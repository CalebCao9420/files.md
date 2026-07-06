// Generated from src/ — edit TypeScript and run: npm run build

const CHAT_ARCHIVE_TITLE_MAX = 100;
const ISSUES_ARCHIVE_ICON = `
<svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-width="1.6" fill="none"/>
  <path d="M9 12h6M9 16h4" stroke-width="1.6" stroke-linecap="round" fill="none"/>
</svg>`;
async function ensureIssuesDirForChatArchive() {
  if (kanbanDirExists()) {
    return true;
  }
  const ok = confirm(
    "\u5C1A\u672A\u53D1\u73B0 issues/ \u76EE\u5F55\u3002\n\n\u662F\u5426\u73B0\u5728\u521B\u5EFA\u300C\u6807\u51C6\u9879\u76EE\u6587\u6863\u7ED3\u6784\u300D\uFF08\u542B issues/\uFF09\uFF1F"
  );
  if (!ok) {
    return false;
  }
  await scaffoldProjectDocs();
  files = await loadLocalFiles(await getRootDirHandle());
  return kanbanDirExists();
}
async function uniqueIssuePath(title) {
  const base = sanitizeFilename(title) || "untitled";
  const dirPath = "/issues";
  let filename = `${base}.md`;
  let num = 1;
  while (await exists(joinPath(dirPath, filename))) {
    filename = `${base} (${num}).md`;
    num += 1;
  }
  return joinPath(dirPath, filename);
}
async function writeChatMessageAsIssue(text) {
  const ready = await ensureIssuesDirForChatArchive();
  if (!ready) {
    throw new Error("issues/ unavailable");
  }
  await ensureTicketStatusesFile();
  await ensureBoardColumnsFile();
  const [title, body] = extractHeaderAndBody(text, CHAT_ARCHIVE_TITLE_MAX);
  const path = await uniqueIssuePath(title);
  const defaultStatus = getDefaultTicketStatusId();
  let content = buildTaskFrontmatter(title, defaultStatus);
  content = setFrontmatterField(content, "title", title);
  if (body.trim()) {
    content = content.replace("## \u63CF\u8FF0\n\n\n", `## \u63CF\u8FF0

${body.trim()}

`);
  }
  await write(path, content);
  return path;
}
function registerKanbanChatArchive(api) {
  api.registerChatArchiveTarget({
    id: "kanban-issues",
    label: "To Issues",
    order: 12,
    html: ISSUES_ARCHIVE_ICON,
    isAvailable: () => true,
    archiveOne: writeChatMessageAsIssue
  });
}
Object.assign(globalThis, {
  registerKanbanChatArchive
});
