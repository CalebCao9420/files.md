// Generated from src/ — edit TypeScript and run: npm run build

const BOARD_CONFIG_PATH = "/issues/ticket-board.json";
let boardColumnConfig = null;
let columnById = /* @__PURE__ */ new Map();
let columnByStatusId = /* @__PURE__ */ new Map();
function rebuildColumnIndexes(config) {
  columnById = /* @__PURE__ */ new Map();
  columnByStatusId = /* @__PURE__ */ new Map();
  for (const column of config.columns) {
    columnById.set(column.id, column);
    if (column.statusId) {
      columnByStatusId.set(column.statusId, column);
    }
  }
}
function validateBoardColumnConfig(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const obj = raw;
  if (!Array.isArray(obj.columns) || !obj.columns.length) {
    return null;
  }
  const columns = [];
  const seenIds = /* @__PURE__ */ new Set();
  const seenStatusIds = /* @__PURE__ */ new Set();
  for (const item of obj.columns) {
    if (!item || typeof item.id !== "string" || typeof item.label !== "string") {
      continue;
    }
    const id = item.id.trim();
    const label = item.label.trim();
    if (!id || !label || seenIds.has(id)) {
      continue;
    }
    seenIds.add(id);
    let statusId = null;
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
      locked: !!item.locked
    });
  }
  if (!columns.length) {
    return null;
  }
  return { version: 1, columns };
}
function syncBoardColumnGlobals(config) {
  boardColumnConfig = config;
  rebuildColumnIndexes(config);
}
function buildColumnsFromStatuses(statuses) {
  return statuses.map((status) => ({
    id: "col-" + status.id,
    label: status.label,
    statusId: status.id,
    locked: false
  }));
}
function buildDefaultBoardConfig() {
  if (typeof buildKanbanDefaultBoardConfig === "function" && !ticketStatusConfig) {
    return buildKanbanDefaultBoardConfig();
  }
  const statuses = getTicketStatuses();
  const linked = buildColumnsFromStatuses(statuses);
  return {
    version: 1,
    columns: [
      { id: "col-inbox", label: "\u6536\u4EF6\u7BB1", statusId: null, locked: false },
      ...linked
    ]
  };
}
async function loadBoardColumns(forceReload = false) {
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
  }
  await loadTicketStatuses();
  const fromStatuses = buildColumnsFromStatuses(getTicketStatuses());
  const fallback = { version: 1, columns: fromStatuses };
  syncBoardColumnGlobals(fallback);
  return fallback;
}
async function boardColumnConfigFileExists() {
  try {
    return await exists(BOARD_CONFIG_PATH);
  } catch {
    return getMemFile(BOARD_CONFIG_PATH) !== null;
  }
}
async function ensureBoardColumnsFile() {
  if (await boardColumnConfigFileExists()) {
    return loadBoardColumns(true);
  }
  await loadTicketStatuses();
  const seeded = buildDefaultBoardConfig();
  await writeBoardColumns(seeded);
  return seeded;
}
async function writeBoardColumns(config) {
  const validated = validateBoardColumnConfig(config);
  if (!validated) {
    throw new Error("\u770B\u677F\u5217\u914D\u7F6E\u65E0\u6548");
  }
  const body = JSON.stringify(validated, null, 2) + "\n";
  await write(BOARD_CONFIG_PATH, body);
  const handle = await getFileHandle(BOARD_CONFIG_PATH, true);
  addMemFile(BOARD_CONFIG_PATH, {
    isFile: true,
    content: body,
    lastModified: Date.now(),
    handle,
    path: BOARD_CONFIG_PATH,
    imageUrl: null
  });
  syncBoardColumnGlobals(validated);
}
function getBoardColumns() {
  return boardColumnConfig?.columns || [];
}
function getBoardColumn(id) {
  return columnById.get(id);
}
function getBoardColumnForStatus(statusId) {
  return columnByStatusId.get(statusId);
}
function isStatusAssociated(statusId) {
  return columnByStatusId.has(statusId);
}
function makeColumnId(label, existingIds) {
  let base = label.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
  if (!base) {
    base = "col-" + Date.now().toString(36);
  }
  if (!base.startsWith("col-")) {
    base = "col-" + base;
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
  buildColumnsFromStatuses
});
