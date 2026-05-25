export const noChatFriends = {
    success: true,
    data: {
        items: [
            {
                id: "user-1",
                displayName: "フォローしている古い人",
                isFollowing: true,
                createdAt: "2026-03-21T10:30:00.000+09:00",
            },
            {
                id: "user-2",
                displayName: "フォローしている新しい人",
                isFollowing: true,
                createdAt: "2026-03-22T10:30:00.000+09:00",
            },
            {
                id: "user-3",
                displayName: "フォローしていない人",
                isFollowing: false,
                createdAt: "2026-03-22T10:30:00.000+09:00",
            },
        ],
    },
};

export const chatFriends = {
    success: true,
    data: [
        {
            id: "user-4",
            friendName: "チャットしている人",
            lastMessageAt: "2026-03-22T15:30:00.000",
            createdAt: "2026-03-21T10:30:00.000+09:00",
        },
    ],
};
