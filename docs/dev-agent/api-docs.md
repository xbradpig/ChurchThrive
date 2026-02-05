# ChurchThrive API Documentation

## Overview

ChurchThrive uses Supabase for database operations and provides Edge Functions for specialized server-side processing. This document covers the complete API surface including database queries, real-time subscriptions, and Edge Functions.

**Base URL (Supabase)**: `https://[your-project].supabase.co`

---

## Authentication

All API requests require authentication via Supabase Auth. The system uses JWT tokens passed in the `Authorization` header.

```typescript
Authorization: Bearer [JWT_TOKEN]
```

### Auth Methods

- **Kakao OAuth**: Primary authentication method for Korean users
- **Email/Password**: Available for admin users
- **Session Management**: Handled automatically by Supabase client

### User Context

After authentication, the user's `church_id` is resolved through:
1. Get authenticated user via `supabase.auth.getUser()`
2. Query `members` table to get `church_id` from `user_id`
3. All subsequent queries are scoped to this `church_id`

---

## Database API

### General Query Pattern

All data access follows this pattern:

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Get current user's church context
const { data: { user } } = await supabase.auth.getUser();
const { data: member } = await supabase
  .from('members')
  .select('church_id')
  .eq('user_id', user.id)
  .single();

// Query scoped to church
const { data, error } = await supabase
  .from('[table_name]')
  .select('*')
  .eq('church_id', member.church_id);
```

### Table Schema Overview

| Table | Description | Primary Keys |
|-------|-------------|--------------|
| `churches` | Church organizations | `id` |
| `members` | Church members & users | `id`, indexed on `church_id`, `user_id` |
| `families` | Family units | `id`, `church_id` |
| `family_members` | Family relationships | `id`, `family_id`, `member_id` |
| `sermons` | Sermon records | `id`, `church_id` |
| `sermon_notes` | Personal sermon notes | `id`, `member_id` |
| `note_feedbacks` | Pastor feedback on notes | `id`, `sermon_note_id` |
| `organizations` | Church organizational structure | `id`, `church_id` |
| `org_roles` | Member roles in organizations | `id`, `organization_id`, `member_id` |
| `announcements` | Church announcements | `id`, `church_id` |
| `attendances` | Worship & event attendance | `id`, `church_id`, `member_id` |
| `cell_groups` | Small group meetings | `id`, `church_id` |
| `pastor_assignments` | Pastor-member relationships | `id`, `pastor_id`, `member_id` |
| `access_requests` | Church access requests | `id`, `church_id`, `user_id` |

---

## Common Hooks API

### useMembers

**Purpose**: Query and filter church members with pagination.

```typescript
import { useMembers } from '@/hooks/useMembers';

const {
  members,        // Member[]
  total,          // number
  totalPages,     // number
  isLoading,      // boolean
  filter,         // MemberListFilter
  updateFilter,   // (updates: Partial<MemberListFilter>) => void
  refresh,        // () => Promise<void>
} = useMembers({
  search: '',
  position: null,
  role: null,
  status: 'active',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20,
});
```

**Features**:
- Chosung (Korean initial consonant) search
- Full-text search on name, phone, email
- Filter by position, role, status, cell group
- Pagination support
- Sort by any field

**Query Details**:
```typescript
// Search with Chosung
if (isChosungOnly(filter.search)) {
  query = query.like('name_chosung', `${filter.search}%`);
} else {
  // Full-text search
  query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
}
```

---

### useSermons

**Purpose**: Query sermons with note counts and filtering.

```typescript
import { useSermons } from '@/hooks/useSermons';

const {
  sermons,        // SermonWithNoteCount[]
  total,
  totalPages,
  isLoading,
  filter,
  updateFilter,
  refresh,
} = useSermons({
  search: '',
  serviceType: null,
  dateFrom: null,
  dateTo: null,
  preacher: null,
  sortBy: 'sermon_date',
  sortOrder: 'desc',
  page: 1,
  pageSize: 12,
});
```

**Features**:
- Search by title or preacher name
- Filter by service type (sunday_morning, wednesday, etc.)
- Date range filtering
- Aggregates sermon_notes count per sermon
- Sorted by date (most recent first)

**Join Pattern**:
```typescript
const { data } = await supabase
  .from('sermons')
  .select(`
    *,
    sermon_notes(count)
  `, { count: 'exact' })
  .eq('church_id', currentMember.church_id);

// Map note counts
const mapped = data.map((sermon) => ({
  ...sermon,
  note_count: sermon.sermon_notes?.[0]?.count ?? 0,
}));
```

---

### useNotes

**Purpose**: Query user's sermon notes with sermon details.

```typescript
import { useNotes } from '@/hooks/useNotes';

