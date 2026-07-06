/// <reference path="../types/global.d.ts" />

type ScaffoldKind = 'standard' | 'docs-only';

interface ScaffoldItem {
  kind: 'dir' | 'file';
  path: string;
  content?: string;
}

function trimPathPrefix(path: string, prefix: string): string {
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

function docsReadme(): string {
  return [
    '# 项目文档',
    '',
    '设计说明、API、决策记录等放在本目录。',
    '',
    '## 建议结构',
    '',
    '- `design/` — 设计与架构',
    '- 其他专题文档 — 直接在本目录新建 `.md`',
    '',
  ].join('\n');
}

function designReadme(): string {
  return [
    '# 设计文档',
    '',
    '架构图、模块划分、接口约定等。',
    '',
  ].join('\n');
}

function issuesReadme(): string {
  return [
    '# Issues / 工单',
    '',
    '本目录 `.md` 为工单；在 **工单看板**（`Ctrl+Shift+B`）中浏览与管理。',
    '',
    '## 看板列（`ticket-board.json`）',
    '',
    '在工单看板点 **列设置**：',
    '',
    '- **关联状态**的列：工单 `status` 匹配时自动进入该列',
    '- **不关联**的列：可自由拖拽，位置写入 frontmatter `boardColumn`',
    '- **锁定**列：不可拖拽进出（状态自动归位仍生效）',
    '',
    '## 工单状态（`ticket-statuses.json`）',
    '',
    '在工单看板点 **状态设置**，或编辑 JSON：',
    '',
    '```json',
    '{',
    '  "defaultStatus": "pending-assign",',
    '  "statuses": [',
    '    { "id": "pending-assign", "label": "待分配" },',
    '    { "id": "in-progress", "label": "进行中" }',
    '  ]',
    '}',
    '```',
    '',
    '工单 frontmatter 的 `status:` 填 **id** 或 **label** 均可。',
    '',
    '## 单条工单示例',
    '',
    '```yaml',
    'status: pending-assign',
    'title: 示例工单',
    'boardColumn: col-inbox',
    'assignee: alice',
    'priority: medium',
    'tags: feature',
    'date: ' + todayIsoDate(),
    '---',
    '```',
    '',
  ].join('\n');
}

function ticketBoardSeedJson(): string {
  return getKanbanBoardSeedJson();
}

function ticketStatusesSeedJson(): string {
  return getKanbanTicketStatusesSeedJson();
}

function changelogBody(): string {
  return [
    '# Changelog',
    '',
    '## Unreleased',
    '',
    '### Added',
    '',
    '- ',
    '',
  ].join('\n');
}

function getScaffoldItems(kind: ScaffoldKind): ScaffoldItem[] {
  const items: ScaffoldItem[] = [
    { kind: 'dir', path: '/docs' },
    { kind: 'dir', path: '/docs/design' },
    { kind: 'file', path: '/docs/README.md', content: docsReadme() },
    { kind: 'file', path: '/docs/design/README.md', content: designReadme() },
  ];

  if (kind === 'standard') {
    items.push(
      { kind: 'dir', path: '/issues' },
      { kind: 'file', path: '/issues/ticket-statuses.json', content: ticketStatusesSeedJson() },
      { kind: 'file', path: '/issues/ticket-board.json', content: ticketBoardSeedJson() },
      { kind: 'file', path: '/issues/README.md', content: issuesReadme() },
      { kind: 'dir', path: '/changelog' },
      { kind: 'file', path: '/changelog/CHANGELOG.md', content: changelogBody() }
    );
  }

  return items;
}

function dirExistsInTree(dirPath: string): boolean {
  const parts = trimPathPrefix(dirPath, '/').split('/').filter(Boolean);
  if (!parts.length) {
    return true;
  }
  let cur: Record<string, unknown> = files;
  for (const part of parts) {
    const key = part + '/';
    const entry = cur[key];
    if (!entry || typeof entry !== 'object' || (entry as { isFile?: boolean }).isFile) {
      return false;
    }
    cur = entry as Record<string, unknown>;
  }
  return true;
}

function fileExistsInTree(filePath: string): boolean {
  return getMemFile(filePath) !== null;
}

async function fileExistsOnDisk(filePath: string): Promise<boolean> {
  try {
    return await exists(filePath);
  } catch {
    return fileExistsInTree(filePath);
  }
}

async function dirExistsOnDisk(dirPath: string): Promise<boolean> {
  const parts = trimPathPrefix(dirPath, '/').split('/').filter(Boolean);
  if (!parts.length) {
    return true;
  }
  try {
    let dirHandle = await getRootDirHandle();
    for (const seg of parts) {
      dirHandle = await dirHandle.getDirectoryHandle(seg);
    }
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      return false;
    }
    throw err;
  }
}

async function scaffoldItemExists(item: ScaffoldItem): Promise<boolean> {
  if (item.kind === 'dir') {
    return dirExistsInTree(item.path) || (await dirExistsOnDisk(item.path));
  }
  return (await fileExistsOnDisk(item.path)) || fileExistsInTree(item.path);
}

async function syncScaffoldFileInTree(filePath: string, content: string): Promise<void> {
  const handle = await getFileHandle(filePath, true);
  addMemFile(filePath, {
    isFile: true,
    content,
    lastModified: 0,
    handle,
    path: filePath,
    imageUrl: null,
  });
}

async function ensureScaffoldDir(dirPath: string): Promise<'created' | 'skipped'> {
  const inTree = dirExistsInTree(dirPath);
  const onDisk = await dirExistsOnDisk(dirPath);
  if (inTree && onDisk) {
    return 'skipped';
  }
  await createDir(dirPath);
  return 'created';
}

