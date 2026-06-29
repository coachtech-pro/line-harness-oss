import { enrollFriendInReminder } from '@line-crm/db';
import type { Form as DbForm } from '@line-crm/db';

export async function handleReminderRegistration({
  db,
  form,
  submissionData,
  friendId,
  sideEffects,
}: {
  db: D1Database
  form: DbForm
  submissionData: Record<string, unknown>
  friendId: string
  sideEffects: Promise<unknown>[]
}) {
  if (!form.on_submit_reminder_id || !form.on_submit_reminder_date_field) {
    return
  }

  const targetDate = submissionData[form.on_submit_reminder_date_field]

  if (typeof targetDate !== 'string') {
    return
  }

  const date = new Date(targetDate)

  if (!targetDate || Number.isNaN(date.getTime())) {
    console.error('Invalid date format for reminder', { targetDate, formId: form.id })
    return
  }

  const reminderTargetDate = `${targetDate}T00:00:00+09:00`
  const existing = await db.prepare(`SELECT * FROM friend_reminders WHERE friend_id = ? AND reminder_id = ?`).bind(friendId, form.on_submit_reminder_id).first()

  if (existing) {
    await db.prepare(`UPDATE friend_reminders SET target_date = ? WHERE id = ?`).bind(reminderTargetDate, existing.id).run()
  } else {
    sideEffects.push(enrollFriendInReminder(db, { friendId, reminderId: form.on_submit_reminder_id, targetDate: reminderTargetDate }))
  }
}