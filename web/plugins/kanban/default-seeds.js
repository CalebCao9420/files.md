// Generated from src/ — edit TypeScript and run: npm run build

const KANBAN_DEFAULT_STATUSES = [
  { id: "pending-assign", label: "\u5F85\u5206\u914D" },
  { id: "assigned-waiting", label: "\u5DF2\u5206\u914D\u7B49\u5F85\u4E2D" },
  { id: "in-progress", label: "\u8FDB\u884C\u4E2D" },
  { id: "done-pending-review", label: "\u521D\u7248\u5B8C\u6210\u5F85\u9A8C\u6536" },
  { id: "reviewing", label: "\u9A8C\u6536\u4E2D" },
  { id: "review-done-pending-test", label: "\u9A8C\u6536\u5B8C\u6210\u5F85\u6D4B\u8BD5" },
  { id: "testing", label: "\u6D4B\u8BD5\u4E2D" },
  { id: "done", label: "\u9A8C\u6D4B\u5B8C\u6210" },
  { id: "requirement-rejected", label: "\u9700\u6C42\u9A73\u56DE" },
  { id: "review-failed", label: "\u9A8C\u6536\u4E0D\u901A\u8FC7" },
  { id: "test-failed", label: "\u6D4B\u8BD5\u4E0D\u901A\u8FC7" }
];
const KANBAN_DEFAULT_STATUS_CONFIG = {
  version: 1,
  defaultStatus: "pending-assign",
  statuses: KANBAN_DEFAULT_STATUSES
};
function buildKanbanDefaultBoardConfig() {
  return {
    version: 1,
    columns: [
      { id: "col-inbox", label: "\u6536\u4EF6\u7BB1", statusId: null, locked: false },
      ...KANBAN_DEFAULT_STATUSES.map((s) => ({
        id: "col-" + s.id,
        label: s.label,
        statusId: s.id,
        locked: false
      }))
    ]
  };
}
function getKanbanTicketStatusesSeedJson() {
  return JSON.stringify(KANBAN_DEFAULT_STATUS_CONFIG, null, 2) + "\n";
}
function getKanbanBoardSeedJson() {
  return JSON.stringify(buildKanbanDefaultBoardConfig(), null, 2) + "\n";
}
Object.assign(globalThis, {
  KANBAN_DEFAULT_STATUSES,
  KANBAN_DEFAULT_STATUS_CONFIG,
  buildKanbanDefaultBoardConfig,
  getKanbanTicketStatusesSeedJson,
  getKanbanBoardSeedJson
});
