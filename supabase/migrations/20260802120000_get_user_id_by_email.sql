CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(p_email));
  RETURN v_user_id;
END;
$$;
