import { test, expect } from '@playwright/test';
import { reminders, friendReminders, friends } from './mock-data/friend-reminders';

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

  await page.route("**/api/reminders/reminder-2/enroll/friend-1", async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      json: {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      },
    });
  });

  await page.getByTestId('reminders-select').selectOption('reminder-2');
  await page.getByTestId('target-date-input').fill('2026-06-21T00:00');
  await page.getByTestId('add-reminder-button').click();
  
  expect(requestBody).toEqual({
    targetDate: '2026-06-21T00:00:00+09:00',
  });
});

test('現在登録中のリマインダ一覧が表示され、解除もできる', async ({ page }) => {
  let deleteCalled = false;

  await page.route("**/api/friend-reminders/friend-reminder-1", async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteCalled = true;
    }
    await route.fulfill({
      status: 200,
      json: {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      },
    });
  });

  const table = page.getByTestId('registered-reminders-table');

  await expect(table.getByRole('cell', { name: '誕生日' })).toHaveCount(3);
  await expect(table.getByRole('cell', { name: '2026/06/02' })).toBeVisible();
  await expect(page.getByTestId('friend-reminder-status-friend-reminder-1')).toContainText('配信中');
  await expect(page.getByTestId('friend-reminder-status-friend-reminder-2')).toContainText('完了');
  await expect(page.getByTestId('friend-reminder-status-friend-reminder-3')).toContainText('解除済み');
  await expect(page.getByTestId('friend-reminder-cancel-button-friend-reminder-1')).toBeVisible();
  await expect(page.getByTestId('friend-reminder-cancel-button-friend-reminder-2')).not.toContainText('解除');
  await expect(page.getByTestId('friend-reminder-cancel-button-friend-reminder-3')).not.toContainText('解除');

  await page.getByTestId('delete-friend-reminder-button-friend-reminder-1').click();
  
  expect(deleteCalled).toBe(true);
});


