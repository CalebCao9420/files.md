/// <reference path="../types/global.d.ts" />

interface LauncherHint {
  workspacePath?: string;
  shell?: boolean;
  /** Plugin folder names under web/plugins/, from .mdtk/config.json (launcher reads disk). */
  plugins?: string[];
  at?: string;
}

let launcherWorkspacePath = '';
let launcherPluginIds: string[] = [];

function getLauncherWorkspacePath(): string {
  return launcherWorkspacePath;
}

function getLauncherPlugins(): string[] {
  return launcherPluginIds.slice();
}

function isTauriHost(): boolean {
  return !!(window as Window & { __TAURI__?: unknown }).__TAURI__;
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  type InvokeFn = (command: string, payload?: Record<string, unknown>) => Promise<unknown>;
  const invoke = (window as Window & { __TAURI__?: { core?: { invoke?: InvokeFn } } }).__TAURI__?.core
    ?.invoke;
  if (!invoke) {
    throw new Error('Tauri invoke unavailable');
  }
  return invoke(cmd, args) as Promise<T>;
}

function applyAppShellMode(shell: boolean): void {
  if (shell) {
    document.documentElement.classList.add('mdtk-app-shell');
  }
}

function removeWorkspaceHintBanner(): void {
  document.getElementById('mdtk-workspace-hint')?.remove();
}

function showWorkspaceHintBanner(path: string): void {
  if (!path || sessionStorage.getItem('mdtkWorkspaceHintDismissed') === path) {
    return;
  }
  if (document.getElementById('mdtk-workspace-hint')) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'mdtk-workspace-hint';
  banner.className = 'mdtk-workspace-hint';
  banner.innerHTML =
    '<span class="mdtk-workspace-hint-text">启动器指定文件夹：<code></code></span>' +
    '<div class="mdtk-workspace-hint-actions">' +
    '<button type="button" id="mdtk-workspace-hint-open">打开文件夹</button>' +
    '<button type="button" id="mdtk-workspace-hint-dismiss">知道了</button>' +
    '</div>';

  const code = banner.querySelector('code');
  if (code) {
    code.textContent = path;
  }

  const content = document.getElementById('content');
  if (content) {
    content.prepend(banner);
  } else {
    document.body.prepend(banner);
  }

  document.getElementById('mdtk-workspace-hint-open')?.addEventListener('click', () => {
    void openDir();
  });
  document.getElementById('mdtk-workspace-hint-dismiss')?.addEventListener('click', () => {
    sessionStorage.setItem('mdtkWorkspaceHintDismissed', path);
    removeWorkspaceHintBanner();
  });
}

async function loadLauncherHint(): Promise<LauncherHint | null> {
  try {
    const response = await fetch('/.launcher-hint.json?v=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as LauncherHint;
  } catch {
    return null;
  }
}

function readUrlLauncherParams(): LauncherHint | null {
  const params = new URLSearchParams(window.location.search);
  const workspacePath = (params.get('workspace') || '').trim();
  const shell = params.get('shell') === '1' || params.get('app') === '1';
  if (!workspacePath && !shell) {
    return null;
  }
  return { workspacePath: workspacePath || undefined, shell };
}

function applyLauncherHint(hint: LauncherHint | null): void {
  if (hint?.shell) {
    applyAppShellMode(true);
  }

  const path = (hint?.workspacePath || '').trim();
  if (path) {
    launcherWorkspacePath = path;
  }

  if (hint?.plugins && Array.isArray(hint.plugins)) {
    launcherPluginIds = hint.plugins
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id) => id.trim());
  }
}

async function initTauriShell(hint: LauncherHint | null): Promise<boolean> {
  if (!isTauriHost()) {
    return false;
  }

  applyAppShellMode(true);

  let path = (hint?.workspacePath || '').trim();
  if (!path) {
    try {
      const fromRust = await tauriInvoke<string | null>('mdtk_get_workspace_path');
      path = (fromRust || '').trim();
    } catch {
      // MDTK_WORKSPACE not set in Rust
    }
  }

  if (path) {
    launcherWorkspacePath = path;
  }

  if (hint?.plugins && Array.isArray(hint.plugins)) {
    launcherPluginIds = hint.plugins
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id) => id.trim());
  }

  log('Tauri shell · workspace:', path || '(none — restart with -Folder)');

  if (path) {
    launcherWorkspacePath = path;
    setTauriWorkspaceBound(true);
    removeWorkspaceHintBanner();
    showToast('已绑定工作区：' + path);
    return true;
  }

  showWorkspaceHintBanner('');
  return false;
}

async function initDesktopShell(): Promise<boolean> {
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
  removeWorkspaceHintBanner,
});
