import pool from "../config/db.js";
import {
  indexIncomingTransactions,
  reconcilePendingTransactions,
} from "../services/reconciliationService.js";

async function mirrorTransactionToRecipient({
  senderUserId,
  senderWalletProvider,
  senderNetworkId,
  senderAddress,
  recipientAddress,
  txHash,
  amountLovelace,
  feeLovelace,
  memo,
}) {
  const recipientQuery = await pool.query(
    `
      SELECT user_id, wallet_provider, network_id, used_address_hex, reward_address_hex
      FROM user_wallets
      WHERE user_id <> $1
        AND (
          LOWER(COALESCE(used_address_hex, '')) = LOWER($2)
          OR LOWER(COALESCE(reward_address_hex, '')) = LOWER($2)
        )
      LIMIT 1
    `,
    [senderUserId, recipientAddress]
  );

  if (!recipientQuery.rows[0]) {
    return;
  }

  const recipientWallet = recipientQuery.rows[0];

  await pool.query(
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
        status,
        direction,
        sender_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted', 'received', $9)
      ON CONFLICT (tx_hash)
      DO UPDATE
      SET
        wallet_provider = EXCLUDED.wallet_provider,
        network_id = EXCLUDED.network_id,
        recipient_address = EXCLUDED.recipient_address,
        amount_lovelace = EXCLUDED.amount_lovelace,
        fee_lovelace = EXCLUDED.fee_lovelace,
        memo = EXCLUDED.memo,
        status = EXCLUDED.status,
        direction = EXCLUDED.direction,
        sender_address = EXCLUDED.sender_address
    `,
    [
      recipientWallet.user_id,
      recipientWallet.wallet_provider || senderWalletProvider,
      recipientWallet.network_id ?? senderNetworkId,
      txHash,
      recipientAddress,
      amountLovelace,
      feeLovelace,
      memo,
      senderAddress,
    ]
  );
}

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
      direction = "sent",
      senderAddress = null,
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
        status,
        direction,
        sender_address
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'submitted',$9,$10)
      ON CONFLICT (tx_hash)
      DO UPDATE
      SET
        wallet_provider = EXCLUDED.wallet_provider,
        network_id = EXCLUDED.network_id,
        recipient_address = EXCLUDED.recipient_address,
        amount_lovelace = EXCLUDED.amount_lovelace,
        fee_lovelace = EXCLUDED.fee_lovelace,
        memo = EXCLUDED.memo,
        status = EXCLUDED.status,
        direction = EXCLUDED.direction,
        sender_address = EXCLUDED.sender_address
      RETURNING tx_hash, recipient_address, amount_lovelace, fee_lovelace, memo, status, submitted_at, direction, sender_address
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
        direction,
        senderAddress,
      ]
    );

    await mirrorTransactionToRecipient({
      senderUserId: req.user.id,
      senderWalletProvider: walletProvider,
      senderNetworkId: networkId,
      senderAddress: senderAddress || recipientAddress,
      recipientAddress,
      txHash,
      amountLovelace: amountValue.toString(),
      feeLovelace: feeValue === null ? null : feeValue.toString(),
      memo,
    });

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
    await indexIncomingTransactions({ userId: req.user.id });

    const result = await pool.query(
      `
      SELECT tx_hash, recipient_address, amount_lovelace, fee_lovelace, memo, status, submitted_at, confirmed_at, direction, sender_address
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