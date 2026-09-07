-- ==============================================================================
-- REVIZO 2.0 — Migration 005 : Système Économique, Abonnements, Énergie,
-- Diamants, Récompenses & Parrainage
-- Date : 2026-09-07
-- Description : 7 tables économiques, contraintes d'intégrité, RLS et fonctions RPC
-- ==============================================================================

-- 1. Mise à jour de la contrainte sur user_progress (pour supporter jusqu'à 100 énergies)
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_energy_balance_check;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_energy_balance_check CHECK (energy_balance BETWEEN 0 AND 100);

-- ------------------------------------------------------------------------------
-- 2. Table: subscriptions (Abonnements des élèves)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'essentiel', 'intensif', 'premium')),
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('free', 'active', 'expired', 'cancelled', 'past_due')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  payment_provider TEXT DEFAULT 'none',
  external_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. Table: user_energy (Solde d'énergie et limites de révision quotidiennes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_energy (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_energy INTEGER NOT NULL DEFAULT 3 CHECK (current_energy >= 0),
  max_energy INTEGER NOT NULL DEFAULT 3 CHECK (max_energy >= 0),
  daily_revision_limit INTEGER NOT NULL DEFAULT 1 CHECK (daily_revision_limit >= 0),
  daily_revision_used INTEGER NOT NULL DEFAULT 0 CHECK (daily_revision_used >= 0),
  revision_counter_date DATE NOT NULL DEFAULT CURRENT_DATE,
  diamonds_converted_today INTEGER NOT NULL DEFAULT 0 CHECK (diamonds_converted_today >= 0),
  conversion_counter_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_user_energy_updated_at
  BEFORE UPDATE ON public.user_energy
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Table: user_diamonds (Solde de diamants vérifié)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_diamonds (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 10 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_user_diamonds_updated_at
  BEFORE UPDATE ON public.user_diamonds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Table: diamond_transactions (Historique des transactions de diamants)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diamond_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diamond_tx_user_date ON public.diamond_transactions(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. Table: energy_transactions (Historique des transactions d'énergie)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.energy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_energy_tx_user_date ON public.energy_transactions(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. Table: referral_accounts (Comptes et codes de parrainage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_status TEXT NOT NULL DEFAULT 'none' CHECK (referral_status IN ('none', 'pending', 'rewarded')),
  referred_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_accounts_code ON public.referral_accounts(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_accounts_referred_by ON public.referral_accounts(referred_by_user_id);

CREATE TRIGGER set_referral_accounts_updated_at
  BEFORE UPDATE ON public.referral_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 8. Table: reward_events (Événements de récompense idempotents)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key TEXT UNIQUE NOT NULL,
  reward_type TEXT NOT NULL,
  diamonds_awarded INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_events_user ON public.reward_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_events_key ON public.reward_events(event_key);

-- ------------------------------------------------------------------------------
-- 9. Fonction utilitaire de génération de code parrainage unique (REV-XXXXXX)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'REV-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ------------------------------------------------------------------------------
-- 10. Activation de RLS sur toutes les tables économiques
-- ------------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_energy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_diamonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_events ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (lecture par l'élève authentifié uniquement)
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_energy_select_own" ON public.user_energy
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_diamonds_select_own" ON public.user_diamonds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "diamond_transactions_select_own" ON public.diamond_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "energy_transactions_select_own" ON public.energy_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "referral_accounts_select_own" ON public.referral_accounts
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = referred_by_user_id);

CREATE POLICY "reward_events_select_own" ON public.reward_events
  FOR SELECT USING (auth.uid() = user_id);

-- Interdire les mutations directes non contrôlées (INSERT/UPDATE/DELETE client)
-- Les mutations passent exclusivement par les fonctions RPC SECURITY DEFINER
-- Pour le service_role ou cas administratif, autoriser :
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "user_energy_admin_all" ON public.user_energy
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "user_diamonds_admin_all" ON public.user_diamonds
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ------------------------------------------------------------------------------
-- 11. Initialisation automatique pour les nouveaux comptes
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.initialize_user_economy()
RETURNS TRIGGER AS $$
DECLARE
  v_ref_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Générer un code parrainage unique
  LOOP
    v_ref_code := public.generate_referral_code();
    SELECT EXISTS(SELECT 1 FROM public.referral_accounts WHERE referral_code = v_ref_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  -- 1. Initialiser le compte de parrainage
  INSERT INTO public.referral_accounts (user_id, referral_code, referral_status)
  VALUES (NEW.id, v_ref_code, 'none')
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Initialiser l'énergie (mode Free par défaut : 3 max, 1 révision/jour)
  INSERT INTO public.user_energy (user_id, current_energy, max_energy, daily_revision_limit, daily_revision_used)
  VALUES (NEW.id, 3, 3, 1, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Initialiser les diamants (10 diamants de bienvenue)
  INSERT INTO public.user_diamonds (user_id, balance)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Initialiser l'abonnement Free
  INSERT INTO public.subscriptions (user_id, plan, price, status)
  VALUES (NEW.id, 'free', 0, 'active')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_initialize_user_economy ON auth.users;
CREATE TRIGGER trigger_initialize_user_economy
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_economy();

-- Rétro-initialisation des utilisateurs existants qui n'ont pas encore leurs entrées économiques
DO $$
DECLARE
  r RECORD;
  v_code TEXT;
  v_ex BOOLEAN;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    -- Referral
    IF NOT EXISTS (SELECT 1 FROM public.referral_accounts WHERE user_id = r.id) THEN
      LOOP
        v_code := public.generate_referral_code();
        SELECT EXISTS(SELECT 1 FROM public.referral_accounts WHERE referral_code = v_code) INTO v_ex;
        EXIT WHEN NOT v_ex;
      END LOOP;
      INSERT INTO public.referral_accounts (user_id, referral_code, referral_status)
      VALUES (r.id, v_code, 'none');
    END IF;

    -- Energy
    INSERT INTO public.user_energy (user_id, current_energy, max_energy, daily_revision_limit, daily_revision_used)
    VALUES (r.id, 3, 3, 1, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Diamonds
    INSERT INTO public.user_diamonds (user_id, balance)
    VALUES (r.id, 10)
    ON CONFLICT (user_id) DO NOTHING;

    -- Subscription
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = r.id) THEN
      INSERT INTO public.subscriptions (user_id, plan, price, status)
      VALUES (r.id, 'free', 0, 'active');
    END IF;
  END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- 12. RPC : get_user_economy_state(p_user_id)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_economy_state(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_sub RECORD;
  v_energy RECORD;
  v_diamonds RECORD;
  v_ref RECORD;
  v_referrals_count INTEGER;
  v_rewarded_count INTEGER;
  v_result JSONB;
BEGIN
  -- Réinitialiser les compteurs journaliers si changement de date
  UPDATE public.user_energy
  SET daily_revision_used = CASE WHEN revision_counter_date < CURRENT_DATE THEN 0 ELSE daily_revision_used END,
      revision_counter_date = CURRENT_DATE,
      diamonds_converted_today = CASE WHEN conversion_counter_date < CURRENT_DATE THEN 0 ELSE diamonds_converted_today END,
      conversion_counter_date = CURRENT_DATE
  WHERE user_id = p_user_id;

  -- Vérifier expiration de l'abonnement
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan != 'free' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();

  -- Si aucun abonnement payant actif, appliquer les limites Free sur l'énergie
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'active' AND plan != 'free'
  ) THEN
    UPDATE public.user_energy
    SET max_energy = 3,
        daily_revision_limit = 1,
        current_energy = LEAST(current_energy, 3)
    WHERE user_id = p_user_id AND (max_energy > 3 OR daily_revision_limit > 1);
  END IF;

  -- Récupérer l'abonnement actif le plus récent (ou dernier expiré/free)
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = p_user_id
  ORDER BY (status = 'active') DESC, created_at DESC
  LIMIT 1;

  -- Récupérer l'énergie
  SELECT * INTO v_energy FROM public.user_energy WHERE user_id = p_user_id;
  -- Récupérer les diamants
  SELECT * INTO v_diamonds FROM public.user_diamonds WHERE user_id = p_user_id;
  -- Récupérer le parrainage
  SELECT * INTO v_ref FROM public.referral_accounts WHERE user_id = p_user_id;

  SELECT count(*) INTO v_referrals_count 
  FROM public.referral_accounts 
  WHERE referred_by_user_id = p_user_id;

  SELECT count(*) INTO v_rewarded_count 
  FROM public.referral_accounts 
  WHERE referred_by_user_id = p_user_id AND referral_status = 'rewarded';

  v_result := jsonb_build_object(
    'subscription', jsonb_build_object(
      'plan', COALESCE(v_sub.plan, 'free'),
      'price', COALESCE(v_sub.price, 0),
      'status', COALESCE(v_sub.status, 'free'),
      'started_at', v_sub.started_at,
      'expires_at', v_sub.expires_at,
      'payment_provider', v_sub.payment_provider,
      'daily_revision_limit', COALESCE(v_energy.daily_revision_limit, 1)
    ),
    'energy', jsonb_build_object(
      'current_energy', COALESCE(v_energy.current_energy, 3),
      'max_energy', COALESCE(v_energy.max_energy, 3),
      'daily_revision_limit', COALESCE(v_energy.daily_revision_limit, 1),
      'daily_revision_used', COALESCE(v_energy.daily_revision_used, 0),
      'daily_revision_remaining', GREATEST(0, COALESCE(v_energy.daily_revision_limit, 1) - COALESCE(v_energy.daily_revision_used, 0)),
      'diamonds_converted_today', COALESCE(v_energy.diamonds_converted_today, 0),
      'max_daily_diamond_conversions', 10
    ),
    'diamonds', jsonb_build_object(
      'balance', COALESCE(v_diamonds.balance, 0)
    ),
    'referral', jsonb_build_object(
      'referral_code', COALESCE(v_ref.referral_code, ''),
      'referred_by_user_id', v_ref.referred_by_user_id,
      'referral_status', COALESCE(v_ref.referral_status, 'none'),
      'total_referrals', v_referrals_count,
      'rewarded_referrals', v_rewarded_count
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 13. RPC : record_revision_usage(p_user_id)
-- Contrôle serveur strict du quota journalier de révisions
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_revision_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_energy RECORD;
  v_sub RECORD;
  v_limit INTEGER;
  v_used INTEGER;
  v_new_used INTEGER;
BEGIN
  -- Vérifier expiration
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan != 'free' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();

  -- Vérifier le plan actif
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Récupérer les limites selon plan
  IF v_sub.plan = 'premium' THEN
    v_limit := 20;
  ELSIF v_sub.plan = 'intensif' THEN
    v_limit := 10;
  ELSIF v_sub.plan = 'essentiel' THEN
    v_limit := 3;
  ELSE
    v_limit := 1;
  END IF;

  -- Verrouiller la ligne pour atomicité
  SELECT * INTO v_energy
  FROM public.user_energy
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Si changement de date, réinitialiser
  IF v_energy.revision_counter_date < CURRENT_DATE THEN
    v_used := 0;
  ELSE
    v_used := v_energy.daily_revision_used;
  END IF;

  -- Vérification de la limite
  IF v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'error', 'daily_limit_reached',
      'message', 'Tu as atteint ta limite de ' || v_limit || ' révisions du jour. Ton compteur sera réinitialisé demain.',
      'limit', v_limit,
      'used', v_used,
      'remaining', 0
    );
  END IF;

  -- Incrémentation atomique
  v_new_used := v_used + 1;

  UPDATE public.user_energy
  SET daily_revision_used = v_new_used,
      daily_revision_limit = v_limit,
      revision_counter_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'limit', v_limit,
    'used', v_new_used,
    'remaining', v_limit - v_new_used
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 14. RPC : consume_energy(p_user_id, p_amount, p_reason, p_reference_id)
-- Consommation atomique d'énergie
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_energy(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1,
  p_reason TEXT DEFAULT 'Session pédagogique',
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_energy RECORD;
  v_new_energy INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    p_amount := 1;
  END IF;

  -- Verrouiller pour éviter race condition
  SELECT * INTO v_energy
  FROM public.user_energy
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_energy.current_energy < p_amount THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'insufficient_energy',
      'message', 'Énergie insuffisante. Convertis 5 diamants pour obtenir 1 énergie.',
      'current_energy', v_energy.current_energy,
      'max_energy', v_energy.max_energy
    );
  END IF;

  v_new_energy := v_energy.current_energy - p_amount;

  UPDATE public.user_energy
  SET current_energy = v_new_energy,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Synchroniser rétro-compatible user_progress
  UPDATE public.user_progress
  SET energy_balance = LEAST(100, v_new_energy),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Journaliser la transaction
  INSERT INTO public.energy_transactions (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, -p_amount, v_new_energy, p_reason, p_reference_id);

  RETURN jsonb_build_object(
    'success', TRUE,
    'current_energy', v_new_energy,
    'max_energy', v_energy.max_energy
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 15. RPC : convert_diamonds_to_energy(p_user_id)
-- Règle : 5 💎 = 1 ⚡ (Max 10 ⚡/jour)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.convert_diamonds_to_energy(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_diamonds RECORD;
  v_energy RECORD;
  v_converted_today INTEGER;
  v_new_diamonds INTEGER;
  v_new_energy INTEGER;
BEGIN
  -- Verrouiller les deux tables
  SELECT * INTO v_diamonds FROM public.user_diamonds WHERE user_id = p_user_id FOR UPDATE;
  SELECT * INTO v_energy FROM public.user_energy WHERE user_id = p_user_id FOR UPDATE;

  -- 0. Vérifier si l'énergie est déjà au maximum
  IF v_energy.current_energy >= v_energy.max_energy THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'energy_already_full',
      'message', 'Ton énergie est déjà à son maximum.',
      'current_diamonds', v_diamonds.balance,
      'current_energy', v_energy.current_energy,
      'max_energy', v_energy.max_energy
    );
  END IF;

  -- 1. Vérifier solde diamants >= 5
  IF v_diamonds.balance < 5 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'insufficient_diamonds',
      'message', 'Il te faut au moins 5 diamants pour obtenir 1 énergie.',
      'current_diamonds', v_diamonds.balance,
      'current_energy', v_energy.current_energy
    );
  END IF;

  -- 2. Vérifier la limite journalière (max 10 conversions = 10 ⚡ par jour)
  IF v_energy.conversion_counter_date < CURRENT_DATE THEN
    v_converted_today := 0;
  ELSE
    v_converted_today := v_energy.diamonds_converted_today;
  END IF;

  IF v_converted_today >= 10 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'daily_conversion_limit_reached',
      'message', 'Tu as atteint la limite quotidienne de 10 énergies récupérées par diamants.',
      'converted_today', v_converted_today,
      'current_diamonds', v_diamonds.balance,
      'current_energy', v_energy.current_energy
    );
  END IF;

  -- 3. Déduction 5 diamants
  v_new_diamonds := v_diamonds.balance - 5;
  UPDATE public.user_diamonds
  SET balance = v_new_diamonds,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 4. Ajout 1 énergie
  v_new_energy := v_energy.current_energy + 1;
  v_converted_today := v_converted_today + 1;

  UPDATE public.user_energy
  SET current_energy = v_new_energy,
      diamonds_converted_today = v_converted_today,
      conversion_counter_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Synchroniser user_progress
  UPDATE public.user_progress
  SET diamonds_balance = v_new_diamonds,
      energy_balance = LEAST(100, v_new_energy),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 5. Transactions
  INSERT INTO public.diamond_transactions (user_id, amount, balance_after, reason)
  VALUES (p_user_id, -5, v_new_diamonds, 'Conversion en 1 énergie ⚡');

  INSERT INTO public.energy_transactions (user_id, amount, balance_after, reason)
  VALUES (p_user_id, 1, v_new_energy, 'Conversion de 5 diamants 💎');

  RETURN jsonb_build_object(
    'success', TRUE,
    'current_diamonds', v_new_diamonds,
    'current_energy', v_new_energy,
    'max_energy', v_energy.max_energy,
    'converted_today', v_converted_today
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 16. RPC : claim_reward(p_user_id, p_event_key, p_reward_type, p_diamonds, p_reason, p_metadata)
-- Idempotence absolue grâce à la clé unique dans reward_events
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_reward(
  p_user_id UUID,
  p_event_key TEXT,
  p_reward_type TEXT,
  p_diamonds INTEGER,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_existing RECORD;
  v_diamonds RECORD;
  v_new_balance INTEGER;
BEGIN
  -- Vérifier si l'événement a déjà été récompensé
  SELECT * INTO v_existing FROM public.reward_events WHERE event_key = p_event_key;
  IF v_existing.id IS NOT NULL THEN
    -- Déjà récompensé : renvoi idempotent sans crédit supplémentaire
    SELECT balance INTO v_new_balance FROM public.user_diamonds WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'success', TRUE,
      'already_claimed', TRUE,
      'diamonds_awarded', 0,
      'current_diamonds', COALESCE(v_new_balance, 0),
      'message', 'Cette récompense a déjà été attribuée.'
    );
  END IF;

  -- Insérer l'événement de récompense
  INSERT INTO public.reward_events (user_id, event_key, reward_type, diamonds_awarded, metadata)
  VALUES (p_user_id, p_event_key, p_reward_type, p_diamonds, p_metadata);

  -- Créditer les diamants atomiquement
  SELECT * INTO v_diamonds FROM public.user_diamonds WHERE user_id = p_user_id FOR UPDATE;
  v_new_balance := v_diamonds.balance + p_diamonds;

  UPDATE public.user_diamonds
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Synchroniser user_progress
  UPDATE public.user_progress
  SET diamonds_balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Enregistrer la transaction
  INSERT INTO public.diamond_transactions (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, p_diamonds, v_new_balance, p_reason, p_event_key);

  RETURN jsonb_build_object(
    'success', TRUE,
    'already_claimed', FALSE,
    'diamonds_awarded', p_diamonds,
    'current_diamonds', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 17. RPC : apply_referral_code(p_user_id, p_referral_code)
-- Rattachement d'un filleul à un parrain
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_referral_code(
  p_user_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_referrer RECORD;
  v_current RECORD;
BEGIN
  -- Nettoyage du code
  p_referral_code := upper(trim(p_referral_code));

  -- Vérifier le parrain
  SELECT * INTO v_referrer FROM public.referral_accounts WHERE referral_code = p_referral_code;
  IF v_referrer.user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'invalid_code', 'message', 'Ce code de parrainage n''existe pas.');
  END IF;

  -- Auto-parrainage interdit
  IF v_referrer.user_id = p_user_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'self_referral', 'message', 'Tu ne peux pas utiliser ton propre code de parrainage.');
  END IF;

  -- Vérifier si l'utilisateur a déjà un parrain
  SELECT * INTO v_current FROM public.referral_accounts WHERE user_id = p_user_id;
  IF v_current.referred_by_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'already_referred', 'message', 'Tu as déjà utilisé un code de parrainage.');
  END IF;

  -- Enregistrer le parrainage en attente de paiement
  UPDATE public.referral_accounts
  SET referred_by_user_id = v_referrer.user_id,
      referral_status = 'pending',
      referred_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Code de parrainage appliqué ! Ton parrain recevra 10 💎 dès ton premier abonnement.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 18. RPC : process_referral_reward_on_payment(p_referee_user_id)
-- Règle absolue : attribution de +10 💎 au parrain UNIQUEMENT APRÈS PREMIER PAIEMENT
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_referral_reward_on_payment(p_referee_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_ref RECORD;
  v_claim_res JSONB;
BEGIN
  SELECT * INTO v_ref 
  FROM public.referral_accounts 
  WHERE user_id = p_referee_user_id;

  -- Vérifier si filleul avec parrain en statut 'pending'
  IF v_ref.referred_by_user_id IS NOT NULL AND v_ref.referral_status = 'pending' THEN
    -- Attribuer +10 diamants au parrain avec clé d'idempotence unique
    v_claim_res := public.claim_reward(
      v_ref.referred_by_user_id,
      'referral_first_sub:' || p_referee_user_id::text,
      'referral_bonus',
      10,
      'Premier abonnement payant d''un filleul',
      jsonb_build_object('referee_id', p_referee_user_id)
    );

    -- Mettre à jour le statut
    UPDATE public.referral_accounts
    SET referral_status = 'rewarded',
        rewarded_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_referee_user_id;

    RETURN jsonb_build_object('success', TRUE, 'rewarded', TRUE, 'referrer_id', v_ref.referred_by_user_id);
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'rewarded', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 19. RPC : activate_subscription(p_user_id, p_plan, p_payment_provider, p_external_id)
-- Activation de plan, attribution des diamants initiaux idempotents, et déclenchement parrainage
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user_id UUID,
  p_plan TEXT,
  p_payment_provider TEXT DEFAULT 'fedapay',
  p_external_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_price INTEGER;
  v_daily_limit INTEGER;
  v_max_energy INTEGER;
  v_initial_diamonds INTEGER;
  v_sub_id UUID;
  v_claim_res JSONB;
BEGIN
  p_plan := lower(trim(p_plan));

  IF p_plan = 'essentiel' THEN
    v_price := 1000;
    v_daily_limit := 3;
    v_max_energy := 10;
    v_initial_diamonds := 10;
  ELSIF p_plan = 'intensif' THEN
    v_price := 3000;
    v_daily_limit := 10;
    v_max_energy := 20;
    v_initial_diamonds := 30;
  ELSIF p_plan = 'premium' THEN
    v_price := 5000;
    v_daily_limit := 20;
    v_max_energy := 30;
    v_initial_diamonds := 60;
  ELSE
    RETURN jsonb_build_object('success', FALSE, 'error', 'invalid_plan', 'message', 'Plan inconnu.');
  END IF;

  IF p_external_id IS NULL THEN
    p_external_id := 'sub-' || gen_random_uuid()::text;
  END IF;

  -- 1. Enregistrer / Activer l'abonnement
  INSERT INTO public.subscriptions (
    user_id, plan, price, status, started_at, expires_at, payment_provider, external_subscription_id
  )
  VALUES (
    p_user_id, p_plan, v_price, 'active', NOW(), NOW() + INTERVAL '30 days', p_payment_provider, p_external_id
  )
  RETURNING id INTO v_sub_id;

  -- 2. Mettre à jour l'énergie et la limite quotidienne
  UPDATE public.user_energy
  SET daily_revision_limit = v_daily_limit,
      max_energy = v_max_energy,
      current_energy = GREATEST(current_energy, v_max_energy),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 3. Créditer les diamants initiaux de façon idempotente
  v_claim_res := public.claim_reward(
    p_user_id,
    'subscription_initial:' || p_external_id,
    'subscription_initial',
    v_initial_diamonds,
    'Diamants de bienvenue — Abonnement ' || upper(p_plan),
    jsonb_build_object('subscription_id', v_sub_id, 'plan', p_plan)
  );

  -- 4. Déclencher la récompense de parrainage si c'est le premier paiement d'un filleul
  PERFORM public.process_referral_reward_on_payment(p_user_id);

  -- 5. Retourner l'état complet
  RETURN public.get_user_economy_state(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
