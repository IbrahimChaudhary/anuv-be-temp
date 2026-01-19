import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { testConnection } from "./config/db";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";
import quizRoutes from "./routes/quizRoutes";
import playlistRoutes from "./routes/playlistRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import path from "path";

dotenv.config();

const app = express();

const PORT: number = parseInt(process.env.PORT || "3000", 10);

// CORS configuration to allow credentials
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cookie parser middleware
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for playlist images
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Routes
app.use("/api/v1/users", userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/upload', uploadRoutes);

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
