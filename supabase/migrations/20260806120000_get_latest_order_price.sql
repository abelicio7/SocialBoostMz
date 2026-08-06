CREATE OR REPLACE FUNCTION get_latest_order_price()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price numeric;
BEGIN
  SELECT total_price INTO v_price FROM public.orders ORDER BY created_at DESC LIMIT 1;
  RETURN v_price;
END;
$$;
