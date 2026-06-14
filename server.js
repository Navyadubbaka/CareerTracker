import express from "express";
import cors from "cors";
import db from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/notes", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notes ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/notes", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });
    const [result] = await db.query("INSERT INTO notes (text) VALUES (?)", [
      text,
    ]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`),
);
