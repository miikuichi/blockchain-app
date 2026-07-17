import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Badge from '../ui/Badge';

const STATUS_VARIANT = { confirmed: 'success', pending: 'pending', failed: 'failed' };

export default function TransactionItem({ tx }) {
  const isSent = tx.type === 'sent';

  return (
    <div className="tx-item">
      <div className={`tx-icon ${isSent ? 'tx-sent' : 'tx-received'}`}>
        {isSent ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
      </div>

      <div className="tx-info">
        <span className="tx-label">{isSent ? 'Sent to' : 'Received from'}</span>
        <span className="tx-address">{tx.address}</span>
      </div>

      <div className="tx-meta">
        <span className={`tx-amount ${isSent ? 'amount-negative' : 'amount-positive'}`}>
          {isSent ? '−' : '+'}{tx.amount} ₳
        </span>
        <div className="tx-footer">
          <Badge label={tx.status} variant={STATUS_VARIANT[tx.status] ?? 'info'} />
          <span className="tx-date">{tx.date}</span>
        </div>
      </div>
    </div>
  );
}
