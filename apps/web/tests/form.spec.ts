import { test, expect } from '@playwright/test'
import { remindersForm } from './mock-data/reminders-form'
import { forms } from './mock-data/forms'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
  });

  await page.route('**/api/reminders*', async (route) => {
    await route.fulfill({
      status: 200,
      json: remindersForm,
    })
  })

  await page.route('**/api/forms', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(forms),
      })
    }

    return route.fallback()
  })

  await page.goto('/forms')
  await expect(page.getByText('フォーム一覧')).toBeVisible()
});

test('フォーム作成時にリマインダ設定を保存できる', async ({ page }) => {
  let requestBody: unknown

  await page.route('**/api/forms', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>
      requestBody = body

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { ...body, id: 'form-new', isActive: true } }),
      })
    }

    return route.fallback()
  })
  
  await page.getByText('新規作成').click()
  await expect(page.getByText('フォーム作成')).toBeVisible()

  await page.getByTestId('create-form-name').fill('新フォーム')
  await page.getByTestId('create-form-description').fill('新フォームの説明')
  await page.getByTestId('create-form-fields').fill(`
    [
      {
        "name": "date",
        "type": "date",
        "label": "日にち"
      },
      {
        "name": "name",
        "type": "text",
        "label": "名前"
      }
    ]
  `)
  
  await expect(page.getByTestId('create-form-reminder-date-field')).not.toContainText('名前')
  
  await page.getByTestId('create-form-tag-id').fill('tag1')
  await page.getByTestId('create-form-scenario-id').fill('scenario1')
  await page.getByTestId('create-form-save-to-metadata').check()
  await page.getByTestId('create-form-reminder-id').selectOption('reminder-1')
  await page.getByTestId('create-form-reminder-date-field').selectOption('date')

  await page.getByTestId('create-form-submit').click()

  await expect.poll(() => requestBody).toBeTruthy()
  expect(requestBody).toMatchObject({
    name: '新フォーム',
    description: '新フォームの説明',
    fields: [
      {
        name: 'date',
        type: 'date',
        label: '日にち',
      },
      {
        name: 'name',
        type: 'text',
        label: '名前',
      }
    ],
    onSubmitTagId: 'tag1',
    onSubmitScenarioId: 'scenario1',
    saveToMetadata: true,
    onSubmitReminderId: 'reminder-1',
    onSubmitReminderDateField: 'date',
  })
});

test('フォーム編集時にリマインダ設定を保存できる', async ({ page }) => {
  let requestBody: unknown

  await page.route('**/api/forms/form1', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    requestBody = body
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: body }),
    })
  })

  await expect(
    page.getByTestId('edit-form-name-form1')
  ).toHaveValue('テストフォームの名前')

  await page.getByTestId('edit-form-fields-form1').fill(`
    [
      {
        "name": "birthday",
        "type": "date",
        "label": "生年月日"
      },
      {
        "name": "name",
        "type": "text",
        "label": "名前"
      }
    ]
  `)
  
  await expect(page.getByTestId('edit-form-reminder-date-field-form1')).not.toContainText('名前')
  await expect(page.getByTestId('edit-form-reminder-date-field-form1')).not.toContainText('日付')
  
  await page.getByTestId('edit-form-reminder-id-form1').selectOption('reminder-2')
  await page.getByTestId('edit-form-reminder-date-field-form1').selectOption('birthday')
  await page.getByTestId('edit-form-is-active-form1').uncheck()

  await page.getByTestId('edit-form-submit-form1').click()

  await expect.poll(() => requestBody).toBeTruthy()
  expect(requestBody).toMatchObject({
    fields: [
      {
        "name": "birthday",
        "type": "date",
        "label": "生年月日"
      },
      {
        "name": "name",
        "type": "text",
        "label": "名前"
      }
    ],
    isActive: false,
    onSubmitReminderId: 'reminder-2',
    onSubmitReminderDateField: 'birthday',
  })
});
