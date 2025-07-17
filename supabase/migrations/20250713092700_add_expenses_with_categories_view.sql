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
  COALESCE(e.category, c.name) as category,
  c.name as category_name,
  c.description as category_description
FROM public.expenses e
LEFT JOIN public.categories c ON e.category_id = c.id;

GRANT SELECT ON public.expenses_with_categories TO authenticated;
ALTER VIEW public.expenses_with_categories SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.get_user_categories_with_count(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  is_default BOOLEAN,
  expense_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.is_default,
    COUNT(e.id) as expense_count,
    c.created_at,
    c.updated_at
  FROM public.categories c
  LEFT JOIN public.expenses e ON e.category_id = c.id
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.name, c.description, c.is_default, c.created_at, c.updated_at
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_categories_with_count TO authenticated;