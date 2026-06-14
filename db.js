import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "career_db",
  waitForConnections: true,
  connectionLimit: 10,
});

async function init() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  } finally {
    conn.release();
  }
}

init().catch((err) => console.error("DB init error:", err));

export default pool;
