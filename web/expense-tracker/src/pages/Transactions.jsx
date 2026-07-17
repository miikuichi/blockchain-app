import { useState } from 'react';
import Card from '../components/ui/Card';
import TransactionItem from '../components/transactions/TransactionItem';

const ALL_TXS = [];

const TABS = ['all', 'sent', 'received'];

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = ALL_TXS.filter(
    (tx) => activeTab === 'all' || tx.type === activeTab,
  );

  return (
    <div>
      <div className="page-header">
        <h1>Transactions</h1>
        <p>No transactions yet.</p>
      </div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="empty-state">No transactions found.</p>
        ) : (
          filtered.map((tx) => <TransactionItem key={tx.id} tx={tx} />)
        )}
      </Card>
    </div>
  );
}
