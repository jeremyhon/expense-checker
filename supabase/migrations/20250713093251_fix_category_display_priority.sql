-- Fix the view to prioritize category names from the categories table
CREATE OR REPLACE VIEW public.expenses_with_categories AS
SELECT 
  e.id,
  e.statement_id,
  e.user_id,
  e.created_at,
  e.date,
  e.description,
  e.amount_sgd,
  e.currency,
  e.foreign_amount,
  e.foreign_currency,
  e.merchant,
  e.line_hash,
  e.category_text,
  e.original_amount,
  e.original_currency,
  e.category_id,
  -- Prioritize category name from categories table over old category column
  COALESCE(c.name, e.category) as category,
  c.name as category_name,
  c.description as category_description
FROM public.expenses e
LEFT JOIN public.categories c ON e.category_id = c.id;

-- Re-grant permissions
GRANT SELECT ON public.expenses_with_categories TO authenticated;