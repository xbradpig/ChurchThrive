// Supabase Edge Function: daily-digest
// Purpose: Send daily digest emails to church members
// Scheduled via cron job or pg_cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Verify service role key for scheduled execution
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.includes(serviceRoleKey || '')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - service role key required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey ?? ''
    );

    // Get all active churches
    const { data: churches, error: churchError } = await supabaseClient
      .from('churches')
      .select('id, name, settings')
      .order('created_at');

    if (churchError) {
      throw churchError;
    }

    const results: Array<{ churchId: string; sent: number; errors: number }> = [];

    // Process each church
    for (const church of churches || []) {
      try {
        // Check if daily digest is enabled in settings
        const settings = church.settings as Record<string, unknown>;
        if (settings?.daily_digest_enabled === false) {
          console.log(`Skipping church ${church.id} - daily digest disabled`);
          continue;
        }

        // Get recent announcements (last 24 hours)
        const { data: announcements } = await supabaseClient
          .from('announcements')
          .select('title, content, author:members(name)')
          .eq('church_id', church.id)
          .eq('is_published', true)
          .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('published_at', { ascending: false })
          .limit(5);

        // Get recent sermons (last 7 days)
        const { data: sermons } = await supabaseClient
          .from('sermons')
          .select('title, sermon_date, preacher:members(name)')
          .eq('church_id', church.id)
          .gte('sermon_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('sermon_date', { ascending: false })
          .limit(3);

        // Get active members with email
        const { data: members } = await supabaseClient
          .from('members')
          .select('email, name')
          .eq('church_id', church.id)
          .eq('status', 'active')
          .not('email', 'is', null);

        if (!members || members.length === 0) {
          console.log(`No members with email for church ${church.id}`);
          continue;
        }

        // Prepare digest content
        const digestContent: DigestContent = {
          churchId: church.id,
          churchName: church.name,
          announcements: announcements?.map((a) => ({
            title: a.title,
            content: a.content,
            author: (a.author as any)?.name || 'Unknown',
          })) || [],
          upcomingEvents: [], // TODO: Add events table
          recentSermons: sermons?.map((s) => ({
            title: s.title,
            preacher: (s.preacher as any)?.name || 'Unknown',
            date: s.sermon_date,
          })) || [],
        };

        // Generate HTML email
        const emailHtml = generateEmailHtml(digestContent);

        // Send emails (using a service like SendGrid, AWS SES, or Resend)
        // For now, log the digest
        console.log(`Daily digest for ${church.name}:`);
        console.log(`- ${announcements?.length || 0} new announcements`);
        console.log(`- ${sermons?.length || 0} recent sermons`);
        console.log(`- Sending to ${members.length} members`);

        // TODO: Integrate with email service
        // Example with Resend:
        // const resendApiKey = Deno.env.get('RESEND_API_KEY');
        // await fetch('https://api.resend.com/emails', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${resendApiKey}`,
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     from: 'noreply@churchthrive.com',
        //     to: members.map(m => m.email),
        //     subject: `${church.name} - Daily Digest`,
        //     html: emailHtml,
        //   }),
        // });

        results.push({
          churchId: church.id,
          sent: members.length,
          errors: 0,
        });
      } catch (error) {
        console.error(`Error processing church ${church.id}:`, error);
        results.push({
          churchId: church.id,
          sent: 0,
          errors: 1,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: churches?.length || 0,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating daily digest:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateEmailHtml(content: DigestContent): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #4f46e5; }
    h2 { color: #6366f1; margin-top: 30px; }
    .announcement { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .sermon { border-left: 4px solid #4f46e5; padding-left: 15px; margin: 10px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${content.churchName} - Daily Digest</h1>

    ${content.announcements.length > 0 ? `
      <h2>New Announcements</h2>
      ${content.announcements.map(a => `
        <div class="announcement">
          <h3>${a.title}</h3>
          <p>${a.content}</p>
          <small>By ${a.author}</small>
        </div>
      `).join('')}
    ` : ''}

    ${content.recentSermons.length > 0 ? `
      <h2>Recent Sermons</h2>
      ${content.recentSermons.map(s => `
        <div class="sermon">
          <h3>${s.title}</h3>
          <p>Preacher: ${s.preacher} | Date: ${s.date}</p>
        </div>
      `).join('')}
    ` : ''}

    <div class="footer">
      <p>This is an automated daily digest from ${content.churchName}.</p>
      <p>To unsubscribe, please update your preferences in the ChurchThrive app.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// To deploy:
// supabase functions deploy daily-digest
//
// To schedule with pg_cron (run daily at 7 AM):
// SELECT cron.schedule(
//   'daily-digest',
//   '0 7 * * *',
//   $$
//   SELECT
//     net.http_post(
//       url := 'https://your-project.supabase.co/functions/v1/daily-digest',
//       headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//     );
//   $$
// );
