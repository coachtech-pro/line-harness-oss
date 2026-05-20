# LINE Harness

> ### **[LINE で無料体験する](https://shudesu.github.io/line-harness-oss/)** 👈

LINE公式アカウントの完全オープンソース CRM。L社 / U社 の無料代替。

Cloudflare 無料枠で動く。サーバー代 0 円。Claude Code から全操作可能。

---

## なぜ LINE Harness？

| | L社 | U社 | **LINE Harness** |
|---|---|---|---|
| 月額 | 2万円〜 | 1万円〜 | **0円** |
| ステップ配信 | ✅ | ✅ | ✅ |
| セグメント配信 | ✅ | ✅ | ✅ |
| リッチメニュー切替 | ✅ | ✅ | ✅ |
| フォーム | ✅ | ✅ | ✅ |
| スコアリング | ✅ | ❌ | ✅ |
| IF-THEN 自動化 | 一部 | 一部 | ✅ |
| API 公開 | ❌ | ❌ | **全機能** |
| AI (Claude Code) 対応 | ❌ | ❌ | **✅** |
| BAN 検知 & 自動移行 | ❌ | ❌ | **✅** |
| マルチアカウント | 別契約 | 別契約 | **標準搭載** |
| ソースコード | 非公開 | 非公開 | **MIT** |

---

<details>
<summary><strong>全機能一覧（クリックで展開）</strong></summary>

## 全機能一覧

### 配信
- **ステップ配信** — delay_minutes で分単位制御、条件分岐、ステルスモード
- **即時配信** — ブロードキャスト即時送信、個別メッセージ即時送信
- **ブロードキャスト** — 全員/タグ/セグメント配信、即時 or 予約配信、バッチ送信
- **リマインダー** — 指定日からのカウントダウン配信（セミナー3日前、1日前、当日）
- **テンプレート** — メッセージテンプレートの管理・再利用
- **テンプレート変数** — `{{name}}`, `{{uid}}`, `{{auth_url:CHANNEL_ID}}` で友だちごとにパーソナライズ
- **配信時間帯制御** — 9:00-23:00 JST のみ配信、ユーザー別の好み時間設定

### CRM
- **友だち管理** — Webhook 自動登録、プロフィール取得、カスタムメタデータ
- **タグ** — セグメント分け、配信条件、シナリオトリガー
- **スコアリング** — 行動ベースのリードスコア自動計算
- **オペレーターチャット** — 管理画面から直接 LINE 返信

### マーケティング
- **リッチメニュー** — ユーザー別・タグ別のメニュー切替
- **トラッキングリンク** — クリック計測 + 自動タグ付け + シナリオ開始
- **フォーム (LIFF)** — LINE 内で完結するフォーム、回答→メタデータ自動保存
- **カレンダー予約** — Google Calendar 連携の予約システム (LIFF)

### 自動化
- **IF-THEN ルール** — 7種のトリガー × 6種のアクション
- **自動返信** — キーワードマッチ（完全一致/部分一致）
- **Webhook IN/OUT** — 外部サービス連携（Stripe, Slack 等）
- **通知ルール** — 条件付きアラート配信

### 安全性
- **BAN 検知** — アカウントヘルスの自動監視（normal/warning/danger）
- **アカウント移行** — BAN 時のワンクリック移行（友だち・タグ・シナリオ引き継ぎ）
- **ステルスモード** — 送信ジッター、バッチ間隔ランダム化
- **マルチアカウント** — 1 Worker で複数アカウント管理、Webhook 署名で自動ルーティング
- **クロスプロバイダー UUID 統合** — `?uid=` パラメータで別プロバイダー間の同一人物を自動リンク
- **管理画面アカウント切替** — サイドバーでアカウント切替、全ページがアカウント別にフィルタ

### 分析
- **CV 計測** — コンバージョンポイント定義 → イベント記録 → レポート
- **アフィリエイト** — コード発行、クリック追跡、報酬計算
- **流入元追跡** — `/auth/line?ref=xxx` で友だち追加経路を自動記録

---

## 技術スタック

```
LINE Platform ──→ Cloudflare Workers (Hono) ──→ D1 (SQLite)
                         ↑                          ↑
                   Cron (5分毎)              42 テーブル
                         ↓
                  LINE Messaging API

Next.js 15 (管理画面) ──→ Workers API ──→ D1
LIFF (Vite) ──→ Workers API ──→ D1
TypeScript SDK ──→ Workers API ──→ D1
Claude Code ──→ Workers API ──→ D1
```

