ALTER TABLE public.services 
  ADD COLUMN IF NOT EXISTS provider_service_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS provider_price numeric DEFAULT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS provider_order_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS provider_status text DEFAULT NULL;