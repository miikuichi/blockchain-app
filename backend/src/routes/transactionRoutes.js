import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
	listTransactions,
	recordTransaction,
	reconcileTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", requireAuth, listTransactions);
router.post("/", requireAuth, recordTransaction);
router.post("/reconcile", requireAuth, reconcileTransactions);

export default router;