import { useEffect, useState } from "react";
import { Send, AlertCircle } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { adaToLovelace } from "../services/cardanoTxService";

const API_BASE = "http://localhost:5000/api";

const EMPTY_FORM = { address: "", amount: "", memo: "" };

export default function SendPayment() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [linkedWallet, setLinkedWallet] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLinkedWallet = async () => {
      const API_BASE = "http://localhost:5000/api";
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

        if (!response.ok) {
          console.error("Failed to load linked wallet");
          return;
        }

        const data = await response.json();

        console.log("Wallet from backend:", data);

        if (data.wallet) {
          setLinkedWallet(data.wallet);
        } else {
          setLinkedWallet(null);
        }
      } catch (err) {
        console.error("Wallet load failed:", err);
        setLinkedWallet(null);
      }
    };

    loadLinkedWallet();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in again before sending a payment.");
      return;
    }

    if (!linkedWallet) {
      console.log("linkedWallet =", linkedWallet);

      setError(
        "No linked wallet found. Please connect your wallet again from the Dashboard.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { sendAdaWithWallet } = await import("../services/cardanoTxService");

      const txResult = await sendAdaWithWallet({
        walletProvider: linkedWallet.walletProvider,
        networkId: linkedWallet.networkId,
        recipientAddress: form.address,
        amountAda: form.amount,
      });

      const recordResponse = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          walletProvider: linkedWallet.walletProvider,
          networkId: linkedWallet.networkId,
          txHash: txResult.txHash,
          recipientAddress: form.address,
          amountLovelace: adaToLovelace(form.amount).toString(),
          feeLovelace: txResult.feeLovelace || null,
          memo: form.memo || null,
        }),
      });

      const recordData = await recordResponse.json();

      if (!recordResponse.ok) {
        throw new Error(
          recordData.message || "Transaction submitted but could not be saved.",
        );
      }

      setTxHash(recordData.transaction?.tx_hash || txResult.txHash);
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (submitError) {
      setError(submitError.message || "Transaction failed.");
    } finally {
      setIsSubmitting(false);
    }
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
                Your transaction has been signed with Lace and broadcast to the
                Cardano network.
              </p>
              {txHash && <p className="tx-hash">Tx Hash: {txHash}</p>}
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setTxHash("");
                }}
              >
                Send Another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="send-form">
              <div className="wallet-send-summary">
                <span className="card-title">Wallet</span>
                <p>
                  {linkedWallet
                    ? `${linkedWallet.walletProvider} (${linkedWallet.networkId === 0 ? "Preprod/Testnet" : "Mainnet"})`
                    : "No wallet linked yet"}
                </p>
              </div>

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
                <span>
                  Network fee is estimated by the wallet during submission.
                </span>
              </div>

              {error && <p className="send-error">{error}</p>}

              <Button
                type="submit"
                variant="gold"
                size="lg"
                icon={<Send size={16} />}
                className="btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm & Send"}
              </Button>
            </form>
          )}
        </Card>

        <Card className="send-info-card">
          <p className="card-title">Tips</p>
          <ul className="tips-list">
            <li>Always double-check the recipient address before sending.</li>
            <li>
              ADA transactions on Cardano are irreversible once confirmed.
            </li>
            <li>
              Keep your wallet on the same network as the app target network.
            </li>
            <li>Transactions confirm after network inclusion.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
