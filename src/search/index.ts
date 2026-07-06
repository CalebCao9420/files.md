/// <reference path="../types/global.d.ts" />

const FM_FILTER_KEYS = new Set([
  'status',
  'tags',
  'tag',
  'title',
  'date',
  'author',
  'category',
  'priority',
  'assignee',
]);

interface ParsedSearchQuery {
  text: string;
  folderPath: string | null;
  filters: Record<string, string>;
  browseFolder: string | null;
}

interface SearchResult {
  path: string;
  score: number;
}

function normalizeBrowseFolder(raw: string): string {
  let s = raw.trim();
  if (!s.endsWith('/')) {
    s += '/';
  }
  if (s.startsWith('/')) {
    s = s.slice(1);
  }
  return s;
}

function normalizeFolderPath(raw: string): string {
  let s = raw.trim().replace(/\/+$/, '');
  if (!s.startsWith('/')) {
    s = '/' + s;
  }
  return s || '/';
}

function parseSearchQuery(raw: string): ParsedSearchQuery {
  const input = raw.trim();
  if (!input) {
    return { text: '', folderPath: null, filters: {}, browseFolder: null };
  }

  if (input.endsWith('/') && !input.includes(' ')) {
    return {
      text: '',
      folderPath: null,
      filters: {},
      browseFolder: normalizeBrowseFolder(input),
    };
  }

  const tokens = input.split(/\s+/).filter(Boolean);
  const filters: Record<string, string> = {};
  const textParts: string[] = [];
  let folderPath: string | null = null;

  for (const token of tokens) {
    const inMatch = token.match(/^in:(.+)$/i);
    if (inMatch) {
      folderPath = normalizeFolderPath(inMatch[1]);
      continue;
    }

    const pathMatch = token.match(/^path:(.+)$/i);
    if (pathMatch) {
      folderPath = normalizeFolderPath(pathMatch[1]);
      continue;
    }

    const hashMatch = token.match(/^#([\w-]+)$/i);
    if (hashMatch) {
      filters.tags = hashMatch[1].toLowerCase();
      continue;
    }

    const kvMatch = token.match(/^([a-z_.-]+):(.+)$/i);
    if (kvMatch && FM_FILTER_KEYS.has(kvMatch[1].toLowerCase())) {
      const key = kvMatch[1].toLowerCase() === 'tag' ? 'tags' : kvMatch[1].toLowerCase();
      filters[key] = kvMatch[2].toLowerCase();
      continue;
    }

    if (
      !folderPath &&
      token.includes('/') &&
      token.split('/').length === 2 &&
      textParts.length === 0 &&
      Object.keys(filters).length === 0
    ) {
      const [dir, file] = token.split('/');
      folderPath = normalizeFolderPath(dir);
      textParts.push(file);
      continue;
    }

    textParts.push(token);
  }

  if (
    textParts.length === 2 &&
    !folderPath &&
    Object.keys(filters).length === 0
  ) {
    const dirKey = textParts[0].endsWith('/') ? textParts[0] : textParts[0] + '/';
    if (files[dirKey]) {
      folderPath = normalizeFolderPath(textParts[0]);
      const filePart = textParts[1];
      textParts.length = 0;
      textParts.push(filePart);
    }
  }

  return {
    text: textParts.join(' ').toLowerCase(),
    folderPath,
    filters,
    browseFolder: null,
  };
}

function pathInScope(filePath: string, scopePath: string | null): boolean {
  if (!scopePath || scopePath === '/') {
    return true;
  }
  const dir = toDirPath(filePath);
  return dir === scopePath || dir.startsWith(scopePath + '/');
}

function metaMatchesFilters(
  meta: Record<string, string> | null,
  filters: Record<string, string>
): boolean {
  if (!Object.keys(filters).length) {
    return true;
  }
  if (!meta) {
    return false;
  }

  for (const [key, want] of Object.entries(filters)) {
    const val = (meta[key] || '').toLowerCase();
    if (key === 'tags') {
      const parts = val.split(/[\s,]+/).filter(Boolean);
      if (!val.includes(want) && !parts.includes(want)) {
        return false;
      }
      continue;
    }
    if (!val.includes(want)) {
      return false;
    }
  }
  return true;
}

function getFolderFileResults(folderKey: string): SearchResult[] {
  const parts = folderKey.replace(/\/$/, '').split('/').filter(Boolean);
  let cur: Record<string, unknown> = files;
  for (const part of parts) {
    const key = part + '/';
    const next = cur[key];
    if (!next || typeof next !== 'object') {
      return [];
    }
    cur = next as Record<string, unknown>;
  }

  const basePath = parts.length ? '/' + parts.join('/') : '';
  const results: SearchResult[] = [];
  for (const filename in cur) {
    const entry = cur[filename] as { isFile?: boolean } | undefined;
    if (!entry?.isFile) {
      continue;
    }
    results.push({
      path: joinPath(basePath || '/', filename),
      score: 100,
    });
  }
  return results;
}

async function getFileTextForSearch(path: string): Promise<string | null> {
  const mem = getMemFile(path);
  if (mem?.content != null && typeof mem.content === 'string') {
    return mem.content;
  }
  try {
    return await read(path);
  } catch {
    return null;
  }
}

function scoreFilenameMatch(searchText: string, path: string, lowPriorityDirs: string[]): number | null {
  if (!searchText) {
    return 50;
  }

  const filename = trimPostfix(toFilename(path), '.md');
  const potentialMatch = filename;
  const similarityScore = similarity(searchText, potentialMatch);
  if (similarityScore >= 70) {
    let score = similarityScore;
    const dirName = toRootDirName(path);
    if (lowPriorityDirs.includes(dirName)) {
      score -= 60;
    }
    return score;
  }

  if (potentialMatch.toLowerCase().includes(searchText)) {
    let matchedPercent = (searchText.length / potentialMatch.length) * 100;
    const dirName = toRootDirName(path);
    if (lowPriorityDirs.includes(dirName)) {
      matchedPercent /= 5;
    }
    return Math.round(matchedPercent);
  }

  return null;
}

async function performFileSearch(raw: string): Promise<SearchResult[]> {
  const query = parseSearchQuery(raw);
  const lowPriorityDirs = ['archive', 'habits', 'triggers'];

  if (query.browseFolder) {
    return getFolderFileResults(query.browseFolder);
  }

  const hasFilters = Object.keys(query.filters).length > 0;
  const hasText = query.text.length > 0;
  const results: SearchResult[] = [];

  const candidates: string[] = [];
  walkFilesExcludingSystemDirs((path) => {
    if (!pathInScope(path, query.folderPath)) {
      return;
    }
    candidates.push(path);
  });

  if (hasFilters) {
    for (const path of candidates) {
      const text = await getFileTextForSearch(path);
      if (text == null) {
        continue;
      }
      const { meta } = parseFrontmatter(text);
      if (!metaMatchesFilters(meta, query.filters)) {
        continue;
      }

      const score = scoreFilenameMatch(query.text, path, lowPriorityDirs);
      if (hasText && score == null) {
        continue;
      }

      results.push({ path, score: (score ?? 70) + 10 });
    }
  } else if (hasText || query.folderPath) {
    for (const path of candidates) {
      const score = scoreFilenameMatch(query.text, path, lowPriorityDirs);
      if (score == null && hasText) {
        continue;
      }
      results.push({ path, score: score ?? 40 });
    }
  } else {
    return [];
  }

  const uniqueResultsMap = new Map<string, SearchResult>();
  for (const item of results) {
    if (item.path === CONFIG_PATH || item.path === CHAT_PATH) {
      continue;
    }
    const existing = uniqueResultsMap.get(item.path);
    if (!existing || existing.score < item.score) {
      uniqueResultsMap.set(item.path, item);
    }
  }

  return Array.from(uniqueResultsMap.values()).sort((a, b) => b.score - a.score);
}

Object.assign(globalThis, {
  performFileSearch,
  parseSearchQuery,
});
