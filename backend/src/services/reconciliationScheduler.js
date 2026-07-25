import { reconcilePendingTransactions } from "./reconciliationService.js";

let schedulerHandle = null;
let runInProgress = false;
let schedulerIntervalMs = null;
let lastRunStartedAt = null;
let lastRunFinishedAt = null;
let lastSuccessAt = null;
let lastErrorMessage = null;
let lastCheckedCount = 0;
let lastUpdatedCount = 0;

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

async function executeReconciliationRun() {
  if (runInProgress) {
    return;
  }

  runInProgress = true;
  lastRunStartedAt = new Date();

  try {
    const result = await reconcilePendingTransactions({ limit: 200 });

    lastCheckedCount = result.checked;
    lastUpdatedCount = result.updated;
    lastSuccessAt = new Date();
    lastErrorMessage = null;

    if (result.updated > 0) {
      console.log(`✅ Reconciled ${result.updated}/${result.checked} pending transaction(s).`);
    }
  } catch (error) {
    lastErrorMessage = error.message;
    console.error("❌ Background reconciliation failed:", error.message);
  } finally {
    lastRunFinishedAt = new Date();
    runInProgress = false;
  }
}

export function getReconciliationSchedulerStatus() {
  return {
    enabled: isEnabled(),
    running: Boolean(schedulerHandle),
    inProgress: runInProgress,
    intervalMs: schedulerIntervalMs,
    lastRunStartedAt: lastRunStartedAt ? lastRunStartedAt.toISOString() : null,
    lastRunFinishedAt: lastRunFinishedAt ? lastRunFinishedAt.toISOString() : null,
    lastSuccessAt: lastSuccessAt ? lastSuccessAt.toISOString() : null,
    lastErrorMessage,
    lastCheckedCount,
    lastUpdatedCount,
  };
}

export async function runReconciliationNow() {
  await executeReconciliationRun();
  return getReconciliationSchedulerStatus();
}

export function startBackgroundReconciliation() {
  if (!isEnabled()) {
    console.log("ℹ️ Background reconciliation is disabled.");
    return;
  }

  if (schedulerHandle) {
    return;
  }

  schedulerIntervalMs = intervalMs();

  executeReconciliationRun();
  schedulerHandle = setInterval(executeReconciliationRun, schedulerIntervalMs);

  console.log(`⏱️ Background reconciliation started (every ${schedulerIntervalMs}ms).`);
}
