import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const EMPTY_FORM = { address: '', amount: '', memo: '' };

export default function SendPayment() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Send Payment</h1>
        <p>Transfer ADA to any Cardano address.</p>
      </div>

      <div className="send-layout">
        <Card className="send-form-card">
          {submitted ? (
            <div className="send-success">
              <div className="success-icon">✓</div>
              <h3>Transaction Submitted</h3>
              <p>
                Your transaction has been broadcast to the Cardano network and is
                awaiting confirmation.
              </p>
              <Button
                variant="outline"
                onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); }}
              >
                Send Another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="send-form">
              <div className="form-group">
                <label className="form-label">Recipient Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="addr1q..."
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (ADA)</label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="form-input"
                    min="1"
                    step="0.01"
                    required
                  />
                  <span className="input-suffix">₳</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Memo <span className="form-optional">(optional)</span>
                </label>
                <textarea
                  name="memo"
                  value={form.memo}
                  onChange={handleChange}
                  placeholder="Add a note..."
                  className="form-input form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-fee-note">
                <AlertCircle size={13} />
                <span>Network fee: ~0.17 ₳ (estimated)</span>
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                icon={<Send size={16} />}
                className="btn-full"
              >
                Confirm &amp; Send
              </Button>
            </form>
          )}
        </Card>

        <Card className="send-info-card">
          <p className="card-title">Tips</p>
          <ul className="tips-list">
            <li>Always double-check the recipient address before sending.</li>
            <li>ADA transactions on Cardano are irreversible once confirmed.</li>
            <li>Minimum transaction is 1 ADA due to the minUTxO requirement.</li>
            <li>Transactions typically confirm within 1–3 blocks (~60 seconds).</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
