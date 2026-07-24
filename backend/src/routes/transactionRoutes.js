import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { listTransactions, recordTransaction } from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", requireAuth, listTransactions);
router.post("/", requireAuth, recordTransaction);

export default router;