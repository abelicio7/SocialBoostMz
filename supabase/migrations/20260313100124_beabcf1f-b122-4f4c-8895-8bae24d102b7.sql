ALTER TABLE public.platform_settings 
ADD COLUMN exchange_rate_brl_mzn numeric NOT NULL DEFAULT 10.50,
ADD COLUMN exchange_rate_auto boolean NOT NULL DEFAULT true,
ADD COLUMN exchange_rate_updated_at timestamp with time zone DEFAULT now();