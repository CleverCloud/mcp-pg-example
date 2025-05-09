#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes the PostgreSQL database with the RAGmonsters sample data.
 * It clones the RAGmonsters repository and applies the SQL files in the correct order.
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const tmpDir = path.join(rootDir, 'tmp');
const repoDir = path.join(tmpDir, 'RAGmonsters');
const postgresqlDir = path.join(repoDir, 'postgresql');

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRESQL_ADDON_URI,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Execute a shell command and return a Promise
 * @param {string} command - Command to execute
 * @param {string} cwd - Current working directory
 * @returns {Promise<string>} - Command output
 */
function execCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.warn(`Warning: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

/**
 * Execute an SQL file against the PostgreSQL database
 * @param {string} filePath - Path to SQL file
 * @returns {Promise<void>}
 */
async function executeSqlFile(filePath) {
  try {
    console.log(`Executing SQL file: ${filePath}`);
    const sql = await fs.readFile(filePath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log(`Successfully executed: ${path.basename(filePath)}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Empty the database by dropping RAGmonsters tables
 * @returns {Promise<void>}
 */
async function emptyDatabase() {
  try {
    console.log('Emptying database...');
    const client = await pool.connect();
    try {
      // First check if any RAGmonsters tables exist
      const tableCheckResult = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'monsters' AND table_schema = 'public'
        );`
      );
      
      const ragmonstersTablesExist = tableCheckResult.rows[0].exists;
      
      if (!ragmonstersTablesExist) {
        console.log('No RAGmonsters tables found. Database is ready for initialization.');
        return;
      }
      
      console.log('RAGmonsters tables found. Dropping them...');
      
      // Create a transaction to drop all tables
      await client.query('BEGIN;');
      
      // Disable foreign key constraints during table dropping
      await client.query('SET CONSTRAINTS ALL DEFERRED;');
      
      // Drop RAGmonsters tables in the correct order to handle dependencies
      const tablesToDrop = [
        'hindrances',
        'augments',
        'flaws',
        'abilities',
        'keywords',
        'questworlds_stats',
        'monsters'
      ];
      
      for (const tableName of tablesToDrop) {
        console.log(`Dropping table: ${tableName}`);
        await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
      }
      
      await client.query('COMMIT;');
      console.log('Database emptied successfully.');
    } catch (error) {
      await client.query('ROLLBACK;');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error emptying database:', error);
    throw error;
  }
}

/**
 * Main function to initialize the database
 */
async function initializeDatabase() {
  try {
    // Create tmp directory if it doesn't exist
    await fs.mkdir(tmpDir, { recursive: true });
    
    // Check if RAGmonsters repository already exists
    try {
      await fs.access(repoDir);
      console.log('RAGmonsters repository already exists. Updating...');
      await execCommand('git pull', repoDir);
    } catch (error) {
      // Repository doesn't exist, clone it
      console.log('Cloning RAGmonsters repository...');
      await execCommand(`git clone https://github.com/LostInBrittany/RAGmonsters.git`, tmpDir);
    }
    
    // Check if PostgreSQL directory exists
    try {
      await fs.access(postgresqlDir);
    } catch (error) {
      console.error('PostgreSQL directory not found in RAGmonsters repository');
      throw error;
    }
    
    // Test database connection
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database');
      client.release();
    } catch (error) {
      console.error('Error connecting to PostgreSQL database:', error.message);
      console.error('Please check your POSTGRESQL_ADDON_URI environment variable');
      process.exit(1);
    }
    
    // Empty the database first to ensure a clean slate
    await emptyDatabase();
    
    // Execute SQL files in the correct order
    console.log('Initializing database with RAGmonsters schema...');
    
    // 1. First, execute the schema file
    await executeSqlFile(path.join(postgresqlDir, 'ragmonsters_schema.sql'));
    
    // 2. Then, process each monster file in the dataset directory
    const datasetDir = path.join(postgresqlDir, 'dataset');
    const monsterFiles = await fs.readdir(datasetDir);
    
    console.log(`Found ${monsterFiles.length} monster files to import`);
    
    // Process each monster file
    for (const monsterFile of monsterFiles) {
      if (monsterFile.endsWith('.sql')) {
        await executeSqlFile(path.join(datasetDir, monsterFile));
      }
    }
    
    console.log('Database initialization completed successfully!');
    
    // Close the pool
    await pool.end();
    
    console.log('\nYou can now start the application with:');
    console.log('npm run dev');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
