/// <reference path="../types/global.d.ts" />

let vcsKind: VcsKind = 'none';

function getVcsKind(): VcsKind {
  return vcsKind;
}

function isGitRepo(): boolean {
  return vcsKind === 'git';
}

async function detectVcsRepo(): Promise<VcsKind> {
  if (isMemFS) {
    vcsKind = 'none';
    return vcsKind;
  }
  try {
    if (typeof isTauriWorkspaceBound === 'function' && isTauriWorkspaceBound()) {
      if (await tauriPathIsDir('.git')) {
        vcsKind = 'git';
        return vcsKind;
      }
      if (await tauriPathIsDir('.svn')) {
        vcsKind = 'svn';
        return vcsKind;
      }
      vcsKind = 'none';
      return vcsKind;
    }

    const root = await getRootDirHandle();
    try {
      await root.getDirectoryHandle('.git');
      vcsKind = 'git';
      return vcsKind;
    } catch {
      // continue
    }
    try {
      await root.getDirectoryHandle('.svn');
      vcsKind = 'svn';
      return vcsKind;
    } catch {
      // continue
    }
  } catch {
    // no handle
  }
  vcsKind = 'none';
  return vcsKind;
}

Object.assign(globalThis, {
  detectVcsRepo,
  getVcsKind,
  isGitRepo,
});
