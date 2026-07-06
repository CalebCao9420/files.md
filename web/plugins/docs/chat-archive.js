// Generated from src/ — edit TypeScript and run: npm run build

const DOCS_ARCHIVE_TITLE_MAX = 100;
const DOCS_ARCHIVE_ICON = `
<svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 4h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" stroke-width="1.6" stroke-linejoin="round" fill="none"/>
  <path d="M14 4v4h4M8 13h8M8 17h5" stroke-width="1.6" stroke-linecap="round" fill="none"/>
</svg>`;
function docsDirExists() {
  return !!files["docs/"];
}
function buildDocFrontmatter(title, body) {
  const trimmed = body.trim();
  return [
    "---",
    `title: ${title}`,
    `date: ${todayIsoDate()}`,
    "tags:",
    "---",
    "",
    trimmed ? trimmed + "\n" : ""
  ].join("\n");
}
async function ensureDocsDirForChatArchive() {
  if (docsDirExists()) {
    return true;
  }
  const ok = confirm(
    "\u5C1A\u672A\u53D1\u73B0 docs/ \u76EE\u5F55\u3002\n\n\u662F\u5426\u73B0\u5728\u521B\u5EFA\u300C\u6807\u51C6\u9879\u76EE\u6587\u6863\u7ED3\u6784\u300D\uFF08\u542B docs/\uFF09\uFF1F"
  );
  if (!ok) {
    return false;
  }
  await scaffoldProjectDocs();
  files = await loadLocalFiles(await getRootDirHandle());
  return docsDirExists();
}
async function uniqueDocArchivePath(title) {
  const base = sanitizeFilename(title) || "untitled";
  const dirPath = "/docs";
  let filename = `${base}.md`;
  let num = 1;
  while (await exists(joinPath(dirPath, filename))) {
    filename = `${base} (${num}).md`;
    num += 1;
  }
  return joinPath(dirPath, filename);
}
async function writeChatMessageAsDoc(text) {
  const ready = await ensureDocsDirForChatArchive();
  if (!ready) {
    throw new Error("docs/ unavailable");
  }
  const [title, body] = extractHeaderAndBody(text, DOCS_ARCHIVE_TITLE_MAX);
  const path = await uniqueDocArchivePath(title);
  const content = buildDocFrontmatter(title, body);
  await write(path, content);
  return path;
}
function registerDocsChatArchive(api) {
  api.registerChatArchiveTarget({
    id: "docs-archive",
    label: "To Docs",
    order: 11,
    html: DOCS_ARCHIVE_ICON,
    isAvailable: () => true,
    archiveOne: writeChatMessageAsDoc
  });
}
Object.assign(globalThis, {
  registerDocsChatArchive
});
