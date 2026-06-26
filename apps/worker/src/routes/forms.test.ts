import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

const enrollFriendInReminder = vi.fn();
const createForm = vi.fn();
const updateForm = vi.fn();

vi.mock('@line-crm/db', () => ({
  createForm,
  updateForm,
  enrollFriendInReminder,
  getFormById: vi.fn(async () => ({
    id: 'form-1',
    on_submit_reminder_id: 'reminder-1',
    on_submit_reminder_date_field: 'birthday',
  })),
}));

const first = vi.fn()
const run = vi.fn()
const bind = vi.fn(() => ({ run, first }))
const consoleErrorSpy = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {})

function makeEnv() {
  const prepare = vi.fn(() => ({ bind }))
  return {
    DB: { prepare } as unknown,
    LINE_CHANNEL_ACCESS_TOKEN: 'default-token',
  };
}

async function submitForm(body: unknown) {
  const { forms } = await import('./forms.js');
  const app = new Hono();
  app.route('/', forms);
  const env = makeEnv();
  const res = await app.request('/api/forms/form-1/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, env);
  return res;
}

async function addForm(body: unknown) {
  const { forms } = await import('./forms.js');
  const app = new Hono();
  app.route('/', forms);
  const env = makeEnv();
  const res = await app.request('/api/forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, env);
  return res;
}

async function editForm(id: string, body: unknown) {
  const { forms } = await import('./forms.js');
  const app = new Hono();
  app.route('/', forms);
  const env = makeEnv();
  const res = await app.request(`/api/forms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, env);
  return res;
}

describe('POST /api/forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('フォーム作成', async () => {
    const res = await addForm({
      name: 'test-form',
      description: 'test-form-description',
      fields: [
        {
          name: 'birthday',
            type: 'date',
            label: '誕生日',
            required: true,
          },
        ],
        saveToMetadata: true,
        onSubmitReminderId: 'reminder-1',
        onSubmitReminderDateField: 'birthday',
      }
    )
    expect(res.status).toBe(200)
    expect(createForm).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-form',
        description: 'test-form-description',
        onSubmitReminderId: 'reminder-1',
        onSubmitReminderDateField: 'birthday',
      }),
    )
  })
})

describe('PUT /api/forms/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('フォーム編集', async () => {
    const res = await editForm('form-1', {
      data: {
        fields: [
          {
            name: 'date',
            type: 'date',
            label: '日付',
            required: true,
          },
        ],
        onSubmitReminderId: 'reminder-2',
        onSubmitReminderDateField: 'date',
      }
    })
    
    expect(res.status).toBe(200)
    expect(updateForm).toHaveBeenCalledWith(
      expect.objectContaining({
        onSubmitReminderId: 'reminder-2',
        onSubmitReminderDateField: 'date',
      }),
    )
  })
})

describe('POST /api/forms/:id/submissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有効な日付の場合はリマインダを登録する', async () => {
    first.mockResolvedValue(null)
    const res = await submitForm({
      friendId: 'friend-1',
      data: {
        birthday: '2026-04-10',
      },
    })
    
    expect(res.status).toBe(200)
    expect(enrollFriendInReminder).toHaveBeenCalledTimes(1)
  })

  it('不正な日付の場合はスキップしてエラーログを出す', async () => {
    first.mockResolvedValue(null)

    const res = await submitForm({
      friendId: 'friend-1',
      data: {
        birthday: 'aaaa',
      },
    })
  
    expect(res.status).toBe(200)
    expect(enrollFriendInReminder).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('空欄の場合はスキップしてエラーログを出す', async () => {
    first.mockResolvedValue(null)
    const res = await submitForm({
      friendId: 'friend-1',
      data: {
        birthday: '',
      },
    })
  
    expect(res.status).toBe(200)
    expect(enrollFriendInReminder).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('既存レコードがある場合は上書きする', async () => {
    first.mockResolvedValue({ id: 'existing-friend-reminder' })
    const res = await submitForm({
      friendId: 'friend-1',
      data: {
        birthday: '2026-05-01',
      },
    })

    expect(res.status).toBe(200)
    expect(enrollFriendInReminder).not.toHaveBeenCalled()
    expect(run).toHaveBeenCalled()
    expect(bind.mock.calls).toContainEqual([
      '2026-05-01T00:00:00+09:00',
      'existing-friend-reminder',
    ])
  })
});
