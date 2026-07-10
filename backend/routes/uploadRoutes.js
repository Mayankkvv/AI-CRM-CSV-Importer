const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const fs = require('fs');
const csv = require('csv-parser');

// POST /api/upload
router.post('/', upload.single('csvFile'), (req, res) => {
  try {
    // 1. Ensure Multer successfully intercepted a file
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file format.' });
    }

    console.log("SUCCESS: File saved temporarily at", req.file.path);

    const results = [];
    let hasError = false;

    // 2. Open a read stream from the temporary file Multer created
    fs.createReadStream(req.file.path)
      
      // 3. Pipe the raw text stream into the CSV Parser
      .pipe(csv())
      
      // 4. The 'data' event fires for every row. It automatically converts the row to JSON.
      .on('data', (data) => {
        results.push(data);
      })
      
      // 5. VALIDATION: Catch malformed CSVs or streaming errors
      .on('error', (error) => {
        console.error("CSV Parsing Error:", error);
        hasError = true;
        
        // Delete the corrupted file from the hard drive
        fs.unlinkSync(req.file.path); 
        
        return res.status(400).json({ error: 'Failed to parse CSV. The file might be malformed.' });
      })
      
      // 6. The 'end' event fires when the entire file has been successfully processed
      .on('end', () => {
        if (hasError) return; // Stop if we already sent an error response

        console.log(`Successfully parsed ${results.length} rows on the backend.`);

        // Clean up: Delete the temporary file now that we have the JSON data in memory
        fs.unlinkSync(req.file.path);

        // 7. Return the parsed records back to the frontend
        res.status(200).json({
          message: 'CSV file uploaded and parsed successfully!',
          totalRows: results.length,
          data: results // This is the massive array of JSON objects!
        });
      });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
});

module.exports = router;
