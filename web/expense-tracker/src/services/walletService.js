function textToHex(text) {
  return Array.from(new TextEncoder().encode(text))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getAvailableWallets() {
  if (!window.cardano) {
    return [];
  }

  return Object.entries(window.cardano)
    .filter(([, wallet]) => typeof wallet?.enable === "function")
    .map(([key, wallet]) => ({
      key,
      name: wallet.name || key,
      icon: wallet.icon || null,
    }));
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