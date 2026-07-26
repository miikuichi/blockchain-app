import pool from "../config/db.js";

const BLOCKFROST_URLS = {
  0: "https://cardano-preprod.blockfrost.io/api/v0",
  1: "https://cardano-mainnet.blockfrost.io/api/v0",
};

async function checkTxConfirmation(networkId, txHash, projectId) {
  const baseUrl = BLOCKFROST_URLS[networkId];

  if (!baseUrl) {
    return {
      found: false,
      message: "Unsupported network for reconciliation.",
    };
  }

  const response = await fetch(`${baseUrl}/txs/${txHash}`, {
    headers: {
      project_id: projectId,
    },
  });

  if (response.status === 404) {
    return {
      found: false,
    };
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Blockfrost lookup failed (${response.status}): ${body}`);
  }

  const data = await response.json();

  return {
    found: true,
    blockTime: data.block_time ? new Date(data.block_time * 1000) : new Date(),
  };
}

function parseLovelaceValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === "object") {
    if (typeof value.coin === "string" || typeof value.coin === "number") {
      return String(value.coin);
    }

    if (typeof value.lovelace === "string" || typeof value.lovelace === "number") {
      return String(value.lovelace);
    }
  }

  return null;
}

function normalizeAddress(address) {
  return typeof address === "string" ? address.toLowerCase() : "";
}

function getMatchingOutputAmount(outputs = [], address) {
  let total = 0n;

  for (const output of outputs) {
    if (typeof output?.address !== "string") {
      continue;
    }

    if (normalizeAddress(output.address) !== normalizeAddress(address)) {
      continue;
    }

    const rawValue = parseLovelaceValue(output?.value?.coin ?? output?.value ?? output?.amount ?? output?.lovelace);

    if (rawValue === null) {
      continue;
    }

    total += BigInt(rawValue);
  }

  return total > 0n ? total.toString() : null;
}

function getIncomingSenderAddress(txData, address) {
  const input = (txData.inputs || []).find((entry) => {
    return typeof entry?.address === "string" && normalizeAddress(entry.address) !== normalizeAddress(address);
  });

  return input?.address || null;
}

export async function indexIncomingTransactions({ userId = null } = {}) {
  const projectId = process.env.BLOCKFROST_PROJECT_ID;

  if (!projectId) {
    return { checked: 0, inserted: 0 };
  }

  const walletQuery = await pool.query(
    `
      SELECT wallet_provider, network_id, used_address_hex, used_address_bech32
      FROM user_wallets
      WHERE user_id = $1
    `,
    [userId]
  );

  if (!walletQuery.rows[0]) {
    return { checked: 0, inserted: 0 };
  }

  const wallet = walletQuery.rows[0];
  const networkBaseUrl = BLOCKFROST_URLS[wallet.network_id] || BLOCKFROST_URLS[0];
  const address = wallet.used_address_bech32 || wallet.used_address_hex;

  try {
    const txListResponse = await fetch(
      `${networkBaseUrl}/addresses/${encodeURIComponent(address)}/transactions?order=desc&count=20`,
      {
        headers: {
          project_id: projectId,
        },
      }
    );

    if (!txListResponse.ok) {
      if (txListResponse.status === 404) {
        return { checked: 0, inserted: 0 };
      }

      throw new Error(`Blockfrost address lookup failed (${txListResponse.status}).`);
    }

    const txList = await txListResponse.json();
    let insertedCount = 0;

    for (const entry of Array.isArray(txList) ? txList : []) {
      const txHash = entry?.tx_hash || entry?.hash || entry;

      if (!txHash) {
        continue;
      }

      const txResponse = await fetch(`${networkBaseUrl}/txs/${encodeURIComponent(txHash)}`, {
        headers: {
          project_id: projectId,
        },
      });

      if (!txResponse.ok) {
        continue;
      }

      const txData = await txResponse.json();
      const incomingAmount = getMatchingOutputAmount(txData.outputs || [], address);

      if (!incomingAmount) {
        continue;
      }

      const confirmedAt = txData.block_time
        ? new Date(txData.block_time * 1000).toISOString()
        : null;

      const senderAddress = getIncomingSenderAddress(txData, address);
      const feeValue = parseLovelaceValue(txData.fees);

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
            confirmed_at,
            submitted_at,
            direction,
            sender_address
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', $9, COALESCE($10, NOW()), 'received', $11)
          ON CONFLICT (user_id, tx_hash, direction)
          DO UPDATE
          SET
            wallet_provider = EXCLUDED.wallet_provider,
            network_id = EXCLUDED.network_id,
            recipient_address = EXCLUDED.recipient_address,
            amount_lovelace = EXCLUDED.amount_lovelace,
            fee_lovelace = EXCLUDED.fee_lovelace,
            memo = EXCLUDED.memo,
            status = EXCLUDED.status,
            confirmed_at = COALESCE(cardano_transactions.confirmed_at, EXCLUDED.confirmed_at),

            sender_address = EXCLUDED.sender_address
        `,
        [
          userId,
          wallet.wallet_provider,
          wallet.network_id,
          txHash,
          address,
          incomingAmount,
          feeValue,
          null,
          confirmedAt,
          confirmedAt,
          senderAddress,
        ]
      );

      insertedCount += 1;
    }

    return { checked: txList.length || 0, inserted: insertedCount };
  } catch (error) {
    console.error("Failed to index incoming transactions:", error.message);
    return { checked: 0, inserted: 0 };
  }
}

function buildPendingQuery({ userId, limit }) {
  const limitValue = Number.isFinite(limit) ? Math.max(1, Number(limit)) : 50;

  if (userId) {
    return {
      text: `
        SELECT id, tx_hash, network_id
        FROM cardano_transactions
        WHERE user_id = $1 AND status IN ('submitted', 'pending')
        ORDER BY submitted_at DESC
        LIMIT $2
      `,
      values: [userId, limitValue],
    };
  }

  return {
    text: `
      SELECT id, tx_hash, network_id
      FROM cardano_transactions
      WHERE status IN ('submitted', 'pending')
      ORDER BY submitted_at DESC
      LIMIT $1
    `,
    values: [limitValue],
  };
}

export async function reconcilePendingTransactions({ userId = null, limit = 50 } = {}) {
  const projectId = process.env.BLOCKFROST_PROJECT_ID;

  await indexIncomingTransactions({ userId });

  if (!projectId) {
    throw new Error("Missing BLOCKFROST_PROJECT_ID in backend environment.");
  }

  const query = buildPendingQuery({ userId, limit });
  const pendingResult = await pool.query(query.text, query.values);

  let updatedCount = 0;

  for (const tx of pendingResult.rows) {
    try {
      const chainResult = await checkTxConfirmation(tx.network_id, tx.tx_hash, projectId);

      if (chainResult.found) {
        await pool.query(
          `
            UPDATE cardano_transactions
            SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, $2)
            WHERE id = $1
          `,
          [tx.id, chainResult.blockTime]
        );

        updatedCount += 1;
      }
    } catch (error) {
      console.error(`Failed to reconcile tx ${tx.tx_hash}:`, error.message);
    }
  }

  return {
    checked: pendingResult.rows.length,
    updated: updatedCount,
  };
}
