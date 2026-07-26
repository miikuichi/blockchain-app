import { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  TrendingUp,
  Send,
  Activity,
} from "lucide-react";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import TransactionItem from "../components/transactions/TransactionItem";
import WalletConnectCard from "../components/wallet/WalletConnectCard";
import { fetchTransactions } from "../services/transactionService";
import { getWalletRuntimeInfo } from "../services/walletService";

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
  const [scheduler, setScheduler] = useState(null);
  const [schedulerLoading, setSchedulerLoading] = useState(true);
  const [schedulerError, setSchedulerError] = useState("");
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState(null);
  const [availableBalanceAda, setAvailableBalanceAda] = useState("—");
  const [receiveAddress, setReceiveAddress] = useState("");
  const [receiveMessage, setReceiveMessage] = useState("");

  const fetchSchedulerStatus = async () => {
    const token = localStorage.getItem("token");

    try {
      setSchedulerLoading(true);
      setSchedulerError("");

      const response = await fetch(`${API_BASE}/health/reconciliation`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load reconciliation status.",
        );
      }

      setScheduler(data.scheduler || null);
    } catch (error) {
      setSchedulerError(
        error.message || "Unable to load reconciliation status.",
      );
      setScheduler(null);
    } finally {
      setSchedulerLoading(false);
    }
  };

  const runReconciliationNow = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setSchedulerError("Please log in again to trigger reconciliation.");
      return;
    }

    try {
      setRunNowLoading(true);
      setSchedulerError("");

      const response = await fetch(`${API_BASE}/health/reconciliation/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to run reconciliation.");
      }

      setScheduler(data.scheduler || null);
    } catch (error) {
      setSchedulerError(error.message || "Unable to run reconciliation.");
    } finally {
      setRunNowLoading(false);
    }
  };

  const statusValue = schedulerLoading
    ? "Loading"
    : scheduler?.inProgress
      ? "Running"
      : scheduler?.running
        ? "Online"
        : "Offline";

  const lastSuccessLabel = scheduler?.lastSuccessAt
    ? new Date(scheduler.lastSuccessAt).toLocaleString()
    : "—";

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

    const loadWalletRuntime = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/wallet/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.wallet) {
          setLinkedWallet(null);
          setAvailableBalanceAda("—");
          setReceiveAddress("");
          return;
        }

        setLinkedWallet(data.wallet);

        const runtime = await getWalletRuntimeInfo(data.wallet.walletProvider);
        setAvailableBalanceAda(runtime.balanceAda);
        setReceiveAddress(runtime.receiveAddress || "");
      } catch {
        setAvailableBalanceAda("—");
        setReceiveAddress("");
      }
    };

    loadTransactions();
    loadWalletRuntime();
    fetchSchedulerStatus();

    const schedulerRefreshHandle = setInterval(() => {
      fetchSchedulerStatus();
    }, 60000);

    return () => {
      clearInterval(schedulerRefreshHandle);
    };
  }, []);

  const onReceiveClick = async () => {
    if (!receiveAddress) {
      setReceiveMessage(
        "Connect and unlock Lace to fetch your receive address.",
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(receiveAddress);
      setReceiveMessage("Receive address copied to clipboard.");
    } catch {
      setReceiveMessage("Unable to copy address automatically.");
    }
  };

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
      value: linkedWallet ? "Active" : "—",
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
              {availableBalanceAda}
              <span className="balance-unit"> ₳</span>
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
            <Button
              variant="ghost"
              icon={<ArrowDownLeft size={15} />}
              onClick={onReceiveClick}
            >
              Receive
            </Button>
          </div>
        </div>
        {receiveMessage && <p className="balance-fiat">{receiveMessage}</p>}
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

      <div className="reconcile-monitor-section">
        <Card className="reconcile-monitor-card">
          <div className="section-header">
            <span className="card-title">Reconciliation Monitor</span>
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={fetchSchedulerStatus}
              disabled={schedulerLoading || runNowLoading}
            >
              Refresh
            </Button>
          </div>

          <div className="reconcile-monitor-grid">
            <div className="reconcile-metric">
              <span>Status</span>
              <strong>{statusValue}</strong>
            </div>
            <div className="reconcile-metric">
              <span>Last Success</span>
              <strong>{lastSuccessLabel}</strong>
            </div>
            <div className="reconcile-metric">
              <span>Last Checked</span>
              <strong>{scheduler?.lastCheckedCount ?? 0}</strong>
            </div>
            <div className="reconcile-metric">
              <span>Last Updated</span>
              <strong>{scheduler?.lastUpdatedCount ?? 0}</strong>
            </div>
          </div>

          {schedulerError && (
            <p className="reconcile-error">{schedulerError}</p>
          )}

          <div className="reconcile-actions">
            <Button
              variant="gold"
              size="sm"
              icon={<Activity size={14} />}
              onClick={runReconciliationNow}
              disabled={runNowLoading}
            >
              {runNowLoading ? "Running..." : "Run Now"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
