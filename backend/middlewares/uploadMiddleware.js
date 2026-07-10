const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the 'uploads' directory exists before we try to save files there!
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up the storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Tell Multer to save files in our backend/uploads folder
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    // Create a guaranteed unique filename: timestamp + random number + original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Configure Multer rules
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Enforce 10 MB limit on the backend too!
  fileFilter: (req, file, cb) => {
    // Security: Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Security Error: Only CSV files are allowed!'), false);
    }
  }
});

module.exports = upload;
