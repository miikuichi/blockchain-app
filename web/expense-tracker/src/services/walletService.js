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

  return {
    api,
    networkId,
    usedAddressHex: usedAddresses[0],
    rewardAddressHex: rewardAddresses?.[0] || null,
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