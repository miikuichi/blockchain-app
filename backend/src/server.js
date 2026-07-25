import app from "./app.js";
import { startBackgroundReconciliation } from "./services/reconciliationScheduler.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  startBackgroundReconciliation();

  console.log(`
========================================
🚀 ADAPay Backend Started
========================================
Server running on:
http://localhost:${PORT}
========================================
`);
});