import { test, expect } from '@playwright/test'
import { remindersForm } from './mock-data/reminders-form'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
  });

  await page.route('**/api/reminders', async (route) => {
    await route.fulfill({
      status: 200,
      json: remindersForm,
    })
  })

  await page.goto('/forms')
  await expect(page.getByText('フォーム一覧')).toBeVisible()
});

test('フォーム作成時にリマインダ設定を保存できる', async ({ page }) => {
  let requestBody: unknown

  await page.route('**/api/forms', async (route) => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
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
        "label": "日付"
      },
      {
        "name": "name",
        "type": "text",
        "label": "名前"
      }
    ]
  `)
  
  await expect(
    page.getByRole('option', { name: '日付' })
  ).toBeVisible()

  await expect(
    page.getByRole('option', { name: '名前' })
  ).toHaveCount(0)
  
  await page.getByTestId('create-form-tag-id').fill('tag1')
  await page.getByTestId('create-form-scenario-id').fill('scenario1')
  await page.getByTestId('create-form-save-to-metadata').check()
  await page.getByTestId('create-form-reminder-id').selectOption('reminder-1')
  await page.getByTestId('create-form-reminder-date-field').selectOption('date')

  await page.getByTestId('create-form-submit').click()

  expect(requestBody).toMatchObject({
    name: '新フォーム',
    description: '新フォームの説明',
    fields: [
      {
        name: 'date',
        type: 'date',
        label: '日付',
      }
    ],
    onSubmitTagId: 'tag1',
    onSubmitScenarioId: 'scenario1',
    saveToMetadata: true,
    onSubmitReminderId: 'reminder-1',
    onSubmitReminderDateField: 'date',
  })
});