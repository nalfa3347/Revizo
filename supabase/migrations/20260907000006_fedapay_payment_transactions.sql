-- ==============================================================================
-- MIGRATION : 20260907000006_fedapay_payment_transactions.sql
-- Description : Traçabilité des paiements FedaPay (Mobile Money & Cartes)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount_fcfa INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  fedapay_transaction_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  checkout_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_fedapay_id ON public.payment_transactions(fedapay_transaction_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Users can view own payment transactions'
  ) THEN
    CREATE POLICY "Users can view own payment transactions"
      ON public.payment_transactions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
