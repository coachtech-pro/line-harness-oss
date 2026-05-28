import { test, expect } from "@playwright/test";
import { noChatFriends, chatFriends } from "./mock-data/friends";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
  });
});

test("チャットリスト表示", async ({ page }) => {
  await page.route("**/api/friends**", async (route) => {
    await route.fulfill({
      status: 200,
      json: noChatFriends,
    });
  });

  await page.route("**/api/chats**", async (route) => {
    await route.fulfill({
      status: 200,
      json: chatFriends,
    });
  });

  await page.goto("/chats");

  await expect(page.getByText("チャットしている人")).toBeVisible();

  const names = page.getByTestId("friend-name");
  await expect(names.nth(0)).toContainText("フォローしている新しい人");
  await expect(names.nth(1)).toContainText("フォローしている古い人");
  await expect(names.nth(2)).toContainText("チャットしている人");

  await expect(page.getByText("フォローしていない人")).not.toBeVisible();
});
