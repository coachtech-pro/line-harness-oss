export const tags = {
  success: true,
  data: [
    {
      id: "tag-1",
      name: "タグ1",
      color: "#000000",
    },
  ],
}

export const friends = {
  success: true,
  data: {
    items: [
      {
        id: "friend-1",
        lineUserId: "user1",
        displayName: "山田",
        pictureUrl: null,
        statusMessage: null,
        isFollowing: true,
        createdAt: "2026-03-22T10:30:00.000+09:00",
        updatedAt: "2026-03-22T10:30:00.000+09:00",
        tags: [],
      },
      {
        id: "friend-2",
        lineUserId: "user2",
        displayName: "佐藤",
        pictureUrl: null,
        statusMessage: null,
        isFollowing: true,
        createdAt: "2026-03-22T10:30:00.000+09:00",
        updatedAt: "2026-03-22T10:30:00.000+09:00",
        tags: [
          {
            id: "tag-1",
            name: "タグ1",
            color: "#000000",
          },
        ],
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
    hasNextPage: false,
  },
}
