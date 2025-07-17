-- Part 2: Default categories and user setup

-- Default categories to insert for new users
CREATE TABLE IF NOT EXISTS public.default_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Insert default categories
INSERT INTO public.default_categories (name, description) VALUES
  ('Dining', 'Restaurants, cafes, food delivery'),
  ('Groceries', 'Supermarkets, grocery stores, food shopping'),
  ('Transportation', 'Public transport, taxis, fuel, parking'),
  ('Shopping', 'Retail, clothing, electronics, general merchandise'),
  ('Entertainment', 'Movies, games, streaming, events, hobbies'),
  ('Bills & Utilities', 'Utilities, phone, internet, insurance, subscriptions'),
  ('Healthcare', 'Medical, dental, pharmacy, fitness, wellness'),
  ('Education', 'Schools, courses, books, educational materials'),
  ('Travel', 'Hotels, flights, foreign transactions, travel expenses'),
  ('Other', 'Miscellaneous expenses')
ON CONFLICT (name) DO NOTHING;

-- Function to create default categories for a new user
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, description, is_default)
  SELECT 
    NEW.id,
    name,
    description,
    true
  FROM public.default_categories;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default categories when a new user is created
CREATE TRIGGER create_user_default_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories_for_user();