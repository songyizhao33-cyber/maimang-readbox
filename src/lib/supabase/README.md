# Supabase Integration

## Setup

1. Install Supabase packages:
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

2. Create a Supabase project at https://supabase.com

3. Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run migrations:
```bash
npx supabase db push
```

## Usage

### Browser Client (Client Components)
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.from('profiles').select('*');
```

### Server Client (Server Components, Route Handlers)
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data, error } = await supabase.from('profiles').select('*');
```

## RLS Policies

All tables have Row Level Security enabled. See `supabase/migrations/0001_initial_schema.sql` for policy details.

## Type Generation

Generate TypeScript types from database schema:
```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```