import express from "express";
import {
  createChallenge,
  verifyAndLinkWallet,
  getLinkedWallet,
} from "../controllers/walletController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/challenge", requireAuth, createChallenge);
router.post("/verify", requireAuth, verifyAndLinkWallet);
router.get("/me", requireAuth, getLinkedWallet);

export default router;