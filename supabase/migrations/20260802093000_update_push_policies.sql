DROP POLICY IF EXISTS "Admins can select their own push subscriptions" ON public.admin_push_subscriptions;
DROP POLICY IF EXISTS "Admins can insert their own push subscriptions" ON public.admin_push_subscriptions;
DROP POLICY IF EXISTS "Admins can update their own push subscriptions" ON public.admin_push_subscriptions;
DROP POLICY IF EXISTS "Admins can delete their own push subscriptions" ON public.admin_push_subscriptions;

CREATE POLICY "Users can select their own push subscriptions"
  ON public.admin_push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.admin_push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON public.admin_push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.admin_push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
