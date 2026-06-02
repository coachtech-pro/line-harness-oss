import { test, expect } from "@playwright/test";
import { chatFriends } from "./mock-data/friends";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
  });

      await page.route("**/api/chats**", async (route) => {
    await route.fulfill({
      status: 200,
      json: chatFriends,
    });
  });

  await page.route("**/api/chats/user-4**", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        success: true,
        data: {
          id: "user-4",
          friendName: "チャットしている人",
          status: "in_progress",
          lastMessageAt: "2026-03-22T15:30:00.000",
          createdAt: "2026-03-21T10:30:00.000+09:00",
        },
      },
    });
  });

  await page.goto('/chats')

  await page.getByText('チャットしている人').click()
  await expect(page.getByTestId('image-input')).toBeVisible()
});

test('画像を選択するとプレビューが表示される', async ({ page }) => {
  await page.setInputFiles(
    '[data-testid="image-input"]',
    'tests/fixtures/test.png'
  )

  await expect(page.getByTestId('image-preview')).toBeVisible()
})

test('画像送信時に画像メッセージが送信される', async ({ page }) => {
  await page.setInputFiles(
    '[data-testid="image-input"]',
    'tests/fixtures/test.png'
  )

  const requestPromise = page.waitForRequest(
    req => req.method() === 'POST' && req.url().includes('**/api/chats/user-4/send**')
  )

  await page.getByTestId('send-button').click()

  const request = await requestPromise
  const body = request.postDataJSON()

  expect(body.messageType).toBe('image')
})

test('送信後に画像メッセージが履歴へ表示され、再読み込み後も画像が表示される', async ({ page }) => {
  await page.setInputFiles(
    '[data-testid="image-input"]',
    'tests/fixtures/test.png'
  )

  await page.getByTestId('send-button').click()

  await expect(page.getByTestId('image-message')).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('image-message')).toBeVisible()
})

test('JPEG、PNG形式の画像を送信できる', async ({ page }) => {
  await page.setInputFiles(
    '[data-testid="image-input"]',
    'tests/fixtures/test.txt'
  )

  await page.getByTestId('send-button').click()

  await expect(page.getByTestId('image-message')).not.toBeVisible()
})
