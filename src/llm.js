import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get LLM API configuration from environment variables
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_MODEL = process.env.LLM_API_MODEL || "gpt-4o-mini";
const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1";

/**
 * Initialize the LLM client
 * @returns {ChatOpenAI} Configured LLM client
 */
function initLLM() {
  if (!LLM_API_KEY) {
    throw new Error("LLM_API_KEY environment variable is not set");
  }

  console.log(`Initializing LLM with model: ${LLM_API_MODEL}`);
  
  // Log the LLM configuration
  console.log(`Using LLM API URL: ${LLM_API_URL}`);
  
  // Create a new LLM client using the API configuration from environment variables
  const llm = new ChatOpenAI({
    openAIApiKey: LLM_API_KEY,
    modelName: LLM_API_MODEL,
    temperature: 0.2,
    configuration: {
      baseURL: LLM_API_URL,
    },
  });
  
  return llm;
}

/**
 * Create a ReAct agent with the LLM and MCP tools
 * @param {Array} tools - MCP tools to use with the agent
 * @returns {Object} Configured ReAct agent
 */
export function createAgent(tools) {
  const llm = initLLM();
  
  // Create a ReAct agent with the LLM and tools
  const agent = createReactAgent({
    llm,
    tools,
  });
  
  return agent;
}

/**
 * Process a natural language query using the agent
 * @param {Object} agent - ReAct agent
 * @param {string} query - Natural language query
 * @returns {Promise<Object>} Query results
 */
export async function processQuery(agent, query) {
  // System message with PostgreSQL syntax guidance
  const systemMessage = {
    role: "system",
    content: `You are a helpful assistant that can explore PostgreSQL databases using SQL queries.

IMPORTANT: Use PostgreSQL syntax, NOT MySQL syntax. For example:
- To list all tables: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
- To describe a table: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'table_name';
- To show database size: SELECT pg_size_pretty(pg_database_size(current_database()));

Avoid using MySQL commands like SHOW TABLES, DESCRIBE table_name, etc. as they won't work in PostgreSQL.

When using the query tool, always provide the full SQL query in the 'sql' parameter.`
  };

  // User message with the query
  const userMessage = {
    role: "user",
    content: query
  };

  // Process the query using the agent
  const response = await agent.invoke({
    messages: [systemMessage, userMessage],
  });

  return response;
}
