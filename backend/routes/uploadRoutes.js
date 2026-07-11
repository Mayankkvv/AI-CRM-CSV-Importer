const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const fs = require('fs');
const csv = require('csv-parser');
const groq = require('../config/groq');
const { getSystemPrompt } = require('../prompts/mappingPrompt');

// In-memory store for tracking AI processing progress globally
const progressStore = {};

// GET /api/upload/progress/:jobId
// Side-channel endpoint for the frontend to poll progress
router.get('/progress/:jobId', (req, res) => {
  const job = progressStore[req.params.jobId];
  if (!job) return res.json({ progress: 0, currentBatch: 0, totalBatches: 0 });
  res.json(job);
});

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
        const jobId = req.query.jobId; // Grab the Job ID from the URL
        
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
            
            let mappedData = Array.isArray(parsed) ? parsed : (parsed.data || parsed.records || parsed.results);
            
            if (!mappedData || !Array.isArray(mappedData)) {
               const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
               if (possibleArray) {
                  mappedData = possibleArray;
               } else {
                  mappedData = [parsed];
               }
            }
            
            // Prevent AI hallucinating extra rows which breaks count parity
            if (mappedData.length > batch.length) {
               mappedData = mappedData.slice(0, batch.length);
            }

            const VALID_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
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
              const allPhones = parseList(record.phone || record.mobile_number);

              record.email = allEmails[0] || '';
              record.phone = allPhones[0] || ''; // Stored as 'phone' for frontend compatibility

              const hasEmail = record.email !== '';
              const hasPhone = record.phone !== '';
              
              if (!hasEmail && !hasPhone) {
                record._skipReason = "Missing both Email and Mobile Number";
                skippedBatch.push(record);
                continue; 
              }

              // 1. Validate CRM Status
              let status = record.status || record.crm_status;
              let isStatusValid = VALID_STATUSES.includes(status);
              
              if (!isStatusValid && status) {
                 // Try to correct invalid statuses
                 const s = String(status).toUpperCase().replace(/ /g, '_');
                 if (VALID_STATUSES.includes(s)) {
                    status = s;
                    isStatusValid = true;
                 } else if (s.includes('GOOD') || s.includes('QUALIFIED')) {
                    status = 'GOOD_LEAD_FOLLOW_UP';
                    isStatusValid = true;
                 } else if (s.includes('SALE') || s.includes('CUSTOMER')) {
                    status = 'SALE_DONE';
                    isStatusValid = true;
                 } else if (s.includes('BAD') || s.includes('LOST')) {
                    status = 'BAD_LEAD';
                    isStatusValid = true;
                 } else if (s.includes('CONNECT')) {
                    status = 'DID_NOT_CONNECT';
                    isStatusValid = true;
                 }
              }

              if (!isStatusValid) {
                  record._skipReason = "Invalid or uncorrectable crm_status";
                  skippedBatch.push(record);
                  continue;
              }
              record.status = status; // Map back to status for the frontend UI

              // 2. Validate Data Source
              let source = record.data_source || record.source;
              if (source && !VALID_SOURCES.includes(source)) {
                 // Try to correct (case-insensitive match)
                 const s = String(source);
                 const matched = VALID_SOURCES.find(v => v.toLowerCase() === s.toLowerCase());
                 if (matched) {
                    source = matched;
                 } else {
                    source = ''; // Leave data_source empty if uncertain
                 }
              }
              record.data_source = source || '';
              record.source = record.data_source; // Map back for frontend

              // 3. Overflow Data
              const extras = [];
              if (allEmails.length > 1) extras.push(`Extra Emails: ${allEmails.slice(1).join(', ')}`);
              if (allPhones.length > 1) extras.push(`Extra Phones: ${allPhones.slice(1).join(', ')}`);

              if (extras.length > 0) {
                const prevNote = record.crm_note ? String(record.crm_note).trim() + " | " : "";
                record.crm_note = prevNote + extras.join(' | ');
              }

              // 4. Validate created_at
              let hasInvalidDate = false;
              for (const key in record) {
                if ((key === 'created_at' || key.toLowerCase().includes('date')) && typeof record[key] === 'string' && record[key].trim() !== '') {
                  const parsedDate = new Date(record[key]);
                  if (!isNaN(parsedDate.getTime())) {
                    record[key] = parsedDate.toISOString(); 
                  } else if (key === 'created_at') {
                    hasInvalidDate = true;
                  }
                }
              }
              
              if (hasInvalidDate) {
                  record._skipReason = "Invalid created_at format";
                  skippedBatch.push(record);
                  continue;
              }

              validatedBatch.push(record);
            }

            return { valid: validatedBatch, skipped: skippedBatch }; 

          } catch (error) {
            console.error(`[Attempt ${attempt} Failed]:`, error.message);
            if (attempt < 3) {
              let delayMs = 2000 * attempt; 
              
              // Dynamically parse Groq's rate limit wait time if available
              const match = error.message.match(/try again in ([0-9.]+)s/);
              if (match) {
                 delayMs = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
                 console.log(`⚠️ Rate limit hit. Retrying in ${delayMs / 1000} seconds...`);
              } else {
                 console.log(`⚠️ Retrying Groq AI request in ${delayMs / 1000} seconds...`);
              }
              
              await new Promise(resolve => setTimeout(resolve, delayMs));
              return await processBatchWithAI(batch, attempt + 1);
            }
            throw new Error("Batch failed permanently after 3 attempts.");
          }
        };

        res.setHeader('Content-Type', 'application/json'); 

        try {
          const totalBatches = Math.ceil(totalRecords / BATCH_SIZE);

          for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            
            // UPDATE GLOBAL PROGRESS FOR FRONTEND POLLING
            if (jobId) {
              progressStore[jobId] = {
                progress: Math.round(((batchNumber - 1) / totalBatches) * 100),
                currentBatch: batchNumber,
                totalBatches: totalBatches
              };
            }
            
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
          
          // SET 100% COMPLETE BEFORE RETURNING
          if (jobId) {
             progressStore[jobId] = { progress: 100, currentBatch: totalBatches, totalBatches };
          }

          const finalResponse = {
            message: 'CSV AI Mapping & Validation Complete!',
            totalOriginalRows: totalRecords,
            totalImported: importedRecords.length,
            totalSkipped: allSkippedRecords.length,
            data: importedRecords,
            skippedData: allSkippedRecords
          };

          res.status(200).json(finalResponse);
          
          // Clean up memory after sending response
          if (jobId) {
             setTimeout(() => delete progressStore[jobId], 5000); 
          }

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
