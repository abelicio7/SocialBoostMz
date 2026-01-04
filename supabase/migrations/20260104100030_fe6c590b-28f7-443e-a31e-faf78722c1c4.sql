-- Add column to track if conversation is closed
ALTER TABLE public.support_messages
ADD COLUMN IF NOT EXISTS conversation_closed boolean NOT NULL DEFAULT false;