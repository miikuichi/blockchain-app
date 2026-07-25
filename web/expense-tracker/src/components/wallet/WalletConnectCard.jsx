import { useEffect, useMemo, useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import {
  getAvailableWallets,
  connectWallet,
  signWalletLinkChallenge,
} from "../../services/walletService";

const API_BASE = "http://localhost:5000/api";

function shortenHex(hexValue) {
  if (!hexValue || hexValue.length < 18) {
    return hexValue || "-";
  }

  return `${hexValue.slice(0, 10)}...${hexValue.slice(-8)}`;
}

export default function WalletConnectCard() {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkedWallet, setLinkedWallet] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchLinkedWallet = async () => {
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

      if (response.ok) {
        setLinkedWallet(data.wallet);
      }
    } catch {
      // Ignore initial load errors to keep dashboard usable.
    }
  };

  useEffect(() => {
    const wallets = getAvailableWallets();
    setAvailableWallets(wallets);

    if (wallets.length > 0) {
      setSelectedWallet(wallets[0].key);
    }

    fetchLinkedWallet();
  }, []);

  const handleLinkWallet = async () => {
    if (!token) {
      setError("Please log in again before linking a wallet.");
      return;
    }

    if (!selectedWallet) {
      setError("Select a wallet to continue.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const challengeRes = await fetch(`${API_BASE}/wallet/challenge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const challengeData = await challengeRes.json();

      if (!challengeRes.ok) {
        throw new Error(
          challengeData.message || "Failed to request challenge.",
        );
      }

      const connection = await connectWallet(selectedWallet);

      if (connection.networkId !== 0) {
        throw new Error(
          "Please switch your wallet to Cardano preprod/testnet (networkId 0).",
        );
      }

      const signed = await signWalletLinkChallenge(
        connection.api,
        connection.usedAddressHex,
        challengeData.challenge.nonce,
      );

      const verifyRes = await fetch(`${API_BASE}/wallet/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          walletProvider: connection.walletProvider,
          networkId: connection.networkId,
          usedAddressHex: connection.usedAddressHex,
          rewardAddressHex: connection.rewardAddressHex,
          nonce: challengeData.challenge.nonce,
          key: signed.key,
          signature: signed.signature,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.message || "Wallet verification failed.");
      }

      setLinkedWallet(verifyData.wallet);
    } catch (err) {
      console.error(err);
      console.log("FAILED AT:", err);

      setError(err.message || "Wallet linking failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="wallet-connect-card">
      <div className="section-header wallet-connect-header">
        <span className="card-title">Wallet Link (CIP-30)</span>
      </div>

      {linkedWallet ? (
        <div className="wallet-linked-state">
          <p className="wallet-linked-title">
            <Link2 size={14} />
            Wallet Linked
          </p>
          <p className="wallet-linked-row">
            Provider: <strong>{linkedWallet.walletProvider}</strong>
          </p>
          <p className="wallet-linked-row">
            Network:{" "}
            <strong>
              {linkedWallet.networkId === 0 ? "Preprod/Testnet" : "Mainnet"}
            </strong>
          </p>
          <p className="wallet-linked-row">
            Address: <strong>{shortenHex(linkedWallet.usedAddressHex)}</strong>
          </p>
        </div>
      ) : (
        <div className="wallet-link-form">
          <label className="form-label" htmlFor="wallet-provider">
            Wallet Provider
          </label>
          <select
            id="wallet-provider"
            className="form-input"
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
          >
            {availableWallets.length === 0 && (
              <option value="">No CIP-30 wallet detected</option>
            )}
            {availableWallets.map((wallet) => (
              <option key={wallet.key} value={wallet.key}>
                {wallet.name}
              </option>
            ))}
          </select>

          <p className="wallet-link-note">
            Use a Cardano preprod wallet extension. The app will request one
            signature to verify wallet ownership.
          </p>

          {error && <p className="wallet-link-error">{error}</p>}

          <Button
            variant="gold"
            icon={<RefreshCw size={14} />}
            onClick={handleLinkWallet}
            disabled={isLoading || availableWallets.length === 0}
          >
            {isLoading ? "Linking..." : "Connect & Link Wallet"}
          </Button>
        </div>
      )}
    </Card>
  );
}
