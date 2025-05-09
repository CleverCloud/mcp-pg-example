import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initMCPClient, closeMCPClient } from './mcp-client.js';
import { createAgent, processQuery } from './llm.js';

// Load environment variables
dotenv.config();

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Store agent instance
let agent = null;

// Initialize MCP client and agent
async function ensureAgent() {
  if (agent) return agent;
  
  try {
    const { tools } = await initMCPClient();
    agent = createAgent(tools);
    return agent;
  } catch (error) {
    console.error('Error initializing agent:', error);
    throw error;
  }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    console.log('Received query:', query);
    
    // Ensure agent is initialized
    const agentInstance = await ensureAgent();
    
    // Process the query using the ReAct agent
    const response = await processQuery(agentInstance, query);
    
    // The ReAct agent handles all the tool calling and response formatting
    // Just return the last message content as the answer
    const lastMessage = response.messages[response.messages.length - 1];
    
    // Send response
    res.json({
      query,
      response: response.messages,
      answer: lastMessage.content
    });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Failed to process query', message: error.message });
  }
});

// Start the server
app.listen(PORT, async () => {
  try {
    // Initialize MCP client on startup
    await ensureAgent();
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('MCP client and agent initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MCP client and agent:', error);
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await closeMCPClient();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await closeMCPClient();
  process.exit(0);
});
