export const postChat = {
  content: "https://example.com/test.png",
  messageType: "image",
};

export const chats = {
  success: true,
  data: {
    id: "user-4",
    friendId: "user-4",
    friendName: "チャットしている人",
    status: "in_progress",
    lastMessageAt: "2026-06-02T11:30:22.444+09:00",
    createdAt: "2026-06-02T11:30:22.444+09:00",
    messages: [
        {
            id: "msg-1",
            direction: "outgoing",
            messageType: "text",
            content: "test",
            createdAt: "2026-06-02T11:30:22.444+09:00",
        }
    ],
  },
};
