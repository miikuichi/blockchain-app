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

      CREATE TABLE IF NOT EXISTS user_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_provider VARCHAR(50) NOT NULL,
        network_id INTEGER NOT NULL,
        used_address_hex TEXT NOT NULL,
        reward_address_hex TEXT,
        cose_key_hex TEXT NOT NULL,
        linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wallet_link_challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nonce VARCHAR(120) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS ux_wallet_challenge_user_nonce
      ON wallet_link_challenges (user_id, nonce);
    `);

    console.log("✅ Database tables are ready.");
  } catch (error) {
    console.error("❌ Failed to initialize database.");
    console.error(error);
  }
}