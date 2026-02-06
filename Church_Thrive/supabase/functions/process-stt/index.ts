// Supabase Edge Function: process-stt
// Purpose: Process speech-to-text for sermon audio files
// Triggered when a new sermon is uploaded with audio_url

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface STTPayload {
  sermonId: string;
  audioUrl: string;
  language?: string; // default: 'ko-KR'
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

    // Initialize Supabase client (service role for updates)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const payload: STTPayload = await req.json();
    const { sermonId, audioUrl, language = 'ko-KR' } = payload;

    if (!sermonId || !audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing sermonId or audioUrl' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update sermon status to processing
    await supabaseClient
      .from('sermons')
      .update({ stt_status: 'processing' })
      .eq('id', sermonId);

    console.log(`Starting STT processing for sermon ${sermonId}`);

    // TODO: Integrate with actual STT service (Google Cloud STT, AWS Transcribe, etc.)
    // For now, this is a placeholder implementation

    // Example integration with Google Cloud Speech-to-Text:
    // const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    // const sttResponse = await fetch(`https://speech.googleapis.com/v1/speech:longrunningrecognize?key=${googleApiKey}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     config: {
    //       encoding: 'MP3',
    //       sampleRateHertz: 16000,
    //       languageCode: language,
    //       enableAutomaticPunctuation: true,
    //       model: 'default',
    //     },
    //     audio: {
    //       uri: audioUrl,
    //     },
    //   }),
    // });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock transcript result
    const mockTranscript = `
[설교 시작]

오늘 본문 말씀은 요한복음 3장 16절입니다.
"하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니
이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라"

이 말씀을 통해 우리는 하나님의 사랑을 깨닫게 됩니다.
하나님은 우리를 사랑하시기에 예수님을 이 땅에 보내주셨습니다.

[설교 내용 계속...]

우리도 이 사랑을 받은 자로서 서로 사랑해야 합니다.
주님의 이름으로 기도하겠습니다.
    `.trim();

    // Update sermon with transcript
    const { error: updateError } = await supabaseClient
      .from('sermons')
      .update({
        transcript: mockTranscript,
        stt_status: 'completed',
      })
      .eq('id', sermonId);

    if (updateError) {
      throw updateError;
    }

    console.log(`STT processing completed for sermon ${sermonId}`);

    return new Response(
      JSON.stringify({
        success: true,
        sermonId,
        transcriptLength: mockTranscript.length,
        status: 'completed',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing STT:', error);

    // Update sermon status to failed if we have the sermonId
    try {
      const payload = await req.json();
      if (payload.sermonId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabaseClient
          .from('sermons')
          .update({ stt_status: 'failed' })
          .eq('id', payload.sermonId);
      }
    } catch (e) {
      console.error('Failed to update sermon status:', e);
    }

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
// supabase functions deploy process-stt --no-verify-jwt
//
// To trigger via database webhook, create a database function:
// CREATE OR REPLACE FUNCTION trigger_stt_processing()
// RETURNS TRIGGER AS $$
// BEGIN
//   IF NEW.audio_url IS NOT NULL AND NEW.stt_status = 'pending' THEN
//     PERFORM
//       net.http_post(
//         url := 'https://your-project.supabase.co/functions/v1/process-stt',
//         headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
//         body := json_build_object('sermonId', NEW.id, 'audioUrl', NEW.audio_url)::jsonb
//       );
//   END IF;
//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;
//
// CREATE TRIGGER sermon_stt_trigger
//   AFTER INSERT OR UPDATE ON sermons
//   FOR EACH ROW
//   EXECUTE FUNCTION trigger_stt_processing();
