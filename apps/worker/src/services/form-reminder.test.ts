import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleReminderRegistration } from './form-reminder.js';
import type { Form as DbForm } from '@line-crm/db';

const form = {
  id: 'form-1',
  on_submit_reminder_id: 'reminder-1',
  on_submit_reminder_date_field: 'birthday',
} as unknown as DbForm

const friendId = 'friend-1'

describe('handleReminderRegistration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('有効な日付の場合はリマインダを登録する', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    } as unknown as D1Database
    
    const submissionData = {
      birthday: '2025-10-20',
    }

    const sideEffects: Promise<unknown>[] = []

    await handleReminderRegistration({
      db,
      form,
      submissionData,
      friendId,
      sideEffects,
    })
    
    expect(db.prepare).toHaveBeenCalled()
    expect(sideEffects).toHaveLength(1)
  })

  it('不正な日付の場合はスキップしてエラーログを出す', async () => {
    const db = { prepare: vi.fn() } as unknown as D1Database
    
    const submissionData = {
      birthday: 'aaaa',
    }
    
    const sideEffects: Promise<unknown>[] = []

    await handleReminderRegistration({
      db,
      form,
      submissionData,
      friendId,
      sideEffects,
    })
    
    expect(db.prepare).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('空欄の場合はスキップしてエラーログを出す', async () => {
    const db = { prepare: vi.fn() } as unknown as D1Database
    
    const submissionData = {
      birthday: '',
    }
    
    const sideEffects: Promise<unknown>[] = []

    await handleReminderRegistration({
      db,
      form,
      submissionData,
      friendId,
      sideEffects,
    })
    
    expect(db.prepare).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('既存レコードがある場合は上書きする', async () => {
    const run = vi.fn()
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 'exists' }),
          run,
        }),
      }),
    } as unknown as D1Database

    
    const submissionData = {
      birthday: '2026-05-01',
    }
    
    const sideEffects: Promise<unknown>[] = []

    await handleReminderRegistration({
      db,
      form,
      submissionData,
      friendId,
      sideEffects,
    })
    
    expect(run).toHaveBeenCalled()
    expect(sideEffects).toHaveLength(0)
  })
});
