/// <reference path="../../types/global.d.ts" />

interface KanbanDefaultStatusDef {
  id: string;
  label: string;
}

const KANBAN_DEFAULT_STATUSES: KanbanDefaultStatusDef[] = [
  { id: 'pending-assign', label: '待分配' },
  { id: 'assigned-waiting', label: '已分配等待中' },
  { id: 'in-progress', label: '进行中' },
  { id: 'done-pending-review', label: '初版完成待验收' },
  { id: 'reviewing', label: '验收中' },
  { id: 'review-done-pending-test', label: '验收完成待测试' },
  { id: 'testing', label: '测试中' },
  { id: 'done', label: '验测完成' },
  { id: 'requirement-rejected', label: '需求驳回' },
  { id: 'review-failed', label: '验收不通过' },
  { id: 'test-failed', label: '测试不通过' },
];

const KANBAN_DEFAULT_STATUS_CONFIG: TicketStatusConfig = {
  version: 1,
  defaultStatus: 'pending-assign',
  statuses: KANBAN_DEFAULT_STATUSES,
};

function buildKanbanDefaultBoardConfig(): BoardColumnConfig {
  return {
    version: 1,
    columns: [
      { id: 'col-inbox', label: '收件箱', statusId: null, locked: false },
      ...KANBAN_DEFAULT_STATUSES.map((s) => ({
        id: 'col-' + s.id,
        label: s.label,
        statusId: s.id,
        locked: false,
      })),
    ],
  };
}

function getKanbanTicketStatusesSeedJson(): string {
  return JSON.stringify(KANBAN_DEFAULT_STATUS_CONFIG, null, 2) + '\n';
}

function getKanbanBoardSeedJson(): string {
  return JSON.stringify(buildKanbanDefaultBoardConfig(), null, 2) + '\n';
}

Object.assign(globalThis, {
  KANBAN_DEFAULT_STATUSES,
  KANBAN_DEFAULT_STATUS_CONFIG,
  buildKanbanDefaultBoardConfig,
  getKanbanTicketStatusesSeedJson,
  getKanbanBoardSeedJson,
});
