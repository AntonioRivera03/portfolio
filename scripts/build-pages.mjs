import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fetchContributionActivity } from '../lib/contributions.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const [owner, repository] = (
  process.env.GITHUB_REPOSITORY ?? 'AntonioRivera03/portfolio'
).split('/');
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (repository.toLowerCase() === `${owner.toLowerCase()}.github.io`
    ? ''
    : `/${repository}`);
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  `https://${owner.toLowerCase()}.github.io${basePath}/`;
const snapshot = JSON.parse(
  await readFile(
    new URL('../app/data/contributions.json', import.meta.url),
    'utf8',
  ),
);
let activity = { ...snapshot, fresh: false };
try {
  activity = { ...snapshot, ...(await fetchContributionActivity()) };
  console.log(`Updated contribution data through ${activity.to}.`);
} catch {
  console.warn(
    `GitHub is unavailable; retaining the dated snapshot from ${snapshot.retrievedAt}.`,
  );
}
await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../public/data/contributions.json', import.meta.url),
  JSON.stringify(activity),
);

const build = spawnSync(
  process.execPath,
  ['node_modules/vinext/dist/cli.js', 'build'],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      GITHUB_PAGES: 'true',
      NEXT_PUBLIC_STATIC_SITE: 'true',
      NEXT_PUBLIC_BASE_PATH: basePath,
      NEXT_PUBLIC_SITE_URL: siteUrl,
    },
  },
);
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

// Preserve clean directory URLs on Pages without triggering Vinext's
// trailing-slash redirect during its internal prerender requests.
await mkdir(new URL('../dist/client/projects-yard/', import.meta.url), {
  recursive: true,
});
await copyFile(
  new URL('../dist/client/projects-yard.html', import.meta.url),
  new URL('../dist/client/projects-yard/index.html', import.meta.url),
);

// An export must contain HTML; a successful server build alone cannot run on Pages.
const html = await readFile(
  new URL('../dist/client/index.html', import.meta.url),
  'utf8',
);
if (
  !html.includes('Download resume') ||
  !html.includes(`${basePath}/documents/Antonio-Rivera-Resume.pdf`)
) {
  throw new Error('Static export is missing the portfolio or its resume link.');
}
const yardHtml = await readFile(
  new URL('../dist/client/projects-yard/index.html', import.meta.url),
  'utf8',
);
if (
  !yardHtml.includes('scenic route.') ||
  !html.includes(`${basePath}/projects-yard/`)
) {
  throw new Error(
    'Static export is missing the project yard or its homepage link.',
  );
}

// Catch missing prefixed scripts, styles, fonts, and public assets before upload.
const exportDir = new URL('../dist/client/', import.meta.url);
const siteOrigin = new URL(siteUrl).origin;
async function checkAsset(value, from = siteUrl) {
  if (value.startsWith('#')) return;
  const url = new URL(value, from);
  if (url.origin !== siteOrigin) return;
  const prefix = `${basePath}/`;
  if (!url.pathname.startsWith(prefix))
    throw new Error(`Asset is outside the Pages path: ${url}`);
  const relative =
    decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
  await access(new URL(relative, exportDir));
}
for (const [pageHtml, pageUrl] of [
  [html, siteUrl],
  [yardHtml, new URL('projects-yard/', siteUrl).href],
]) {
  for (const [, value] of pageHtml.matchAll(/(?:src|href)="([^"]+)"/g)) {
    await checkAsset(value, pageUrl);
  }
}
for (const file of await readdir(exportDir, { recursive: true })) {
  if (!file.endsWith('.css')) continue;
  const css = await readFile(new URL(file, exportDir), 'utf8');
  for (const [, value] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    await checkAsset(value, new URL(file, siteUrl));
  }
}
await writeFile(new URL('../dist/client/.nojekyll', import.meta.url), '');
console.log(`GitHub Pages export ready at dist/client for ${siteUrl}`);
