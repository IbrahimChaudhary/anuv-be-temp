import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./db";

dotenv.config();

const app = express();

const PORT: number = parseInt(process.env.PORT || "3000", 10);

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  try {
    await testConnection();
  } catch (error) {
    console.error("Failed to connect to database");
  }
});
