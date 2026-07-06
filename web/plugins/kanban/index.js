// Generated from src/ — edit TypeScript and run: npm run build

function injectKanbanDom(mount) {
  if (document.getElementById("kanban-container")) {
    return;
  }
  mount.insertAdjacentHTML(
    "beforeend",
    `
    <div id="kanban-container" style="display: none">
        <header class="kanban-header">
            <h1>\u5DE5\u5355\u770B\u677F \xB7 issues/</h1>
            <div class="kanban-header-actions">
                <button type="button" id="kanban-toggle-layout" aria-pressed="false">\u5217\u8868\u89C6\u56FE</button>
                <button type="button" id="kanban-edit-columns">\u5217\u8BBE\u7F6E</button>
                <button type="button" id="kanban-edit-statuses">\u72B6\u6001\u8BBE\u7F6E</button>
                <button type="button" id="kanban-new-task">\u65B0\u5EFA\u5DE5\u5355</button>
                <button type="button" id="kanban-refresh">\u5237\u65B0</button>
                <button type="button" id="kanban-close">\u8FD4\u56DE\u7F16\u8F91</button>
            </div>
        </header>
        <div id="kanban-filters" class="kanban-filters">
            <label class="kanban-filter-field">
                <span>\u8D1F\u8D23\u4EBA</span>
                <select id="kanban-filter-assignee"><option value="">\u5168\u90E8\u8D1F\u8D23\u4EBA</option></select>
            </label>
            <label class="kanban-filter-field">
                <span>\u6807\u7B7E</span>
                <input id="kanban-filter-tag" type="text" placeholder="tag" list="kanban-tag-suggestions" autocomplete="off">
                <datalist id="kanban-tag-suggestions"></datalist>
            </label>
            <label class="kanban-filter-field">
                <span>\u4F18\u5148\u7EA7</span>
                <select id="kanban-filter-priority"><option value="">\u5168\u90E8\u4F18\u5148\u7EA7</option></select>
            </label>
            <button type="button" id="kanban-filter-clear">\u6E05\u9664\u7B5B\u9009</button>
            <label class="kanban-filter-field">
                <span>\u9884\u8BBE</span>
                <select id="kanban-filter-preset"><option value="">\u7B5B\u9009\u9884\u8BBE</option></select>
            </label>
            <button type="button" id="kanban-filter-save">\u4FDD\u5B58\u7B5B\u9009</button>
            <button type="button" id="kanban-filter-delete-preset" title="\u5220\u9664\u6240\u9009\u9884\u8BBE">\u5220</button>
            <span id="kanban-filter-summary" class="kanban-filter-summary"></span>
        </div>
        <div id="ticket-board" class="ticket-board"></div>
        <div id="ticket-list" class="ticket-list" style="display: none"></div>
    </div>
    `
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="ticket-board-config" style="display: none" role="dialog" aria-labelledby="ticket-board-config-title">
        <div class="ticket-status-config-panel ticket-board-config-panel">
            <h2 id="ticket-board-config-title">\u770B\u677F\u5217</h2>
            <p class="ticket-status-config-hint">\u5217\u987A\u5E8F\u5373\u770B\u677F\u4ECE\u5DE6\u5230\u53F3\u3002\u53EF\u5173\u8054\u5DE5\u5355\u72B6\u6001\uFF08\u81EA\u52A8\u5F52\u4F4D\uFF09\uFF0C\u6216\u4E0D\u5173\u8054\uFF08\u624B\u52A8\u62D6\u62FD\uFF0C\u5199\u5165 <code>boardColumn</code>\uFF09\u3002\u9501\u5B9A\u5217\u4E0D\u53EF\u62D6\u62FD\u8FDB\u51FA\u3002\u4FDD\u5B58\u5230 <code>issues/ticket-board.json</code>\u3002</p>
            <ul id="ticket-board-editor-list"></ul>
            <div class="ticket-status-config-actions">
                <button type="button" id="ticket-board-add">\u6DFB\u52A0\u5217</button>
                <button type="button" id="ticket-board-save">\u4FDD\u5B58</button>
                <button type="button" id="ticket-board-cancel">\u53D6\u6D88</button>
            </div>
        </div>
    </div>
    <div id="ticket-status-config" style="display: none" role="dialog" aria-labelledby="ticket-status-config-title">
        <div class="ticket-status-config-panel">
            <h2 id="ticket-status-config-title">\u5DE5\u5355\u72B6\u6001</h2>
            <p class="ticket-status-config-hint">\u5DE5\u5355 frontmatter \u7684 <code>status:</code> \u53EF\u9009\u503C\u3002\u4FDD\u5B58\u5230 <code>issues/ticket-statuses.json</code>\u3002</p>
            <ul id="ticket-status-editor-list"></ul>
            <div class="ticket-status-config-actions">
                <button type="button" id="ticket-status-add">\u6DFB\u52A0\u72B6\u6001</button>
                <button type="button" id="ticket-status-save">\u4FDD\u5B58</button>
                <button type="button" id="ticket-status-cancel">\u53D6\u6D88</button>
            </div>
        </div>
    </div>
    `
  );
}
registerPlugin({
  manifest: { id: "kanban", name: "\u5DE5\u5355\u770B\u677F", version: "1" },
  async init(api) {
    api.loadStylesheet("plugins/kanban.css");
    injectKanbanDom(api.getMountEl());
    initKanbanPlugin(api);
  }
});
