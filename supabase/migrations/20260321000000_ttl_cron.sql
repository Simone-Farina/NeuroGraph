-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the pg_cron job to wipe old chats
-- Deletes conversations older than 14 days
-- Assumes messages have ON DELETE CASCADE to conversations (standard Vercel AI SDK setup)
SELECT cron.schedule('daily_chat_wipe', '0 * * * *', $$ 
  DELETE FROM conversations WHERE created_at < now() - interval '14 days'; 
$$);
