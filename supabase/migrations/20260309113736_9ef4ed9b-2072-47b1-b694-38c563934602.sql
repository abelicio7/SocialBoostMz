
-- Create api_keys table for resellers
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key text NOT NULL UNIQUE DEFAULT 'rk_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  name text NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 50),
  is_active boolean NOT NULL DEFAULT true,
  requests_today integer NOT NULL DEFAULT 0,
  daily_limit integer NOT NULL DEFAULT 1000,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Admin can manage all API keys
CREATE POLICY "Admins can manage api_keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own API keys
CREATE POLICY "Users can view their own api_keys" ON public.api_keys
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
