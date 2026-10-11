#!/usr/bin/env node
/*
  Prerenders the case studies so they exist as real HTML, not only as JS.

  What it writes:
    index.html               project cards between <!-- @cards-start --> and <!-- @cards-end -->
    work/<slug>/index.html   one page per case: own title, description, OG image, canonical,
                             with the case already rendered in the drawer
    sitemap.xml              home, about, CV and every case page

  Source of truth stays the `P` array in index.html (the @render-start / @render-end region).
  Edit the case there, then run:  node scripts/build-case-pages.mjs
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://erdemulker.com';
const read = f => readFileSync(join(ROOT, f), 'utf8');
const write = (f, s) => { mkdirSync(dirname(join(ROOT, f)), { recursive: true }); writeFileSync(join(ROOT, f), s); };

const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = s => String(s).replace(/<[^>]+>/g, '');

/** replace exactly one occurrence, or fail loudly so a template change never silently breaks a page */
function swap(html, from, to, label) {
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 match, found ${n}`);
  return html.replace(from, () => to);
}
function swapRe(html, re, to, label) {
  if (!re.test(html)) throw new Error(`${label}: no match for ${re}`);
  return html.replace(re, () => to);
}

// ---- load data + renderers from index.html ----
let index = read('index.html');
const start = index.indexOf('/* @render-start');
const end = index.indexOf('/* @render-end */');
if (start < 0 || end < 0) throw new Error('render markers missing in index.html');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(index.slice(start, end) + '\n;globalThis.__x={P,SLUGS,renderCard,renderCase,caseUrl};', ctx);
const { P, SLUGS, renderCard, renderCase, caseUrl } = ctx.__x;
if (P.length !== SLUGS.length) throw new Error(`P has ${P.length} cases but SLUGS has ${SLUGS.length}`);

// ---- 0. consistency: a number on About must not contradict the same number in a case ----
{
  const about = read('about.html');
  const caseText = P.map(c => JSON.stringify([c.impact, c.impactNote, c.metrics, c.d])).join(' ');
  const windowOf = s => (String(s).match(/\b(one|two|three|four|six|eight|twelve)[ -](day|week|month)s?\b/i) || [])[0]?.toLowerCase().replace('-', ' ');
  const problems = [];
  for (const [, value, label, source] of about.matchAll(/<div class="nm[^"]*"><b>([^<]*)<\/b><span>([^<]*)<\/span><i>([^<]*)<\/i>/g)) {
    const hits = P.flatMap(c => c.impact.filter(m => m[0].startsWith(value)));
    for (const m of hits) {
      const a = windowOf(source), b = windowOf(m[1]);
      if (a && b && a !== b) problems.push(`"${value}": About says "${a}", case says "${b}"`);
    }
    if (/adjoe/i.test(source) && !caseText.includes(value)) console.warn(`note: About stat "${value} ${label}" is not mentioned in any case`);
  }
  if (problems.length) throw new Error('About and case numbers disagree:\n  ' + problems.join('\n  '));
}

// ---- 1. cards into index.html ----
const cards = P.map((c, i) => renderCard(c, i)).join('');
index = swapRe(index, /<!-- @cards-start -->[\s\S]*?<!-- @cards-end -->/, `<!-- @cards-start -->${cards}<!-- @cards-end -->`, 'cards');
write('index.html', index);

// ---- 2. one page per case ----
P.forEach((c, i) => {
  const url = ORIGIN + caseUrl(i);
  const title = `${plain(c.t)} · Erdem Ülker`;
  const desc = plain(c.one);
  const img = c.hero || c.preview;
  for (const p of [c.hero?.src, c.preview?.src]) if (p && !existsSync(join(ROOT, p))) console.warn(`warn: ${p} not found`);

  let h = index;
  h = swap(h, '<html lang="en">', `<html lang="en" data-case="${SLUGS[i]}" style="overflow:hidden">`, 'html');
  h = swapRe(h, /<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`, 'title');
  h = swapRe(h, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${attr(desc)}" />`, 'description');
  h = swapRe(h, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, 'canonical');
  h = swapRe(h, /<meta property="og:type" content="[^"]*" \/>/, '<meta property="og:type" content="article" />', 'og:type');
  h = swapRe(h, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${attr(plain(c.t))}" />`, 'og:title');
  h = swapRe(h, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${attr(desc)}" />`, 'og:description');
  h = swapRe(h, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`, 'og:url');
  // preview image: the designed card from scripts/og-images.mjs if present, else the case hero
  const og = `images/og/${SLUGS[i]}.png`;
  const ogSrc = existsSync(join(ROOT, og)) ? og : img?.src;
  if (ogSrc) {
    h = swapRe(h, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${ORIGIN}/${ogSrc}" />`, 'og:image');
    if (ogSrc !== og) h = swapRe(h, /<meta property="og:image:width"[^>]*>\n<meta property="og:image:height"[^>]*>\n/, '', 'og:image size');
    else h = swapRe(h, /<meta property="og:image:height" content="[^"]*" \/>/, '<meta property="og:image:height" content="630" />', 'og:image height');
    h = swapRe(h, /<meta property="og:image:alt" content="[^"]*" \/>/, `<meta property="og:image:alt" content="${attr(plain(c.t))}. Case study by Erdem Ülker." />`, 'og:image:alt');
    h = swapRe(h, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${ORIGIN}/${ogSrc}" />`, 'twitter:image');
  }
  // structured data for the case itself
  const ld = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: plain(c.t), headline: plain(c.t), description: desc, url,
    image: ogSrc ? `${ORIGIN}/${ogSrc}` : undefined, author: { '@type': 'Person', name: 'Erdem Ülker', url: `${ORIGIN}/` }, about: plain(c.kk) };
  h = swap(h, '</head>', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n</head>`, 'ld+json');
  h = swapRe(h, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${attr(plain(c.t))}" />`, 'twitter:title');
  h = swapRe(h, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${attr(desc)}" />`, 'twitter:description');

  // drawer: open, with the case rendered server side
  h = swap(h, '<div class="dr" id="dr"', '<div class="dr on" id="dr"', 'drawer');
  h = swap(h, '<span class="dr-ix lbl" id="drIx"></span>', `<span class="dr-ix lbl" id="drIx">Case ${c.ix}</span>`, 'drIx');
  h = swap(h, '<div class="dr-in" id="drC"></div>', `<div class="dr-in" id="drC">${renderCase(c)}</div>`, 'drC');

  write(`work/${SLUGS[i]}/index.html`, h);
});

// ---- 3. sitemap ----
const today = new Date().toISOString().slice(0, 10);
const urls = [
  [`${ORIGIN}/`, '1.0'],
  ...SLUGS.map(s => [`${ORIGIN}/work/${s}/`, '0.9']),
  [`${ORIGIN}/about.html`, '0.8'],
  [`${ORIGIN}/cv/erdem-ulker-cv.pdf`, '0.5'],
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p]) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><priority>${p}</priority></url>`).join('\n')}
</urlset>
`);

console.log(`cards: ${P.length}  pages: ${SLUGS.map(s => `/work/${s}/`).join(' ')}  sitemap: ${urls.length} urls`);
