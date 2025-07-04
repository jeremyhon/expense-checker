-- Deny anonymous access to prevent security bypass
--
-- SECURITY ISSUE: The existing RLS policies only apply TO authenticated users.
-- Anonymous requests (using anon key) bypass these policies completely.
-- This fix explicitly denies all anonymous access.

-- Deny all anonymous access to expenses table
CREATE POLICY "Deny anonymous access to expenses" 
ON public.expenses
FOR ALL 
TO anon
USING (false);

-- Deny all anonymous access to statements table
CREATE POLICY "Deny anonymous access to statements" 
ON public.statements
FOR ALL 
TO anon
USING (false);

-- Add comments explaining the security fix
COMMENT ON POLICY "Deny anonymous access to expenses" ON public.expenses IS 
'Explicitly denies all anonymous access to expenses table to prevent security bypass.';

COMMENT ON POLICY "Deny anonymous access to statements" ON public.statements IS 
'Explicitly denies all anonymous access to statements table to prevent security bypass.';