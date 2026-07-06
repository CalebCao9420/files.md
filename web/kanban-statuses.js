// Generated from src/ — edit TypeScript and run: npm run build

var WORKFLOW_STATUSES = [
  {
    id: "pending-assign",
    label: "\u5F85\u5206\u914D",
    short: "a",
    tone: "neutral",
    aliases: ["\u5F85\u5206\u914D", "pending-assign", "pending", "todo", "a"]
  },
  {
    id: "assigned-waiting",
    label: "\u5DF2\u5206\u914D\u7B49\u5F85\u4E2D",
    short: "b",
    tone: "neutral",
    aliases: ["\u5DF2\u5206\u914D\u7B49\u5F85\u4E2D", "assigned-waiting", "assigned", "waiting", "b"]
  },
  {
    id: "in-progress",
    label: "\u8FDB\u884C\u4E2D",
    short: "c",
    tone: "active",
    aliases: ["\u8FDB\u884C\u4E2D", "in-progress", "doing", "progress", "c"]
  },
  {
    id: "done-pending-review",
    label: "\u521D\u7248\u5B8C\u6210\u5F85\u9A8C\u6536",
    short: "d",
    tone: "review",
    aliases: ["\u521D\u7248\u5B8C\u6210\u5F85\u9A8C\u6536", "done-pending-review", "pending-review", "d"]
  },
  {
    id: "reviewing",
    label: "\u9A8C\u6536\u4E2D",
    short: "e",
    tone: "review",
    aliases: ["\u9A8C\u6536\u4E2D", "reviewing", "review", "e"]
  },
  {
    id: "review-done-pending-test",
    label: "\u9A8C\u6536\u5B8C\u6210\u5F85\u6D4B\u8BD5",
    short: "f",
    tone: "review",
    aliases: ["\u9A8C\u6536\u5B8C\u6210\u5F85\u6D4B\u8BD5", "review-done-pending-test", "pending-test", "f"]
  },
  {
    id: "testing",
    label: "\u6D4B\u8BD5\u4E2D",
    short: "g",
    tone: "review",
    aliases: ["\u6D4B\u8BD5\u4E2D", "testing", "test", "g"]
  },
  {
    id: "done",
    label: "\u9A8C\u6D4B\u5B8C\u6210",
    short: "h",
    tone: "done",
    aliases: ["\u9A8C\u6D4B\u5B8C\u6210", "done", "completed", "complete", "h"]
  },
  {
    id: "requirement-rejected",
    label: "\u9700\u6C42\u9A73\u56DE",
    short: "j",
    tone: "blocked",
    aliases: ["\u9700\u6C42\u9A73\u56DE", "requirement-rejected", "rejected", "j"]
  },
  {
    id: "review-failed",
    label: "\u9A8C\u6536\u4E0D\u901A\u8FC7",
    short: "k",
    tone: "blocked",
    aliases: ["\u9A8C\u6536\u4E0D\u901A\u8FC7", "review-failed", "review-rejected", "k"]
  },
  {
    id: "test-failed",
    label: "\u6D4B\u8BD5\u4E0D\u901A\u8FC7",
    short: "l",
    tone: "blocked",
    aliases: ["\u6D4B\u8BD5\u4E0D\u901A\u8FC7", "test-failed", "test-rejected", "l"]
  }
];
var WORKFLOW_GROUPS = [
  {
    id: "intake",
    label: "\u5F85\u529E / \u5206\u914D",
    tone: "neutral",
    statusIds: ["pending-assign", "assigned-waiting"]
  },
  {
    id: "working",
    label: "\u6267\u884C\u4E2D",
    tone: "active",
    statusIds: ["in-progress"]
  },
  {
    id: "review-test",
    label: "\u9A8C\u6536 \xB7 \u6D4B\u8BD5",
    tone: "review",
    statusIds: [
      "done-pending-review",
      "reviewing",
      "review-done-pending-test",
      "testing"
    ]
  },
  {
    id: "complete",
    label: "\u5DF2\u5B8C\u6210",
    tone: "done",
    statusIds: ["done"]
  },
  {
    id: "blocked",
    label: "\u9A73\u56DE / \u4E0D\u901A\u8FC7",
    tone: "blocked",
    statusIds: ["requirement-rejected", "review-failed", "test-failed"]
  }
];
const GROUP_BY_STATUS = /* @__PURE__ */ new Map();
for (const group of WORKFLOW_GROUPS) {
  for (const statusId of group.statusIds) {
    GROUP_BY_STATUS.set(statusId, group);
  }
}
const STATUS_BY_ID = new Map(WORKFLOW_STATUSES.map((s) => [s.id, s]));
const ALIAS_TO_ID = /* @__PURE__ */ new Map();
for (const status of WORKFLOW_STATUSES) {
  ALIAS_TO_ID.set(status.id.toLowerCase(), status.id);
  ALIAS_TO_ID.set(status.label.toLowerCase(), status.id);
  ALIAS_TO_ID.set(status.short.toLowerCase(), status.id);
  for (const alias of status.aliases) {
    ALIAS_TO_ID.set(alias.toLowerCase(), status.id);
  }
}
function getWorkflowGroupForStatus(statusId) {
  return GROUP_BY_STATUS.get(statusId);
}
function getWorkflowStatus(id) {
  return STATUS_BY_ID.get(id);
}
function normalizeWorkflowStatus(raw) {
  if (!raw || !String(raw).trim()) {
    return "pending-assign";
  }
  const key = String(raw).trim().toLowerCase();
  return ALIAS_TO_ID.get(key) || "pending-assign";
}
Object.assign(globalThis, {
  WORKFLOW_STATUSES,
  WORKFLOW_GROUPS,
  getWorkflowStatus,
  getWorkflowGroupForStatus,
  normalizeWorkflowStatus
});
