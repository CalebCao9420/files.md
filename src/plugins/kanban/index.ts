/// <reference path="../../types/global.d.ts" />

function injectKanbanDom(mount: HTMLElement): void {
  if (document.getElementById('kanban-container')) {
    return;
  }

  mount.insertAdjacentHTML(
    'beforeend',
    `
    <div id="kanban-container" style="display: none">
        <header class="kanban-header">
            <h1>工单看板 · issues/</h1>
            <div class="kanban-header-actions">
                <button type="button" id="kanban-toggle-layout" aria-pressed="false">列表视图</button>
                <button type="button" id="kanban-edit-columns">列设置</button>
                <button type="button" id="kanban-edit-statuses">状态设置</button>
                <button type="button" id="kanban-new-task">新建工单</button>
                <button type="button" id="kanban-refresh">刷新</button>
                <button type="button" id="kanban-close">返回编辑</button>
            </div>
        </header>
        <div id="kanban-filters" class="kanban-filters">
            <label class="kanban-filter-field">
                <span>负责人</span>
                <select id="kanban-filter-assignee"><option value="">全部负责人</option></select>
            </label>
            <label class="kanban-filter-field">
                <span>标签</span>
                <input id="kanban-filter-tag" type="text" placeholder="tag" list="kanban-tag-suggestions" autocomplete="off">
                <datalist id="kanban-tag-suggestions"></datalist>
            </label>
            <label class="kanban-filter-field">
                <span>优先级</span>
                <select id="kanban-filter-priority"><option value="">全部优先级</option></select>
            </label>
            <button type="button" id="kanban-filter-clear">清除筛选</button>
            <label class="kanban-filter-field">
                <span>预设</span>
                <select id="kanban-filter-preset"><option value="">筛选预设</option></select>
            </label>
            <button type="button" id="kanban-filter-save">保存筛选</button>
            <button type="button" id="kanban-filter-delete-preset" title="删除所选预设">删</button>
            <span id="kanban-filter-summary" class="kanban-filter-summary"></span>
        </div>
        <div id="ticket-board" class="ticket-board"></div>
        <div id="ticket-list" class="ticket-list" style="display: none"></div>
    </div>
    `
  );

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div id="ticket-board-config" style="display: none" role="dialog" aria-labelledby="ticket-board-config-title">
        <div class="ticket-status-config-panel ticket-board-config-panel">
            <h2 id="ticket-board-config-title">看板列</h2>
            <p class="ticket-status-config-hint">列顺序即看板从左到右。可关联工单状态（自动归位），或不关联（手动拖拽，写入 <code>boardColumn</code>）。锁定列不可拖拽进出。保存到 <code>issues/ticket-board.json</code>。</p>
            <ul id="ticket-board-editor-list"></ul>
            <div class="ticket-status-config-actions">
                <button type="button" id="ticket-board-add">添加列</button>
                <button type="button" id="ticket-board-save">保存</button>
                <button type="button" id="ticket-board-cancel">取消</button>
            </div>
        </div>
    </div>
    <div id="ticket-status-config" style="display: none" role="dialog" aria-labelledby="ticket-status-config-title">
        <div class="ticket-status-config-panel">
            <h2 id="ticket-status-config-title">工单状态</h2>
            <p class="ticket-status-config-hint">工单 frontmatter 的 <code>status:</code> 可选值。保存到 <code>issues/ticket-statuses.json</code>。</p>
            <ul id="ticket-status-editor-list"></ul>
            <div class="ticket-status-config-actions">
                <button type="button" id="ticket-status-add">添加状态</button>
                <button type="button" id="ticket-status-save">保存</button>
                <button type="button" id="ticket-status-cancel">取消</button>
            </div>
        </div>
    </div>
    `
  );
}

registerPlugin({
  manifest: { id: 'kanban', name: '工单看板', version: '1' },
  async init(api: PluginAPI) {
    api.loadStylesheet('plugins/kanban.css');
    injectKanbanDom(api.getMountEl());
    initKanbanPlugin(api);
  },
});
