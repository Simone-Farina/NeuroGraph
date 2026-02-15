-- Fix existing crystals where retrievability was initialized to 0
-- New crystals should start at 1.0 (100% retrievability)
UPDATE crystals 
SET retrievability = 1.0 
WHERE retrievability = 0;
