-- ==============================================================================
-- REVIZO 2.0 : MIGRATION LIMITATION ESSAI GRATUIT & CORRECTION QUOTA PREMIUM
-- 1. Un utilisateur non abonné (Free) a droit à exactement 1 import de cours à vie.
-- 2. Au 2e cours, retour de 'free_trial_exhausted' / trialExhausted = true.
-- 3. Les utilisateurs abonnés (Essentiel, Intensif, Premium) ne sont JAMAIS bloqués par l'essai gratuit.
-- 4. Quotas officiels mis à jour : Essentiel (4/j), Intensif (10/j), Premium (18/j).
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
    -- Compter tous les cours déjà créés/importés par cet élève
    SELECT COUNT(*) INTO v_courses_count
    FROM public.courses
    WHERE user_id = p_user_id;

    IF v_courses_count >= 1 THEN
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'error', 'free_trial_exhausted',
        'trialExhausted', TRUE,
        'message', 'Tu as déjà profité de ton essai gratuit pour ton premier cours. Choisis un forfait pour continuer à réviser avec RÉVIZO.',
        'limit', 1,
        'used', v_courses_count,
        'remaining', 0
      );
    END IF;

    -- Premier cours d'essai gratuit autorisé
    v_limit := 1;
  ELSE
    -- 4. UTILISATEURS ABONNÉS PAYANTS : QUOTAS DU FORFAIT (JAMAIS BLOQUÉS PAR L'ESSAI GRATUIT)
    IF v_sub.plan = 'premium' THEN
      v_limit := 18; -- Quota corrigé à 18/jour (TÂCHE 2)
    ELSIF v_sub.plan = 'intensif' THEN
      v_limit := 10;
    ELSIF v_sub.plan = 'essentiel' THEN
      v_limit := 4;  -- Quota officiel Essentiel (4/jour)
    ELSE
      v_limit := 1;
    END IF;
  END IF;

  -- 5. Verrouiller la ligne user_energy pour atomicité
  SELECT * INTO v_energy
  FROM public.user_energy
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Si l'enregistrement n'existe pas encore, l'initialiser
  IF NOT FOUND THEN
    INSERT INTO public.user_energy (
      user_id, current_energy, max_energy, daily_revision_limit,
      daily_revision_used, revision_counter_date
    ) VALUES (
      p_user_id, 3, 3, v_limit, 0, CURRENT_DATE
    ) RETURNING * INTO v_energy;
  END IF;

  -- Si changement de date, réinitialiser le compteur journalier
  IF v_energy.revision_counter_date < CURRENT_DATE THEN
    v_used := 0;
  ELSE
    v_used := v_energy.daily_revision_used;
  END IF;

  -- 6. Vérification du quota journalier du forfait actif
  IF v_is_paid_active AND v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'error', 'daily_limit_reached',
      'trialExhausted', FALSE,
      'message', 'Tu as atteint ta limite de ' || v_limit || ' révisions du jour. Ton compteur sera réinitialisé demain.',
      'limit', v_limit,
      'used', v_used,
      'remaining', 0
    );
  END IF;

  -- 7. Incrémentation atomique du compteur de révisions
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
    'limit', v_limit,
    'used', v_new_used,
    'remaining', GREATEST(0, v_limit - v_new_used)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
