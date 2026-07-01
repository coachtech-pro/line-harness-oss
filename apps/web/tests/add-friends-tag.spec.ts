import { test, expect } from "@playwright/test";
import { friendsWithTag } from "./mock-data/friends";
import { tags } from "./mock-data/tags";
import { reminderFriend } from "./mock-data/reminder-friend";
import { reminders } from "./mock-data/reminders";

let reminderFriendData: typeof reminderFriend

test.beforeEach(async ({ page }) => {
  reminderFriendData = structuredClone(reminderFriend)

  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
  });

  await page.route("**/api/friends**", async (route) => {
    await route.fulfill({
      status: 200,
      json: friendsWithTag,
    });
  });

  await page.route("**/api/tags", async (route) => {
    await route.fulfill({
      status: 200,
      json: tags,
    });
  });

  await page.route("**/api/reminders", async (route) => {
    await route.fulfill({
      status: 200,
      json: reminders,
    });
  });


  await page.route("**/api/reminders/reminder-1", async (route) => {
    await route.fulfill({
      status: 200,
      json: reminderFriendData,
    });
  });

  await page.goto('/reminders')

  await expect(page.getByText('テストリマインダー')).toBeVisible()
  await page.getByText('詳細').click()
  await expect(page.getByText('現在登録されている友だち一覧')).toBeVisible()
});

test('対象タグの全友だちを登録し、登録済みの友だちはスキップされ、登録結果を画面で確認できる', async ({ page }) => {
  const requests: {
    url: string
    body: any
  }[] = []

  await page.route('**/api/reminders/reminder-1/enroll/**', async route => {
    requests.push({
      url: route.request().url(),
      body: route.request().postDataJSON()
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  await page.getByRole('button', { name: '+ タグから一括登録' }).click()

  await page.getByTestId('tag-select').selectOption('tag-1')

  await page.getByTestId('target-date-input').fill('2026-01-01T10:00')

  await page.getByTestId('add-friend-button').click()

  await page.waitForTimeout(1000)
  
  expect(requests).toHaveLength(3)

  expect(requests[0].body.targetDate).toBe('2026-01-01T10:00:00+09:00')
  expect(requests[1].body.targetDate).toBe('2026-01-01T10:00:00+09:00')
  expect(requests[2].body.targetDate).toBe('2026-01-01T10:00:00+09:00')

  expect(requests[0].url).toContain('reminder-1')
  expect(requests[1].url).toContain('reminder-1')
  expect(requests[2].url).toContain('reminder-1')

  const urls = requests.map(r => r.url)

  expect(urls.some(url => url.includes('user-1'))).toBe(true)
  expect(urls.some(url => url.includes('user-2'))).toBe(true)
  expect(urls.some(url => url.includes('user-5'))).toBe(true)

  expect(urls.some(url => url.includes('user-3'))).toBe(false)
  expect(urls.some(url => url.includes('user-4'))).toBe(false)

  await expect(page.getByText('新規3件 / スキップ2件')).toBeVisible()
});

test('現在登録されている友だち一覧が基準日と共に表示され、解除もできる', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    await dialog.accept()
  })

  let deleteCalled = false

  await page.route('**/api/friend-reminders/reminder-friend-1', async route => {
    if (route.request().method() === 'DELETE') {
      deleteCalled = true
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  await expect(page.getByText('名前: 佐藤')).toBeVisible()
  await expect(page.getByText('名前: 田中')).not.toBeVisible()
  await expect(page.getByText('名前: 斎藤')).not.toBeVisible()
  await expect(page.getByText('基準日: 2026/01/01 10:00')).toHaveCount(1)

  await page.getByTestId('delete-friend-button-user-3').click()
  
  expect(deleteCalled).toBe(true)
  
  reminderFriendData = {
    ...reminderFriendData,
    data: {
      ...reminderFriendData.data,
      friends: reminderFriendData.data.friends.filter((friend) => friend.id !== 'reminder-friend-1')
    }
  }
  
  await expect(page.getByText('名前: 佐藤')).not.toBeVisible()
  await expect(page.getByText('基準日: 2026/01/01 10:00')).toHaveCount(0)
});
