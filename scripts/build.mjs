import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const banner = '// Generated from src/ — edit TypeScript and run: npm run build\n';

mkdirSync('web', { recursive: true });
mkdirSync('web/plugins/kanban', { recursive: true });
mkdirSync('web/plugins/docs', { recursive: true });

const shared = {
  bundle: false,
  platform: 'browser',
  target: ['es2020'],
  banner: { js: banner },
  logLevel: 'info',
};

/** Transpile-only: preserves classic multi-script global scope in the browser. */
const entries = [
  ['src/config.ts', 'web/config.js'],
  ['src/welcome/index.ts', 'web/welcome.js'],
  ['src/files/index.ts', 'web/files.js'],
  ['src/reading/parse.ts', 'web/reading-parse.js'],
  ['src/reading/ui.ts', 'web/reading.js'],
  ['src/templates/index.ts', 'web/templates.js'],
  ['src/templates/project-structure.ts', 'web/project-structure.js'],
  ['src/plugins/kanban/default-seeds.ts', 'web/plugins/kanban/default-seeds.js'],
  ['src/search/index.ts', 'web/search.js'],
  ['src/mdtk/workspace-config.ts', 'web/mdtk-workspace-config.js'],
  ['src/plugins/chat-archive.ts', 'web/plugins/chat-archive.js'],
  ['src/plugins/api.ts', 'web/plugins.js'],
  ['src/plugins/docs/chat-archive.ts', 'web/plugins/docs/chat-archive.js'],
  ['src/plugins/docs/index.ts', 'web/plugins/docs/index.js'],
  ['src/vcs/repo.ts', 'web/vcs-repo.js'],
  ['src/vcs/menu.ts', 'web/vcs-menu.js'],
  ['src/vcs/dirty.ts', 'web/vcs-dirty.js'],
  ['src/desktop/shell.ts', 'web/desktop-shell.js'],
  ['src/desktop/tauri-fs.ts', 'web/tauri-fs.js'],
  ['src/plugins/kanban/ticket-statuses.ts', 'web/plugins/kanban/ticket-statuses.js'],
  ['src/plugins/kanban/board-columns.ts', 'web/plugins/kanban/board-columns.js'],
  ['src/plugins/kanban/frontmatter.ts', 'web/plugins/kanban/frontmatter.js'],
  ['src/plugins/kanban/chat-archive.ts', 'web/plugins/kanban/chat-archive.js'],
  ['src/plugins/kanban/board.ts', 'web/plugins/kanban/board.js'],
  ['src/plugins/kanban/index.ts', 'web/plugins/kanban/index.js'],
  ['src/editor/index.ts', 'web/editor.js'],
  ['src/app/index.ts', 'web/app.js'],
  ['src/chat/index.ts', 'web/chat.js'],
  ['src/modals/index.ts', 'web/modals.js'],
];

async function buildOne(entry, outfile) {
  return esbuild.build({
    ...shared,
    entryPoints: [entry],
    outfile,
  });
}

if (watch) {
  const contexts = await Promise.all(
    entries.map(([entry, outfile]) =>
      esbuild.context({ ...shared, entryPoints: [entry], outfile })
    )
  );
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log('Watching src/ …');
} else {
  await Promise.all(entries.map(([entry, outfile]) => buildOne(entry, outfile)));
}

const buildStamp = Date.now();
writeFileSync(
  'web/build-stamp.js',
  `${banner}window.COMMIT_HASH='?v=${buildStamp}';\n`
);

const indexPath = 'web/index.html';
let indexHtml = readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(/\?v=[^"']*/g, `?v=${buildStamp}`);
writeFileSync(indexPath, indexHtml);

for (const id of ['docs', 'kanban']) {
  copyFileSync(`src/plugins/${id}/scripts.json`, `web/plugins/${id}/scripts.json`);
}

console.log('Build stamp:', buildStamp);
