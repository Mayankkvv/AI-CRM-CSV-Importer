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

        const BATCH_SIZE = 50;
        const totalRecords = results.length;
        
        let importedRecords = [];
        let allSkippedRecords = []; 

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

            let parsed = JSON.parse(aiResponseString);
            
            // SMART EXTRACTOR V3
            // Safely extract the array regardless of how the AI wrapped it
            let mappedData = Array.isArray(parsed) ? parsed : (parsed.data || parsed.records || parsed.results);
            
            if (!mappedData || !Array.isArray(mappedData)) {
               const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
               if (possibleArray) {
                  mappedData = possibleArray;
               } else {
                  mappedData = [parsed]; // Extreme fallback
               }
            }

            const VALID_STATUSES = ['Lead', 'Contacted', 'Qualified', 'Customer', 'Lost'];
            const VALID_SOURCES = ['Organic', 'Paid', 'Referral', 'CSV_Import', 'Other'];
            
            const validatedBatch = [];
            const skippedBatch = [];

            for (let record of mappedData) {
              if (!record) continue;

              const parseList = (val) => {
                if (!val) return [];
                if (typeof val === 'string') return val.split(',').map(v => v.trim()).filter(Boolean);
                if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
                return [String(val).trim()];
              };

              const allEmails = parseList(record.email);
              const allPhones = parseList(record.phone);

              // 1. Convert array of emails to a single string BEFORE evaluating if they exist!
              record.email = allEmails[0] || '';
              record.phone = allPhones[0] || '';

              // 2. NOW Evaluate Skipping using the converted strings
              const hasEmail = record.email !== '';
              const hasPhone = record.phone !== '';
              
              if (!hasEmail && !hasPhone) {
                record._skipReason = "Missing Email and Phone";
                skippedBatch.push(record);
                continue; 
              }

              // 3. Validate CRM Status
              if (!VALID_STATUSES.includes(record.status)) record.status = 'Lead';
              if (!VALID_SOURCES.includes(record.source)) record.source = 'CSV_Import';

              // 4. Overflow Data
              const extras = [];
              if (allEmails.length > 1) extras.push(`Extra Emails: ${allEmails.slice(1).join(', ')}`);
              if (allPhones.length > 1) extras.push(`Extra Phones: ${allPhones.slice(1).join(', ')}`);

              if (extras.length > 0) {
                const prevNote = record.crm_note ? String(record.crm_note).trim() + " | " : "";
                record.crm_note = prevNote + extras.join(' | ');
              }

              // 5. Dates
              for (const key in record) {
                if (key.toLowerCase().includes('date') && typeof record[key] === 'string') {
                  const parsedDate = new Date(record[key]);
                  if (!isNaN(parsedDate.getTime())) record[key] = parsedDate.toISOString(); 
                }
              }

              validatedBatch.push(record);
            }

            return { valid: validatedBatch, skipped: skippedBatch }; 

          } catch (error) {
            console.error(`[Attempt ${attempt} Failed]:`, error.message);
            if (attempt === 1) {
              console.log("⚠️ Retrying Groq AI request...");
              return await processBatchWithAI(batch, 2);
            }
            throw new Error("Batch failed permanently after 2 attempts.");
          }
        };

        res.setHeader('Content-Type', 'application/json'); 

        try {
          for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            
            try {
              const { valid, skipped } = await processBatchWithAI(batch);
              importedRecords = importedRecords.concat(valid);
              allSkippedRecords = allSkippedRecords.concat(skipped);
              
              const droppedCount = batch.length - (valid.length + skipped.length);
              if (droppedCount > 0) {
                for(let j=0; j<droppedCount; j++) {
                  allSkippedRecords.push({ _skipReason: "AI inexplicably dropped this record." });
                }
              }
              
              console.log(`✅ Batch ${batchNumber} Success!`);
            } catch (batchError) {
              console.error(`❌ Batch ${batchNumber} FAILED completely.`);
              const failedBatch = batch.map(b => ({ ...b, _skipReason: "AI Batch Processing Failed" }));
              allSkippedRecords = allSkippedRecords.concat(failedBatch);
            }
          }

          return res.status(200).json({
            message: 'CSV AI Mapping & Validation Complete!',
            totalOriginalRows: totalRecords,
            totalImported: importedRecords.length,
            totalSkipped: allSkippedRecords.length,
            data: importedRecords,
            skippedData: allSkippedRecords
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
