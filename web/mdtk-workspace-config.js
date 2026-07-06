// Generated from src/ — edit TypeScript and run: npm run build

const MDTK_CONFIG_PATH = "/.mdtk/config.json";
let cachedMdtkConfig = null;
function normalizePluginIds(plugins) {
  if (!Array.isArray(plugins)) {
    return [];
  }
  return plugins.filter((id) => typeof id === "string" && id.trim().length > 0).map((id) => id.trim());
}
async function loadMdtkWorkspaceConfig(forceReload = false) {
  if (cachedMdtkConfig && !forceReload) {
    return cachedMdtkConfig;
  }
  try {
    const text = await read(MDTK_CONFIG_PATH);
    const parsed = JSON.parse(text);
    cachedMdtkConfig = parsed && typeof parsed === "object" ? parsed : {};
    if (cachedMdtkConfig.plugins) {
      cachedMdtkConfig.plugins = normalizePluginIds(cachedMdtkConfig.plugins);
    }
  } catch (err) {
    cachedMdtkConfig = {};
    log(
      "No readable .mdtk/config.json in workspace (plugins list unavailable from disk).",
      err && err.message ? err.message : err
    );
  }
  return cachedMdtkConfig;
}
function getWorkspacePath() {
  return (cachedMdtkConfig?.workspacePath || "").trim();
}
Object.assign(globalThis, {
  loadMdtkWorkspaceConfig,
  getWorkspacePath,
  MDTK_CONFIG_PATH
});
