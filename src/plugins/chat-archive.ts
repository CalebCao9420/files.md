/// <reference path="../types/global.d.ts" />

interface ChatArchiveTarget {
  id: string;
  label: string;
  html: string;
  order?: number;
  isAvailable?: () => boolean;
  archiveOne: (text: string) => Promise<string>;
}

const chatArchiveTargets = new Map<string, ChatArchiveTarget>();
let chatArchiveRevision = 0;
let lastRenderedChatArchiveRevision = -1;

function registerChatArchiveTarget(target: ChatArchiveTarget): void {
  chatArchiveTargets.set(target.id, target);
  chatArchiveRevision += 1;
  if (typeof refreshChatArchiveUi === 'function') {
    refreshChatArchiveUi();
  }
}

function getChatArchiveTargets(): ChatArchiveTarget[] {
  return Array.from(chatArchiveTargets.values()).sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100)
  );
}

function getChatArchiveTarget(id: string): ChatArchiveTarget | undefined {
  return chatArchiveTargets.get(id);
}

function getChatArchiveRevision(): number {
  return chatArchiveRevision;
}

function markChatArchiveRendered(): void {
  lastRenderedChatArchiveRevision = chatArchiveRevision;
}

function shouldSkipChatRender(text: string, lastText: string | null): boolean {
  return text === lastText && chatArchiveRevision === lastRenderedChatArchiveRevision;
}

async function archiveChatMessages(
  texts: string[],
  writeOne: (text: string) => Promise<string>
): Promise<string[]> {
  const paths: string[] = [];
  for (const text of texts) {
    await moveFromChat(text, async () => {
      paths.push(await writeOne(text));
    });
  }
  files = await loadLocalFiles(await getRootDirHandle());
  await renderMessages();
  if (paths.length > 0) {
    renderSidebar('', paths);
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
  shouldSkipChatRender,
});
