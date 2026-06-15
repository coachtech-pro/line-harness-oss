export const scenarios = {
  success: true,
  data: {
    id: "scenario-1",
    name: "テストシナリオ",
    description: "テストシナリオの説明",
    triggerType: "friend_add",
    triggerTagId: null,
    lineAccountId: null,
    isActive: true,
    createdAt: "2026-06-15T10:05:03.315+09:00",
    updatedAt: "2026-06-15T10:05:29.504+09:00",
    steps: [
        {
            id: "step-1",
            scenarioId: "scenario-1",
            stepOrder: 1,
            delayMinutes: 0,
            messageType: "text",
            messageContent: "テストメッセージ",
            conditionType: null,
            conditionValue: null,
            nextStepOnFalse: null,
            createdAt: "2026-06-15T10:05:03.315+09:00",
        }
    ]
  },
};
