// Supabase Edge Function: withdraw-response
// Deploy with: supabase functions deploy withdraw-response --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Server configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const withdrawalCode = typeof body.withdrawal_code === 'string' ? body.withdrawal_code : '';

    // Derive a privacy-preserving rate-limit key from request headers (never stored in plain text)
    const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const cfIp = req.headers.get('cf-connecting-ip') || '';
    const clientIp = cfIp || forwardedFor || 'edge_anonymous';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabaseAdmin.rpc('request_response_withdrawal', {
      p_withdrawal_code: withdrawalCode,
      p_client_key: clientIp,
    });

    if (error || !data) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Unable to process withdrawal request at this time. Please try again later.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusCode =
      data.status === 'deleted'
        ? 200
        : data.status === 'rate_limited'
        ? 429
        : data.status === 'expired'
        ? 410
        : 400;

    return new Response(JSON.stringify(data), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'An unexpected server error occurred while processing your request.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
