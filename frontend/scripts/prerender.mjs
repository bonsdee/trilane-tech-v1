// Writes a ready-made HTML file for each public page, so visitors, search
// engines and link previews that don't run JavaScript still see the content.
// Runs after `vite build` (see the "build" script in package.json).
//
// The browser still loads the normal app, which replaces this HTML with the
// live page and quietly refreshes the data.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js');
const env = { ...loadEnv('production', root, 'VITE_'), ...process.env };
const API = (env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

// Each page, the file it is saved as, and the data it shows.
const PAGES = [
  { path: '/', file: 'index.html', data: ['site', 'services', 'team'] },
  { path: '/services', file: 'services.html', data: ['site', 'services'] },
  { path: '/about', file: 'about.html', data: ['site', 'team'] },
  { path: '/faq', file: 'faq.html', data: ['site', 'faqs'] },
  { path: '/contact', file: 'contact.html', data: ['site', 'services'] },
  { path: '/privacy', file: 'privacy.html', data: ['site'] },
];
const ENDPOINTS = { site: '/public/site', services: '/public/services', team: '/public/team', faqs: '/public/faqs' };

async function fetchJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).data;
  } finally {
    clearTimeout(timer);
  }
}

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// JSON inside <script>: stop "</script>" and similar from ending the tag early.
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

function setTag(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`Template is missing ${pattern}`);
  return html.replace(pattern, replacement);
}

function applyMeta(html, meta) {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const u = escapeHtml(meta.url);
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${t}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${u}" />`);
  const extra = [
    `<link rel="canonical" href="${u}" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow'}" />`,
  ].join('\n    ');
  return html.replace('</head>', `    ${extra}\n  </head>`);
}

async function main() {
  if (!existsSync(ssrEntry)) throw new Error('Missing dist-ssr/entry-server.js. Run the SSR build first.');
  const template = readFileSync(join(dist, 'index.html'), 'utf8');
  if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill.');
  const { render } = await import(pathToFileURL(ssrEntry).href);

  const data = {};
  for (const [key, path] of Object.entries(ENDPOINTS)) {
    try {
      data[key] = await fetchJson(path);
    } catch (e) {
      // Pages still build; those sections just show their loading state until the browser fetches them.
      console.warn(`prerender: could not load ${key} from ${API}${path} (${e.message}). Continuing without it.`);
    }
  }

  for (const page of PAGES) {
    const pageData = Object.fromEntries(page.data.filter((k) => k in data).map((k) => [k, data[k]]));
    const { html, meta } = render(page.path, pageData);
    if (!meta) throw new Error(`${page.path} did not set its page title and description.`);
    let out = applyMeta(template, meta);
    // The pre-rendered HTML belongs to one path. Cloudflare also serves index.html for
    // paths without their own file (for example /admin); there it is hidden until the app takes over.
    const guard = `<script>(function(){var p=location.pathname.replace(/\\/+$/,'')||'/';if(p!==${JSON.stringify(page.path)})document.documentElement.classList.add('pr-hide')})()</script>`;
    out = out.replace(
      '<div id="root"></div>',
      `${guard}\n    <div id="root">${html}</div>\n    <script>window.__TRILANE_DATA__=${safeJson(pageData)}</script>`,
    );
    writeFileSync(join(dist, page.file), out);
    console.log(`prerender: ${page.path} -> dist/${page.file}${Object.keys(pageData).length < page.data.length ? ' (some data missing)' : ''}`);
  }
  rmSync(join(root, 'dist-ssr'), { recursive: true, force: true });
}

main().catch((e) => {
  console.error(`prerender failed: ${e.message}`);
  process.exit(1);
});
