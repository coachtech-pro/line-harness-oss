import { test, expect } from "@playwright/test";
import { scenarios } from "./mock-data/scenarios";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
  });

  await page.route("**/api/scenarios/scenario-1", async (route) => {
    await route.fulfill({
      status: 200,
      json: scenarios,
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

  await page.goto('/scenarios/detail?id=scenario-1')

  await page.getByText('+ ステップ追加').click()
  await expect(page.getByText('新しいステップを追加')).toBeVisible()
});

test('メッセージタイプ「画像」を選ぶと、URL 入力欄ではなくファイル選択 / ドラッグ & ドロップ UI が出る', async ({ page }) => {
  await page.getByTestId('message-type-select').selectOption('image')

  await expect(page.getByPlaceholder('メッセージ内容を入力')).not.toBeVisible()

  await expect(page.getByTestId('image-drop-zone')).toBeVisible()
})

test('画像を選択するとアップロード → R2 保存 → サムネイルプレビューが完結する', async ({ page }) => {
  await page.getByTestId('message-type-select').selectOption('image')

  await expect(page.getByTestId('image-drop-zone')).toBeVisible()
  await expect(page.getByTestId('image-input')).toBeVisible()

  await page.setInputFiles(
    '[data-testid="image-input"]',
    'tests/fixtures/test.png'
  )

  await expect(page.getByTestId('image-preview')).toHaveAttribute(
    'src',
    'https://example.com/test.png'
  )
})

test('保存後にmessageContentがJSONになる', async ({ page }) => {
  let requestBody: any

  await page.route('**/api/scenarios/scenario-1/steps', async route => {
    requestBody = route.request().postDataJSON()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  await page.getByTestId('message-type-select').selectOption('image')

  await expect(page.getByTestId('image-drop-zone')).toBeVisible()
  await expect(page.getByTestId('image-input')).toBeVisible()

  await page.setInputFiles(
    '[data-testid="image-input"]',
    'tests/fixtures/test.png'
  )

  await page.getByTestId('save-step-button').click()

  expect(() => JSON.parse(requestBody.messageContent)).not.toThrow()

  const parsed = JSON.parse(requestBody.messageContent)

  expect(parsed).toEqual({
    originalContentUrl: 'https://example.com/test.png',
    previewImageUrl: 'https://example.com/test.png',
  })
})
