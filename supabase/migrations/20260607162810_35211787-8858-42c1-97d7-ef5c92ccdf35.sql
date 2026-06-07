
CREATE TABLE public.pending_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  method text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pending_payments TO authenticated;
GRANT ALL ON public.pending_payments TO service_role;

ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own pending payments"
ON public.pending_payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER trg_pending_payments_updated_at
BEFORE UPDATE ON public.pending_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pending_payments_user ON public.pending_payments(user_id);
CREATE INDEX idx_pending_payments_payment_id ON public.pending_payments(payment_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_payments;
ALTER TABLE public.pending_payments REPLICA IDENTITY FULL;
