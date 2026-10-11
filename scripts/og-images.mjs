#!/usr/bin/env node
/*
  Renders the 1200x630 link-preview image for each case into images/og/<slug>.png.
  Re-run when a case title or headline metric changes, then run build-case-pages.mjs.

  Needs Playwright (with a Chromium) and the Hanken Grotesk font package, installed
  OUTSIDE this repo so nothing ends up in the deployed assets:

    mkdir -p /tmp/og && cd /tmp/og && npm i playwright @fontsource/hanken-grotesk
    node scripts/og-images.mjs /tmp/og/node_modules

  Optional: CHROMIUM=/path/to/chrome to use an existing browser binary.
*/
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODS = process.argv[2];
if (!MODS) { console.error('usage: node scripts/og-images.mjs <path-to-node_modules>'); process.exit(1); }
const req = createRequire(join(MODS, 'x.js'));
const pw = await import(pathToFileURL(req.resolve('playwright')).href);
const chromium = pw.chromium || pw.default.chromium;
const fontDir = join(MODS, '@fontsource/hanken-grotesk/files');
// embedded as data URIs: a page set with setContent cannot read file:// fonts
const font = w => `url(data:font/woff2;base64,${readFileSync(join(fontDir, `hanken-grotesk-latin-${w}-normal.woff2`)).toString('base64')})`;

const index = readFileSync(join(ROOT, 'index.html'), 'utf8');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(index.slice(index.indexOf('/* @render-start'), index.indexOf('/* @render-end */')) + ';globalThis.__x={P,SLUGS}', ctx);
const { P, SLUGS } = ctx.__x;
const esc = s => String(s).replace(/<[^>]+>/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

const page = c => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:H;font-weight:300;src:${font(300)}}
@font-face{font-family:H;font-weight:400;src:${font(400)}}
@font-face{font-family:H;font-weight:500;src:${font(500)}}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#fafaf9;color:#1c1917;font-family:H,sans-serif;padding:64px 72px;display:flex;flex-direction:column;
  background-image:linear-gradient(#e7e5e4 1px,transparent 1px),linear-gradient(90deg,#e7e5e4 1px,transparent 1px);background-size:48px 48px;background-position:-1px -1px}
.card{background:#fafaf9;border:1px solid #d6d3d1;border-radius:18px;padding:48px 52px;flex:1;display:flex;flex-direction:column}
.k{font-size:20px;color:#78716c;letter-spacing:.06em;text-transform:uppercase;font-weight:500}
h1{margin-top:22px;font-size:60px;line-height:1.06;font-weight:500;letter-spacing:-.028em;max-width:19ch}
.m{margin-top:auto;display:flex;gap:56px;align-items:flex-end}
.m b{display:block;font-size:44px;font-weight:500;letter-spacing:-.02em;line-height:1}
.m span{display:block;margin-top:10px;font-size:20px;color:#78716c;font-weight:400;white-space:nowrap}
.by{margin-left:auto;text-align:right;font-size:20px;color:#57534e;line-height:1.4;white-space:nowrap}
.by b{color:#1c1917;font-weight:500;font-size:22px;display:block}
</style></head><body><div class="card">
<div class="k">Case ${esc(c.ix)} · ${esc(c.kk)}</div>
<h1>${esc(c.t)}</h1>
<div class="m">${c.metrics.map(m => `<div><b>${esc(m[0])}</b><span>${esc(m[1])}</span></div>`).join('')}
<div class="by"><b>Erdem Ülker</b>Senior Product Designer · erdemulker.com</div></div>
</div></body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
mkdirSync(join(ROOT, 'images/og'), { recursive: true });
for (const [i, c] of P.entries()) {
  await tab.setContent(page(c), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: join(ROOT, `images/og/${SLUGS[i]}.png`) });
  console.log(`images/og/${SLUGS[i]}.png`);
}
await browser.close();
