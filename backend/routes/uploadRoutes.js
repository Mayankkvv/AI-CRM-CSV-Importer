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
        fs.unlinkSync(req.file.path); // Clean up the temp file

        if (results.length === 0) {
          return res.status(400).json({ error: 'The uploaded CSV file is empty.' });
        }

        // ==========================================
        // SINGLE RECORD AI MAPPING LOGIC
        // ==========================================
        
        // 1. Take only the very first chaotic row for testing
        const firstRecord = results[0];

        try {
          console.log("Sending first record to Groq AI...");
          
          // 2. Build and execute the API call
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: getSystemPrompt() },
              { role: "user", content: JSON.stringify([firstRecord]) } // Wrap in array as expected by prompt
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0, // 0 = Rigid, logical, predictable (No creative hallucinations)
            response_format: { type: "json_object" }, // Native SDK feature to guarantee JSON format
          });

          // 3. Receive the raw string response
          const aiResponseString = chatCompletion.choices[0]?.message?.content;
          
          if (!aiResponseString) {
            throw new Error("AI returned an empty response.");
          }

          // 4. Safely validate that the AI actually returned perfect JSON
          let mappedData;
          try {
            mappedData = JSON.parse(aiResponseString);
          } catch (jsonError) {
            console.error("CRITICAL ERROR: AI returned invalid JSON syntax.", aiResponseString);
            return res.status(500).json({ error: 'AI failed to return valid JSON syntax.' });
          }

          // 5. Return both the original and the new mapped data back to the frontend!
          return res.status(200).json({
            message: 'First record mapped successfully!',
            originalRecord: firstRecord, // Helpful for debugging on the frontend
            mappedData: mappedData       // The beautiful, clean CRM data
          });

        } catch (aiError) {
          console.error("Groq AI Mapping Error:", aiError);
          return res.status(500).json({ error: 'Failed to map data with Groq AI.' });
        }
      });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
});

module.exports = router;
