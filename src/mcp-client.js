import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadMcpTools } from "@langchain/mcp-adapters";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get PostgreSQL connection URI from environment variables
const POSTGRESQL_ADDON_URI = process.env.POSTGRESQL_ADDON_URI;

// Singleton instance of the MCP client
let mcpClient = null;
let mcpTools = null;

/**
 * Initialize the MCP client for PostgreSQL
 * @returns {Promise<Object>} Object containing the MCP client and tools
 */
export async function initMCPClient() {
  if (mcpClient && mcpTools) {
    return { client: mcpClient, tools: mcpTools };
  }

  if (!POSTGRESQL_ADDON_URI) {
    throw new Error("POSTGRESQL_ADDON_URI environment variable is not set");
  }

  console.log(`Initializing MCP client with PostgreSQL connection: ${POSTGRESQL_ADDON_URI.split('@')[1]}`);

  // Create a transport to communicate with the MCP server
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", POSTGRESQL_ADDON_URI],
  });

  // Create and connect the MCP client
  mcpClient = new Client({ name: "postgres-client", version: "1.0.0" });
  await mcpClient.connect(transport);

  // Load MCP tools
  mcpTools = await loadMcpTools("query", mcpClient);
  console.log("Available MCP tools:", mcpTools.map(tool => tool.name));

  return { client: mcpClient, tools: mcpTools };
}

/**
 * Close the MCP client connection
 * @returns {Promise<void>}
 */
export async function closeMCPClient() {
  if (mcpClient) {
    console.log("Closing MCP client connection");
    await mcpClient.close();
    mcpClient = null;
    mcpTools = null;
  }
}

// Handle process exit to clean up MCP client
process.on('SIGINT', async () => {
  await closeMCPClient();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeMCPClient();
  process.exit(0);
});
