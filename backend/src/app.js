import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import {
  getReconciliationSchedulerStatus,
  runReconciliationNow,
} from "./services/reconciliationScheduler.js";

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
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);

app.get("/api/health/reconciliation", (req, res) => {
  res.status(200).json({
    success: true,
    scheduler: getReconciliationSchedulerStatus(),
  });
});

app.post("/api/health/reconciliation/run", requireAuth, async (req, res) => {
  try {
    const status = await runReconciliationNow();

    res.status(200).json({
      success: true,
      scheduler: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to run reconciliation.",
    });
  }
});

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