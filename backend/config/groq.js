const Groq = require('groq-sdk');
require('dotenv').config();

// 1. Error Handling: Check if the API key exists BEFORE initializing the SDK
if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
  console.error("==================================================");
  console.error("🚨 FATAL ERROR: GROQ_API_KEY is missing or invalid!");
  console.error("Please add a real Groq API key to your backend/.env file.");
  console.error("Get your free key at: https://console.groq.com/keys");
  console.error("==================================================");
  // We use process.exit(1) to forcefully stop the server from starting if the AI can't connect.
  // This is a production best-practice called "Fail Fast".
  process.exit(1); 
}

// 2. Initialize the Official Groq Client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

console.log("✅ Groq AI SDK configured and ready.");

module.exports = groq;
