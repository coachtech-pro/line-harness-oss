import { upsertFriendReminder } from '@line-crm/db';
import type { Form as DbForm } from '@line-crm/db';

// HTML date input と同じ YYYY-MM-DD のみ受け付ける(他形式は保存値が壊れるため)
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/

export function handleReminderRegistration({
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

  if (!DATE_FORMAT.test(targetDate) || Number.isNaN(new Date(targetDate).getTime())) {
    console.error('Invalid date format for reminder', { targetDate, formId: form.id })
    return
  }

  sideEffects.push(
    upsertFriendReminder(db, {
      friendId,
      reminderId: form.on_submit_reminder_id,
      targetDate: `${targetDate}T00:00:00+09:00`,
    })
  )
}
