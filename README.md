# ADAPay Expense Tracker

A React + Node.js expense tracker prototype with Cardano wallet linking using CIP-30 browser wallets.

## Current Status

Implemented in this phase:

- User registration and login (JWT)
- Wallet link flow using CIP-30 challenge-sign-verify
- Wallet ownership verification on backend using COSE parsing + Ed25519 signature verification
- Wallet linkage persistence in PostgreSQL
- Wallet link UI in the dashboard
- Real ADA send flow from frontend wallet (Lucid + CIP-30)
- Transaction recording and history views backed by PostgreSQL
- Transaction confirmation reconciliation against Blockfrost
- Background scheduler for transaction reconciliation

Not implemented yet:

- Received transaction indexing and full portfolio balance indexing
- Production deployment hardening

## Tech Stack

- Frontend: React + Vite
- Backend: Express (ESM)
- Database: PostgreSQL
- Cardano wallet integration: CIP-30 browser wallet API

## Project Structure

- backend: API server and database initialization
- web/expense-tracker: React client

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL database (Supabase or local)
- A CIP-30 wallet extension on browser (for example Lace, Eternl, Nami)

## Environment Variables (Backend)

Create backend/.env with:

```
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...

JWT_SECRET=replace_with_secure_secret

# 0 = testnet/preprod, 1 = mainnet
CARDANO_TARGET_NETWORK_ID=0
BLOCKFROST_PROJECT_ID=your_blockfrost_project_id

# Optional background reconciliation config
ENABLE_BACKGROUND_RECONCILE=true
RECONCILE_INTERVAL_MS=60000

PORT=5000
```

Notes:

- Keep CARDANO_TARGET_NETWORK_ID at 0 while developing and testing.
- Wallet linking will fail when wallet network does not match this value.
- RECONCILE_INTERVAL_MS has a minimum safety floor of 10000ms.

## Environment Variables (Frontend)

Create web/expense-tracker/.env with:

```
VITE_BLOCKFROST_PROJECT_ID=your_blockfrost_project_id
```

Notes:

- The Send page uses Blockfrost through Lucid to build and submit ADA transactions.
- Use a preprod Blockfrost project ID while developing against network ID 0.

## Install and Run

### 1) Backend

```
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:5000

### 2) Frontend

```
cd web/expense-tracker
npm install
npm run dev
```

Frontend runs on the Vite local URL (usually http://localhost:5173)

## API Endpoints

### Auth

- POST /api/auth/register
- POST /api/auth/login

### Wallet Link (Requires Bearer JWT)

- POST /api/wallet/challenge
  - Returns one-time nonce challenge
- POST /api/wallet/verify
  - Accepts wallet provider, addresses, nonce, COSE key, and signature
  - Verifies signature and links wallet to user
- GET /api/wallet/me
  - Returns linked wallet for current user

### Transactions (Requires Bearer JWT)

- POST /api/transactions
  - Records a submitted tx hash and metadata
- GET /api/transactions
  - Returns recorded transactions for the current user
- POST /api/transactions/reconcile
  - Checks submitted/pending tx hashes against Blockfrost and updates confirmed status

## Wallet Link Flow (CIP-30)

1. User logs in and receives JWT.
2. Frontend requests challenge from backend.
3. Frontend enables selected CIP-30 wallet.
4. Frontend signs message:
   ADAPay wallet link:<nonce>
5. Frontend sends nonce + key + signature + addresses to backend.
6. Backend verifies signature and stores linked wallet.

## Send Flow

1. User links a wallet first.
2. Frontend loads the linked wallet provider from the backend.
3. Send page uses Lucid + Blockfrost to build, sign, and submit a simple ADA transfer.
4. Backend records the submitted tx hash in the transaction table.
5. Dashboard and Transactions pages trigger reconciliation to update pending transactions to confirmed.
6. Background scheduler continuously reconciles pending transactions even when users are offline.

## Database Tables

Created automatically on backend startup:

- users
- user_wallets
- wallet_link_challenges

## Verify the Current Integration Quickly

1. Start backend and frontend.
2. Register or login.
3. Open Dashboard.
4. Use Connect and Link Wallet.
5. Approve wallet access and signature in extension.
6. Confirm linked wallet details appear in dashboard card.

## Known Constraints

- This phase supports outgoing on-chain sends, but currently indexes only sends initiated through this app.
- Network is intentionally preprod-first (target network ID 0).
- If your wallet has no used address yet, linking can fail until at least one address is active in wallet.
- Reconciliation currently checks only outgoing transactions recorded by this app.

## Next Steps

Planned next implementation steps:

1. Index incoming transactions and compute true wallet balance from chain data.
2. Add pagination and advanced filters for transaction history.
3. Harden rate limiting, retries, and observability for Blockfrost calls.
4. Add backoff and batching controls for high-volume reconciliation workloads.
