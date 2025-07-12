-- ──────────────────────────────────────────────────────────────────────────
--                          SCHEMA INITIALIZATION
--
-- This script sets up the initial database schema for Spendro.
-- It includes table definitions, relationships, indexes, and security policies.
-- ──────────────────────────────────────────────────────────────────────────

-- Enable UUID extension for generating unique identifiers.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────────────
--                                 TABLES
-- ──────────────────────────────────────────────────────────────────────────

-- Create 'statements' table to store uploaded bank statements.
-- It links to auth.users to ensure data integrity and enable cascading deletes.
CREATE TABLE IF NOT EXISTS public.statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  blob_url TEXT NOT NULL,
  bank_name TEXT,
  period_start DATE,
  period_end DATE,
  CONSTRAINT unique_user_checksum UNIQUE(user_id, checksum)
);
COMMENT ON TABLE public.statements IS 'Stores metadata for uploaded bank statements.';

-- Create 'expenses' table to store individual expense transactions.
-- It also links to auth.users and the statements table.
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID REFERENCES public.statements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount_sgd NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SGD',
  foreign_amount NUMERIC(10, 2),
  foreign_currency TEXT,
  merchant TEXT,
  category TEXT NOT NULL,
  line_hash TEXT NOT NULL,
  CONSTRAINT unique_user_line_hash UNIQUE(user_id, line_hash)
);
COMMENT ON TABLE public.expenses IS 'Stores individual expense transactions extracted from statements.';

-- ──────────────────────────────────────────────────────────────────────────
--                                INDEXES
-- ──────────────────────────────────────────────────────────────────────────

-- Create indexes for faster queries on frequently used columns.
CREATE INDEX IF NOT EXISTS idx_statements_user_id ON public.statements(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_statement_id ON public.expenses(statement_id);

-- ──────────────────────────────────────────────────────────────────────────
--                           ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────────────────────

-- Enable Row Level Security on the tables.
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate before creating new ones.
DROP POLICY IF EXISTS "Users can manage their own statements" ON public.statements;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;

-- Create RLS policies that allow users to access their own data.
-- SECURITY: Explicitly check auth.uid() IS NOT NULL to prevent unauthorized access.
-- When auth.uid() is NULL, (auth.uid() = user_id) evaluates to NULL, 
-- which PostgreSQL RLS treats as permissive, allowing unauthorized access.
CREATE POLICY "Users can manage their own statements"
  ON public.statements
  FOR ALL
  USING ( auth.uid() IS NOT NULL AND auth.uid() = user_id );

CREATE POLICY "Users can manage their own expenses"
  ON public.expenses
  FOR ALL
  USING ( auth.uid() IS NOT NULL AND auth.uid() = user_id );

-- ──────────────────────────────────────────────────────────────────────────
--                                TRIGGERS
-- ──────────────────────────────────────────────────────────────────────────

-- Function to automatically update the 'updated_at' timestamp on row modification.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function when a statement is updated.
DROP TRIGGER IF EXISTS update_statements_updated_at ON public.statements;
CREATE TRIGGER update_statements_updated_at
  BEFORE UPDATE ON public.statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
