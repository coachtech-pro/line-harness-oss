export const reminderFriend = {
  success: true,
      data: {
        id: "reminder-1",
        name: "テストリマインダー",
        description: "説明",
        isActive: true,
        createdAt: "2025-10-13T00:00:00.000+09:00",
        updatedAt: "2025-10-13T00:00:00.000+09:00",
        steps: [],
        friends: [
          {
            id: "reminder-friend-1",
            friendId: "user-3",
            reminderId: "reminder-1",
            targetDate: "2026-01-01T10:00:00.000+09:00",
            status: "active",
          },
          {
            id: "reminder-friend-2",
            friendId: "user-4",
            reminderId: "reminder-1",
            targetDate: "2026-01-01T10:00:00.000+09:00",
            status: "completed",
          },
          {
            id: "reminder-friend-3",
            friendId: "user-2",
            reminderId: "reminder-1",
            targetDate: "2026-01-02T18:00:00.000+09:00",
            status: "active",
          },
          {
            id: "reminder-friend-4",
            friendId: "user-5",
            reminderId: "reminder-1",
            targetDate: "2026-01-01T10:00:00.000+09:00",
            status: "cancelled",
          }
        ],
      },
};