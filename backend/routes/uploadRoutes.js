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
        // SINGLE RECORD AI MAPPING (WITH RETRY LOGIC)
        // ==========================================
        const firstRecord = results[0];

        // 1. Validation & Retry Wrapper Function
        const processWithAI = async (record, attempt = 1) => {
          try {
            console.log(`[Attempt ${attempt}] Sending record to Groq AI...`);
            
            const chatCompletion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: getSystemPrompt() },
                { role: "user", content: JSON.stringify([record]) } 
              ],
              model: "llama-3.1-8b-instant",
              temperature: 0, 
              response_format: { type: "json_object" }, 
            });

            const aiResponseString = chatCompletion.choices[0]?.message?.content;
            
            if (!aiResponseString) {
              throw new Error("AI returned an empty response.");
            }

            // 2. The Validation Layer: If this fails, it jumps instantly to the catch block
            const mappedData = JSON.parse(aiResponseString);
            
            // If we get here, the JSON is perfect!
            return mappedData; 

          } catch (error) {
            console.error(`[Attempt ${attempt} Failed]:`, error.message);
            
            // 3. Retry Logic: If we are on attempt 1, try exactly one more time
            if (attempt === 1) {
              console.log("⚠️ Retrying Groq AI request to recover from invalid JSON...");
              return await processWithAI(record, 2);
            }
            
            // If we already retried and failed again, throw the error up to the main route handler
            throw new Error("AI continuously returned invalid JSON or failed to respond.");
          }
        };

        // Execute the robust AI process
        try {
          const mappedData = await processWithAI(firstRecord);

          return res.status(200).json({
            message: 'First record mapped successfully!',
            originalRecord: firstRecord,
            mappedData: mappedData
          });

        } catch (finalError) {
          console.error("❌ Groq AI Mapping Error (After Retries):", finalError.message);
          return res.status(500).json({ 
            error: 'Failed to map data with AI after multiple attempts.',
            details: finalError.message
          });
        }
      });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
});

module.exports = router;
