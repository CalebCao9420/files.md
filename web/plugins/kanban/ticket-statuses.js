// Generated from src/ — edit TypeScript and run: npm run build

const STATUS_CONFIG_PATH = "/issues/ticket-statuses.json";
const DEFAULT_TICKET_STATUS_CONFIG = JSON.parse(
  JSON.stringify(KANBAN_DEFAULT_STATUS_CONFIG)
);
let ticketStatusConfig = null;
let statusById = /* @__PURE__ */ new Map();
let aliasToStatusId = /* @__PURE__ */ new Map();
function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_TICKET_STATUS_CONFIG));
}
function rebuildStatusIndexes(config) {
  statusById = /* @__PURE__ */ new Map();
  aliasToStatusId = /* @__PURE__ */ new Map();
  for (const status of config.statuses) {
    statusById.set(status.id, status);
    aliasToStatusId.set(status.id.toLowerCase(), status.id);
    aliasToStatusId.set(status.label.toLowerCase(), status.id);
  }
}
function validateTicketStatusConfig(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const obj = raw;
  if (!Array.isArray(obj.statuses) || obj.statuses.length === 0) {
    return null;
  }
  const statuses = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of obj.statuses) {
    if (!item || typeof item.id !== "string" || typeof item.label !== "string") {
      continue;
    }
    const id = item.id.trim();
    const label = item.label.trim();
    if (!id || !label || seen.has(id)) {
      continue;
    }
    seen.add(id);
    statuses.push({ id, label });
  }
  if (!statuses.length) {
    return null;
  }
  const defaultStatus = typeof obj.defaultStatus === "string" && seen.has(obj.defaultStatus) ? obj.defaultStatus : statuses[0].id;
  return { version: 1, defaultStatus, statuses };
}
function syncTicketStatusGlobals(config) {
  ticketStatusConfig = config;
  rebuildStatusIndexes(config);
}
async function loadTicketStatuses(forceReload = false) {
  if (ticketStatusConfig && !forceReload) {
    return ticketStatusConfig;
  }
  try {
    const text = await read(STATUS_CONFIG_PATH);
    const parsed = validateTicketStatusConfig(JSON.parse(text));
    if (parsed) {
      syncTicketStatusGlobals(parsed);
      return parsed;
    }
  } catch {
  }
  const seeded = cloneDefaultConfig();
  syncTicketStatusGlobals(seeded);
  return seeded;
}
async function ensureTicketStatusesFile() {
  if (await ticketStatusConfigFileExists()) {
    return loadTicketStatuses(true);
  }
  const seeded = cloneDefaultConfig();
  await writeTicketStatuses(seeded);
  return seeded;
}
async function ticketStatusConfigFileExists() {
  try {
    return await exists(STATUS_CONFIG_PATH);
  } catch {
    return getMemFile(STATUS_CONFIG_PATH) !== null;
  }
}
async function writeTicketStatuses(config) {
  const validated = validateTicketStatusConfig(config);
  if (!validated) {
    throw new Error("\u5DE5\u5355\u72B6\u6001\u914D\u7F6E\u65E0\u6548");
  }
  const body = JSON.stringify(validated, null, 2) + "\n";
  await write(STATUS_CONFIG_PATH, body);
  const handle = await getFileHandle(STATUS_CONFIG_PATH, true);
  addMemFile(STATUS_CONFIG_PATH, {
    isFile: true,
    content: body,
    lastModified: Date.now(),
    handle,
    path: STATUS_CONFIG_PATH,
    imageUrl: null
  });
  syncTicketStatusGlobals(validated);
}
function getTicketStatuses() {
  return ticketStatusConfig?.statuses || DEFAULT_TICKET_STATUS_CONFIG.statuses;
}
function getTicketStatus(id) {
  return statusById.get(id);
}
function getDefaultTicketStatusId() {
  return ticketStatusConfig?.defaultStatus || DEFAULT_TICKET_STATUS_CONFIG.defaultStatus;
}
function normalizeTicketStatus(raw) {
  if (!raw || !String(raw).trim()) {
    return getDefaultTicketStatusId();
  }
  const key = String(raw).trim().toLowerCase();
  const known = aliasToStatusId.get(key);
  if (known) {
    return known;
  }
  return String(raw).trim();
}
function isConfiguredTicketStatus(statusId) {
  return statusById.has(statusId);
}
function makeStatusId(label, existingIds) {
  let base = label.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
  if (!base) {
    base = "status-" + Date.now().toString(36);
  }
  let id = base;
  let n = 1;
  while (existingIds.has(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}
function normalizeWorkflowStatus(raw) {
  return normalizeTicketStatus(raw);
}
function getWorkflowStatus(id) {
  return getTicketStatus(id);
}
Object.assign(globalThis, {
  TICKET_STATUSES_PATH: STATUS_CONFIG_PATH,
  loadTicketStatuses,
  ensureTicketStatusesFile,
  writeTicketStatuses,
  getTicketStatuses,
  getTicketStatus,
  getDefaultTicketStatusId,
  normalizeTicketStatus,
  normalizeWorkflowStatus,
  getWorkflowStatus,
  isConfiguredTicketStatus,
  makeStatusId,
  DEFAULT_TICKET_STATUS_CONFIG
});
