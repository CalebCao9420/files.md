// Generated from src/ — edit TypeScript and run: npm run build

function parseFrontmatter(text) {
  const lines = text.split("\n");
  let start = -1;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    if (lines[i].trim() === "---") {
      start = i;
      break;
    }
  }
  if (start === -1) {
    return { meta: null, body: text };
  }
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return { meta: null, body: text };
  }
  const meta = {};
  for (let i = start + 1; i < end; i++) {
    const line = lines[i];
    const match = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    meta[match[1]] = value;
  }
  return { meta: Object.keys(meta).length ? meta : null, body: text };
}
function parseHeadings(text) {
  const lines = text.split("\n");
  const headings = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) {
      continue;
    }
    const level = match[1].length;
    let title = match[2].trim();
    title = title.replace(/\s*\[#+\]\([^)]*\)\s*$/, "").trim();
    if (!title) {
      continue;
    }
    headings.push({ level, text: title, line: i });
  }
  return headings;
}
Object.assign(globalThis, { parseFrontmatter, parseHeadings });
