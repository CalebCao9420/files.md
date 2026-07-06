// Generated from src/ — edit TypeScript and run: npm run build

const chatArchiveTargets = /* @__PURE__ */ new Map();
let chatArchiveRevision = 0;
let lastRenderedChatArchiveRevision = -1;
function registerChatArchiveTarget(target) {
  chatArchiveTargets.set(target.id, target);
  chatArchiveRevision += 1;
  if (typeof refreshChatArchiveUi === "function") {
    refreshChatArchiveUi();
  }
}
function getChatArchiveTargets() {
  return Array.from(chatArchiveTargets.values()).sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100)
  );
}
function getChatArchiveTarget(id) {
  return chatArchiveTargets.get(id);
}
function getChatArchiveRevision() {
  return chatArchiveRevision;
}
function markChatArchiveRendered() {
  lastRenderedChatArchiveRevision = chatArchiveRevision;
}
function shouldSkipChatRender(text, lastText) {
  return text === lastText && chatArchiveRevision === lastRenderedChatArchiveRevision;
}
async function archiveChatMessages(texts, writeOne) {
  const paths = [];
  for (const text of texts) {
    await moveFromChat(text, async () => {
      paths.push(await writeOne(text));
    });
  }
  files = await loadLocalFiles(await getRootDirHandle());
  await renderMessages();
  if (paths.length > 0) {
    renderSidebar("", paths);
  }
  return paths;
}
Object.assign(globalThis, {
  registerChatArchiveTarget,
  getChatArchiveTargets,
  getChatArchiveTarget,
  archiveChatMessages,
  getChatArchiveRevision,
  markChatArchiveRendered,
  shouldSkipChatRender
});
