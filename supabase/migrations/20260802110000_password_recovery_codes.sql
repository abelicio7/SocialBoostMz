CREATE TABLE public.password_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  created_at timestamp with time zone DEFAULT clock_timestamp(),
  expires_at timestamp with time zone NOT NULL
);

ALTER TABLE public.password_recovery_codes ENABLE ROW LEVEL SECURITY;
