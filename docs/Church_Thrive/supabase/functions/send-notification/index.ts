// Supabase Edge Function: send-notification
// Purpose: Send push notifications via Firebase Cloud Messaging (FCM)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  tokens: string[]; // FCM device tokens
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
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

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const payload: NotificationPayload = await req.json();
    const { tokens, title, body, data, imageUrl } = payload;

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ error: 'No tokens provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare FCM message
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY not configured');
    }

    const messages = tokens.map((token) => ({
      to: token,
      notification: {
        title,
        body,
        ...(imageUrl && { image: imageUrl }),
      },
      data: data || {},
    }));

    // Send notifications to FCM
    const results = await Promise.all(
      messages.map(async (message) => {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${fcmServerKey}`,
          },
          body: JSON.stringify(message),
        });

        return {
          token: message.to,
          success: response.ok,
          status: response.status,
        };
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
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

// To deploy:
// supabase functions deploy send-notification --no-verify-jwt
//
// To invoke locally:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/send-notification' \
//   --header 'Authorization: Bearer YOUR_ANON_KEY' \
//   --header 'Content-Type: application/json' \
//   --data '{"tokens":["token1"],"title":"Test","body":"Hello"}'
