import { reconcilePendingTransactions } from "./reconciliationService.js";

let schedulerHandle = null;

function isEnabled() {
  const raw = (process.env.ENABLE_BACKGROUND_RECONCILE || "true").toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function intervalMs() {
  const parsed = Number(process.env.RECONCILE_INTERVAL_MS || 60000);

  if (!Number.isFinite(parsed) || parsed < 10000) {
    return 60000;
  }

  return parsed;
}

export function startBackgroundReconciliation() {
  if (!isEnabled()) {
    console.log("ℹ️ Background reconciliation is disabled.");
    return;
  }

  if (schedulerHandle) {
    return;
  }

  const everyMs = intervalMs();

  const run = async () => {
    try {
      const result = await reconcilePendingTransactions({ limit: 200 });

      if (result.updated > 0) {
        console.log(`✅ Reconciled ${result.updated}/${result.checked} pending transaction(s).`);
      }
    } catch (error) {
      console.error("❌ Background reconciliation failed:", error.message);
    }
  };

  run();
  schedulerHandle = setInterval(run, everyMs);

  console.log(`⏱️ Background reconciliation started (every ${everyMs}ms).`);
}
