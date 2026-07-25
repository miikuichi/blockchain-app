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
