import { test, expect } from '@playwright/test';
import { reminders, friendReminders, friends, enrolledFriendReminder } from './mock-data/friend-reminders';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
  });

  await page.route("**/api/friends?offset=0&limit=20", async (route) => {
    await route.fulfill({
      status: 200,
      json: friends,
    });
  });

  await page.route("**/api/reminders", async (route) => {
    await route.fulfill({
      status: 200,
      json: reminders,
    });
  });

  await page.route("**/api/friends/friend-1/reminders", async (route) => {
    await route.fulfill({
      status: 200,
      json: friendReminders,
    });
  });

  await page.goto('/friends');
  await expect(page.getByText("山田")).toBeVisible();
  await page.getByTestId('expanded-icon-friend-1').click();
  await expect(page.getByText("リマインダ管理")).toBeVisible();
});

test('友だちをリマインダに登録できる', async ({ page }) => {
  let requestBody: any
  let enrolled = false;

  await page.route("**/api/reminders/reminder-2/enroll/friend-1", async (route) => {
    requestBody = route.request().postDataJSON();
    enrolled = true;
    await route.fulfill({
      status: 200,
      json: { success: true, data: enrolledFriendReminder },
    });
  });

  // 登録後の再取得では新しいリマインダを含む一覧を返す
  await page.route("**/api/friends/friend-1/reminders", async (route) => {
    await route.fulfill({
      status: 200,
      json: enrolled
        ? { success: true, data: [...friendReminders.data, enrolledFriendReminder] }
        : friendReminders,
    });
  });

  // 未入力の間は登録ボタンが無効
  await expect(page.getByTestId('add-reminder-button')).toBeDisabled();

  await page.getByTestId('reminders-select').selectOption('reminder-2');
  await page.getByTestId('target-date-input').fill('2026-06-21T00:00');
  await page.getByTestId('add-reminder-button').click();

  // 送信ボディの検証
  await expect.poll(() => requestBody).toEqual({
    targetDate: '2026-06-21T00:00:00+09:00',
  });

  // 成功後はフォームがリセットされ、一覧が再取得される
  await expect(page.getByTestId('reminders-select')).toHaveValue('');
  await expect(page.getByTestId('target-date-input')).toHaveValue('');
  const table = page.getByTestId('registered-reminders-table');
  await expect(table.getByRole('cell', { name: '予約日' })).toBeVisible();
});

test('現在登録中のリマインダ一覧が表示され、解除もできる', async ({ page }) => {
  let deleteCalled = false;

  await page.route("**/api/friend-reminders/friend-reminder-1", async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteCalled = true;
    }
    await route.fulfill({
      status: 200,
      json: { success: true, data: null },
    });
  });

  // 解除後の再取得では対象を解除済みにした一覧を返す
  await page.route("**/api/friends/friend-1/reminders", async (route) => {
    await route.fulfill({
      status: 200,
      json: deleteCalled
        ? {
            success: true,
            data: friendReminders.data.map((fr) =>
              fr.id === 'friend-reminder-1' ? { ...fr, status: 'cancelled' } : fr
            ),
          }
        : friendReminders,
    });
  });

  const table = page.getByTestId('registered-reminders-table');

  await expect(table.getByRole('cell', { name: '誕生日' })).toHaveCount(3);
  await expect(table.getByRole('cell', { name: '2026/06/02' })).toBeVisible();
  await expect(page.getByTestId('friend-reminder-status-friend-reminder-1')).toContainText('配信中');
  await expect(page.getByTestId('friend-reminder-status-friend-reminder-2')).toContainText('完了');
  await expect(page.getByTestId('friend-reminder-status-friend-reminder-3')).toContainText('解除済み');
  await expect(page.getByTestId('friend-reminder-cancel-cell-friend-reminder-1')).toBeVisible();
  await expect(page.getByTestId('friend-reminder-cancel-cell-friend-reminder-2')).not.toContainText('解除');
  await expect(page.getByTestId('friend-reminder-cancel-cell-friend-reminder-3')).not.toContainText('解除');

  await page.getByTestId('delete-friend-reminder-button-friend-reminder-1').click();

  // 解除後は一覧が再取得され、状態が解除済みになる
  await expect(page.getByTestId('friend-reminder-status-friend-reminder-1')).toContainText('解除済み');
  expect(deleteCalled).toBe(true);
});
