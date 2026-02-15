-- NeuroGraph FSRS Migration
-- Replaces SM-2 columns with FSRS-6 columns

-- 1. Add FSRS-specific columns
ALTER TABLE crystals 
ADD COLUMN IF NOT EXISTS difficulty NUMERIC NOT NULL DEFAULT 0, -- D ∈ [1, 10]
ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'New' CHECK (state IN ('New', 'Learning', 'Review', 'Relearning')),
ADD COLUMN IF NOT EXISTS reps INTEGER NOT NULL DEFAULT 0, -- Review count (successful)
ADD COLUMN IF NOT EXISTS lapses INTEGER NOT NULL DEFAULT 0, -- Failed reviews (Again)
ADD COLUMN IF NOT EXISTS elapsed_days INTEGER NOT NULL DEFAULT 0, -- Days since last review
ADD COLUMN IF NOT EXISTS scheduled_days INTEGER NOT NULL DEFAULT 0; -- Interval for next review

-- 2. Remove SM-2 specific columns
-- Note: 'ease_factor' is SM-2 only. 'stability' and 'retrievability' are reused but semantics change slightly (handled in code).
-- 'consecutive_correct' is kept for stats but not used by FSRS logic.
ALTER TABLE crystals DROP COLUMN IF EXISTS ease_factor;

-- 3. Initialize existing data (if any)
-- Set default difficulty to 5 (medium) for existing items
UPDATE crystals SET difficulty = 5 WHERE difficulty = 0;

-- 4. Update index for review queue
-- We keep idx_crystals_next_review_due as it's still the primary query filter
