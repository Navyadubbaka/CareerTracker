import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "career_db",
    });
    const [rows] = await conn.query("SELECT 1 AS ok");
    console.log("Connection successful:", rows);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err.message);
    if (err.code) console.error("Error code:", err.code);
    process.exit(1);
  }
}

test();
