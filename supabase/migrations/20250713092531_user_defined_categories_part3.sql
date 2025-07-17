-- Part 3: Migrate existing data

-- Add temporary column to store old category text during migration
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category_text TEXT;

-- Copy current category values to temporary column
UPDATE public.expenses SET category_text = category WHERE category_text IS NULL;

-- Create categories for all existing users based on their expenses
INSERT INTO public.categories (user_id, name, is_default)
SELECT DISTINCT 
  e.user_id,
  e.category,
  CASE 
    WHEN e.category IN (SELECT name FROM public.default_categories) THEN true
    ELSE false
  END
FROM public.expenses e
WHERE e.category IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also ensure all existing users have all default categories
INSERT INTO public.categories (user_id, name, description, is_default)
SELECT 
  u.id,
  dc.name,
  dc.description,
  true
FROM auth.users u
CROSS JOIN public.default_categories dc
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c 
  WHERE c.user_id = u.id AND LOWER(c.name) = LOWER(dc.name)
);

-- Add new category_id column to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category_id UUID;

-- Update expenses to use category IDs
UPDATE public.expenses e
SET category_id = c.id
FROM public.categories c
WHERE e.user_id = c.user_id 
  AND LOWER(e.category) = LOWER(c.name);

-- Make category_id NOT NULL after populating (only if there are expenses)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.expenses LIMIT 1) THEN
    ALTER TABLE public.expenses ALTER COLUMN category_id SET NOT NULL;
  END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE public.expenses 
  ADD CONSTRAINT fk_expense_category 
  FOREIGN KEY (category_id) 
  REFERENCES public.categories(id) 
  ON DELETE RESTRICT;

-- Create index on category_id for performance
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);