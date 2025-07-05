-- Migration to standardize Food categories to Dining
-- This updates existing expense records to use the new standardized category name

-- Update all expenses with "Food" category to "Dining"
UPDATE expenses 
SET category = 'Dining' 
WHERE category = 'Food';

-- Update all expenses with "Food & Dining" category to "Dining"
UPDATE expenses 
SET category = 'Dining' 
WHERE category = 'Food & Dining';

-- Update all expenses with "Food & Drink" category to "Dining"
UPDATE expenses 
SET category = 'Dining' 
WHERE category = 'Food & Drink';