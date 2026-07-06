/// <reference path="../../types/global.d.ts" />

interface TicketStatusDef {
  id: string;
  label: string;
}

interface TicketStatusConfig {
  version: number;
  defaultStatus: string;
  statuses: TicketStatusDef[];
}

const STATUS_CONFIG_PATH = '/issues/ticket-statuses.json';

/** 仅在首次生成配置文件时使用，运行期以磁盘上的 JSON 为准 */
const DEFAULT_TICKET_STATUS_CONFIG: TicketStatusConfig = JSON.parse(
  JSON.stringify(KANBAN_DEFAULT_STATUS_CONFIG)
);

let ticketStatusConfig: TicketStatusConfig | null = null;
let statusById = new Map<string, TicketStatusDef>();
let aliasToStatusId = new Map<string, string>();

function cloneDefaultConfig(): TicketStatusConfig {
  return JSON.parse(JSON.stringify(DEFAULT_TICKET_STATUS_CONFIG));
}

function rebuildStatusIndexes(config: TicketStatusConfig): void {
  statusById = new Map();
  aliasToStatusId = new Map();
  for (const status of config.statuses) {
    statusById.set(status.id, status);
    aliasToStatusId.set(status.id.toLowerCase(), status.id);
    aliasToStatusId.set(status.label.toLowerCase(), status.id);
  }
}

function validateTicketStatusConfig(raw: unknown): TicketStatusConfig | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as TicketStatusConfig;
  if (!Array.isArray(obj.statuses) || obj.statuses.length === 0) {
    return null;
  }
  const statuses: TicketStatusDef[] = [];
  const seen = new Set<string>();
  for (const item of obj.statuses) {
    if (!item || typeof item.id !== 'string' || typeof item.label !== 'string') {
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
  const defaultStatus =
    typeof obj.defaultStatus === 'string' && seen.has(obj.defaultStatus)
      ? obj.defaultStatus
      : statuses[0].id;
  return { version: 1, defaultStatus, statuses };
}

function syncTicketStatusGlobals(config: TicketStatusConfig): void {
  ticketStatusConfig = config;
  rebuildStatusIndexes(config);
}

async function loadTicketStatuses(forceReload = false): Promise<TicketStatusConfig> {
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
    // fall through to default seed
  }

  const seeded = cloneDefaultConfig();
  syncTicketStatusGlobals(seeded);
  return seeded;
}

async function ensureTicketStatusesFile(): Promise<TicketStatusConfig> {
  if (await ticketStatusConfigFileExists()) {
    return loadTicketStatuses(true);
  }
  const seeded = cloneDefaultConfig();
  await writeTicketStatuses(seeded);
  return seeded;
}

async function ticketStatusConfigFileExists(): Promise<boolean> {
  try {
    return await exists(STATUS_CONFIG_PATH);
  } catch {
    return getMemFile(STATUS_CONFIG_PATH) !== null;
  }
}

async function writeTicketStatuses(config: TicketStatusConfig): Promise<void> {
  const validated = validateTicketStatusConfig(config);
  if (!validated) {
    throw new Error('工单状态配置无效');
  }

  const body = JSON.stringify(validated, null, 2) + '\n';
  await write(STATUS_CONFIG_PATH, body);

  const handle = await getFileHandle(STATUS_CONFIG_PATH, true);
  addMemFile(STATUS_CONFIG_PATH, {
    isFile: true,
    content: body,
    lastModified: Date.now(),
    handle,
    path: STATUS_CONFIG_PATH,
    imageUrl: null,
  });

  syncTicketStatusGlobals(validated);
}

function getTicketStatuses(): TicketStatusDef[] {
  return ticketStatusConfig?.statuses || DEFAULT_TICKET_STATUS_CONFIG.statuses;
}

function getTicketStatus(id: string): TicketStatusDef | undefined {
  return statusById.get(id);
}

function getDefaultTicketStatusId(): string {
  return ticketStatusConfig?.defaultStatus || DEFAULT_TICKET_STATUS_CONFIG.defaultStatus;
}

function normalizeTicketStatus(raw: string | undefined | null): string {
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

function isConfiguredTicketStatus(statusId: string): boolean {
  return statusById.has(statusId);
}

function makeStatusId(label: string, existingIds: Set<string>): string {
  let base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
  if (!base) {
    base = 'status-' + Date.now().toString(36);
  }
  let id = base;
  let n = 1;
  while (existingIds.has(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

function normalizeWorkflowStatus(raw: string | undefined | null): string {
  return normalizeTicketStatus(raw);
}

function getWorkflowStatus(id: string): TicketStatusDef | undefined {
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
  DEFAULT_TICKET_STATUS_CONFIG,
});
