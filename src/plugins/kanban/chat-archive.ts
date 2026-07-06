/// <reference path="../../types/global.d.ts" />

const CHAT_ARCHIVE_TITLE_MAX = 100;

const ISSUES_ARCHIVE_ICON = `
<svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-width="1.6" fill="none"/>
  <path d="M9 12h6M9 16h4" stroke-width="1.6" stroke-linecap="round" fill="none"/>
</svg>`;

async function ensureIssuesDirForChatArchive(): Promise<boolean> {
  if (kanbanDirExists()) {
    return true;
  }
  const ok = confirm(
    '尚未发现 issues/ 目录。\n\n是否现在创建「标准项目文档结构」（含 issues/）？'
  );
  if (!ok) {
    return false;
  }
  await scaffoldProjectDocs();
  files = await loadLocalFiles(await getRootDirHandle());
  return kanbanDirExists();
}

async function uniqueIssuePath(title: string): Promise<string> {
  const base = sanitizeFilename(title) || 'untitled';
  const dirPath = '/issues';
  let filename = `${base}.md`;
  let num = 1;
  while (await exists(joinPath(dirPath, filename))) {
    filename = `${base} (${num}).md`;
    num += 1;
  }
  return joinPath(dirPath, filename);
}

async function writeChatMessageAsIssue(text: string): Promise<string> {
  const ready = await ensureIssuesDirForChatArchive();
  if (!ready) {
    throw new Error('issues/ unavailable');
  }

  await ensureTicketStatusesFile();
  await ensureBoardColumnsFile();

  const [title, body] = extractHeaderAndBody(text, CHAT_ARCHIVE_TITLE_MAX);
  const path = await uniqueIssuePath(title);
  const defaultStatus = getDefaultTicketStatusId();

  let content = buildTaskFrontmatter(title, defaultStatus);
  content = setFrontmatterField(content, 'title', title);
  if (body.trim()) {
    content = content.replace('## 描述\n\n\n', `## 描述\n\n${body.trim()}\n\n`);
  }

  await write(path, content);
  return path;
}

function registerKanbanChatArchive(api: PluginAPI): void {
  api.registerChatArchiveTarget({
    id: 'kanban-issues',
    label: 'To Issues',
    order: 12,
    html: ISSUES_ARCHIVE_ICON,
    isAvailable: () => true,
    archiveOne: writeChatMessageAsIssue,
  });
}

Object.assign(globalThis, {
  registerKanbanChatArchive,
});
