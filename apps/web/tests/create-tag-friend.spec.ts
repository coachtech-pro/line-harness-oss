import { test, expect } from "@playwright/test";
import { tags, friends } from "./mock-data/friend-tags";
import { lineAccounts } from "./mock-data/line-accounts";

let requestBody: any
let friendsTagRequestBody: any

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lh_api_key", "test-key");
    localStorage.setItem("lh_selected_account", "test-line-account-id-2");
  });

  await page.route("**/api/line-accounts", async (route) => {
    await route.fulfill({
      status: 200,
      json: lineAccounts,
    });
  });

  await page.route("**/api/friends?offset=0&limit=20", async (route) => {
    await route.fulfill({
      status: 200,
      json: friends,
    });
  });

  await page.route("**/api/tags*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: tags,
      });
    } else if (route.request().method() === "POST") {
      requestBody = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { ...requestBody, id: "new-tag-id" } }),
      });
    }
  });

  await page.route("**/api/friends/friend-1/tags", async (route) => {
    friendsTagRequestBody = await route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto("/friends");
  await expect(page.getByText("山田")).toBeVisible();
  await expect(page.getByText("佐藤")).toBeVisible();
});

test("「+ 新規タグを作成」項目を選択で新規タグを作成でき、その友だちに即時付与される", async ({ page }) => {
  await page.getByTestId("expanded-icon-friend-1").click();
  await expect(page.getByRole("button", { name: "タグを追加" })).toBeVisible();
  await page.getByRole("button", { name: "タグを追加" }).click();
  await expect(page.getByRole("button", { name: "+ 新規タグを作成" })).toBeVisible();
  await page.getByRole("button", { name: "+ 新規タグを作成" }).click();

  await page.locator("#tag-name-friend-1").fill("新規タグ");
  await page.locator("#tag-color-friend-1").fill("#ff0000");
  await page.getByRole("button", { name: "保存" }).click();

  await page.waitForResponse("**/api/friends/friend-1/tags");

  expect(requestBody).toEqual({
    name: "新規タグ",
    color: "#ff0000",
    lineAccountId: "test-line-account-id-2",
  });

  expect(friendsTagRequestBody).toEqual({
    tagId: "new-tag-id",
  });
});

test("色を入力しなくてもタグを作成できる", async ({ page }) => {
  await page.getByTestId("expanded-icon-friend-1").click();
  await expect(page.getByRole("button", { name: "タグを追加" })).toBeVisible();
  await page.getByRole("button", { name: "タグを追加" }).click();
  await expect(page.getByRole("button", { name: "+ 新規タグを作成" })).toBeVisible();
  await page.getByRole("button", { name: "+ 新規タグを作成" }).click();

  await page.locator("#tag-name-friend-1").fill("色指定なしタグ");
  await page.getByRole("button", { name: "保存" }).click();

  await page.waitForResponse("**/api/friends/friend-1/tags");

  expect(requestBody).toEqual({
    name: "色指定なしタグ",
    lineAccountId: "test-line-account-id-2",
  });

  expect(friendsTagRequestBody).toEqual({
    tagId: "new-tag-id",
  });
});

test("タグが0件の時も「タグを追加」ボタンが表示され、押すと新規作成フォームが出現する", async ({ page }) => {
  await page.getByTestId("expanded-icon-friend-2").click();
  await expect(page.getByRole("button", { name: "タグを追加" })).toBeVisible();
  await page.getByRole("button", { name: "タグを追加" }).click();

  await expect(page.locator("#tag-name-friend-2")).toBeVisible();
  await expect(page.locator("#tag-color-friend-2")).toBeVisible();
});
