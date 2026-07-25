import { Blockfrost, Lucid } from "@lucid-evolution/lucid";
import { connectWallet } from "./walletService";

const BLOCKFROST_URLS = {
  0: "https://cardano-preprod.blockfrost.io/api/v0",
  1: "https://cardano-mainnet.blockfrost.io/api/v0",
};

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

  const blockfrostUrl = BLOCKFROST_URLS[networkId];

  if (!blockfrostUrl) {
    throw new Error("Unsupported Cardano network.");
  }

  const { api } = await connectWallet(walletProvider);
  const network = networkId === 0 ? "Preprod" : "Mainnet";

  console.log("Step 1");
  console.log("Project ID:", projectId);
  console.log("Network:", network);
  console.log("URL:", blockfrostUrl);

  const provider = new Blockfrost(blockfrostUrl, projectId);

  console.log("Step 2");

  const lucid = await Lucid.new(provider, network);

  console.log("Step 3");

  /*const lucid = await Lucid.new(new Blockfrost(blockfrostUrl, projectId), network);
  lucid.selectWallet(api);*/

  const address = validateRecipientAddress(recipientAddress);
  const lovelace = adaToLovelace(amountAda);

  const tx = await lucid
    .newTx()
    .payToAddress(address, { lovelace })
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  return {
    txHash,
  };
}