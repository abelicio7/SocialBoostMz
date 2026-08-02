DROP TABLE IF EXISTS public.admin_push_subscriptions CASCADE;

CREATE TABLE public.admin_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Select policy: Admins can select their own subscriptions
CREATE POLICY "Admins can select their own push subscriptions"
  ON public.admin_push_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND public.has_role(auth.uid(), 'admin')
  );

-- Insert/Upsert policy: Admins can insert their own subscriptions
CREATE POLICY "Admins can insert their own push subscriptions"
  ON public.admin_push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND public.has_role(auth.uid(), 'admin')
  );

-- Update policy: Admins can update their own subscriptions
CREATE POLICY "Admins can update their own push subscriptions"
  ON public.admin_push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id AND public.has_role(auth.uid(), 'admin')
  );

-- Delete policy: Admins can delete their own subscriptions
CREATE POLICY "Admins can delete their own push subscriptions"
  ON public.admin_push_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND public.has_role(auth.uid(), 'admin')
  );
