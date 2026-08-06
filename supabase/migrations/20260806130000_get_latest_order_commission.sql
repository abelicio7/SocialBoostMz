CREATE OR REPLACE FUNCTION get_latest_order_commission()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commission numeric;
BEGIN
  SELECT 
    COALESCE(
      o.total_price - (((COALESCE(s.provider_price, 0) / 1000.0) * o.quantity) * COALESCE(ps.exchange_rate_brl_mzn, 12.00)),
      0
    ) INTO v_commission
  FROM public.orders o
  JOIN public.services s ON o.service_id = s.id
  CROSS JOIN public.platform_settings ps
  WHERE ps.id = 'main'
  ORDER BY o.created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_commission, 0);
END;
$$;
