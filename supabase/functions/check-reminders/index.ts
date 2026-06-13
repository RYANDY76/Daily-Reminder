import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPushToSubscription, getLocalTimeParts, parseTimeToMinutes } from '../_shared/push.ts'

interface TaskData {
  id: string
  title: string
  time?: string
  date?: string
  done?: boolean
  dueDate?: string
}

interface HabitData {
  id: string
  name: string
  reminderTime?: string
  completedDates?: string[]
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET')
  const authHeader = req.headers.get('Authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { date: today, minutes: currentMinutes } = getLocalTimeParts()
  let sent = 0
  let skipped = 0

  const { data: subscriptions, error: subErr } = await admin
    .from('push_subscriptions')
    .select('id, auth_user_id, profile_id, subscription')

  if (subErr) {
    return new Response(JSON.stringify({ error: subErr.message }), { status: 500 })
  }

  for (const sub of subscriptions || []) {
    const profileId = sub.profile_id
    const authUserId = sub.auth_user_id

    const { data: tasks } = await admin
      .from('app_tasks')
      .select('id, data')
      .eq('profile_id', profileId)
      .eq('auth_user_id', authUserId)

    for (const row of tasks || []) {
      const task = row.data as TaskData
      if (task.done) continue
      const taskDate = task.date || today
      if (taskDate !== today) continue

      const taskMinutes = parseTimeToMinutes(task.time || '09:00')
      if (Math.abs(currentMinutes - taskMinutes) > 2) continue

      const logId = `task-${task.id}-${today}`
      const { data: existing } = await admin.from('push_sent_log').select('id').eq('id', logId).maybeSingle()
      if (existing) { skipped++; continue }

      try {
        await sendPushToSubscription(sub.subscription, {
          title: 'Daily Reminder',
          body: `Waktunya: ${task.title}`,
          url: '/',
          tag: logId
        })
        await admin.from('push_sent_log').upsert({ id: logId, profile_id: profileId, sent_at: Date.now() })
        sent++
      } catch (e) {
        console.error('Push failed for task', task.id, e)
        // Remove stale subscription on 410 Gone
        if (String(e).includes('410')) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }

    const { data: habits } = await admin
      .from('app_habits')
      .select('id, data')
      .eq('profile_id', profileId)
      .eq('auth_user_id', authUserId)

    for (const row of habits || []) {
      const habit = row.data as HabitData
      if ((habit.completedDates || []).includes(today)) continue

      const reminderMinutes = parseTimeToMinutes(habit.reminderTime || '09:00')
      if (currentMinutes < reminderMinutes || currentMinutes > reminderMinutes + 30) continue

      const logId = `habit-${habit.id}-${today}`
      const { data: existing } = await admin.from('push_sent_log').select('id').eq('id', logId).maybeSingle()
      if (existing) { skipped++; continue }

      try {
        await sendPushToSubscription(sub.subscription, {
          title: 'Pengingat Kebiasaan',
          body: `Jangan lupa: ${habit.name}`,
          url: '/habits',
          tag: logId
        })
        await admin.from('push_sent_log').upsert({ id: logId, profile_id: profileId, sent_at: Date.now() })
        sent++
      } catch (e) {
        console.error('Push failed for habit', habit.id, e)
      }
    }
  }

  // Cleanup logs older than 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  await admin.from('push_sent_log').delete().lt('sent_at', weekAgo)

  return new Response(JSON.stringify({ sent, skipped, today, currentMinutes }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
