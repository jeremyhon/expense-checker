-- Fix RLS policies to prevent unauthorized access
-- 
-- SECURITY ISSUE: The existing RLS policies allow unauthenticated access because
-- when auth.uid() is NULL, the expression (auth.uid() = user_id) evaluates to NULL,
-- which PostgreSQL RLS treats as permissive, allowing the operation to proceed.
--
-- This fix explicitly checks that auth.uid() IS NOT NULL before allowing access.

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Users can manage their own statements" ON public.statements;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;

-- Create secure RLS policies that explicitly require authentication
CREATE POLICY "Users can manage their own statements"
  ON public.statements
  FOR ALL
  USING ( auth.uid() IS NOT NULL AND auth.uid() = user_id );

CREATE POLICY "Users can manage their own expenses"
  ON public.expenses
  FOR ALL
  USING ( auth.uid() IS NOT NULL AND auth.uid() = user_id );

-- Add comments explaining the security fix
COMMENT ON POLICY "Users can manage their own statements" ON public.statements IS 
'Allows authenticated users to manage only their own statements. Explicitly checks for auth.uid() IS NOT NULL to prevent unauthorized access.';

COMMENT ON POLICY "Users can manage their own expenses" ON public.expenses IS 
'Allows authenticated users to manage only their own expenses. Explicitly checks for auth.uid() IS NOT NULL to prevent unauthorized access.';