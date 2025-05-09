![Clever Cloud logo](/github-assets/clever-cloud-logo.png)

# PostgreSQL MCP Server with LLM Chat Example on Clever Cloud
[![Clever Cloud - PaaS](https://img.shields.io/badge/Clever%20Cloud-PaaS-orange)](https://clever-cloud.com)

## Overview
This repository demonstrates how to deploy a Node.js application on [Clever Cloud](https://clever-cloud.com) that uses the Model Context Protocol (MCP) server for PostgreSQL along with a language model to enable natural language querying of a PostgreSQL database.

The application allows users to interact with a PostgreSQL database using natural language queries, which are translated into SQL using an LLM, and then executed against the database using the MCP server.

![Application Screenshot](img/screenshot.jpg)
*Screenshot of the application in action, showing natural language querying of a PostgreSQL database*

### Sample Data: RAGmonsters

This example uses the [RAGmonsters](https://github.com/LostInBrittany/RAGmonsters) dataset as sample data. RAGmonsters is an open dataset designed for testing and demonstrating Retrieval-Augmented Generation (RAG) systems. It contains information about fictional monsters with rich attributes, abilities, and relationships - making it perfect for natural language querying demonstrations.

The PostgreSQL version of RAGmonsters provides a well-structured relational database with multiple tables and relationships, allowing for complex queries that showcase the power of combining natural language processing with structured database access through MCP.

## Prerequisites
- A [Clever Cloud](https://www.clever-cloud.com/) account
- [Clever Tools CLI](https://github.com/CleverCloud/clever-tools) installed and configured
- Node.js 23 or later
- PostgreSQL database
- Access to an LLM API (e.g., OpenAI)

## Project Structure

```
├── .env.example        # Example environment variables
├── package.json        # Node.js project configuration
├── README.md           # This documentation
├── img/                # Images for documentation
│   └── screenshot.jpg  # Application screenshot
├── scripts/
│   ├── initializeDb.js # Script to initialize the database with RAGmonsters data
│   └── testMCP.js      # Script to test MCP server with LLM integration
├── src/
│   ├── index.js        # Main application server
│   ├── llm.js          # LangChain integration for LLM
│   ├── mcp-client.js   # MCP client for PostgreSQL
│   └── public/         # Web interface files
│       └── index.html  # Chat interface
```

## Features

- PostgreSQL database exploration using natural language
- MCP server integration with the official PostgreSQL implementation
- LangChain.js integration for LLM interactions
- Simple web interface for chatting with your database
- Express.js backend with API endpoints

## Local Development

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Configure your environment variables by copying `.env.example` to `.env` and updating the values:

```bash
cp .env.example .env
```

4. Update the `.env` file with your PostgreSQL connection details and LLM API key.

5. Initialize the database with RAGmonsters sample data:

```bash
node scripts/initializeDb.js
```

This script will clone the RAGmonsters repository and populate your PostgreSQL database with the sample data.

6. Test the MCP server and LLM integration:

```bash
node scripts/testMCP.js
```

This script will connect to your PostgreSQL database using the MCP server, and use an LLM to translate natural language queries into SQL. It demonstrates the core functionality of the application without the web interface.

7. Start the development server:

```bash
npm run dev
```

Your application will be available at http://localhost:8080 (or the port specified in your `.env` file).

## How It Works

1. The application connects to your PostgreSQL database using the provided connection details
2. The MCP server provides a standardized way to interact with the database
3. When you ask a question in natural language, the application:
   - Retrieves the database schema using the MCP server
   - Sends your question along with the schema to the LLM
   - The LLM generates an appropriate SQL query
   - The query is executed against the database using the MCP server
   - Results are displayed in the web interface

### Testing with testMCP.js

The `testMCP.js` script demonstrates the core functionality of the application without the web interface:

1. **Environment Setup**: Loads environment variables from `.env` file, including PostgreSQL connection URI and LLM API key
2. **MCP Server Initialization**: Launches the PostgreSQL MCP server as a child process using StdioClientTransport
3. **LLM Integration**: Configures the ChatOpenAI model with detailed instructions about PostgreSQL syntax
4. **Agent Creation**: Sets up a LangChain ReAct agent that combines the LLM with MCP tools
5. **Query Execution**: Processes a natural language query, converts it to SQL, and executes it against the database
6. **Result Display**: Shows the results in a formatted response

This script is useful for:
- Testing your database connection
- Verifying that the MCP server is working correctly
- Ensuring the LLM can generate valid PostgreSQL queries
- Exploring your database schema and data without the web interface

## Deploying to Clever Cloud

### Using the Clever Cloud CLI

1. Install the Clever Cloud CLI:
   ```bash
   npm install -g clever-tools
   ```

2. Login to your Clever Cloud account:
   ```bash
   clever login
   ```

3. Create a new application:
   ```bash
   clever create --type node <APP_NAME>
   ```

4. Add your domain (optional but recommended):
   ```bash
   clever domain add <YOUR_DOMAIN_NAME>
   ```
   
5. Create a PostgreSQL add-on and link it to your application:
   ```bash
   clever addon create <APP_NAME>-pg --plan dev
   clever service link-addon <APP_NAME>-pg
   ```
   
   This will automatically set the `POSTGRESQL_ADDON_URI` environment variable in your application.

6. Set the required environment variables:
   ```bash
   clever env set LLM_API_KEY "your-openai-api-key"
   clever env set LLM_API_MODEL "gpt-4o-mini" # Optional, defaults to gpt-4o-mini
   clever env set LLM_API_URL "https://api.your-llm-provider.com" # Optional, for alternative OpenAI-compatible providers
   ```

7. Deploy your application:
   ```bash
   clever deploy
   ```

8. Open your application:
   ```bash
   clever open
   ```

### Using the Clever Cloud Console

You can also deploy directly from the [Clever Cloud Console](https://console.clever-cloud.com/):

1. Create a new application in the console
2. Select Node.js as the runtime
3. Create a PostgreSQL add-on and link it to your application
4. Set the required environment variables in the console:
   - `LLM_API_KEY`: Your OpenAI API key
   - `LLM_API_MODEL`: (Optional) The model to use, defaults to gpt-4o-mini
5. Deploy your application using Git or GitHub integration

### Important Notes

- The `POSTGRESQL_ADDON_URI` environment variable is automatically set by Clever Cloud when you link a PostgreSQL add-on to your application
- The application requires Node.js 20 or later, which is available on Clever Cloud
- The application will automatically run on port 8080, which is the default port for Node.js applications on Clever Cloud

## Environment Variables

The following environment variables are used to configure your application:

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `POSTGRESQL_ADDON_URI` | PostgreSQL connection URI (automatically provided by Clever Cloud) | `postgresql://user:password@host:port/database` | Yes |
| `PORT` | The port on which the server will listen | `8080` | No (defaults to 8080) |
| `LLM_API_KEY` | API key for the OpenAI service | `sk-...` | Yes |
| `LLM_API_MODEL` | Model to use for the LLM service | `gpt-4o-mini` | No (defaults to gpt-4o-mini) |
| `LLM_API_URL` | Base URL for the OpenAI-compatible API | `https://api.openai.com/v1` | No (defaults to OpenAI) |

## Troubleshooting

If you encounter issues:

1. Check the application logs: `clever logs`
2. Verify all environment variables are correctly set: `clever env`
3. Ensure your application is running: `clever status`

## Resources

- [Model Context Protocol Documentation](https://github.com/modelcontextprotocol/mcp)
- [LangChain.js Documentation](https://js.langchain.com/docs/)
- [Clever Cloud Documentation for Node.js](https://www.clever-cloud.com/doc/deploy/application/javascript/nodejs/)
- [Clever Cloud Console](https://console.clever-cloud.com/)

## License

This example is provided under the terms of the MIT license.
