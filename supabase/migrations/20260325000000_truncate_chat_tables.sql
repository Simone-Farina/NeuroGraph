-- Phase 23: Pure Conversationalist — hard reset chat data
-- Removes all legacy tool-call messages and conversations to prevent
-- rehydration errors in the new tool-free chat architecture.
-- This is a destructive migration — acceptable because NeuroGraph is
-- single-user beta with disposable conversation data.

TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
