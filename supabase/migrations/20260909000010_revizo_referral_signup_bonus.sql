-- ==============================================================================
-- REVIZO 2.0 - Migration : Bonus de Parrainage à l'Inscription (+5 💎 A, +5 💎 B)
-- Date : 2026-09-09
-- Règle :
-- 1. Inscription de B avec le code de A :
--    - A reçoit immédiatement +5 diamants
--    - B reçoit immédiatement +5 diamants
--    - Déclenché une seule fois par code utilisé, à l'inscription de B
-- 2. Premier abonnement payant de B :
--    - A reçoit +10 diamants supplémentaires (géré par process_referral_reward_on_payment)
--    - B reçoit ses diamants de forfait (10, 30 ou 60)
-- 3. Anti-fraude : Pas d'auto-parrainage, 1 seul parrain par compte à vie
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.apply_referral_code(
  p_user_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_referrer RECORD;
  v_current RECORD;
  v_claim_referrer JSONB;
  v_claim_referee JSONB;
BEGIN
  -- 1. Nettoyage du code
  p_referral_code := upper(trim(p_referral_code));

  IF p_referral_code IS NULL OR length(p_referral_code) < 3 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'invalid_code', 'message', 'Code de parrainage invalide.');
  END IF;

  -- 2. Vérifier l'existence du parrain
  SELECT * INTO v_referrer 
  FROM public.referral_accounts 
  WHERE referral_code = p_referral_code;

  IF v_referrer.user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'invalid_code', 'message', 'Ce code de parrainage n''existe pas.');
  END IF;

  -- 3. Anti-fraude : auto-parrainage strictement interdit
  IF v_referrer.user_id = p_user_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'self_referral', 'message', 'Tu ne peux pas utiliser ton propre code de parrainage.');
  END IF;

  -- 4. Anti-fraude : un utilisateur ne peut être parrainé qu'une seule fois à vie
  SELECT * INTO v_current 
  FROM public.referral_accounts 
  WHERE user_id = p_user_id;

  IF v_current.user_id IS NOT NULL AND v_current.referred_by_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'already_referred', 'message', 'Tu as déjà utilisé un code de parrainage.');
  END IF;

  -- 5. Enregistrer le parrainage sur le compte du filleul
  IF v_current.user_id IS NULL THEN
    INSERT INTO public.referral_accounts (
      user_id,
      referral_code,
      referred_by_user_id,
      referral_status,
      referred_at
    ) VALUES (
      p_user_id,
      'REV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
      v_referrer.user_id,
      'pending',
      NOW()
    );
  ELSE
    UPDATE public.referral_accounts
    SET referred_by_user_id = v_referrer.user_id,
        referral_status = 'pending',
        referred_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- 6. PALIER 1 : Attribution immédiate de +5 💎 au parrain A
  v_claim_referrer := public.claim_reward(
    v_referrer.user_id,
    'referral_signup_referrer:' || p_user_id::text,
    'referral_signup_bonus',
    5,
    'Parrainage d''un ami (inscription)',
    jsonb_build_object('referee_id', p_user_id)
  );

  -- 7. PALIER 1 : Attribution immédiate de +5 💎 au filleul B
  v_claim_referee := public.claim_reward(
    p_user_id,
    'referral_signup_referee:' || p_user_id::text,
    'referral_signup_bonus',
    5,
    'Bonus de bienvenue parrainage (inscription)',
    jsonb_build_object('referrer_id', v_referrer.user_id)
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Code validé ! Tu as reçu +5 💎 et ton parrain a aussi reçu +5 💎. Il recevra +10 💎 supplémentaires lors de ton premier abonnement.',
    'diamonds_awarded_referee', 5,
    'diamonds_awarded_referrer', 5
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
