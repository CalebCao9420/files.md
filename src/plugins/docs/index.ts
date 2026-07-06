/// <reference path="../../types/global.d.ts" />

registerPlugin({
  manifest: { id: 'docs', name: 'Docs 归档', version: '1' },
  init(api: PluginAPI) {
    registerDocsChatArchive(api);
  },
});
