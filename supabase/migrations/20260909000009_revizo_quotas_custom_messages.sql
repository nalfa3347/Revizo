-- ==============================================================================
-- REVIZO 2.0 : MIGRATION QUOTAS & COMPORTEMENT DE DÉPASSEMENT PAR PALIER
-- 1. Essentiel (4/j) : blocage au 5e avec proposition de mise à niveau Pro ou Premium
-- 2. Pro/Intensif (10/j) : blocage au 11e avec proposition de mise à niveau Premium uniquement
-- 3. Premium (18/j) : blocage au 19e avec message épuré SANS proposition d'upgrade
-- 4. Gratuit : 1 seul import à vie (ne se réinitialise jamais)
-- 5. Réinitialisation quotidienne stricte à minuit UTC pour tous les plans payants
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.record_revision_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_energy RECORD;
  v_sub RECORD;
  v_limit INTEGER;
  v_used INTEGER;
  v_new_used INTEGER;
  v_courses_count INTEGER;
  v_is_paid_active BOOLEAN := FALSE;
  v_quota_message TEXT;
  v_upgrade_target TEXT := NULL;
BEGIN
  -- 1. Nettoyage des abonnements périmés
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan != 'free' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();

  -- 2. Vérifier si l'utilisateur possède un forfait payant actif
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan IN ('essentiel', 'intensif', 'premium')
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_is_paid_active := TRUE;
  END IF;

  -- 3. CONTRÔLE DE L'ESSAI GRATUIT (UTILISATEURS NON ABONNÉS) : 1 SEUL IMPORT À VIE
  IF NOT v_is_paid_active THEN
    SELECT COUNT(*) INTO v_courses_count
    FROM public.courses
    WHERE user_id = p_user_id;

    IF v_courses_count >= 1 THEN
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'error', 'free_trial_exhausted',
        'trialExhausted', TRUE,
        'plan', 'free',
        'message', 'Tu as déjà profité de ton essai gratuit pour ton premier cours. Choisis un forfait pour continuer à réviser avec RÉVIZO.',
        'limit', 1,
        'used', v_courses_count,
        'remaining', 0,
        'canUpgrade', TRUE,
        'upgradeOptions', jsonb_build_array('essentiel', 'intensif', 'premium')
      );
    END IF;

    v_limit := 1;
  ELSE
    -- 4. UTILISATEURS ABONNÉS PAYANTS : QUOTAS OFFICIELS ET MESSAGES CIBLÉS
    IF v_sub.plan = 'premium' THEN
      v_limit := 18;
      v_quota_message := 'Tu as utilisé tes 18 révisions du jour. Reviens demain pour continuer à réviser !';
      v_upgrade_target := NULL; -- Palier maximum : AUCUN upgrade proposé
    ELSIF v_sub.plan = 'intensif' THEN
      v_limit := 10;
      v_quota_message := 'Tu as atteint ta limite de 10 révisions du jour. Ton compteur sera réinitialisé demain à minuit UTC. Passe à Premium pour réviser jusqu’à 18 cours par jour !';
      v_upgrade_target := 'premium';
    ELSIF v_sub.plan = 'essentiel' THEN
      v_limit := 4;
      v_quota_message := 'Tu as atteint ta limite de 4 révisions du jour. Ton compteur sera réinitialisé demain à minuit UTC. Passe à Pro (10/j) ou Premium (18/j) pour réviser davantage dès maintenant !';
      v_upgrade_target := 'pro_or_premium';
    ELSE
      v_limit := 1;
      v_quota_message := 'Tu as atteint ta limite de révisions du jour.';
    END IF;
  END IF;

  -- 5. Verrouiller la ligne user_energy pour atomicité
  SELECT * INTO v_energy
  FROM public.user_energy
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_energy (
      user_id, current_energy, max_energy, daily_revision_limit,
      daily_revision_used, revision_counter_date
    ) VALUES (
      p_user_id, 3, 3, v_limit, 0, CURRENT_DATE
    ) RETURNING * INTO v_energy;
  END IF;

  -- 6. RÉINITIALISATION QUOTIDIENNE À MINUIT UTC (CURRENT_DATE en UTC)
  IF v_energy.revision_counter_date < CURRENT_DATE THEN
    v_used := 0;
  ELSE
    v_used := v_energy.daily_revision_used;
  END IF;

  -- 7. Vérification du quota journalier
  IF v_is_paid_active AND v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'error', 'daily_limit_reached',
      'trialExhausted', FALSE,
      'plan', v_sub.plan,
      'message', v_quota_message,
      'limit', v_limit,
      'used', v_used,
      'remaining', 0,
      'canUpgrade', (v_upgrade_target IS NOT NULL),
      'upgradeTarget', v_upgrade_target
    );
  END IF;

  -- 8. Incrémentation atomique du compteur de révisions
  v_new_used := v_used + 1;

  UPDATE public.user_energy
  SET daily_revision_used = v_new_used,
      revision_counter_date = CURRENT_DATE,
      daily_revision_limit = v_limit,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'error', NULL,
    'trialExhausted', FALSE,
    'plan', COALESCE(v_sub.plan, 'free'),
    'limit', v_limit,
    'used', v_new_used,
    'remaining', GREATEST(0, v_limit - v_new_used),
    'canUpgrade', (v_upgrade_target IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
