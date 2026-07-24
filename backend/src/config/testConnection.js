import pool from "./db.js";

async function test() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database Connected");
    console.log(result.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

test();