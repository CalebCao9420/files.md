// Generated from src/ — edit TypeScript and run: npm run build

let launcherWorkspacePath = "";
let launcherPluginIds = [];
function getLauncherWorkspacePath() {
  return launcherWorkspacePath;
}
function getLauncherPlugins() {
  return launcherPluginIds.slice();
}
function isTauriHost() {
  return !!window.__TAURI__;
}
async function tauriInvoke(cmd, args) {
  const invoke = window.__TAURI__?.core?.invoke;
  if (!invoke) {
    throw new Error("Tauri invoke unavailable");
  }
  return invoke(cmd, args);
}
function applyAppShellMode(shell) {
  if (shell) {
    document.documentElement.classList.add("mdtk-app-shell");
  }
}
function removeWorkspaceHintBanner() {
  document.getElementById("mdtk-workspace-hint")?.remove();
}
function showWorkspaceHintBanner(path) {
  if (!path || sessionStorage.getItem("mdtkWorkspaceHintDismissed") === path) {
    return;
  }
  if (document.getElementById("mdtk-workspace-hint")) {
    return;
  }
  const banner = document.createElement("div");
  banner.id = "mdtk-workspace-hint";
  banner.className = "mdtk-workspace-hint";
  banner.innerHTML = '<span class="mdtk-workspace-hint-text">\u542F\u52A8\u5668\u6307\u5B9A\u6587\u4EF6\u5939\uFF1A<code></code></span><div class="mdtk-workspace-hint-actions"><button type="button" id="mdtk-workspace-hint-open">\u6253\u5F00\u6587\u4EF6\u5939</button><button type="button" id="mdtk-workspace-hint-dismiss">\u77E5\u9053\u4E86</button></div>';
  const code = banner.querySelector("code");
  if (code) {
    code.textContent = path;
  }
  const content = document.getElementById("content");
  if (content) {
    content.prepend(banner);
  } else {
    document.body.prepend(banner);
  }
  document.getElementById("mdtk-workspace-hint-open")?.addEventListener("click", () => {
    void openDir();
  });
  document.getElementById("mdtk-workspace-hint-dismiss")?.addEventListener("click", () => {
    sessionStorage.setItem("mdtkWorkspaceHintDismissed", path);
    removeWorkspaceHintBanner();
  });
}
async function loadLauncherHint() {
  try {
    const response = await fetch("/.launcher-hint.json?v=" + Date.now(), { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}
function readUrlLauncherParams() {
  const params = new URLSearchParams(window.location.search);
  const workspacePath = (params.get("workspace") || "").trim();
  const shell = params.get("shell") === "1" || params.get("app") === "1";
  if (!workspacePath && !shell) {
    return null;
  }
  return { workspacePath: workspacePath || void 0, shell };
}
function applyLauncherHint(hint) {
  if (hint?.shell) {
    applyAppShellMode(true);
  }
  const path = (hint?.workspacePath || "").trim();
  if (path) {
    launcherWorkspacePath = path;
  }
  if (hint?.plugins && Array.isArray(hint.plugins)) {
    launcherPluginIds = hint.plugins.filter((id) => typeof id === "string" && id.trim().length > 0).map((id) => id.trim());
  }
}
async function initTauriShell(hint) {
  if (!isTauriHost()) {
    return false;
  }
  applyAppShellMode(true);
  let path = (hint?.workspacePath || "").trim();
  if (!path) {
    try {
      const fromRust = await tauriInvoke("mdtk_get_workspace_path");
      path = (fromRust || "").trim();
    } catch {
    }
  }
  if (path) {
    launcherWorkspacePath = path;
  }
  if (hint?.plugins && Array.isArray(hint.plugins)) {
    launcherPluginIds = hint.plugins.filter((id) => typeof id === "string" && id.trim().length > 0).map((id) => id.trim());
  }
  log("Tauri shell \xB7 workspace:", path || "(none \u2014 restart with -Folder)");
  if (path) {
    launcherWorkspacePath = path;
    setTauriWorkspaceBound(true);
    removeWorkspaceHintBanner();
    showToast("\u5DF2\u7ED1\u5B9A\u5DE5\u4F5C\u533A\uFF1A" + path);
    return true;
  }
  showWorkspaceHintBanner("");
  return false;
}
async function initDesktopShell() {
  const fromUrl = readUrlLauncherParams();
  const fromFile = await loadLauncherHint();
  const hint = fromFile || fromUrl;
  if (isTauriHost()) {
    return initTauriShell(hint);
  }
  applyLauncherHint(hint);
  const path = getLauncherWorkspacePath();
  if (path) {
    showWorkspaceHintBanner(path);
  }
  return false;
}
Object.assign(globalThis, {
  initDesktopShell,
  getLauncherWorkspacePath,
  getLauncherPlugins,
  isTauriHost,
  tauriInvoke,
  removeWorkspaceHintBanner
});
