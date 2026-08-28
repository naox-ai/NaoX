/*
# Add Web3 / Crypto Payment Fields to Marketplace

## Overview
Adds blockchain-related columns to the `agents` table to support Web3 AI agents
that accept crypto payments. Also adds a `payments` table to track on-chain
payment transactions.

## Changes to `agents` table
- `chain` (text) — blockchain network: 'ethereum', 'polygon', 'solana', 'base', 'arbitrum'
- `token_address` (text) — ERC-20/SPL token contract address for payments (null = native token)
- `price_crypto` (numeric) — price per run in crypto units (e.g. ETH, MATIC, SOL)
- `price_crypto_symbol` (text) — display symbol: 'ETH', 'MATIC', 'SOL', 'USDC', etc.
- `contract_address` (text) — on-chain agent contract address (if agent is a smart contract)
- `is_web3` (boolean, default false) — flag for Web3-native agents
- `token_id` (numeric) — NFT token ID if agent is tokenized as an NFT

## New Tables
- `payments` — records of crypto payment transactions
  - `id` (uuid, PK)
  - `agent_id` (uuid, references agents, cascade delete)
  - `user_id` (uuid, references profiles, defaults to auth.uid())
  - `wallet_address` (text) — payer's wallet address
  - `tx_hash` (text) — on-chain transaction hash
  - `amount` (numeric) — amount paid in crypto
  - `token_symbol` (text) — ETH, MATIC, SOL, USDC, etc.
  - `chain` (text) — blockchain network
  - `status` (text) — 'pending' | 'confirmed' | 'failed'
  - `created_at` (timestamp)

## Security
- `payments`: owners can read their own payments; creators can read payments for their agents.
- All existing policies remain unchanged.

## Notes
1. All new columns are nullable/defaulted so existing agents are unaffected.
2. `is_web3` defaults to false; existing agents remain non-Web3.
3. Payments table uses owner-scoped RLS with creator visibility.
*/

-- ============ ADD WEB3 COLUMNS TO AGENTS ============
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS chain text DEFAULT 'ethereum',
  ADD COLUMN IF NOT EXISTS token_address text,
  ADD COLUMN IF NOT EXISTS price_crypto numeric(24,8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_crypto_symbol text,
  ADD COLUMN IF NOT EXISTS contract_address text,
  ADD COLUMN IF NOT EXISTS is_web3 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS token_id numeric;

-- ============ PAYMENTS TABLE ============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  tx_hash text,
  amount numeric(24,8) NOT NULL DEFAULT 0,
  token_symbol text NOT NULL DEFAULT 'ETH',
  chain text NOT NULL DEFAULT 'ethereum',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM agents a WHERE a.id = payments.agent_id AND a.creator_id = auth.uid()));

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_update_own" ON payments;
CREATE POLICY "payments_update_own" ON payments FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_delete_own" ON payments;
CREATE POLICY "payments_delete_own" ON payments FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_agent ON payments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_web3 ON agents(is_web3);
CREATE INDEX IF NOT EXISTS idx_agents_chain ON agents(chain);

-- ============ ADD WEB3 CATEGORY ============
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Web3 & DeFi', 'web3', 'On-chain AI agents for DeFi, NFTs, and blockchain interactions', 'Wallet')
ON CONFLICT (slug) DO NOTHING;
