// Generated from src/ — edit TypeScript and run: npm run build

function trimPathPrefix(path, prefix) {
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}
function docsReadme() {
  return [
    "# \u9879\u76EE\u6587\u6863",
    "",
    "\u8BBE\u8BA1\u8BF4\u660E\u3001API\u3001\u51B3\u7B56\u8BB0\u5F55\u7B49\u653E\u5728\u672C\u76EE\u5F55\u3002",
    "",
    "## \u5EFA\u8BAE\u7ED3\u6784",
    "",
    "- `design/` \u2014 \u8BBE\u8BA1\u4E0E\u67B6\u6784",
    "- \u5176\u4ED6\u4E13\u9898\u6587\u6863 \u2014 \u76F4\u63A5\u5728\u672C\u76EE\u5F55\u65B0\u5EFA `.md`",
    ""
  ].join("\n");
}
function designReadme() {
  return [
    "# \u8BBE\u8BA1\u6587\u6863",
    "",
    "\u67B6\u6784\u56FE\u3001\u6A21\u5757\u5212\u5206\u3001\u63A5\u53E3\u7EA6\u5B9A\u7B49\u3002",
    ""
  ].join("\n");
}
function issuesReadme() {
  return [
    "# Issues / \u5DE5\u5355",
    "",
    "\u672C\u76EE\u5F55 `.md` \u4E3A\u5DE5\u5355\uFF1B\u5728 **\u5DE5\u5355\u770B\u677F**\uFF08`Ctrl+Shift+B`\uFF09\u4E2D\u6D4F\u89C8\u4E0E\u7BA1\u7406\u3002",
    "",
    "## \u770B\u677F\u5217\uFF08`ticket-board.json`\uFF09",
    "",
    "\u5728\u5DE5\u5355\u770B\u677F\u70B9 **\u5217\u8BBE\u7F6E**\uFF1A",
    "",
    "- **\u5173\u8054\u72B6\u6001**\u7684\u5217\uFF1A\u5DE5\u5355 `status` \u5339\u914D\u65F6\u81EA\u52A8\u8FDB\u5165\u8BE5\u5217",
    "- **\u4E0D\u5173\u8054**\u7684\u5217\uFF1A\u53EF\u81EA\u7531\u62D6\u62FD\uFF0C\u4F4D\u7F6E\u5199\u5165 frontmatter `boardColumn`",
    "- **\u9501\u5B9A**\u5217\uFF1A\u4E0D\u53EF\u62D6\u62FD\u8FDB\u51FA\uFF08\u72B6\u6001\u81EA\u52A8\u5F52\u4F4D\u4ECD\u751F\u6548\uFF09",
    "",
    "## \u5DE5\u5355\u72B6\u6001\uFF08`ticket-statuses.json`\uFF09",
    "",
    "\u5728\u5DE5\u5355\u770B\u677F\u70B9 **\u72B6\u6001\u8BBE\u7F6E**\uFF0C\u6216\u7F16\u8F91 JSON\uFF1A",
    "",
    "```json",
    "{",
    '  "defaultStatus": "pending-assign",',
    '  "statuses": [',
    '    { "id": "pending-assign", "label": "\u5F85\u5206\u914D" },',
    '    { "id": "in-progress", "label": "\u8FDB\u884C\u4E2D" }',
    "  ]",
    "}",
    "```",
    "",
    "\u5DE5\u5355 frontmatter \u7684 `status:` \u586B **id** \u6216 **label** \u5747\u53EF\u3002",
    "",
    "## \u5355\u6761\u5DE5\u5355\u793A\u4F8B",
    "",
    "```yaml",
    "status: pending-assign",
    "title: \u793A\u4F8B\u5DE5\u5355",
    "boardColumn: col-inbox",
    "assignee: alice",
    "priority: medium",
    "tags: feature",
    "date: " + todayIsoDate(),
    "---",
    "```",
    ""
  ].join("\n");
}
function ticketBoardSeedJson() {
  return getKanbanBoardSeedJson();
}
function ticketStatusesSeedJson() {
  return getKanbanTicketStatusesSeedJson();
}
function changelogBody() {
  return [
    "# Changelog",
    "",
    "## Unreleased",
    "",
    "### Added",
    "",
    "- ",
    ""
  ].join("\n");
}
function getScaffoldItems(kind) {
  const items = [
    { kind: "dir", path: "/docs" },
    { kind: "dir", path: "/docs/design" },
    { kind: "file", path: "/docs/README.md", content: docsReadme() },
    { kind: "file", path: "/docs/design/README.md", content: designReadme() }
  ];
  if (kind === "standard") {
    items.push(
      { kind: "dir", path: "/issues" },
      { kind: "file", path: "/issues/ticket-statuses.json", content: ticketStatusesSeedJson() },
      { kind: "file", path: "/issues/ticket-board.json", content: ticketBoardSeedJson() },
      { kind: "file", path: "/issues/README.md", content: issuesReadme() },
      { kind: "dir", path: "/changelog" },
      { kind: "file", path: "/changelog/CHANGELOG.md", content: changelogBody() }
    );
  }
  return items;
}
function dirExistsInTree(dirPath) {
  const parts = trimPathPrefix(dirPath, "/").split("/").filter(Boolean);
  if (!parts.length) {
    return true;
  }
  let cur = files;
  for (const part of parts) {
    const key = part + "/";
    const entry = cur[key];
    if (!entry || typeof entry !== "object" || entry.isFile) {
      return false;
    }
    cur = entry;
  }
  return true;
}
function fileExistsInTree(filePath) {
  return getMemFile(filePath) !== null;
}
async function fileExistsOnDisk(filePath) {
  try {
    return await exists(filePath);
  } catch {
    return fileExistsInTree(filePath);
  }
}
async function dirExistsOnDisk(dirPath) {
  const parts = trimPathPrefix(dirPath, "/").split("/").filter(Boolean);
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
    if (err instanceof DOMException && err.name === "NotFoundError") {
      return false;
    }
    throw err;
  }
}
async function scaffoldItemExists(item) {
  if (item.kind === "dir") {
    return dirExistsInTree(item.path) || await dirExistsOnDisk(item.path);
  }
  return await fileExistsOnDisk(item.path) || fileExistsInTree(item.path);
}
async function syncScaffoldFileInTree(filePath, content) {
  const handle = await getFileHandle(filePath, true);
  addMemFile(filePath, {
    isFile: true,
    content,
    lastModified: 0,
    handle,
    path: filePath,
    imageUrl: null
  });
}
async function ensureScaffoldDir(dirPath) {
  const inTree = dirExistsInTree(dirPath);
  const onDisk = await dirExistsOnDisk(dirPath);
  if (inTree && onDisk) {
    return "skipped";
  }
  await createDir(dirPath);
  return "created";
}
async function ensureScaffoldFile(filePath, content) {
  const inTree = fileExistsInTree(filePath);
  const onDisk = await fileExistsOnDisk(filePath);
  if (inTree && onDisk) {
    return "skipped";
  }
  if (onDisk && !inTree) {
    await syncScaffoldFileInTree(filePath, content);
    return "skipped";
  }
  await write(filePath, content);
  await syncScaffoldFileInTree(filePath, content);
  return "created";
}
async function applyProjectScaffold(kind) {
  const items = getScaffoldItems(kind);
  let created = 0;
  let skipped = 0;
  for (const item of items) {
    if (item.kind === "dir") {
      const result2 = await ensureScaffoldDir(item.path);
      if (result2 === "created") {
        created++;
      } else {
        skipped++;
      }
      continue;
    }
    const result = await ensureScaffoldFile(item.path, item.content || "");
    if (result === "created") {
      created++;
    } else {
      skipped++;
    }
  }
  return { created, skipped };
}
class ProjectScaffoldModal {
  constructor() {
    this.resolve = null;
    this.focusedIndex = 0;
    this.ignoreOutsideClickUntil = 0;
    this.modal = document.getElementById("project-scaffold");
    this.options = document.getElementById("project-scaffold-options");
    if (!this.modal || !this.options) {
      logError("Project scaffold modal elements missing");
    }
    this.init();
  }
  armOutsideClickGuard(ms = 400) {
    this.ignoreOutsideClickUntil = Date.now() + ms;
  }
  init() {
    if (!this.modal || !this.options) {
      return;
    }
    this.options.querySelectorAll("li").forEach((item, index) => {
      item.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        this.choose(item.getAttribute("data-scaffold"));
      });
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.choose(item.getAttribute("data-scaffold"));
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          this.focusedIndex = (index + 1) % this.options.children.length;
          this.updateFocusedItem();
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          this.focusedIndex = (index - 1 + this.options.children.length) % this.options.children.length;
          this.updateFocusedItem();
        }
      });
    });
    document.addEventListener("keydown", (event) => {
      if (!this.modal || this.modal.style.display === "none") {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.cancel();
      }
    });
    document.addEventListener("click", (event) => {
      if (!this.modal || this.modal.style.display === "none") {
        return;
      }
      if (Date.now() < this.ignoreOutsideClickUntil) {
        return;
      }
      if (!this.modal.contains(event.target)) {
        this.cancel();
      }
    });
  }
  pick() {
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
        this.modal.style.display = "flex";
        this.modal.style.position = "fixed";
        this.modal.style.top = "28%";
        this.modal.style.left = "50%";
        this.modal.style.transform = "translate(-50%, 0)";
        this.modal.style.zIndex = "10001";
        this.options.children[this.focusedIndex]?.focus();
      }, 0);
    });
  }
  choose(kind) {
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
  cancel() {
    this.close();
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }
  close() {
    if (this.modal) {
      this.modal.style.display = "none";
    }
  }
  updateFocusedItem() {
    const items = this.options.querySelectorAll("li");
    items.forEach((item, index) => {
      item.classList.toggle("focused", index === this.focusedIndex);
      if (index === this.focusedIndex) {
        item.focus();
      }
    });
  }
}
let projectScaffoldModal = null;
function getProjectScaffoldModal() {
  if (!projectScaffoldModal) {
    projectScaffoldModal = new ProjectScaffoldModal();
  }
  return projectScaffoldModal;
}
async function scaffoldProjectDocs() {
  const modal = getProjectScaffoldModal();
  modal.armOutsideClickGuard();
  const kind = await modal.pick();
  if (!kind) {
    return;
  }
  const items = getScaffoldItems(kind);
  const pending = [];
  for (const item of items) {
    if (!await scaffoldItemExists(item)) {
      pending.push(item);
    }
  }
  if (!pending.length) {
    alert("\u6240\u9009\u9879\u76EE\u6587\u6863\u7ED3\u6784\u5DF2\u5B58\u5728\uFF0C\u65E0\u9700\u91CD\u590D\u521B\u5EFA\u3002");
    return;
  }
  try {
    const { created, skipped } = await applyProjectScaffold(kind);
    renderSidebar("docs");
    const msg = created > 0 ? `\u5DF2\u521B\u5EFA ${created} \u9879` + (skipped > 0 ? `\uFF0C\u8DF3\u8FC7 ${skipped} \u9879\u5DF2\u5B58\u5728` : "") : "\u6CA1\u6709\u65B0\u5EFA\u9879\uFF08\u5747\u5DF2\u5B58\u5728\uFF09";
    showToast(msg);
    log(
      "Project scaffold:",
      kind,
      msg,
      "dirs:",
      Object.keys(files).filter((k) => k.endsWith("/"))
    );
    if (fileExistsInTree("/docs/README.md") || await fileExistsOnDisk("/docs/README.md")) {
      await openFile("/docs/README.md");
    }
  } catch (err) {
    logError("scaffoldProjectDocs failed", err);
    alert("\u521B\u5EFA\u9879\u76EE\u6587\u6863\u7ED3\u6784\u5931\u8D25: " + (err && err.message ? err.message : err));
  }
}
Object.assign(globalThis, {
  scaffoldProjectDocs,
  getProjectScaffoldModal
});
