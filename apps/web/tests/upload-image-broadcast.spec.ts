import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
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

  await page.goto('/broadcasts')

  await page.getByText('+ 新規配信').click()
  await expect(page.getByText('新規配信を作成')).toBeVisible()
});

test('メッセージタイプ「画像」を選ぶと、URL 入力欄ではなくファイル選択 / ドラッグ & ドロップ UI が出る', async ({ page }) => {
  await page.getByTestId('message-type-button-image').click()

  await expect(page.getByTestId('message-content-textarea')).not.toBeVisible()

  await expect(page.getByTestId('image-drop-zone')).toBeVisible()
})

test('画像を選択するとアップロード → R2 保存 → サムネイルプレビューが完結する', async ({ page }) => {
  await page.getByTestId('message-type-button-image').click()

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

test('メッセージタイプ切替でmessageContentが空になり、アプリが落ちない', async ({ page }) => {
  await page.getByTestId('message-type-button-text').click()

  await page.getByTestId('message-content-textarea').fill('こんにちは')

  await page.getByTestId('message-type-button-image').click()

  await expect(page.getByTestId('image-drop-zone')).toBeVisible()
  expect(await page.getByTestId('image-preview').count()).toBe(0)

  await page.getByTestId('message-type-button-text').click()

  await expect(
    page.getByTestId('message-content-textarea')
  ).toHaveValue('')
})