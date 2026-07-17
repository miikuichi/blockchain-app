import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, TrendingUp, Send } from 'lucide-react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import TransactionItem from '../components/transactions/TransactionItem';

const STATS = [
  { label: 'Total Sent',       value: '—', sub: 'Last 30 days', icon: ArrowUpRight },
  { label: 'Total Received',   value: '—', sub: 'Last 30 days', icon: ArrowDownLeft },
  { label: 'Pending',          value: '—', sub: '—',            icon: RefreshCw },
  { label: 'Portfolio Change', value: '—', sub: 'vs last month', icon: TrendingUp },
];

const RECENT_TXS = [];

export default function Dashboard({ onNavigate }) {
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
              —
              <span className="balance-unit"> ₳</span>
            </div>
          </div>
          <div className="balance-actions">
            <Button variant="gold" icon={<Send size={15} />} onClick={() => onNavigate('send')}>
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
          <button className="link-btn" onClick={() => onNavigate('transactions')}>
            View all
          </button>
        </div>
        {RECENT_TXS.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} />
        ))}
      </Card>
    </div>
  );
}
