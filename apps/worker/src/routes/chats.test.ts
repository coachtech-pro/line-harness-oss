import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// LINE SDK をモックして pushMessage の呼び出しを検証する
const pushMessage = vi.fn();
const pushTextMessage = vi.fn();
const pushFlexMessage = vi.fn();

vi.mock('@line-crm/line-sdk', () => ({
  LineClient: vi.fn().mockImplementation(() => ({
    pushMessage,
    pushTextMessage,
    pushFlexMessage,
  })),
}));

// DB アクセス層をモック。getChatById が既存チャットを返すので
// resolveOrCreateChat は friend 検索・INSERT を経由しない。
vi.mock('@line-crm/db', () => ({
  getChatById: vi.fn(async () => ({ id: 'chat-1', friend_id: 'friend-1' })),
  getFriendById: vi.fn(async () => ({
    id: 'friend-1',
    line_user_id: 'U123',
    line_account_id: null,
  })),
  getLineAccountById: vi.fn(async () => null),
  updateChat: vi.fn(async () => {}),
  jstNow: () => '2026-06-14T00:00:00+09:00',
  // chats.ts が import する他の named export（未使用だが存在が必要）
  getOperators: vi.fn(),
  getOperatorById: vi.fn(),
  createOperator: vi.fn(),
  updateOperator: vi.fn(),
  deleteOperator: vi.fn(),
  getChats: vi.fn(),
  createChat: vi.fn(),
}));

// messages_log への INSERT 用の最小 D1 スタブ
function makeEnv() {
  const run = vi.fn(async () => ({}));
  const bind = vi.fn(() => ({ run }));
  const prepare = vi.fn(() => ({ bind }));
  return {
    DB: { prepare } as unknown,
    LINE_CHANNEL_ACCESS_TOKEN: 'default-token',
  };
}

async function callSend(body: unknown) {
  const { chats } = await import('./chats.js');
  const app = new Hono();
  app.route('/', chats);
  const env = makeEnv();
  const res = await app.request(
    '/api/chats/chat-1/send',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    env,
  );
  return res;
}

describe('POST /api/chats/:id/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('messageType=image で lineClient.pushMessage が image 形式で呼ばれる', async () => {
    const res = await callSend({ messageType: 'image', content: 'https://a.png' });

    expect(res.status).toBe(200);
    expect(pushMessage).toHaveBeenCalledWith('U123', [
      {
        type: 'image',
        originalContentUrl: 'https://a.png',
        previewImageUrl: 'https://a.png',
      },
    ]);
  });

  it('messageType=text では pushTextMessage が呼ばれる', async () => {
    const res = await callSend({ messageType: 'text', content: 'hello' });

    expect(res.status).toBe(200);
    expect(pushTextMessage).toHaveBeenCalledWith('U123', 'hello');
    expect(pushMessage).not.toHaveBeenCalled();
  });

  it('未対応の messageType は 400 を返す', async () => {
    const res = await callSend({ messageType: 'video', content: 'https://a.mp4' });

    expect(res.status).toBe(400);
    expect(pushMessage).not.toHaveBeenCalled();
  });

  it('content が空なら 400 を返す', async () => {
    const res = await callSend({ messageType: 'image', content: '' });

    expect(res.status).toBe(400);
  });
});
