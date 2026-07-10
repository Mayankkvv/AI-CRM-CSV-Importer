const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES
// ==========================================

// 1. Enable CORS so our Next.js frontend can make requests to this API
app.use(cors());

// 2. Parse incoming JSON payloads so we can read req.body
app.use(express.json());

// ==========================================
// ROUTES
// ==========================================

// A simple Health Check route to verify our server is running correctly
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend server is healthy and ready to receive CSVs!',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
