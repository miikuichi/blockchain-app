import crypto from "node:crypto";
import pool from "../config/db.js";
import {
  COSESign1,
  COSEKey,
  Label,
  Int,
} from "@emurgo/cardano-message-signing-nodejs";
import nacl from "tweetnacl";

const CHALLENGE_TTL_MINUTES = 10;

function toHexUtf8(input) {
  return Buffer.from(input, "utf8").toString("hex");
}

function constantTimeEqual(a, b) {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyCip30DataSignature(signatureHex, keyHex, expectedPayloadHex) {
  const coseSign1 = COSESign1.from_bytes(Buffer.from(signatureHex, "hex"));
  const coseKey = COSEKey.from_bytes(Buffer.from(keyHex, "hex"));

  const labelMinusTwo = Label.new_int(Int.new_i32(-2));
  const keyX = coseKey.header(labelMinusTwo);

  if (!keyX) {
    throw new Error("COSE key is missing public key material.");
  }

  const pubKeyBytes = keyX.as_bytes();

  if (!pubKeyBytes) {
    throw new Error("Public key bytes are missing from COSE key.");
  }

  const payloadBytes = coseSign1.payload();

  if (!payloadBytes) {
    throw new Error("Signature payload is missing.");
  }

  const payloadHex = Buffer.from(payloadBytes).toString("hex");

  if (!constantTimeEqual(payloadHex, expectedPayloadHex)) {
    throw new Error("Signed payload does not match expected challenge payload.");
  }

  const sigStructureBytes = coseSign1.signed_data().to_bytes();
  const signatureBytes = coseSign1.signature();

  const verified = nacl.sign.detached.verify(
    new Uint8Array(sigStructureBytes),
    new Uint8Array(signatureBytes),
    new Uint8Array(pubKeyBytes)
  );

  if (!verified) {
    throw new Error("Invalid signature.");
  }
}

export const createChallenge = async (req, res) => {
  try {
    const nonce = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60 * 1000);

    await pool.query(
      `
      INSERT INTO wallet_link_challenges (user_id, nonce, expires_at)
      VALUES ($1, $2, $3)
      `,
      [req.user.id, nonce, expiresAt]
    );

    return res.status(200).json({
      success: true,
      challenge: {
        nonce,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create wallet link challenge.",
    });
  }
};

export const verifyAndLinkWallet = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      walletProvider,
      networkId,
      usedAddressHex,
      rewardAddressHex,
      key,
      signature,
      nonce,
    } = req.body;

    const targetNetworkId = Number(process.env.CARDANO_TARGET_NETWORK_ID ?? 0);

    if (
      !walletProvider ||
      typeof networkId !== "number" ||
      !usedAddressHex ||
      !key ||
      !signature ||
      !nonce
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required wallet verification fields.",
      });
    }

    if (networkId !== targetNetworkId) {
      return res.status(400).json({
        success: false,
        message: `Wallet network mismatch. Expected networkId ${targetNetworkId}.`,
      });
    }

    await client.query("BEGIN");

    const challengeResult = await client.query(
      `
      SELECT id, nonce, expires_at, consumed_at
      FROM wallet_link_challenges
      WHERE user_id = $1 AND nonce = $2
      FOR UPDATE
      `,
      [req.user.id, nonce]
    );

    if (challengeResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Wallet challenge not found.",
      });
    }

    const challenge = challengeResult.rows[0];

    if (challenge.consumed_at) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Wallet challenge has already been used.",
      });
    }

    if (new Date(challenge.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return res.status(410).json({
        success: false,
        message: "Wallet challenge has expired.",
      });
    }

    const message = `ADAPay wallet link:${nonce}`;
    const expectedPayloadHex = toHexUtf8(message);

    verifyCip30DataSignature(signature, key, expectedPayloadHex);

    await client.query(
      `
      INSERT INTO user_wallets (
        user_id,
        wallet_provider,
        network_id,
        used_address_hex,
        reward_address_hex,
        cose_key_hex,
        linked_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id)
      DO UPDATE
      SET
        wallet_provider = EXCLUDED.wallet_provider,
        network_id = EXCLUDED.network_id,
        used_address_hex = EXCLUDED.used_address_hex,
        reward_address_hex = EXCLUDED.reward_address_hex,
        cose_key_hex = EXCLUDED.cose_key_hex,
        linked_at = NOW()
      `,
      [
        req.user.id,
        walletProvider,
        networkId,
        usedAddressHex,
        rewardAddressHex || null,
        key,
      ]
    );

    await client.query(
      `
      UPDATE wallet_link_challenges
      SET consumed_at = NOW()
      WHERE id = $1
      `,
      [challenge.id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Wallet linked successfully.",
      wallet: {
        walletProvider,
        networkId,
        usedAddressHex,
        rewardAddressHex: rewardAddressHex || null,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to verify wallet signature.",
    });
  } finally {
    client.release();
  }
};

export const getLinkedWallet = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT wallet_provider, network_id, used_address_hex, reward_address_hex, linked_at
      FROM user_wallets
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      wallet: result.rows[0]
        ? {
            walletProvider: result.rows[0].wallet_provider,
            networkId: result.rows[0].network_id,
            usedAddressHex: result.rows[0].used_address_hex,
            rewardAddressHex: result.rows[0].reward_address_hex,
            linkedAt: result.rows[0].linked_at,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch linked wallet.",
    });
  }
};