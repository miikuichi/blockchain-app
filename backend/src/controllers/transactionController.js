import pool from "../config/db.js";
import { reconcilePendingTransactions } from "../services/reconciliationService.js";

export const recordTransaction = async (req, res) => {
  try {
    const {
      walletProvider,
      networkId,
      txHash,
      recipientAddress,
      amountLovelace,
      feeLovelace = null,
      memo = null,
    } = req.body;

    if (
      !walletProvider ||
      typeof networkId !== "number" ||
      !txHash ||
      !recipientAddress ||
      amountLovelace === undefined ||
      amountLovelace === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required transaction fields.",
      });
    }

    const amountValue = BigInt(amountLovelace);
    const feeValue = feeLovelace === null ? null : BigInt(feeLovelace);

    const result = await pool.query(
      `
      INSERT INTO cardano_transactions (
        user_id,
        wallet_provider,
        network_id,
        tx_hash,
        recipient_address,
        amount_lovelace,
        fee_lovelace,
        memo,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'submitted')
      ON CONFLICT (tx_hash)
      DO UPDATE
      SET
        wallet_provider = EXCLUDED.wallet_provider,
        network_id = EXCLUDED.network_id,
        recipient_address = EXCLUDED.recipient_address,
        amount_lovelace = EXCLUDED.amount_lovelace,
        fee_lovelace = EXCLUDED.fee_lovelace,
        memo = EXCLUDED.memo,
        status = EXCLUDED.status
      RETURNING tx_hash, recipient_address, amount_lovelace, fee_lovelace, memo, status, submitted_at
      `,
      [
        req.user.id,
        walletProvider,
        networkId,
        txHash,
        recipientAddress,
        amountValue.toString(),
        feeValue === null ? null : feeValue.toString(),
        memo,
      ]
    );

    return res.status(201).json({
      success: true,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to record transaction.",
    });
  }
};

export const listTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT tx_hash, recipient_address, amount_lovelace, fee_lovelace, memo, status, submitted_at, confirmed_at
      FROM cardano_transactions
      WHERE user_id = $1
      ORDER BY submitted_at DESC
      LIMIT 50
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      transactions: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load transactions.",
    });
  }
};

export const reconcileTransactions = async (req, res) => {
  try {
    const result = await reconcilePendingTransactions({
      userId: req.user.id,
      limit: 50,
    });

    return res.status(200).json({
      success: true,
      checked: result.checked,
      updated: result.updated,
    });
  } catch (error) {
    if (error.message?.includes("BLOCKFROST_PROJECT_ID")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to reconcile transactions.",
    });
  }
};