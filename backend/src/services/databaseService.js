import pool from "../config/db.js";

export async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        firstname VARCHAR(100) NOT NULL,

        lastname VARCHAR(100) NOT NULL,

        email VARCHAR(255) UNIQUE NOT NULL,

        password VARCHAR(255) NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Users table is ready.");
  } catch (error) {
    console.error("❌ Failed to initialize database.");
    console.error(error);
  }
}