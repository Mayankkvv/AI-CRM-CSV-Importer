const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
// Import Routes
const uploadRoutes = require('./routes/uploadRoutes');
const groq = require('./config/groq'); // Import our configured AI client

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

// Mount the CSV upload endpoint
app.use('/api/upload', uploadRoutes);

// Temporary AI Test Route
app.get('/test-ai', async (req, res) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Reply with the exact word CONNECTED" }],
      model: "llama3-8b-8192", // Fast, standard model for testing
      temperature: 0,
      max_tokens: 10,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "No response";
    
    res.status(200).json({
      status: 'success',
      message: 'Successfully connected to Groq AI!',
      groq_response: aiResponse.trim()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Groq AI. Please verify your API key in the .env file.',
      details: error.message || "Unknown error occurred"
    });
  }
});

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
