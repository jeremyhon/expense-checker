# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev       # Start development server with Turbopack (http://localhost:3000)

# Production  
bun run build     # Create production build  
bun run start     # Start production server

# Code Quality (uses Biome)
bun run check     # Run linting, formatting with auto-fix, and typecheck
bun run ci        # Run check + build (for CI/CD)

# Database (Supabase)
supabase --version    # Check Supabase CLI version
supabase db reset     # Reset local database
supabase db diff      # Show database schema changes
supabase migration new <name>  # Create new migration
bun run db:push       # Push migrations to remote database (uses .env.local password)

# Database Reset (Development)
bun run reset        # Reset database and clear blob storage (uses scripts/reset-db.ts)

# Testing
bun test             # Run tests using Bun's built-in test runner
bun test [pattern]   # Run specific test files (e.g., bun test temporal)
bun run gen-pdf      # Generate test PDF with unique hash for upload testing
bun run clean-temp   # Clear temp folder (removes generated test PDFs)

# Logs
bun run log:clear    # Clear development server logs (dev.log)
```

## Testing Framework

This project uses **Bun's built-in test runner** for testing:

- **Test files**: Co-located with source code using `.test.ts` suffix (e.g., `utils/temporal-dates.test.ts`)
- **Test pattern**: Tests are placed alongside their source files, not in separate `__tests__/` directories
- **Rationale**: Co-located tests improve discoverability, maintenance, and encourage keeping tests up-to-date
- **Import style**: Use relative imports (`./module`) since tests are in the same directory
- **API**: Uses Bun's native `describe`, `test`, and `expect` functions from `bun:test`

## Architecture Overview

Spendro is an AI-powered expense tracking application built with Next.js App Router that processes bank statement PDFs and extracts expenses using Google's Gemini AI.

### Core Technologies
- **Next.js 15.2.4** with App Router architecture
- **React 19** with TypeScript and strict mode
- **Bun** as package manager and JavaScript runtime
- **Biome** for linting and formatting (not ESLint/Prettier)
- **Tailwind CSS** with shadcn/ui components
- **Supabase** for authentication, database, and real-time updates
- **ElectricSQL** for high-performance real-time data synchronization
- **Vercel Blob** for PDF file storage
- **Google Gemini AI** (via AI SDK) for PDF expense extraction
- **@tanstack/react-virtual** for virtualized table rendering

### Key Architecture Patterns

1. **Real-time Expense Processing**: Uses streaming AI responses to insert expenses as they're extracted from PDFs, providing real-time updates via Supabase realtime subscriptions.

2. **Duplicate Detection**: Implements both file-level (SHA256 checksum) and expense-level (line hash) duplicate detection to prevent processing the same statement or expense twice. Note: File-level duplicate detection is currently disabled in `app/actions/upload.ts` for development iteration.

3. **Server Actions**: Uses Next.js server actions (`app/actions/upload.ts`) for file upload and AI processing, with proper authentication checks.

4. **Database Security**: Implements Row Level Security (RLS) policies to ensure users can only access their own data.

5. **Timezone-Safe Date Handling**: Uses Temporal PlainDate objects (`lib/utils/temporal-dates.ts`) for consistent date operations across timezones, avoiding Date constructor inconsistencies.

6. **ElectricSQL Real-time Sync**: Implements ElectricSQL for high-performance data synchronization with shape-based filtering and client-side operations on cached data.

7. **Virtual Scrolling**: Uses @tanstack/react-virtual for rendering large datasets efficiently, handling thousands of expense records with smooth performance.

### Database Schema
- `statements` - Stores uploaded PDF metadata with status tracking
- `expenses` - Individual expense records with SGD conversion and categorization
- Uses UUID primary keys and foreign key relationships
- RLS policies enforce user data isolation

### Important Implementation Details

1. **AI Processing Flow**:
   - Upload PDF to Vercel Blob storage
   - Stream PDF content to Google Gemini AI
   - Extract expenses with real-time insertion
   - Automatic categorization and currency conversion
   - Foreign transactions automatically categorized as "Travel"
   - Currency conversion using exchangerate-api.com with fallback to original amount

2. **Authentication**: Uses Supabase Auth with client/server patterns:
   - `lib/supabase/client.ts` for browser operations
   - `lib/supabase/server.ts` for server-side operations
   - `app/api/electric/auth/route.ts` for ElectricSQL authentication proxy

3. **ElectricSQL Data Management**:
   - `lib/electric/client.ts` - ElectricSQL client configuration and URL handling
   - `lib/electric/shapes.ts` - Shape registry for filtered data synchronization
   - `hooks/use-electric-expenses.ts` - Real-time expense data hooks with client-side filtering
   - Progressive loading: recent expenses load first, historical data on-demand
   - Client-side operations on cached data for instant UI responses

4. **Component Architecture**:
   - `components/expenses-table-virtualized.tsx` - High-performance virtual scrolling table
   - `components/expense-bulk-actions.tsx` - Bulk selection and operations UI
   - `components/expense-column-filters.tsx` - Advanced filtering controls
   - `components/expense-column-visibility.tsx` - Column show/hide management
   - `components/expense-inline-filters.tsx` - Inline filter components
   - Uses `cn()` utility from `lib/utils.ts` for conditional className merging

5. **File Structure**:
   - `app/` - Next.js App Router pages and layouts
   - `components/` - Reusable UI components (shadcn/ui + custom)
   - `lib/` - Utilities and database clients
   - `scripts/` - Database initialization SQL

### Code Style (Biome Configuration)
- Double quotes for strings
- Semicolons required
- 2-space indentation
- 80 character line width
- Import type enforcement
- Trailing commas in ES5 mode
- Self-closing JSX elements enforced

### Environment Variables & Configuration

**T3 Env Validation**: All environment variables are managed through `lib/env.ts` using T3 env for type safety and validation. The application will fail fast with clear error messages if required variables are missing.

**Current Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key for Gemini
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `ELECTRIC_SOURCE_ID` - ElectricSQL source ID for real-time sync
- `ELECTRIC_SOURCE_SECRET` - ElectricSQL source secret for authentication

**Adding New Environment Variables:**
When adding new environment variables, always update `lib/env.ts` to include proper validation:
1. Add to appropriate section (`server` for server-side, `client` for client-side)
2. Define Zod validation schema
3. Add to `runtimeEnv` mapping
4. The application will enforce these variables at startup

## ElectricSQL Integration

Spendro uses ElectricSQL for high-performance real-time data synchronization, providing instant UI responses and scalable performance for large datasets.

### Key Benefits
- **Real-time Sync**: Changes appear instantly across all connected clients
- **Client-side Operations**: Filtering, sorting, and searching on cached data with zero latency
- **Progressive Loading**: Recent expenses load first, historical data loads on-demand
- **Scalable Performance**: Handles thousands of records with smooth virtual scrolling
- **Offline-first**: Works offline with automatic conflict resolution when reconnected

### Architecture Components

**ElectricSQL Client** (`lib/electric/client.ts`):
```typescript
// Configured with authentication proxy and proper URL handling
const electricClient = createElectricClient({
  url: constructElectricUrl(),
  // Uses /api/electric/auth for secure user-filtered access
});
```

**Shape Registry** (`lib/electric/shapes.ts`):
```typescript
// Predefined shapes for efficient data filtering
SHAPE_REGISTRY.recentExpenses(monthsBack, filters)  // Recent data
SHAPE_REGISTRY.historicalExpenses(from, to, filters)  // Historical data
```

**Real-time Hooks** (`hooks/use-electric-expenses.ts`):
```typescript
// Progressive loading with client-side filtering
const { expenses, loading, refetch } = useElectricExpenses({
  filters: { categories: ['Dining'], searchText: 'coffee' },
  autoSubscribe: true,
  monthsBack: 6
});
```

**Authentication Proxy** (`app/api/electric/auth/route.ts`):
- Automatically injects `user_id` filtering for secure multi-tenant access
- Validates Supabase JWT tokens
- Proxies authenticated requests to ElectricSQL service

### Usage Patterns

**Basic Expense Loading**:
```typescript
// Load recent expenses with real-time updates
const { expenses, loading } = useRecentElectricExpenses(3); // 3 months back
```

**Advanced Filtering**:
```typescript
// Client-side filtering with instant response
const { expenses } = useElectricExpenses({
  filters: {
    categories: ['Dining', 'Travel'],
    amountRange: { min: 10, max: 500 },
    searchText: 'restaurant',
    dateRange: { start: '2024-01-01', end: '2024-12-31' }
  }
});
```

**Progressive Data Loading**:
```typescript
// Load historical data on-demand
const { loadHistoricalData, hasHistoricalData } = useElectricExpenses();

