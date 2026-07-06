// Generated from src/ — edit TypeScript and run: npm run build

registerPlugin({
  manifest: { id: "docs", name: "Docs \u5F52\u6863", version: "1" },
  init(api) {
    registerDocsChatArchive(api);
  }
});
