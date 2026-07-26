import { BlockfrostProvider, BrowserWallet, Transaction } from "@meshsdk/core";

export function adaToLovelace(amount) {
  const normalized = String(amount).trim();

  if (!normalized) {
    throw new Error("Amount is required.");
  }

  if (!/^\d+(\.\d{1,6})?$/.test(normalized)) {
    throw new Error("Amount must have at most 6 decimal places.");
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const paddedFractional = `${fractionalPart}000000`.slice(0, 6);

  return BigInt(`${wholePart}${paddedFractional}`);
}

export function validateRecipientAddress(address) {
  const trimmed = String(address).trim();

  if (!trimmed) {
    throw new Error("Recipient address is required.");
  }

  return trimmed;
}

export async function sendAdaWithWallet({
  walletProvider,
  networkId,
  recipientAddress,
  amountAda,
}) {
  const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;

  if (!projectId) {
    throw new Error("Missing VITE_BLOCKFROST_PROJECT_ID environment variable.");
  }

  const address = validateRecipientAddress(recipientAddress);
  const lovelace = adaToLovelace(amountAda);

  const wallet = await BrowserWallet.enable(walletProvider);
  const walletNetworkId = await wallet.getNetworkId();

  if (walletNetworkId !== networkId) {
    throw new Error("Wallet network changed. Please reconnect your wallet.");
  }

  const blockchainProvider = new BlockfrostProvider(projectId);
  const tx = new Transaction({
    initiator: wallet,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
  });

  tx.sendLovelace(address, lovelace.toString());

  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  return {
    txHash,
    feeLovelace: null,
  };
}