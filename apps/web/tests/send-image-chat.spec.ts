import { test, expect } from "@playwright/test";
import { chatFriends } from "./mock-data/friends";
import { chats, postChat, } from "./mock-data/chats";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
  });

  await page.route("**/api/chats?", async (route) => {
    await route.fulfill({
      status: 200,
      json: chatFriends,
    });
  });

  await page.route("**/api/chats/user-4", async (route) => {
    await route.fulfill({
      status: 200,
      json: chats,
    });
  });

  await page.route('**/api/images', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        data: {
          url: 'https://example.com/test.png',
        },
      },
    })
  })

  await page.route("**/api/chats/user-4/send**", async (route) => {
    await route.fulfill({
      status: 200,
      json: postChat,
    })

    chats.data.messages.push({
      id: "msg-2",
      direction: "outgoing",
      messageType: "image",
      content: "https://example.com/test.png",
      createdAt: new Date().toISOString(),
    })
  })

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

test('送信後に画像メッセージが履歴へ表示され、再読み込み後も画像が表示される', async ({ page }) => {
  await page.setInputFiles(
    '[data-testid="image-input"]',
    'tests/fixtures/test.png'
  )

  await page.getByTestId('send-button').click()

  await expect(page.getByTestId('image-message')).toHaveAttribute(
    'src',
    'https://example.com/test.png'
  )

  await page.reload()
  await page.getByText('チャットしている人').click()

  await expect(page.getByTestId('image-message')).toHaveAttribute(
    'src',
    'https://example.com/test.png'
  )
})
