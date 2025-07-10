-- Create merchant_mappings table for user-specific merchant-to-category mappings
CREATE TABLE merchant_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, merchant_name)
);

-- Enable RLS
ALTER TABLE merchant_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own merchant mappings" ON merchant_mappings
  FOR ALL USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_merchant_mappings_user_id ON merchant_mappings(user_id);
CREATE INDEX idx_merchant_mappings_merchant_name ON merchant_mappings(merchant_name);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_merchant_mappings_updated_at
  BEFORE UPDATE ON merchant_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime subscriptions for the merchant_mappings table
ALTER PUBLICATION supabase_realtime ADD TABLE merchant_mappings;