| レイヤー | 技術 |
|---------|------|
| API / Webhook | Cloudflare Workers + Hono |
| データベース | Cloudflare D1 (SQLite) — 51 テーブル |
| 管理画面 | Next.js 15 (App Router) + Tailwind CSS |
| LIFF | Vite + TypeScript |
| SDK | TypeScript (ESM + CJS, 41 テスト) |
| 定期実行 | Workers Cron Triggers (5分毎) |
| デプロイ | `pnpm deploy:setup` / `pnpm deploy:update` ウィザード |

**Cloudflare 無料枠で 5,000 友だちまで運用可能。サーバー代 0 円。**

---

## クイックスタート

> ⚠️ wrangler の設定ファイルは `apps/worker/wrangler.toml` にあります。リポジトリルートから wrangler を実行する場合は `-c apps/worker/wrangler.toml` を付けてください (本書のコマンドは原則ルート実行を想定)。

### 前提条件

- Node.js 20+, pnpm 9+
- [Cloudflare アカウント](https://dash.cloudflare.com/sign-up)
- [LINE Developers アカウント](https://developers.line.biz/)

### ⚡️ 自動セットアップ (推奨)

LINE チャネル情報（チャネル ID / シークレット / アクセストークン / LIFF ID 等）を準備の上、対話ウィザードを起動するだけで、D1 / R2 / シークレット / Worker / Web のデプロイまでまとめて自動実行されます。

```bash
git clone https://github.com/Shudesu/line-harness-oss.git
cd line-harness-oss
pnpm install
pnpm deploy:setup     # 対話ウィザード
```

ウィザードが行うこと:

1. Cloudflare 認証チェック (`wrangler login`)
2. アカウント選択
3. プロジェクト名 / LINE 認証情報 / LIFF ID の入力
4. D1 データベース作成 + 全マイグレーション適用 (`d1_migrations` で追跡)
5. R2 バケット作成 (`<project>-images`)
6. Workers シークレットを一括設定
7. Worker / 管理画面 (Next.js) のデプロイ
8. MCP 設定の生成

セットアップ後は `pnpm deploy:update` で再デプロイ + 未適用マイグレーションを安全に追加適用できます。

LINE チャネルの作成方法は次節を参照。チャネル作成済みの場合はそのまま `pnpm deploy:setup` を実行してください。手動で進めたい場合は以下の「手動セットアップ」セクションを参照。

---

### 1. セットアップ (手動)

```bash
git clone https://github.com/Shudesu/line-harness-oss.git
cd line-harness-oss
pnpm install
```

### 2. LINE チャネル設定

[LINE Developers Console](https://developers.line.biz/console/) で **同じプロバイダー配下** に 2 つのチャネルを作成:

1. **Messaging API チャネル** — メッセージ送受信用
2. **LINE Login チャネル** — UUID 自動取得用 (**必須**)

> ⚠️ LINE Login チャネルがないと `/auth/line` 経由の友だち追加で UUID が取れません。
> UUID がないとマルチアカウント統合・流入追跡が機能しません。
>
> ⚠️ LIFF の Bot link feature を使うには、Login チャネルと Messaging API チャネルが**同一プロバイダー配下**にある必要があります。

メモしておく値:
- Messaging API: **チャネル ID** / **チャネルシークレット** / **チャネルアクセストークン (長期)**
- LINE Login: **チャネル ID** / **チャネルシークレット**

### 3. Cloudflare アカウントの初期化

初回のみダッシュボードでの設定が必要です:

1. **Cloudflare アカウント ID を確認**
   ```bash
   npx wrangler login        # 未ログインなら最初に実行
   npx wrangler whoami       # 表示された Account ID をメモ
   ```
2. **R2 を有効化** — ダッシュボード ([https://dash.cloudflare.com](https://dash.cloudflare.com) → R2) で「Purchase R2 / Enable R2」をクリックして利用規約に同意 (無料枠あり)。R2 が有効でないと初回 deploy が失敗します。
3. **workers.dev サブドメインを登録** — ダッシュボード → Workers → onboarding 画面で好きなサブドメイン名を入力 (例: `your-name`)。これで Worker が `*.your-name.workers.dev` で公開可能になります。

### 4. wrangler.toml の作成

`apps/worker/wrangler.toml` は個人の `account_id` / `database_id` を含むためリポジトリでは追跡されません。テンプレートからコピーして編集します。

```bash
cp apps/worker/wrangler.toml.example apps/worker/wrangler.toml
```

コピーした `apps/worker/wrangler.toml` を開き、プレースホルダーを実値に置き換えます。

```toml
account_id = "YOUR_ACCOUNT_ID"                # ← 手順3でメモした Account ID

[[d1_databases]]
binding = "DB"                                # ← コードはこの名前を期待 (変更しない)
database_name = "line-crm"
database_id = "YOUR_D1_DATABASE_ID"           # ← 次手順で取得して書き戻す
migrations_dir = "../../packages/db/migrations"
```

### 5. D1 データベース作成 + スキーマ適用

```bash
# 1) リモート D1 を作成 → 出力された database_id を wrangler.toml に書き戻す
npx wrangler d1 create line-crm

# 2) 全マイグレーションをリモート D1 へ流す (wrangler 標準の d1 migrations apply)
pnpm db:migrate
```

> ℹ️ `d1_migrations` テーブルで適用済みが追跡されるため、何度実行しても未適用分のみが安全に流れます。適用状況は `pnpm db:migrate:status` で確認できます。

### 6. シークレット設定

```bash
cd apps/worker

npx wrangler secret put API_KEY                       # 任意の長いランダム文字列 (例: openssl rand -hex 32)
npx wrangler secret put LINE_CHANNEL_ID               # Messaging API チャネル ID
npx wrangler secret put LINE_CHANNEL_SECRET           # Messaging API チャネルシークレット
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN     # Messaging API 長期アクセストークン
npx wrangler secret put LINE_LOGIN_CHANNEL_ID         # LINE Login チャネル ID
npx wrangler secret put LINE_LOGIN_CHANNEL_SECRET     # LINE Login チャネルシークレット
npx wrangler secret put WORKER_URL                    # 例: https://line-harness.your-name.workers.dev
npx wrangler secret put LIFF_URL                      # 例: https://liff.line.me/2009961677-XXXXXXXX (手順 7 で発行)

cd ../..
```

> 💡 上記は最小構成です。Stripe や IG Harness 連携を使う場合のみ `STRIPE_WEBHOOK_SECRET`, `X_HARNESS_URL`, `IG_HARNESS_URL` 等を追加してください。

### 7. LIFF アプリ作成

LINE Developers Console → 手順2の **LINE Login チャネル** → 「LIFF」タブ → 「追加」:

- **エンドポイント URL**: `https://line-harness.your-name.workers.dev/` (Worker のルート。`/liff` のような独自パスは付けない)
- **サイズ**: Full
- **Scope**: `profile`, `openid`
- **Bot link feature**: `On (Aggressive)` に設定 → 紐付け先に Messaging API チャネルを選択

作成後に表示される **LIFF URL** (例: `https://liff.line.me/2009961677-XXXXXXXX`) と **LIFF ID** (URL の末尾部分) をメモします。

> ⚠️ Bot link を設定しないと、LIFF 起動時に `There is no login bot linked to this channel.` エラーになります。同一プロバイダー配下に Messaging API チャネルが存在することが前提です。
>
> ⚠️ メモした **LIFF URL** は手順6の `LIFF_URL` シークレットに、**LIFF ID** は次手順の `VITE_LIFF_ID` に使います。

### 8. デプロイ

LIFF ID をビルド時環境変数として埋め込んでデプロイします (LIFF SDK が URL クエリを書き換える仕様により、`?liffId=` 渡しは利用不可)。

```bash
VITE_LIFF_ID=2009961677-XXXXXXXX pnpm deploy:worker
# → https://line-harness.your-name.workers.dev
```

### 9. LINE Webhook 設定

LINE Developers Console → Messaging API チャネル → Webhook 設定:

- **Webhook URL**: `https://line-harness.your-name.workers.dev/webhook`
- **Webhook の利用**: ON
- 「検証」ボタンで 200 が返れば疎通 OK
- **応答メッセージ** / **あいさつメッセージ**: OFF 推奨 (Worker 側で制御するため)

### 10. 管理画面の起動

ローカル開発で起動する場合:

```bash
echo "NEXT_PUBLIC_API_URL=https://line-harness.your-name.workers.dev" > apps/web/.env.local
pnpm dev:web
# → http://localhost:3001
```

ログイン時は手順6で登録した `API_KEY` の値を入力します。

### 11. 動作確認

```bash
# 友だち追加URL (これを LP や SNS に貼る)
https://line-harness.your-name.workers.dev/auth/line?ref=test

# API 疎通確認
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://line-harness.your-name.workers.dev/api/friends/count
```

LINE 公式アカウントを友だち追加してメッセージを送り、D1 に記録されているか確認:

```bash
npx wrangler d1 execute line-crm -c apps/worker/wrangler.toml --remote \
  --command "SELECT id, type, text, created_at FROM messages ORDER BY created_at DESC LIMIT 5"
```

---

## プロジェクト構成

```
line-harness-oss/
├── apps/
│   ├── worker/           # Cloudflare Workers API (Hono)
│   ├── web/              # Next.js 15 管理画面
│   └── liff/             # LINE ミニアプリ (Vite)
├── packages/
│   ├── db/               # D1 スキーマ (migrations/) + クエリ (51テーブル)
│   ├── sdk/              # TypeScript SDK (41テスト)
│   ├── line-sdk/         # LINE Messaging API ラッパー
│   └── shared/           # 共有型定義
├── docs/
│   └── wiki/             # 全23ページのドキュメント
└── .github/
    └── ISSUE_TEMPLATE/   # Issue テンプレート
```

---

## API エンドポイント（抜粋）

25 のルートファイル、100+ エンドポイント。全一覧は [Wiki: API Reference](https://github.com/Shudesu/line-harness-oss/wiki/20-API-Reference) を参照。

```bash
# 友だち一覧
GET  /api/friends?limit=20&offset=0&tagId=xxx

# シナリオ作成
POST /api/scenarios
{ "name": "ウェルカム", "triggerType": "friend_add" }

# ステップ追加
POST /api/scenarios/:id/steps
{ "stepOrder": 0, "delayMinutes": 0, "messageType": "text", "messageContent": "ようこそ！" }

# ブロードキャスト予約
POST /api/broadcasts
{ "title": "セール", "messageType": "text", "messageContent": "50% OFF!", "targetType": "all", "scheduledAt": "2026-04-01T10:00:00+09:00" }

# 自動化ルール作成
POST /api/automations
{ "name": "友だち追加→ウェルカム", "eventType": "friend_add", "actions": [{"type": "add_tag", "params": {"tagId": "xxx"}}] }
```

---

## ドキュメント

**[📖 Wiki（全23ページ）](https://github.com/Shudesu/line-harness-oss/wiki)**

| カテゴリ | ページ |
|---------|--------|
| はじめに | [Home](https://github.com/Shudesu/line-harness-oss/wiki/Home) · [Getting Started](https://github.com/Shudesu/line-harness-oss/wiki/Getting-Started) · [Architecture](https://github.com/Shudesu/line-harness-oss/wiki/Architecture) · [Configuration](https://github.com/Shudesu/line-harness-oss/wiki/Configuration) |
| 配信 | [Scenarios](https://github.com/Shudesu/line-harness-oss/wiki/Scenarios) · [Broadcasts](https://github.com/Shudesu/line-harness-oss/wiki/Broadcasts) · [Reminders](https://github.com/Shudesu/line-harness-oss/wiki/12-Reminders) |
| CRM | [Friends](https://github.com/Shudesu/line-harness-oss/wiki/Friends) · [Tags](https://github.com/Shudesu/line-harness-oss/wiki/Tags) · [Scoring](https://github.com/Shudesu/line-harness-oss/wiki/13-Scoring) · [Chat](https://github.com/Shudesu/line-harness-oss/wiki/16-Chat-and-AutoReply) |
| マーケ | [Rich Menus](https://github.com/Shudesu/line-harness-oss/wiki/09-Rich-Menus) · [Tracked Links](https://github.com/Shudesu/line-harness-oss/wiki/10-Tracked-Links) · [Forms & LIFF](https://github.com/Shudesu/line-harness-oss/wiki/11-Forms-and-LIFF) · [CV & Affiliates](https://github.com/Shudesu/line-harness-oss/wiki/17-CV-Tracking-and-Affiliates) |
| 自動化 | [Automation](https://github.com/Shudesu/line-harness-oss/wiki/14-Automation) · [Webhooks](https://github.com/Shudesu/line-harness-oss/wiki/15-Webhooks-and-Notifications) |
| 安全性 | [Multi-Account & BAN](https://github.com/Shudesu/line-harness-oss/wiki/18-Multi-Account-and-BAN) |
| 開発 | [SDK Reference](https://github.com/Shudesu/line-harness-oss/wiki/19-SDK-Reference) · [API Reference](https://github.com/Shudesu/line-harness-oss/wiki/20-API-Reference) · [Deployment](https://github.com/Shudesu/line-harness-oss/wiki/21-Deployment) · [Operations](https://github.com/Shudesu/line-harness-oss/wiki/22-Operations) · [Claude Code](https://github.com/Shudesu/line-harness-oss/wiki/23-Claude-Code-Integration) |

---

## コスト

| 友だち数 | 月額コスト |
|----------|-----------|
| 〜5,000 | **無料**（Cloudflare 無料枠） |
| 〜10,000 | 約 $10/月（D1 + Workers 有料プラン） |
| 50,000+ | 約 $25/月 + Queues 推奨 |

L社: 月額 21,780円〜。LINE Harness: **0円〜。**

---

## ローカル開発

```bash
pnpm dev:worker    # → http://localhost:8787
pnpm dev:web       # → http://localhost:3001 (apps/web/.env.local が必要)

# ローカル D1 にスキーマ + 全マイグレーションを適用
pnpm db:migrate:local
```
---

## コントリビュート

Issue・PR 歓迎。[Wiki](https://github.com/Shudesu/line-harness-oss/wiki) を読んでからの参加を推奨。

</details>

## ライセンス

MIT
