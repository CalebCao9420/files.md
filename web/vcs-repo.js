// Generated from src/ — edit TypeScript and run: npm run build

let vcsKind = "none";
function getVcsKind() {
  return vcsKind;
}
function isGitRepo() {
  return vcsKind === "git";
}
async function detectVcsRepo() {
  if (isMemFS) {
    vcsKind = "none";
    return vcsKind;
  }
  try {
    if (typeof isTauriWorkspaceBound === "function" && isTauriWorkspaceBound()) {
      if (await tauriPathIsDir(".git")) {
        vcsKind = "git";
        return vcsKind;
      }
      if (await tauriPathIsDir(".svn")) {
        vcsKind = "svn";
        return vcsKind;
      }
      vcsKind = "none";
      return vcsKind;
    }
    const root = await getRootDirHandle();
    try {
      await root.getDirectoryHandle(".git");
      vcsKind = "git";
      return vcsKind;
    } catch {
    }
    try {
      await root.getDirectoryHandle(".svn");
      vcsKind = "svn";
      return vcsKind;
    } catch {
    }
  } catch {
  }
  vcsKind = "none";
  return vcsKind;
}
Object.assign(globalThis, {
  detectVcsRepo,
  getVcsKind,
  isGitRepo
});
