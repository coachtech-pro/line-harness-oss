export const reminders = {
  success: true,
  data: [
    {
      id: "reminder-1",
      name: "誕生日",
    },
    {
      id: "reminder-2",
      name: "予約日",
    },
  ],
};

export const friendReminders = {
  success: true,
  data: [
    {
      id: "friend-reminder-1",
      friendId: "friend-1",
      reminderId: "reminder-1",
      targetDate: "2026-06-02T11:00:00+09:00",
      status: "active",
    },
    {
      id: "friend-reminder-2",
      friendId: "friend-1",
      reminderId: "reminder-1",
      targetDate: "2026-06-01T11:00:00+09:00",
      status: "completed",
    },
    {
      id: "friend-reminder-3",
      friendId: "friend-1",
      reminderId: "reminder-1",
      targetDate: "2026-06-03T11:00:00+09:00",
      status: "cancelled",
    },
  ],
};

export const enrolledFriendReminder = {
  id: "friend-reminder-4",
  friendId: "friend-1",
  reminderId: "reminder-2",
  targetDate: "2026-06-21T00:00:00+09:00",
  status: "active",
};

export const friends = {
  success: true,
  data: {
    items: [
      {
        id: "friend-1",
        lineUserId: "line_user_id_1",
        displayName: "山田",
        pictureUrl: null,
        statusMessage: null,
        isFollowing: true,
        createdAt: "2026-03-21T10:30:00.000+09:00",
        updatedAt: "2026-03-21T10:30:00.000+09:00",
        tags: [],
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    hasNextPage: false,
  },
};
