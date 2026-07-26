import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
	listTransactions,
	recordTransaction,
	sendTransactionAssisted,
	reconcileTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", requireAuth, listTransactions);
router.post("/", requireAuth, recordTransaction);
router.post("/send", requireAuth, sendTransactionAssisted);
router.post("/reconcile", requireAuth, reconcileTransactions);

export default router;