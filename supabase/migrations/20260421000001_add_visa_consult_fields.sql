-- Add visa_type and phone columns to messages table for visa consultation form

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS visa_type TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;
