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

  initUpdateDownloadPanel();
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

type UpdateHudPayload =
  | { phase: 'start'; version?: string }
  | { phase: 'progress'; percent: number; message: string; total?: number | null; downloaded?: number }
  | { phase: 'installing'; version?: string }
  | { phase: 'done'; version?: string }
  | { phase: 'error'; message: string };

type UpdateHudController = {
  setProgress: (
    percent: number,
    message: string,
    opts?: { version?: string; indeterminate?: boolean; installing?: boolean },
  ) => void;
  showError: (message: string) => void;
};

let updateHudController: UpdateHudController | null = null;

function ensureUpdateDownloadHud(): UpdateHudController {
  if (updateHudController) {
    return updateHudController;
  }

  let overlay: HTMLElement | null = null;
  let barFill: HTMLElement | null = null;
  let statusEl: HTMLElement | null = null;
  let titleEl: HTMLElement | null = null;
  let subtitleEl: HTMLElement | null = null;
  let percentEl: HTMLElement | null = null;
  let actionsEl: HTMLElement | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const clearHideTimer = (): void => {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const ensureOverlay = (): void => {
    if (overlay) {
      return;
    }
    overlay = document.createElement('div');
    overlay.id = 'mdtk-update-overlay';
    overlay.className = 'mdtk-update-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="mdtk-update-panel" role="dialog" aria-labelledby="mdtk-update-title" aria-live="polite">' +
      '<div class="mdtk-update-header">' +
      '<h2 id="mdtk-update-title">软件更新</h2>' +
      '<p class="mdtk-update-subtitle"></p>' +
      '</div>' +
      '<p class="mdtk-update-status"></p>' +
      '<div class="mdtk-update-bar" aria-hidden="true"><div class="mdtk-update-bar-fill"></div></div>' +
      '<p class="mdtk-update-percent"></p>' +
      '<div class="mdtk-update-actions"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    statusEl = overlay.querySelector('.mdtk-update-status');
    barFill = overlay.querySelector('.mdtk-update-bar-fill');
    titleEl = overlay.querySelector('#mdtk-update-title');
    subtitleEl = overlay.querySelector('.mdtk-update-subtitle');
    percentEl = overlay.querySelector('.mdtk-update-percent');
    actionsEl = overlay.querySelector('.mdtk-update-actions');
  };

  const setActions = (html: string): void => {
    if (actionsEl) {
      actionsEl.innerHTML = html;
    }
  };

  const showOverlay = (): void => {
    ensureOverlay();
    if (!overlay) {
      return;
    }
    clearHideTimer();
    overlay.hidden = false;
    overlay.classList.remove('mdtk-update-overlay--error');
  };

  const hideOverlay = (): void => {
    clearHideTimer();
    if (overlay) {
      overlay.hidden = true;
      overlay.classList.remove(
        'mdtk-update-overlay--error',
        'mdtk-update-overlay--indeterminate',
        'mdtk-update-overlay--installing',
      );
    }
    setActions('');
  };

  const setProgress = (
    percent: number,
    message: string,
    opts?: { version?: string; indeterminate?: boolean; installing?: boolean },
  ): void => {
    showOverlay();
    if (titleEl) {
      titleEl.textContent = '软件更新';
    }
    if (subtitleEl) {
      subtitleEl.textContent = opts?.version ? `新版本 v${opts.version}` : '';
    }
    if (statusEl) {
      statusEl.textContent = message;
    }
    if (barFill) {
      barFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }
    if (percentEl) {
      percentEl.textContent =
        opts?.indeterminate || opts?.installing ? '' : percent > 0 ? `${percent}%` : '';
    }
    overlay?.classList.toggle('mdtk-update-overlay--indeterminate', !!opts?.indeterminate);
    overlay?.classList.toggle('mdtk-update-overlay--installing', !!opts?.installing);
    setActions('');
  };

  const showError = (message: string): void => {
    showOverlay();
    overlay?.classList.add('mdtk-update-overlay--error');
    overlay?.classList.remove('mdtk-update-overlay--indeterminate', 'mdtk-update-overlay--installing');
    if (titleEl) {
      titleEl.textContent = '更新失败';
    }
    if (subtitleEl) {
      subtitleEl.textContent = '';
    }
    if (statusEl) {
      statusEl.textContent = message;
    }
    if (barFill) {
      barFill.style.width = '0%';
    }
    if (percentEl) {
      percentEl.textContent = '';
    }
    setActions('<button type="button" class="mdtk-update-dismiss">关闭</button>');
    actionsEl?.querySelector('.mdtk-update-dismiss')?.addEventListener('click', hideOverlay, {
      once: true,
    });
    clearHideTimer();
    hideTimer = window.setTimeout(hideOverlay, 15000);
  };

  updateHudController = { setProgress, showError };
  return updateHudController;
}

function handleUpdateHudPayload(payload: UpdateHudPayload): void {
  const hud = ensureUpdateDownloadHud();
  switch (payload.phase) {
    case 'start':
      hud.setProgress(0, '准备下载…', { version: payload.version, indeterminate: true });
      break;
    case 'progress': {
      const indeterminate = !payload.total && payload.percent === 0;
      hud.setProgress(payload.percent ?? 0, payload.message || '正在下载…', { indeterminate });
      break;
    }
    case 'installing':
      hud.setProgress(100, '下载完成，正在安装…', { version: payload.version, installing: true });
      break;
    case 'done':
      hud.setProgress(100, '安装完成，正在重启…', { version: payload.version, installing: true });
      break;
    case 'error':
      hud.showError(payload.message || '未知错误');
      break;
    default:
      break;
  }
}

function __mdtkUpdateHud(payload: UpdateHudPayload): void {
  handleUpdateHudPayload(payload);
}

function initUpdateDownloadPanel(): void {
  ensureUpdateDownloadHud();

  type ListenFn = (
    event: string,
    handler: (event: { payload: unknown }) => void,
  ) => Promise<() => void>;
  const eventApi = (window as Window & { __TAURI__?: { event?: { listen?: ListenFn } } }).__TAURI__
    ?.event;
  if (!eventApi?.listen) {
    return;
  }

  const listen = eventApi.listen.bind(eventApi);

  void listen('update-download-start', (event) => {
    handleUpdateHudPayload({ phase: 'start', ...(event.payload as { version?: string }) });
  });
  void listen('update-download-progress', (event) => {
    const p = event.payload as {
      percent?: number;
      message?: string;
      total?: number | null;
    };
    handleUpdateHudPayload({
      phase: 'progress',
      percent: p.percent ?? 0,
      message: p.message || '正在下载…',
      total: p.total,
    });
  });
  void listen('update-download-installing', (event) => {
    handleUpdateHudPayload({
      phase: 'installing',
      ...(event.payload as { version?: string }),
    });
  });
  void listen('update-download-done', (event) => {
    handleUpdateHudPayload({ phase: 'done', ...(event.payload as { version?: string }) });
  });
  void listen('update-download-error', (event) => {
    handleUpdateHudPayload({
      phase: 'error',
      message: (event.payload as { message?: string }).message || '未知错误',
    });
  });
}

if (isTauriHost()) {
  ensureUpdateDownloadHud();
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
  __mdtkUpdateHud,
});
