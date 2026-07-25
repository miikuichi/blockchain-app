import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Badge from "../ui/Badge";

const STATUS_VARIANT = {
  confirmed: "success",
  pending: "pending",
  failed: "failed",
};

export default function TransactionItem({ tx }) {
  const isSent = (tx.type || tx.direction || "sent") === "sent";
  const address =
    tx.address || tx.recipient_address || tx.txHash || tx.tx_hash || "—";
  const amount = tx.amount ?? tx.amount_display ?? tx.amountAda ?? "0";
  const status = tx.status || "pending";
  const date = tx.date || tx.submitted_at || "—";

  return (
    <div className="tx-item">
      <div className={`tx-icon ${isSent ? "tx-sent" : "tx-received"}`}>
        {isSent ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
      </div>

      <div className="tx-info">
        <span className="tx-label">{isSent ? "Sent to" : "Received from"}</span>
        <span className="tx-address">{address}</span>
      </div>

      <div className="tx-meta">
        <span
          className={`tx-amount ${isSent ? "amount-negative" : "amount-positive"}`}
        >
          {isSent ? "−" : "+"}
          {amount} ₳
        </span>
        <div className="tx-footer">
          <Badge label={status} variant={STATUS_VARIANT[status] ?? "info"} />
          <span className="tx-date">{date}</span>
        </div>
      </div>
    </div>
  );
}
