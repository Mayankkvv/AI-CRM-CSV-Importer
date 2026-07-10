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
            
            // Smart Extractor
            if (typeof mappedData === 'object' && !Array.isArray(mappedData)) {
               const possibleArray = Object.values(mappedData).find(val => Array.isArray(val));
               if (possibleArray) {
                  mappedData = possibleArray;
               } else {
                  mappedData = [mappedData];
               }
            }

            if (!Array.isArray(mappedData)) {
               throw new Error("AI failed to return an array of records.");
            }

            // ==========================================
            // STRICT BACKEND VALIDATION LAYER
            // ==========================================
            const VALID_STATUSES = ['Lead', 'Contacted', 'Qualified', 'Customer', 'Lost'];
            const VALID_SOURCES = ['Organic', 'Paid', 'Referral', 'CSV_Import', 'Other'];
            const validatedBatch = [];

            for (let record of mappedData) {
              if (!record) continue;

              // 1. Skip records without email AND phone
              const hasEmail = typeof record.email === 'string' && record.email.trim() !== '';
              const hasPhone = typeof record.phone === 'string' && record.phone.trim() !== '';
              
              if (!hasEmail && !hasPhone) {
                // If it has neither, drop the record. (Will be counted as skipped later)
                continue;
              }

              // 2. Validate CRM Status
              if (!VALID_STATUSES.includes(record.status)) {
                record.status = 'Lead'; // Force default
              }

              // 3. Validate Data Source
              if (!VALID_SOURCES.includes(record.source)) {
                record.source = 'CSV_Import'; // Force default
              }

              // 4. Move extra emails and phones to crm_note
              const parseList = (val) => {
                if (!val) return [];
                if (typeof val === 'string') return val.split(',').map(v => v.trim()).filter(Boolean);
                if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
                return [String(val).trim()];
              };

              const allEmails = parseList(record.email);
              const allPhones = parseList(record.phone);

              record.email = allEmails[0] || '';
              record.phone = allPhones[0] || '';

              const extras = [];
              if (allEmails.length > 1) extras.push(`Extra Emails: ${allEmails.slice(1).join(', ')}`);
              if (allPhones.length > 1) extras.push(`Extra Phones: ${allPhones.slice(1).join(', ')}`);

              if (extras.length > 0) {
                const prevNote = record.crm_note ? String(record.crm_note).trim() + " | " : "";
                record.crm_note = prevNote + extras.join(' | ');
              }

              // 5. Convert any Date fields into strict JavaScript ISO strings
              for (const key in record) {
                if (key.toLowerCase().includes('date') && typeof record[key] === 'string') {
                  const parsedDate = new Date(record[key]);
                  // Check if the date is valid before replacing the original string
                  if (!isNaN(parsedDate.getTime())) {
                    record[key] = parsedDate.toISOString(); 
                  }
                }
              }

              validatedBatch.push(record);
            }

            return validatedBatch; 

          } catch (error) {
            console.error(`[Attempt ${attempt} Failed]:`, error.message);
            if (attempt === 1) {
              console.log("⚠️ Retrying Groq AI request...");
              return await processBatchWithAI(batch, 2);
            }
            throw new Error("Batch failed permanently after 2 attempts.");
          }
        };

        // Execute batch sequentially
        res.setHeader('Content-Type', 'application/json'); 

        try {
          for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(totalRecords / BATCH_SIZE);
            
            console.log(`Processing Batch ${batchNumber} of ${totalBatches}...`);
            
            try {
              const mappedBatch = await processBatchWithAI(batch);
              importedRecords = importedRecords.concat(mappedBatch);
              
              // Calculate exactly how many records were dropped by the AI or our Backend Validator
              const droppedInThisBatch = batch.length - mappedBatch.length;
              skippedRecordsCount += droppedInThisBatch;
              
              console.log(`✅ Batch ${batchNumber} Success! Mapped: ${mappedBatch.length} | Dropped: ${droppedInThisBatch}`);
            } catch (batchError) {
              console.error(`❌ Batch ${batchNumber} FAILED completely. Skipping ${batch.length} rows.`);
              skippedRecordsCount += batch.length;
            }
          }

          // Return Final Summary
          return res.status(200).json({
            message: 'CSV AI Mapping & Validation Complete!',
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
