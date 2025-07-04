# TODO

## Security Investigation
- [ ] Verify how come I was able to delete expenses and statements without an admin supabase key
  - The reset script used `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anonymous key) to delete all data
  - This suggests RLS policies may not be properly configured or there's a security issue
  - Need to review Row Level Security (RLS) policies on `expenses` and `statements` tables
  - Consider if the anonymous key has elevated permissions it shouldn't have

## UI Improvements