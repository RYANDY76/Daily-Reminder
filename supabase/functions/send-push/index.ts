import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPushToSubscription, type PushPayload } from '../_shared/push.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await sb.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const profileId: string = body.profileId
    const payload: PushPayload = {
      title: body.title || 'Daily Reminder',
      body: body.body || '',
      url: body.url || '/',
      tag: body.tag || `test-${Date.now()}`
    }

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId required' }), { status: 400, headers: corsHeaders })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: row, error: subError } = await admin
      .from('push_subscriptions')
      .select('subscription')
      .eq('auth_user_id', user.id)
      .eq('profile_id', profileId)
      .maybeSingle()

    if (subError) throw subError
    if (!row?.subscription) {
      return new Response(JSON.stringify({ error: 'No push subscription', sent: 0 }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await sendPushToSubscription(row.subscription, payload)

    return new Response(JSON.stringify({ sent: 1, ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
