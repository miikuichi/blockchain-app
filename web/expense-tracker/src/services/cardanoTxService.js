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
  recipientAddress,
}) {
  validateRecipientAddress(recipientAddress);

  throw new Error(
    "Browser-side ADA sending is disabled because Lucid Evolution was removed to avoid the wasm runtime error.",
  );
}