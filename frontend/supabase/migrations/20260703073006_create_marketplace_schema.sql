/*
# Decentralized AI Agent Marketplace Schema

## Overview
Creates the full schema for a decentralized AI agent marketplace where creators
publish AI agents, users browse/discover them, leave reviews, and "deploy"
(purchase/subscribe to) agents. Includes categories, tags, ratings, and
creator profiles.

## New Tables

1. `profiles` — public user profiles (1:1 with auth.users)
   - `id` (uuid, PK, references auth.users)
   - `username` (text, unique, not null)
   - `full_name` (text)
   - `bio` (text)
   - `avatar_url` (text)
   - `wallet_address` (text) — decentralized identity / payout address
   - `is_creator` (boolean, default false)
   - `created_at`, `updated_at` (timestamps)

2. `categories` — agent categories (e.g. "Coding", "Research", "Creative")
   - `id` (uuid, PK)
   - `name` (text, unique, not null)
   - `slug` (text, unique, not null)
   - `description` (text)
   - `icon` (text) — lucide icon name
   - `created_at` (timestamp)

3. `agents` — the AI agents listed on the marketplace
   - `id` (uuid, PK)
   - `creator_id` (uuid, references profiles, defaults to auth.uid())
   - `category_id` (uuid, references categories)
   - `name` (text, not null)
   - `slug` (text, unique, not null)
   - `tagline` (text) — short one-liner
   - `description` (text) — full description
   - `capabilities` (text[]) — list of capabilities
   - `pricing_model` (text) — 'free' | 'paid' | 'freemium'
   - `price_per_run` (numeric) — cost per invocation in credits
   - `api_endpoint` (text) — decentralized endpoint URL
   - `repo_url` (text) — source / IPFS / git repo
   - `icon_url` (text)
   - `cover_url` (text)
   - `status` (text) — 'draft' | 'pending' | 'published' | 'suspended'
   - `is_verified` (boolean, default false)
   - `runs_count` (integer, default 0) — total invocations
   - `rating_avg` (numeric, default 0) — cached average rating
   - `rating_count` (integer, default 0) — cached review count
   - `created_at`, `updated_at` (timestamps)

4. `reviews` — user reviews/ratings for agents
   - `id` (uuid, PK)
   - `agent_id` (uuid, references agents, cascade delete)
   - `user_id` (uuid, references profiles, defaults to auth.uid())
   - `rating` (integer, 1-5, not null)
   - `comment` (text)
   - `created_at` (timestamp)
   - UNIQUE(agent_id, user_id) — one review per user per agent

5. `deployments` — records of users deploying/subscribing to an agent
   - `id` (uuid, PK)
   - `agent_id` (uuid, references agents, cascade delete)
   - `user_id` (uuid, references profiles, defaults to auth.uid())
   - `status` (text) — 'active' | 'paused' | 'cancelled'
   - `created_at` (timestamp)
   - UNIQUE(agent_id, user_id) — one deployment per user per agent

## Security (RLS)
- `profiles`: owners can read/update their own; all profiles readable by authenticated users.
- `categories`: public read (anon + authenticated); no writes from client.
- `agents`: published agents readable by everyone; creators can CRUD their own.
- `reviews`: anyone authenticated can read; users can insert/update/delete their own.
- `deployments`: owners can read/insert/update/delete their own; creators can see deployments of their agents.

## Notes
1. Owner columns default to `auth.uid()` so client inserts omitting the owner succeed.
2. Rating aggregates on `agents` are maintained by triggers when reviews change.
3. All tables have RLS enabled; no `FOR ALL` policies.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  wallet_address text,
  is_creator boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read" ON categories;
CREATE POLICY "categories_read" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- ============ AGENTS ============
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  tagline text,
  description text,
  capabilities text[] DEFAULT '{}',
  pricing_model text NOT NULL DEFAULT 'free' CHECK (pricing_model IN ('free','paid','freemium')),
  price_per_run numeric(12,2) NOT NULL DEFAULT 0,
  api_endpoint text,
  repo_url text,
  icon_url text,
  cover_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','published','suspended')),
  is_verified boolean NOT NULL DEFAULT false,
  runs_count integer NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Published agents are publicly readable; drafts only by owner
DROP POLICY IF EXISTS "agents_select" ON agents;
CREATE POLICY "agents_select" ON agents FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR creator_id = auth.uid());

DROP POLICY IF EXISTS "agents_insert_own" ON agents;
CREATE POLICY "agents_insert_own" ON agents FOR INSERT
  TO authenticated WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "agents_update_own" ON agents;
CREATE POLICY "agents_update_own" ON agents FOR UPDATE
  TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "agents_delete_own" ON agents;
CREATE POLICY "agents_delete_own" ON agents FOR DELETE
  TO authenticated USING (creator_id = auth.uid());

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============ DEPLOYMENTS ============
CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, user_id)
);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deployments_select_own" ON deployments;
CREATE POLICY "deployments_select_own" ON deployments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM agents a WHERE a.id = deployments.agent_id AND a.creator_id = auth.uid()));

DROP POLICY IF EXISTS "deployments_insert_own" ON deployments;
CREATE POLICY "deployments_insert_own" ON deployments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "deployments_update_own" ON deployments;
CREATE POLICY "deployments_update_own" ON deployments FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "deployments_delete_own" ON deployments;
CREATE POLICY "deployments_delete_own" ON deployments FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_agents_creator ON agents(creator_id);
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_reviews_agent ON reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_agent ON deployments(agent_id);

-- ============ TRIGGERS ============
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recompute agent rating aggregates when reviews change
CREATE OR REPLACE FUNCTION public.recompute_agent_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_agent uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_agent := OLD.agent_id;
  ELSE
    target_agent := NEW.agent_id;
  END IF;

  UPDATE agents
  SET rating_avg = COALESCE((SELECT AVG(rating) FROM reviews WHERE agent_id = target_agent), 0),
      rating_count = COALESCE((SELECT COUNT(*) FROM reviews WHERE agent_id = target_agent), 0)
  WHERE id = target_agent;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_agent_rating();

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_profiles ON profiles;
CREATE TRIGGER touch_profiles BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_agents ON agents;
CREATE TRIGGER touch_agents BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEED CATEGORIES ============
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Coding & Dev', 'coding', 'Code generation, review, and developer tooling agents', 'Code2'),
  ('Research', 'research', 'Data gathering, analysis, and research assistants', 'Search'),
  ('Creative', 'creative', 'Writing, art, music, and design agents', 'Palette'),
  ('Data & Analytics', 'data', 'Data processing, ETL, and analytics agents', 'BarChart3'),
  ('Productivity', 'productivity', 'Automation, scheduling, and workflow agents', 'Zap'),
  ('Customer Support', 'support', 'Chatbots, ticketing, and support agents', 'Headphones'),
  ('Finance', 'finance', 'Trading, accounting, and financial analysis agents', 'TrendingUp'),
  ('Security', 'security', 'Auditing, monitoring, and security agents', 'ShieldCheck')
ON CONFLICT (slug) DO NOTHING;
