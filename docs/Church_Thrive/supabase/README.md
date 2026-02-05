# ChurchThrive Supabase Backend

This directory contains the complete Supabase backend implementation for ChurchThrive.

## Quick Start

### Prerequisites
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Install Docker Desktop (required for local dev)
# Download from: https://www.docker.com/products/docker-desktop
```

### Local Development
```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db push

# Load seed data
supabase db reset

# Access Supabase Studio
open http://localhost:54323

# Access API
# API URL: http://localhost:54321
# Anon Key: Check output of `supabase status`
```

### Production Deployment
```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push --linked

# Deploy edge functions
supabase functions deploy send-notification
supabase functions deploy process-stt
supabase functions deploy daily-digest

# Configure realtime
psql <your-connection-string> -f config/realtime.sql
```

## Directory Structure

```
supabase/
├── config.toml              # Local development config
├── seed.sql                 # Development seed data
├── README.md               # This file
├── migrations/             # Database migrations (17 files)
│   ├── 00001_extensions.sql
│   ├── 00002_churches.sql
│   ├── ...
│   └── 00017_functions.sql
├── functions/              # Supabase Edge Functions
│   ├── send-notification/  # Push notifications via FCM
│   ├── process-stt/        # Speech-to-text processing
│   └── daily-digest/       # Daily email digests
├── tests/                  # Test suite
│   └── rls-tests.sql       # Row Level Security tests
└── config/                 # Configuration scripts
    └── realtime.sql        # Realtime setup
```

## Database Schema

### Tables (14)
1. **churches** - Church organizations and subscriptions
2. **members** - Church members with roles and positions
3. **families** - Family groupings
4. **family_members** - Family relationships
5. **sermons** - Sermon recordings and transcripts
6. **sermon_notes** - Member sermon notes
7. **note_feedbacks** - Pastor feedback on notes
8. **organizations** - Church organizational structure
9. **org_roles** - Organization member assignments
10. **announcements** - Church announcements
11. **attendances** - Attendance tracking
12. **cell_groups** - Small group management
13. **pastor_assignments** - Pastor-member discipleship
14. **access_requests** - Church access approval workflow

### Key Features
- **Church Isolation**: All data isolated by church_id via RLS
- **Role-Based Access**: Admin, pastor, staff, leader, member roles
- **Korean Name Search**: Chosung (초성) extraction for fast search
- **Full-Text Search**: Sermon transcript search
- **Realtime Updates**: 6 tables with realtime enabled
- **Audit Logging**: Auto-updated timestamps on all tables

## Edge Functions

### send-notification
Send push notifications via Firebase Cloud Messaging.

```typescript
POST /functions/v1/send-notification
Authorization: Bearer <user-token>

{
  "tokens": ["fcm-token-1"],
  "title": "New Announcement",
  "body": "Check the latest updates"
}
```

### process-stt
Process speech-to-text for sermon audio.

```typescript
POST /functions/v1/process-stt

{
  "sermonId": "uuid",
  "audioUrl": "https://storage.com/audio.mp3",
  "language": "ko-KR"
}
```

### daily-digest
Send daily email digest to members.

```typescript
POST /functions/v1/daily-digest
Authorization: Bearer <service-role-key>
```

Schedule with pg_cron:
```sql
SELECT cron.schedule('daily-digest', '0 7 * * *', $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/daily-digest',
    headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
  );
$$);
```

## Security

### Row Level Security (RLS)
All tables have RLS enabled with comprehensive policies:

- **Church Isolation**: Members can only access data from their church
- **Role Hierarchy**: Admin > Pastor > Staff > Leader > Member
- **Data Privacy**: Members control sharing of personal notes
- **Pastor Access**: Pastors can view assigned members' data

### Helper Functions
```sql
-- Get current user's church ID
SELECT get_my_church_id();

-- Get current user's role
SELECT get_my_role();

-- Get current user's member ID
SELECT get_my_member_id();
```

### Testing RLS
```bash
# Run test suite
supabase test db

# Or manually
psql <connection-string> -f tests/rls-tests.sql
```

## Realtime

### Enabled Tables
- attendances (live check-ins)
- announcements (instant posts)
- access_requests (admin dashboard)
- sermon_notes (pastor monitoring)
- note_feedbacks (member notifications)
- members (status updates)

### Client Usage
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

// Subscribe to attendance check-ins
const channel = supabase
  .channel('attendance')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'attendances',
    filter: `church_id=eq.${churchId}`
  }, (payload) => {
    console.log('New check-in:', payload)
  })
  .subscribe()

// Cleanup
useEffect(() => {
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Development Workflow

### Adding a New Table
1. Create migration file: `supabase migration new add_table_name`
2. Write SQL in the migration file
3. Add RLS policies for church isolation
4. Create indexes for performance
5. Update TypeScript types: `supabase gen types typescript --local`
6. Add seed data in `seed.sql`
7. Add tests in `tests/rls-tests.sql`

### Modifying Existing Table
1. Create migration: `supabase migration new modify_table_name`
2. Use ALTER TABLE statements
3. Update RLS policies if needed
4. Regenerate types
5. Update seed data
6. Test changes locally

### Testing Changes
```bash
# Reset database with migrations + seed
supabase db reset

# Run tests
supabase test db

# Check in Supabase Studio
open http://localhost:54323
```

## Common Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Check status
supabase status

# View logs
supabase logs

# Create new migration
supabase migration new <name>

# Apply migrations
supabase db push

# Reset database (migrations + seed)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local

# Deploy function
supabase functions deploy <function-name>

# View function logs
supabase functions logs <function-name>

# Run tests
supabase test db
```

## Environment Variables

Required environment variables (set in `.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Kakao OAuth
NEXT_PUBLIC_KAKAO_APP_KEY=your-kakao-app-key

# Firebase Cloud Messaging
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key
FCM_SERVER_KEY=your-fcm-server-key
```

For local development:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
```

## Troubleshooting

### Migrations Not Applying
```bash
# Check migration status
supabase db status

# Revert last migration
supabase db reset --version <previous-version>

# Repair migrations
supabase db repair --status=applied <version>
```

### RLS Blocking Queries
```sql
-- Temporarily disable RLS for debugging (local only!)
ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;

-- Check which policies are blocking
SELECT * FROM pg_policies WHERE tablename = '<table_name>';

-- Test as specific user
SET LOCAL jwt.claims.sub = '<user-id>';
SELECT * FROM <table_name>;
```

### Edge Function Errors
```bash
# View logs
supabase functions logs <function-name>

# Test locally
supabase functions serve

# Invoke locally
curl -i --location --request POST 'http://localhost:54321/functions/v1/<function-name>' \
  --header 'Authorization: Bearer <anon-key>' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Database Design](https://supabase.com/docs/guides/database/overview)

## Support

For issues or questions:
1. Check Supabase logs: `supabase logs`
2. Review RLS policies: `supabase/migrations/00015_rls_policies.sql`
3. Run test suite: `supabase test db`
4. Check Supabase Studio: http://localhost:54323
