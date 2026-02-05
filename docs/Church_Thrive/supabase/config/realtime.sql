-- ChurchThrive Realtime Configuration
-- Configure Supabase Realtime for tables that need real-time updates

-- ==========================================
-- REALTIME PUBLICATION SETUP
-- ==========================================

-- Remove existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;

-- Create new publication for realtime tables
CREATE PUBLICATION supabase_realtime FOR TABLE
  attendances,
  announcements,
  access_requests,
  sermon_notes,
  note_feedbacks,
  members;

-- ==========================================
-- ENABLE REALTIME FOR SPECIFIC TABLES
-- ==========================================

-- 1. ATTENDANCES
-- Real-time updates for attendance check-ins
-- Use case: Live attendance dashboard, QR code check-in tracking
ALTER PUBLICATION supabase_realtime ADD TABLE attendances;

COMMENT ON TABLE attendances IS 'Realtime enabled: attendance check-ins appear instantly on dashboard';

-- 2. ANNOUNCEMENTS
-- Real-time updates for new announcements
-- Use case: Instant notification when admin posts new announcement
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

COMMENT ON TABLE announcements IS 'Realtime enabled: new announcements appear instantly';

-- 3. ACCESS REQUESTS
-- Real-time updates for church access requests
-- Use case: Admin sees new access requests immediately
ALTER PUBLICATION supabase_realtime ADD TABLE access_requests;

COMMENT ON TABLE access_requests IS 'Realtime enabled: admin sees new requests instantly';

-- 4. SERMON NOTES
-- Real-time updates for sermon notes
-- Use case: Pastor sees when members create new notes
ALTER PUBLICATION supabase_realtime ADD TABLE sermon_notes;

COMMENT ON TABLE sermon_notes IS 'Realtime enabled: pastors see new notes from members';

-- 5. NOTE FEEDBACKS
-- Real-time updates for pastor feedback on notes
-- Use case: Members see pastor feedback instantly
ALTER PUBLICATION supabase_realtime ADD TABLE note_feedbacks;

COMMENT ON TABLE note_feedbacks IS 'Realtime enabled: members see pastor feedback instantly';

-- 6. MEMBERS
-- Real-time updates for member status changes
-- Use case: Admin sees when new members join or status changes
ALTER PUBLICATION supabase_realtime ADD TABLE members;

COMMENT ON TABLE members IS 'Realtime enabled: member status changes appear instantly';

-- ==========================================
-- REALTIME SUBSCRIPTION EXAMPLES
-- ==========================================

-- Example 1: Subscribe to attendance check-ins for a specific event
-- Client code (TypeScript/React):
/*
const supabase = createClient(...)
const channel = supabase
  .channel('attendance-checkins')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'attendances',
      filter: `church_id=eq.${churchId}`
    },
    (payload) => {
      console.log('New check-in:', payload)
      // Update UI with new attendance
    }
  )
  .subscribe()
*/

-- Example 2: Subscribe to new announcements
-- Client code (TypeScript/React):
/*
const channel = supabase
  .channel('new-announcements')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'announcements',
      filter: `church_id=eq.${churchId}`
    },
    (payload) => {
      console.log('New announcement:', payload)
      // Show notification to user
    }
  )
  .subscribe()
*/

-- Example 3: Subscribe to access requests (admin only)
-- Client code (TypeScript/React):
/*
const channel = supabase
  .channel('access-requests')
  .on(
    'postgres_changes',
    {
      event: '*', // All events (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'access_requests',
      filter: `church_id=eq.${churchId}`
    },
    (payload) => {
      console.log('Access request update:', payload)
      // Update admin dashboard
    }
  )
  .subscribe()
*/

-- Example 4: Subscribe to sermon note updates (pastor dashboard)
-- Client code (TypeScript/React):
/*
const channel = supabase
  .channel('sermon-notes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'sermon_notes',
      filter: `church_id=eq.${churchId}`
    },
    (payload) => {
      console.log('New sermon note:', payload)
      // Update pastor dashboard with new note
    }
  )
  .subscribe()
*/

-- Example 5: Subscribe to note feedbacks (member view)
-- Client code (TypeScript/React):
/*
const channel = supabase
  .channel('note-feedbacks')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'note_feedbacks',
      filter: `sermon_note_id=eq.${noteId}`
    },
    (payload) => {
      console.log('New feedback:', payload)
      // Show feedback to member
    }
  )
  .subscribe()
*/

-- ==========================================
-- REALTIME SECURITY CONSIDERATIONS
-- ==========================================

-- 1. RLS Policies Still Apply
-- Even with Realtime enabled, Row Level Security policies are enforced.
-- Users will only receive updates for rows they have permission to see.

-- 2. Church Isolation
-- Realtime subscriptions should always filter by church_id to prevent
-- cross-church data leakage.

-- 3. Rate Limiting
-- Consider implementing rate limiting on the client side to prevent
-- excessive realtime connections.

-- 4. Connection Management
-- Always unsubscribe from channels when components unmount:
/*
useEffect(() => {
  const channel = supabase.channel('my-channel').subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
*/

-- ==========================================
-- PERFORMANCE OPTIMIZATION
-- ==========================================

-- 1. Use specific filters
-- Always filter by church_id to reduce payload size
-- Filter by specific IDs when possible (e.g., event_id, sermon_id)

-- 2. Limit subscriptions
-- Don't subscribe to tables you don't need updates from
-- Unsubscribe when not actively viewing the data

-- 3. Batch updates
-- Use throttling/debouncing on client side to batch rapid updates

-- 4. Monitor Realtime connections
-- Track active connections in Supabase dashboard
-- Set up alerts for unusual connection patterns

-- ==========================================
-- TESTING REALTIME
-- ==========================================

-- Test Realtime locally with Supabase CLI:
-- 1. Start Supabase: supabase start
-- 2. In one terminal, subscribe to changes:
--    supabase realtime subscribe '*' --db-url 'postgresql://...'
-- 3. In another terminal, make changes to the database
-- 4. Verify updates appear in the subscription terminal

-- ==========================================
-- REALTIME MONITORING QUERIES
-- ==========================================

-- Check which tables have realtime enabled
SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Count realtime publications
SELECT
  pubname,
  COUNT(*) as table_count
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
GROUP BY pubname;

-- Verify RLS is enabled on realtime tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
)
ORDER BY tablename;

SELECT '✓ Realtime configuration completed' AS status;