// User clicks "Load More" -> instant loading from ElectricSQL cache
loadHistoricalData(); 
```

### Performance Characteristics

- **Throughput**: ~5,000 row changes/second
- **Filtering**: Millions of `field = constant` where clauses evaluated efficiently
- **Memory**: Only visible rows rendered via virtual scrolling
- **Bandwidth**: Efficient subset synchronization, not full table sync
- **Latency**: Client-side operations with zero network round-trips

### Security Model

ElectricSQL implements **server-side security** through the authentication proxy:

```typescript
// All queries automatically filtered by user_id on the server
// Example: "SELECT * FROM expenses WHERE category = 'Dining'"
// Becomes: "SELECT * FROM expenses WHERE category = 'Dining' AND user_id = $user_id"
```

This ensures users can only access their own data, regardless of client-side queries.

### Development Setup

1. **Environment Variables**: Set `ELECTRIC_SOURCE_ID` and `ELECTRIC_SOURCE_SECRET`
2. **Shape Registration**: Define data shapes in `lib/electric/shapes.ts`
3. **Hook Usage**: Use `useElectricExpenses()` for real-time data management
4. **Client Filtering**: All filtering happens client-side for instant response

The T3 env validation ensures ElectricSQL credentials are present, failing fast with clear error messages if misconfigured.

## Development Workflow

The recommended development workflow for this project:

1. **NEVER start or stop the dev server**: The dev server is managed externally
2. **Make changes**: Edit code with hot reload automatically handling updates
3. **Monitor logs**: To see dev server logs, refer to `dev.log` file
4. **Test frontend changes**: Use playwright-mcp to verify frontend changes if applicable
5. **Iterate**: Repeat steps 2-4 as needed
6. **Final cleanup**: Once satisfied with changes:
   - Remove unnecessary code
   - Run `bun run check` for linting, formatting, and typechecking
7. **Update documentation**: Update CLAUDE.md if changes affect architecture, commands, or workflow
8. **Commit**: Use conventional commit style for version control

## Precommit Hooks

This project uses husky and lint-staged to automatically run code quality checks before commits:

- **husky**: Manages git hooks
- **lint-staged**: Runs linting and formatting only on staged files
- **Precommit hook**: Automatically runs code quality checks on all staged files before commit

The precommit hook will:
- Run Biome linting and auto-fix issues
- Format code according to project standards
- Prevent commits if there are unfixable linting errors

To bypass the precommit hook (not recommended):
```bash
git commit --no-verify -m "commit message"
```