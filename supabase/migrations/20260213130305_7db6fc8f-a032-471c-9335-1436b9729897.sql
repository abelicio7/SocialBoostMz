
-- Create platform settings table
CREATE TABLE public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  is_on_break BOOLEAN NOT NULL DEFAULT false,
  break_end_time TIMESTAMP WITH TIME ZONE,
  break_message TEXT DEFAULT 'Estamos em intervalo. Voltamos em breve!',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.platform_settings (id) VALUES ('main');

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update platform settings"
ON public.platform_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
