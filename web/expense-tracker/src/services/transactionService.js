const API_BASE = "http://localhost:5000/api";

export function formatAdaFromLovelace(lovelace) {
  const value = typeof lovelace === "bigint" ? lovelace : BigInt(lovelace ?? 0);
  const whole = value / 1_000_000n;
  const fraction = value % 1_000_000n;
  const fractionText = fraction.toString().padStart(6, "0").replace(/0+$/, "");

  return fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();
}

export function formatTxDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeTransaction(record) {
  return {
    id: record.tx_hash,
    type: record.direction || "sent",
    address: record.recipient_address,
    amount: formatAdaFromLovelace(record.amount_lovelace),
    status: record.status || "submitted",
    date: formatTxDate(record.confirmed_at || record.submitted_at),
    txHash: record.tx_hash,
    memo: record.memo || null,
    fee: record.fee_lovelace ? formatAdaFromLovelace(record.fee_lovelace) : null,
  };
}

export async function fetchTransactions(token) {
  const response = await fetch(`${API_BASE}/transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load transactions.");
  }

  return (data.transactions || []).map(normalizeTransaction);
}
