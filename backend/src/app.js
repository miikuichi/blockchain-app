import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

import { initializeDatabase } from "./services/databaseService.js";

dotenv.config();

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

/*
|--------------------------------------------------------------------------
| Initialize Database
|--------------------------------------------------------------------------
*/

await initializeDatabase();

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ADAPay Backend is running 🚀",
  });
});

/*
|--------------------------------------------------------------------------
| Export App
|--------------------------------------------------------------------------
*/

export default app;