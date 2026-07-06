// Generated from src/ — edit TypeScript and run: npm run build

const APP_NAME = "MD Toolkit";
const APP_PORT = 8765;
const STORAGE_SCHEMA_VERSION = 1;
const LEGACY_STORAGE_KEYS = ["server", "lastServerOk", "apiUrl"];
function migrateLegacyStorage() {
  const versionKey = "mdToolkitStorageVersion";
  if (localStorage.getItem(versionKey) === String(STORAGE_SCHEMA_VERSION)) {
    return;
  }
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.setItem(versionKey, String(STORAGE_SCHEMA_VERSION));
  log("Migrated localStorage (removed legacy sync keys)");
}
function getToolkitHelpIntro() {
  return '# MD Toolkit\n\nLocal-first markdown workspace. Your notes stay as plain `.md` files on disk.\n\n## First steps\n\n1. Click **Open folder** and choose your notes or project docs directory.\n\n2. Check **Allow on every visit** (Chrome/Edge) so the app can save files.\n\n3. Press **Ctrl+Enter** to open **Chat** \u2014 quick capture for ideas and tasks.\n\n4. Optional: install as PWA from the browser menu (*Install MD Toolkit*).\n\n5. Optional plugins: add `.mdtk/config.json` in your workspace (see below).\n\nWithout a bound folder, data may live in browser storage only (not recommended).\n\n## Plugins\n\nEnable plugins with `.mdtk/config.json`:\n\n```json\n{\n  "plugins": ["docs", "kanban"]\n}\n```\n\n### Kanban (`issues/`)\n\n- **Ctrl+Shift+B** \u2014 open the ticket board\n- Toolbar: scaffold project docs, board/list toggle, column & status settings\n- Filter by assignee, tag, or priority; save named filter presets\n- **Chat archive**: **To Issues** (ticket frontmatter + status) or **To Docs** (plain doc in `docs/`)\n- Config files: `issues/ticket-statuses.json`, `issues/ticket-board.json`\n\n';
}
Object.assign(globalThis, {
  APP_NAME,
  APP_PORT,
  STORAGE_SCHEMA_VERSION,
  migrateLegacyStorage,
  getToolkitHelpIntro
});
