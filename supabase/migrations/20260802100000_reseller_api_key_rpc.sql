CREATE OR REPLACE FUNCTION generate_user_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_key text;
  existing_key text;
BEGIN
  -- 1. Check if user already has an API key
  SELECT api_key INTO existing_key FROM public.api_keys WHERE user_id = auth.uid();
  IF existing_key IS NOT NULL THEN
    RETURN existing_key;
  END IF;

  -- 2. Generate a secure random string prefixing with rk_
  new_key := 'rk_' || encode(sha256(random()::text::bytea || clock_timestamp()::text::bytea), 'hex');

  -- 3. Insert the new api key into api_keys table
  INSERT INTO public.api_keys (user_id, api_key, name, discount_percent, is_active, daily_limit)
  VALUES (auth.uid(), new_key, 'Chave de Revendedor', 0, true, 1000);

  RETURN new_key;
END;
$$;
