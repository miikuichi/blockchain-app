import { BrowserWallet } from "@meshsdk/core";

function textToHex(text) {
  return Array.from(new TextEncoder().encode(text))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isWalletProvider(candidate) {
  return Boolean(candidate && typeof candidate.enable === "function");
}

function collectWalletEntries() {
  if (!window.cardano) {
    return [];
  }

  const entries = [];
  const seen = new Set();

  for (const key of Reflect.ownKeys(window.cardano)) {
    if (typeof key !== "string") {
      continue;
    }

    const wallet = window.cardano[key];

    if (!isWalletProvider(wallet) || seen.has(key)) {
      continue;
    }

    seen.add(key);
    entries.push({
      key,
      name: wallet.name || key,
      icon: wallet.icon || null,
    });
  }

  if (isWalletProvider(window.cardano.lace) && !seen.has("lace")) {
    entries.unshift({
      key: "lace",
      name: window.cardano.lace.name || "Lace",
      icon: window.cardano.lace.icon || null,
    });
  }

  return entries;
}

export function getAvailableWallets() {
  return collectWalletEntries();
}

export async function connectWallet(walletKey) {
  const wallet = window.cardano?.[walletKey];

  if (!wallet) {
    throw new Error("Selected wallet is not available.");
  }

  const api = await wallet.enable();
  const networkId = await api.getNetworkId();
  const usedAddresses = await api.getUsedAddresses();
  const rewardAddresses = await api.getRewardAddresses();

  if (!usedAddresses?.length) {
    throw new Error("No used address found in this wallet yet.");
  }

  const meshWallet = await BrowserWallet.enable(walletKey);
  const changeAddress = await meshWallet.getChangeAddress();

  return {
    api,
    networkId,
    usedAddressHex: usedAddresses[0],
    rewardAddressHex: rewardAddresses?.[0] || null,
    changeAddressBech32: changeAddress || null,
    walletProvider: walletKey,
  };
}

export async function signWalletLinkChallenge(api, usedAddressHex, nonce) {
  const message = `ADAPay wallet link:${nonce}`;
  const payloadHex = textToHex(message);
  const signed = await api.signData(usedAddressHex, payloadHex);

  return {
    key: signed.key,
    signature: signed.signature,
  };
}

export function lovelaceToAda(lovelaceQuantity) {
  const lovelace = BigInt(lovelaceQuantity ?? 0);
  const whole = lovelace / 1_000_000n;
  const fraction = lovelace % 1_000_000n;
  const fractionText = fraction.toString().padStart(6, "0").replace(/0+$/, "");

  return fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();
}

export async function getWalletRuntimeInfo(walletKey) {
  if (!walletKey) {
    throw new Error("Wallet provider is required.");
  }

  const wallet = await BrowserWallet.enable(walletKey);
  const [networkId, changeAddress, balanceAssets] = await Promise.all([
    wallet.getNetworkId(),
    wallet.getChangeAddress(),
    wallet.getBalance(),
  ]);

  const lovelaceAsset = (balanceAssets || []).find((asset) => asset.unit === "lovelace");
  const lovelace = lovelaceAsset?.quantity || "0";

  return {
    networkId,
    receiveAddress: changeAddress,
    lovelace,
    balanceAda: lovelaceToAda(lovelace),
  };
}