-- Part 1: Create categories table and basic setup

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index for case-insensitive category names per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_category_name 
  ON public.categories(user_id, LOWER(name));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(LOWER(name));

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policy for categories
CREATE POLICY "Users can manage their own categories"
  ON public.categories
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();