async function ensureScaffoldFile(filePath: string, content: string): Promise<'created' | 'skipped'> {
  const inTree = fileExistsInTree(filePath);
  const onDisk = await fileExistsOnDisk(filePath);
  if (inTree && onDisk) {
    return 'skipped';
  }
  if (onDisk && !inTree) {
    await syncScaffoldFileInTree(filePath, content);
    return 'skipped';
  }
  await write(filePath, content);
  await syncScaffoldFileInTree(filePath, content);
  return 'created';
}

async function applyProjectScaffold(kind: ScaffoldKind): Promise<{ created: number; skipped: number }> {
  const items = getScaffoldItems(kind);
  let created = 0;
  let skipped = 0;

  for (const item of items) {
    if (item.kind === 'dir') {
      const result = await ensureScaffoldDir(item.path);
      if (result === 'created') {
        created++;
      } else {
        skipped++;
      }
      continue;
    }
    const result = await ensureScaffoldFile(item.path, item.content || '');
    if (result === 'created') {
      created++;
    } else {
      skipped++;
    }
  }

  return { created, skipped };
}

class ProjectScaffoldModal {
  modal: HTMLElement | null;
  options: HTMLElement | null;
  resolve: ((value: ScaffoldKind | null) => void) | null = null;
  focusedIndex = 0;
  ignoreOutsideClickUntil = 0;

  constructor() {
    this.modal = document.getElementById('project-scaffold');
    this.options = document.getElementById('project-scaffold-options');
    if (!this.modal || !this.options) {
      logError('Project scaffold modal elements missing');
    }
    this.init();
  }

  armOutsideClickGuard(ms = 400): void {
    this.ignoreOutsideClickUntil = Date.now() + ms;
  }

  init(): void {
    if (!this.modal || !this.options) {
      return;
    }

    this.options.querySelectorAll('li').forEach((item, index) => {
      item.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        this.choose(item.getAttribute('data-scaffold') as ScaffoldKind | null);
      });
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.choose(item.getAttribute('data-scaffold') as ScaffoldKind | null);
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.focusedIndex = (index + 1) % this.options!.children.length;
          this.updateFocusedItem();
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          this.focusedIndex =
            (index - 1 + this.options!.children.length) % this.options!.children.length;
          this.updateFocusedItem();
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (!this.modal || this.modal.style.display === 'none') {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.cancel();
      }
    });

    document.addEventListener('click', (event) => {
      if (!this.modal || this.modal.style.display === 'none') {
        return;
      }
      if (Date.now() < this.ignoreOutsideClickUntil) {
        return;
      }
      if (!this.modal.contains(event.target as Node)) {
        this.cancel();
      }
    });
  }

  pick(): Promise<ScaffoldKind | null> {
    return new Promise((resolve) => {
      if (!this.modal) {
        resolve(null);
        return;
      }
      this.resolve = resolve;
      this.focusedIndex = 0;
      this.updateFocusedItem();
      this.armOutsideClickGuard();
      setTimeout(() => {
        this.modal!.style.display = 'flex';
        this.modal!.style.position = 'fixed';
        this.modal!.style.top = '28%';
        this.modal!.style.left = '50%';
        this.modal!.style.transform = 'translate(-50%, 0)';
        this.modal!.style.zIndex = '10001';
        (this.options!.children[this.focusedIndex] as HTMLElement | undefined)?.focus();
      }, 0);
    });
  }

  choose(kind: ScaffoldKind | null): void {
    if (!kind) {
      return;
    }
    this.armOutsideClickGuard();
    this.close();
    if (this.resolve) {
      this.resolve(kind);
      this.resolve = null;
    }
  }

  cancel(): void {
    this.close();
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }

  close(): void {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  updateFocusedItem(): void {
    const items = this.options!.querySelectorAll('li');
    items.forEach((item, index) => {
      item.classList.toggle('focused', index === this.focusedIndex);
      if (index === this.focusedIndex) {
        (item as HTMLElement).focus();
      }
    });
  }
}

let projectScaffoldModal: ProjectScaffoldModal | null = null;

function getProjectScaffoldModal(): ProjectScaffoldModal {
  if (!projectScaffoldModal) {
    projectScaffoldModal = new ProjectScaffoldModal();
  }
  return projectScaffoldModal;
}

async function scaffoldProjectDocs(): Promise<void> {
  const modal = getProjectScaffoldModal();
  modal.armOutsideClickGuard();
  const kind = await modal.pick();
  if (!kind) {
    return;
  }

  const items = getScaffoldItems(kind);
  const pending: ScaffoldItem[] = [];
  for (const item of items) {
    if (!(await scaffoldItemExists(item))) {
      pending.push(item);
    }
  }

  if (!pending.length) {
    alert('所选项目文档结构已存在，无需重复创建。');
    return;
  }

  try {
    const { created, skipped } = await applyProjectScaffold(kind);
    renderSidebar('docs');
    const msg =
      created > 0
        ? `已创建 ${created} 项` + (skipped > 0 ? `，跳过 ${skipped} 项已存在` : '')
        : '没有新建项（均已存在）';
    showToast(msg);
    log(
      'Project scaffold:',
      kind,
      msg,
      'dirs:',
      Object.keys(files).filter((k) => k.endsWith('/'))
    );

    if (fileExistsInTree('/docs/README.md') || (await fileExistsOnDisk('/docs/README.md'))) {
      await openFile('/docs/README.md');
    }
  } catch (err) {
    logError('scaffoldProjectDocs failed', err);
    alert('创建项目文档结构失败: ' + (err && (err as Error).message ? (err as Error).message : err));
  }
}

Object.assign(globalThis, {
  scaffoldProjectDocs,
  getProjectScaffoldModal,
});
