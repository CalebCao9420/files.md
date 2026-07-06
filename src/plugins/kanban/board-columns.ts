/// <reference path="../../types/global.d.ts" />

interface BoardColumnDef {
  id: string;
  label: string;
  /** 关联工单 status 时，匹配该状态的工单自动进入此列 */
  statusId: string | null;
  /** 锁定列：不可拖拽进出（状态关联的自动归位仍生效） */
  locked: boolean;
}

interface BoardColumnConfig {
  version: number;
  columns: BoardColumnDef[];
}

const BOARD_CONFIG_PATH = '/issues/ticket-board.json';

let boardColumnConfig: BoardColumnConfig | null = null;
let columnById = new Map<string, BoardColumnDef>();
let columnByStatusId = new Map<string, BoardColumnDef>();

function rebuildColumnIndexes(config: BoardColumnConfig): void {
  columnById = new Map();
  columnByStatusId = new Map();
  for (const column of config.columns) {
    columnById.set(column.id, column);
    if (column.statusId) {
      columnByStatusId.set(column.statusId, column);
    }
  }
}

function validateBoardColumnConfig(raw: unknown): BoardColumnConfig | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as BoardColumnConfig;
  if (!Array.isArray(obj.columns) || !obj.columns.length) {
    return null;
  }

  const columns: BoardColumnDef[] = [];
  const seenIds = new Set<string>();
  const seenStatusIds = new Set<string>();

  for (const item of obj.columns) {
    if (!item || typeof item.id !== 'string' || typeof item.label !== 'string') {
      continue;
    }
    const id = item.id.trim();
    const label = item.label.trim();
    if (!id || !label || seenIds.has(id)) {
      continue;
    }
    seenIds.add(id);

    let statusId: string | null = null;
    if (item.statusId != null && String(item.statusId).trim()) {
      const sid = String(item.statusId).trim();
      if (seenStatusIds.has(sid)) {
        continue;
      }
      seenStatusIds.add(sid);
      statusId = sid;
    }

    columns.push({
      id,
      label,
      statusId,
      locked: !!item.locked,
    });
  }

  if (!columns.length) {
    return null;
  }
  return { version: 1, columns };
}

function syncBoardColumnGlobals(config: BoardColumnConfig): void {
  boardColumnConfig = config;
  rebuildColumnIndexes(config);
}

function buildColumnsFromStatuses(statuses: TicketStatusDef[]): BoardColumnDef[] {
  return statuses.map((status) => ({
    id: 'col-' + status.id,
    label: status.label,
    statusId: status.id,
    locked: false,
  }));
}

function buildDefaultBoardConfig(): BoardColumnConfig {
  if (typeof buildKanbanDefaultBoardConfig === 'function' && !ticketStatusConfig) {
    return buildKanbanDefaultBoardConfig();
  }
  const statuses = getTicketStatuses();
  const linked = buildColumnsFromStatuses(statuses);
  return {
    version: 1,
    columns: [
      { id: 'col-inbox', label: '收件箱', statusId: null, locked: false },
      ...linked,
    ],
  };
}

async function loadBoardColumns(forceReload = false): Promise<BoardColumnConfig> {
  if (boardColumnConfig && !forceReload) {
    return boardColumnConfig;
  }

  try {
    const text = await read(BOARD_CONFIG_PATH);
    const parsed = validateBoardColumnConfig(JSON.parse(text));
    if (parsed) {
      syncBoardColumnGlobals(parsed);
      return parsed;
    }
  } catch {
    // fall through
  }

  await loadTicketStatuses();
  const fromStatuses = buildColumnsFromStatuses(getTicketStatuses());
  const fallback: BoardColumnConfig = { version: 1, columns: fromStatuses };
  syncBoardColumnGlobals(fallback);
  return fallback;
}

async function boardColumnConfigFileExists(): Promise<boolean> {
  try {
    return await exists(BOARD_CONFIG_PATH);
  } catch {
    return getMemFile(BOARD_CONFIG_PATH) !== null;
  }
}

async function ensureBoardColumnsFile(): Promise<BoardColumnConfig> {
  if (await boardColumnConfigFileExists()) {
    return loadBoardColumns(true);
  }
  await loadTicketStatuses();
  const seeded = buildDefaultBoardConfig();
  await writeBoardColumns(seeded);
  return seeded;
}

async function writeBoardColumns(config: BoardColumnConfig): Promise<void> {
  const validated = validateBoardColumnConfig(config);
  if (!validated) {
    throw new Error('看板列配置无效');
  }

  const body = JSON.stringify(validated, null, 2) + '\n';
  await write(BOARD_CONFIG_PATH, body);

  const handle = await getFileHandle(BOARD_CONFIG_PATH, true);
  addMemFile(BOARD_CONFIG_PATH, {
    isFile: true,
    content: body,
    lastModified: Date.now(),
    handle,
    path: BOARD_CONFIG_PATH,
    imageUrl: null,
  });

  syncBoardColumnGlobals(validated);
}

function getBoardColumns(): BoardColumnDef[] {
  return boardColumnConfig?.columns || [];
}

function getBoardColumn(id: string): BoardColumnDef | undefined {
  return columnById.get(id);
}

function getBoardColumnForStatus(statusId: string): BoardColumnDef | undefined {
  return columnByStatusId.get(statusId);
}

function isStatusAssociated(statusId: string): boolean {
  return columnByStatusId.has(statusId);
}

function makeColumnId(label: string, existingIds: Set<string>): string {
  let base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
  if (!base) {
    base = 'col-' + Date.now().toString(36);
  }
  if (!base.startsWith('col-')) {
    base = 'col-' + base;
  }
  let id = base;
  let n = 1;
  while (existingIds.has(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

Object.assign(globalThis, {
  TICKET_BOARD_PATH: BOARD_CONFIG_PATH,
  loadBoardColumns,
  ensureBoardColumnsFile,
  writeBoardColumns,
  getBoardColumns,
  getBoardColumn,
  getBoardColumnForStatus,
  isStatusAssociated,
  makeColumnId,
  buildColumnsFromStatuses,
});
