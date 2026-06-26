ALTER TABLE forms ADD COLUMN on_submit_reminder_id TEXT REFERENCES reminders (id) ON DELETE SET NULL;
ALTER TABLE forms ADD COLUMN on_submit_reminder_date_field TEXT;