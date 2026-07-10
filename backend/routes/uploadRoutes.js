const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const fs = require('fs');
const csv = require('csv-parser');
const groq = require('../config/groq');
const { getSystemPrompt } = require('../prompts/mappingPrompt');

// POST /api/upload
router.post('/', upload.single('csvFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file format.' });
    }

    console.log("SUCCESS: File saved temporarily at", req.file.path);

    const results = [];
    let hasError = false;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('error', (error) => {
        console.error("CSV Parsing Error:", error);
        hasError = true;
        fs.unlinkSync(req.file.path); 
        return res.status(400).json({ error: 'Failed to parse CSV. The file might be malformed.' });
      })
      .on('end', async () => {
        if (hasError) return; 

        console.log(`Successfully parsed ${results.length} rows on the backend.`);
        fs.unlinkSync(req.file.path); 

        if (results.length === 0) {
          return res.status(400).json({ error: 'The uploaded CSV file is empty.' });
        }

        // ==========================================
        // BATCH PROCESSING AI MAPPING LOGIC
        // ==========================================
        const BATCH_SIZE = 50;
        const totalRecords = results.length;
        
        let importedRecords = [];
        let skippedRecordsCount = 0; 

        // 1. Validation & Retry Wrapper Function (Now processes Arrays!)
        const processBatchWithAI = async (batch, attempt = 1) => {
          try {
            const chatCompletion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: getSystemPrompt() },
                { role: "user", content: JSON.stringify(batch) } 
              ],
              model: "llama-3.1-8b-instant",
              temperature: 0, 
              response_format: { type: "json_object" }, 
            });

            const aiResponseString = chatCompletion.choices[0]?.message?.content;
            if (!aiResponseString) throw new Error("AI returned an empty response.");

            let mappedData = JSON.parse(aiResponseString);
            
            // SMART EXTRACTOR: 
            // Because `json_object` mode forces the AI to return an object {}, 
            // it often wraps our requested array inside a key like { "data": [...] }
            if (typeof mappedData === 'object' && !Array.isArray(mappedData)) {
               const possibleArray = Object.values(mappedData).find(val => Array.isArray(val));
               if (possibleArray) {
                  mappedData = possibleArray;
               } else {
                  mappedData = [mappedData]; // Fallback if it returned just one single object
               }
            }

            if (!Array.isArray(mappedData)) {
               throw new Error("AI failed to return an array of records.");
            }

            return mappedData; 

          } catch (error) {
            console.error(`[Attempt ${attempt} Failed]:`, error.message);
            
            if (attempt === 1) {
              console.log("⚠️ Retrying Groq AI request for this batch...");
              return await processBatchWithAI(batch, 2);
            }
            
            throw new Error("Batch failed permanently after 2 attempts.");
          }
        };

        // 2. Process Sequentially using a For Loop
        // We do NOT use Promise.all() here because sending 50 parallel requests would trigger Rate Limits!
        res.setHeader('Content-Type', 'application/json'); // Keep connection alive

        try {
          for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(totalRecords / BATCH_SIZE);
            
            console.log(`Processing Batch ${batchNumber} of ${totalBatches} (${batch.length} rows)...`);
            
            try {
              // Wait for this batch to finish before sending the next one
              const mappedBatch = await processBatchWithAI(batch);
              importedRecords = importedRecords.concat(mappedBatch);
              console.log(`✅ Batch ${batchNumber} Success! Mapped ${mappedBatch.length} records.`);
            } catch (batchError) {
              // Fault Tolerance: If this specific chunk fails twice, skip it and continue!
              console.error(`❌ Batch ${batchNumber} FAILED completely. Skipping ${batch.length} rows.`);
              skippedRecordsCount += batch.length;
            }
          }

          // 3. Return the Final Summary!
          return res.status(200).json({
            message: 'CSV AI Mapping Complete!',
            totalOriginalRows: totalRecords,
            totalImported: importedRecords.length,
            totalSkipped: skippedRecordsCount,
            data: importedRecords
          });

        } catch (fatalError) {
          console.error("Fatal error during batch processing:", fatalError);
          return res.status(500).json({ error: 'Fatal error occurred during batch processing.' });
        }
      });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
});

module.exports = router;
