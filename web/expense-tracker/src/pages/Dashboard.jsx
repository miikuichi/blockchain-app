import { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  TrendingUp,
  Send,
} from "lucide-react";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import TransactionItem from "../components/transactions/TransactionItem";
import WalletConnectCard from "../components/wallet/WalletConnectCard";
import { fetchTransactions } from "../services/transactionService";

const API_BASE = "http://localhost:5000/api";

function sumAda(txList) {
  const total = txList.reduce((acc, tx) => {
    const clean = String(tx.amount ?? "0").replace(/[^\d.]/g, "");
    const [whole = "0", fraction = ""] = clean.split(".");
    const lovelace = BigInt(`${whole}${`${fraction}000000`.slice(0, 6)}`);
    return acc + lovelace;
  }, 0n);

  const whole = total / 1_000_000n;
  const fraction = total % 1_000_000n;
  const fractionText = fraction.toString().padStart(6, "0").replace(/0+$/, "");

  return fractionText
    ? `${whole.toString()}.${fractionText}`
    : whole.toString();
}

export default function Dashboard({ onNavigate }) {
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

  const sentTotal = sumAda(
    transactions.filter((tx) => (tx.type || "sent") === "sent"),
  );
  const pendingCount = transactions.filter(
    (tx) => tx.status === "pending" || tx.status === "submitted",
  ).length;
  const txCount = transactions.length;
  const recentTransactions = transactions.slice(0, 5);

  const STATS = [
    {
      label: "Total Sent",
      value: `${sentTotal} ₳`,
      sub: "All submitted txs",
      icon: ArrowUpRight,
    },
    {
      label: "Pending",
      value: `${pendingCount}`,
      sub: "Awaiting confirmation",
      icon: RefreshCw,
    },
    {
      label: "Transactions",
      value: `${txCount}`,
      sub: "Recorded by backend",
      icon: TrendingUp,
    },
    {
      label: "Linked Wallet",
      value: transactions.length > 0 ? "Active" : "—",
      sub: "CIP-30 wallet",
      icon: Wallet,
    },
  ];
  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back — here&apos;s your wallet overview.</p>
      </div>

      {/* Balance hero card */}
      <div className="balance-card">
        <div className="balance-card-inner">
          <div className="balance-left">
            <div className="balance-label">
              <Wallet size={13} />
              <span>Available Balance</span>
            </div>
            <div className="balance-amount">
              —<span className="balance-unit"> ₳</span>
            </div>
          </div>
          <div className="balance-actions">
            <Button
              variant="gold"
              icon={<Send size={15} />}
              onClick={() => onNavigate("send")}
            >
              Send
            </Button>
            <Button variant="ghost" icon={<ArrowDownLeft size={15} />}>
              Receive
            </Button>
          </div>
        </div>
        <div className="balance-glow" />
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent transactions */}
      <Card>
        <div className="section-header">
          <span className="card-title">Recent Transactions</span>
          <button
            className="link-btn"
            onClick={() => onNavigate("transactions")}
          >
            View all
          </button>
        </div>
        {loading ? (
          <p className="empty-state">Loading transactions...</p>
        ) : recentTransactions.length === 0 ? (
          <p className="empty-state">No transactions submitted yet.</p>
        ) : (
          recentTransactions.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} />
          ))
        )}
      </Card>

      <div className="wallet-connect-section">
        <WalletConnectCard />
      </div>
    </div>
  );
}
