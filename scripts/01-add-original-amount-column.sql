-- Add original_amount column to expenses table
-- This column stores the original transaction amount before any currency conversion
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10, 2);

-- Add original_currency column to expenses table  
-- This column stores the original 3-letter currency code (e.g., SGD, USD)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS original_currency TEXT;

-- Update existing records to populate the new columns based on current data
-- If foreign_amount exists, use that as original_amount, otherwise use amount_sgd
UPDATE public.expenses 
SET 
  original_amount = COALESCE(foreign_amount, amount_sgd),
  original_currency = COALESCE(foreign_currency, currency)
WHERE original_amount IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.original_amount IS 'The original transaction amount before currency conversion';
COMMENT ON COLUMN public.expenses.original_currency IS 'The original 3-letter currency code (e.g., SGD, USD)';