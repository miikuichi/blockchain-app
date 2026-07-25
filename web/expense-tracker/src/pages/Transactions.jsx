import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import TransactionItem from "../components/transactions/TransactionItem";
import { fetchTransactions } from "../services/transactionService";

const TABS = ["all", "sent", "received"];

export default function Transactions() {
  const [activeTab, setActiveTab] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchTransactions(token);
        setTransactions(data);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const filtered = useMemo(
    () =>
      transactions.filter(
        (tx) => activeTab === "all" || (tx.type || "sent") === activeTab,
      ),
    [transactions, activeTab],
  );

  const pageDescription = loading
    ? "Loading submitted Cardano transactions..."
    : transactions.length === 0
      ? "No transactions have been recorded yet."
      : `${transactions.length} transaction${transactions.length === 1 ? "" : "s"} recorded.`;

  return (
    <div>
      <div className="page-header">
        <h1>Transactions</h1>
        <p>{pageDescription}</p>
      </div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <p className="empty-state">Loading transactions...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">No transactions found.</p>
        ) : (
          filtered.map((tx) => <TransactionItem key={tx.id} tx={tx} />)
        )}
      </Card>
    </div>
  );
}
