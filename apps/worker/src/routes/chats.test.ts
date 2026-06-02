import { it, expect, vi } from 'vitest'

it('lineClient.pushMessageが正しく呼ばれる', async () => {
  const pushMessage = vi.fn()

  const lineClient = { pushMessage }

  const friend = {
    line_user_id: 'U123',
  }


  const body = {
    messageType: 'image',
    content: 'https://a.png',
  }

  async function sendMessage(lineClient: any, friend: any, body: any) {
    const messageType = body.messageType ?? 'text'

    if (messageType === 'image') {
      await lineClient.pushMessage(friend.line_user_id, [
        {
          type: 'image',
          originalContentUrl: body.content,
          previewImageUrl: body.content,
        },
      ])
    }
  }

  await sendMessage(lineClient, friend, body)

  expect(pushMessage).toHaveBeenCalledWith(
    'U123',
    [
      {
        type: 'image',
        originalContentUrl: 'https://a.png',
        previewImageUrl: 'https://a.png',
      },
    ]
  )
})