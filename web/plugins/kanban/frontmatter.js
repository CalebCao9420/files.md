// Generated from src/ — edit TypeScript and run: npm run build

function findFrontmatterBounds(lines) {
  let start = -1;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    if (lines[i].trim() === "---") {
      start = i;
      break;
    }
  }
  if (start === -1) {
    return null;
  }
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      return { start, end: i };
    }
  }
  return null;
}
function removeFrontmatterField(content, key) {
  const lines = content.split("\n");
  const bounds = findFrontmatterBounds(lines);
  if (!bounds) {
    return content;
  }
  for (let i = bounds.start + 1; i < bounds.end; i++) {
    const match = lines[i].match(/^([A-Za-z0-9_.-]+):/);
    if (match && match[1] === key) {
      lines.splice(i, 1);
      break;
    }
  }
  return lines.join("\n");
}
function setFrontmatterField(content, key, value) {
  const lines = content.split("\n");
  const bounds = findFrontmatterBounds(lines);
  if (!bounds) {
    return [`---`, `${key}: ${value}`, `---`, ``, content].join("\n");
  }
  let replaced = false;
  for (let i = bounds.start + 1; i < bounds.end; i++) {
    const match = lines[i].match(/^([A-Za-z0-9_.-]+):/);
    if (match && match[1] === key) {
      lines[i] = `${key}: ${value}`;
      replaced = true;
      break;
    }
  }
  if (!replaced) {
    lines.splice(bounds.end, 0, `${key}: ${value}`);
  }
  return lines.join("\n");
}
function buildTaskFrontmatter(title, statusId) {
  return [
    "---",
    `status: ${statusId}`,
    `title: ${title}`,
    "priority: medium",
    "assignee:",
    "tags:",
    `date: ${todayIsoDate()}`,
    "---",
    "",
    "## \u63CF\u8FF0",
    "",
    ""
  ].join("\n");
}
Object.assign(globalThis, {
  setFrontmatterField,
  removeFrontmatterField,
  buildTaskFrontmatter
});