const {
  notes,          // NoteWithSermon[]
  total,
  totalPages,
  isLoading,
  filter,
  updateFilter,
  refresh,
} = useNotes({
  search: '',
  sermonId: null,
  serviceType: null,
  dateFrom: null,
  dateTo: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
  page: 1,
  pageSize: 12,
});
```

**Features**:
- Auto-scoped to current member
- Search in title and plain_text
- Join with sermons table for context
- Filter by sermon or service type
- Date range filtering

**Join Pattern**:
```typescript
const { data } = await supabase
  .from('sermon_notes')
  .select(`
    *,
    sermons(id, title, preacher_name, sermon_date, service_type, bible_verses)
  `, { count: 'exact' })
  .eq('member_id', currentMember.id);
```

---

## Edge Functions

### 1. send-notification

**Endpoint**: `POST /functions/v1/send-notification`

**Purpose**: Send push notifications via Firebase Cloud Messaging (FCM).

**Authentication**: Required (user JWT token)

**Request Body**:
```typescript
{
  tokens: string[];           // FCM device tokens
  title: string;              // Notification title
  body: string;               // Notification body
  data?: Record<string, string>; // Custom payload
  imageUrl?: string;          // Optional notification image
}
```

**Response**:
```typescript
{
  success: true,
  sent: number,               // Count of successful sends
  failed: number,             // Count of failures
  results: Array<{
    token: string,
    success: boolean,
    status: number
  }>
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authorization header
- `400 Bad Request`: No tokens provided
- `500 Internal Server Error`: FCM_SERVER_KEY not configured or FCM API failure

**Example Usage**:
```typescript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/send-notification',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tokens: ['device-token-1', 'device-token-2'],
      title: 'New Announcement',
      body: 'Check out the latest church announcement!',
      data: {
        type: 'announcement',
        announcementId: '123',
      },
    }),
  }
);
```

**Deployment**:
```bash
supabase functions deploy send-notification --no-verify-jwt
```

**Environment Variables**:
- `FCM_SERVER_KEY`: Firebase Cloud Messaging server key

---

### 2. process-stt

**Endpoint**: `POST /functions/v1/process-stt`

**Purpose**: Process speech-to-text for sermon audio files.

**Authentication**: Service role key required (internal use)

**Request Body**:
```typescript
{
  sermonId: string;           // Sermon ID to process
  audioUrl: string;           // URL to audio file
  language?: string;          // Default: 'ko-KR'
}
```

**Response**:
```typescript
{
  success: true,
  sermonId: string,
  transcriptLength: number,
  status: 'completed'
}
```

**Error Responses**:
- `400 Bad Request`: Missing sermonId or audioUrl
- `500 Internal Server Error`: STT processing failure

**Processing Flow**:
1. Update sermon `stt_status` to 'processing'
2. Call STT service (Google Cloud STT, AWS Transcribe, etc.)
3. Update sermon with transcript and status 'completed'
4. On error, update status to 'failed'

**Database Trigger (Optional)**:
```sql
CREATE OR REPLACE FUNCTION trigger_stt_processing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.audio_url IS NOT NULL AND NEW.stt_status = 'pending' THEN
    PERFORM
      net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/process-stt',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := json_build_object('sermonId', NEW.id, 'audioUrl', NEW.audio_url)::jsonb
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sermon_stt_trigger
  AFTER INSERT OR UPDATE ON sermons
  FOR EACH ROW
  EXECUTE FUNCTION trigger_stt_processing();
```

**Deployment**:
```bash
supabase functions deploy process-stt --no-verify-jwt
```

**Environment Variables**:
- `SUPABASE_SERVICE_ROLE_KEY`: For database updates
- `GOOGLE_CLOUD_API_KEY`: (Optional) For Google Cloud STT integration

---

### 3. daily-digest

**Endpoint**: `POST /functions/v1/daily-digest`

**Purpose**: Send daily digest emails to church members.

**Authentication**: Service role key required (cron job)

**Request Body**: None (automated execution)

**Response**:
```typescript
{
  success: true,
  processed: number,          // Number of churches processed
  results: Array<{
    churchId: string,
    sent: number,             // Emails sent
    errors: number            // Errors encountered
  }>
}
```

**Processing Flow** (per church):
1. Check if `daily_digest_enabled` in church settings
2. Query recent announcements (last 24 hours)
3. Query recent sermons (last 7 days)
4. Query active members with email
5. Generate HTML email with digest content
6. Send via email service (SendGrid, AWS SES, or Resend)

**Digest Content**:
```typescript
interface DigestContent {
  churchId: string;
  churchName: string;
  announcements: Array<{
    title: string;
    content: string;
    author: string;
  }>;
  upcomingEvents: Array<{
    title: string;
    date: string;
    type: string;
  }>;
  recentSermons: Array<{
    title: string;
    preacher: string;
    date: string;
  }>;
}
```

**Scheduling with pg_cron**:
```sql
-- Run daily at 7 AM
SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/daily-digest',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);
```

**Deployment**:
```bash
supabase functions deploy daily-digest
```

**Environment Variables**:
- `SUPABASE_SERVICE_ROLE_KEY`: For database access
- `RESEND_API_KEY`: (Optional) For Resend email service

---

## Row Level Security (RLS)

All tables have RLS enabled to ensure data isolation between churches.

### Policy Pattern

**Example: Members Table**
```sql
-- Select: Users can view members of their church
CREATE POLICY "Users can view members of their church"
ON members FOR SELECT
USING (
  church_id = (
    SELECT church_id FROM members
    WHERE user_id = auth.uid()
  )
);

-- Insert: Admin/Pastor can add members
CREATE POLICY "Admin/Pastor can add members"
ON members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM members m
    WHERE m.user_id = auth.uid()
    AND m.church_id = church_id
    AND m.role IN ('admin', 'pastor')
  )
);

-- Update: Users can update their own record, Admin/Pastor can update all
CREATE POLICY "Users can update own record"
ON members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admin/Pastor can update all members"
ON members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM members m
    WHERE m.user_id = auth.uid()
    AND m.church_id = church_id
    AND m.role IN ('admin', 'pastor')
  )
);
```

### Database Functions

**get_my_church_id()**

Returns the current user's church_id.

```sql
CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS uuid AS $$
  SELECT church_id FROM members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

**compute_chosung(input_text text)**

Computes Korean initial consonants for search optimization.

```sql
CREATE OR REPLACE FUNCTION compute_chosung(input_text text)
RETURNS text AS $$
  -- Implementation extracts initial consonants
  -- Example: "홍길동" -> "ㅎㄱㄷ"
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Storage API

### Buckets

- **avatars**: Member profile photos
- **sermon-audio**: Sermon audio recordings
- **sermon-notes**: Audio recordings from note-taking
- **attachments**: General file attachments

### Upload Pattern

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${memberId}/profile.jpg`, file, {
    cacheControl: '3600',
    upsert: true,
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${memberId}/profile.jpg`);
```

### Storage Policies

All storage buckets enforce RLS based on church_id context.

---

## Real-time Subscriptions

### Subscribe to Table Changes

```typescript
const channel = supabase
  .channel('sermon-notes-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'sermon_notes',
      filter: `member_id=eq.${currentMember.id}`,
    },
    (payload) => {
      console.log('Note changed:', payload);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### Available Events

- `INSERT`: New record created
- `UPDATE`: Record updated
- `DELETE`: Record deleted
- `*`: All events

---

## Error Handling

### Common Error Patterns

```typescript
try {
  const { data, error } = await supabase
    .from('members')
    .select('*');

  if (error) {
    throw error;
  }

  return data;
} catch (error) {
  if (error.code === 'PGRST116') {
    // Row not found
    console.error('Record not found');
  } else if (error.code === '42501') {
    // Insufficient permissions
    console.error('Permission denied');
  } else {
    console.error('Database error:', error.message);
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Supabase enforces rate limits based on subscription tier:

- **Free tier**: 200 requests/minute
- **Pro tier**: 500 requests/minute
- **Enterprise**: Custom limits

For Edge Functions, limits are:
- **Concurrent invocations**: 50 (free), 500 (pro)
- **Execution time**: 60 seconds max

---

## Best Practices

1. **Always check church_id context** before querying
2. **Use RLS policies** instead of manual filtering
3. **Batch operations** when possible to reduce API calls
4. **Cache static data** (e.g., organization structure)
5. **Use TypeScript types** from `@churchthrive/shared`
6. **Handle offline scenarios** in mobile app
7. **Implement optimistic updates** for better UX
8. **Subscribe to real-time updates** for collaborative features

---

## Development Tools

### Local Supabase CLI

```bash
# Start local Supabase
supabase start

# Run migrations
supabase migration up

# Generate TypeScript types
supabase gen types typescript --local > packages/shared/src/types/database.ts

# Test Edge Functions locally
supabase functions serve send-notification
```

### Testing Edge Functions

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"tokens":["token1"],"title":"Test","body":"Hello"}'
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Database Schema](../Church_Thrive/packages/shared/src/types/database.ts)
- [Edge Functions](../Church_Thrive/supabase/functions/)
- [React Hooks](../Church_Thrive/app/src/hooks/)
