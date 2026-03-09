
-- Allow admins to delete API keys  
CREATE POLICY "Admins can delete api_keys" ON public.api_keys
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert API keys
CREATE POLICY "Admins can insert api_keys" ON public.api_keys
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
