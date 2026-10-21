// Prints cv.html to cv/erdem-ulker-cv.pdf (A4, one page) with Chromium.
// Edit the copy in cv.html, then:  node scripts/cv/build.mjs
// Env: PW_MODULES=<dir containing node_modules/playwright>, CHROMIUM=<browser binary> (both optional).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(join(process.env.PW_MODULES || process.cwd(), 'node_modules', 'x.js'))('playwright');
const out = process.argv[2] || join(here, '..', '..', 'cv', 'erdem-ulker-cv.pdf');
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage();
await p.goto(pathToFileURL(join(here, 'cv.html')).href, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
const h = await p.evaluate(() => document.body.scrollHeight);
const mm = h * 25.4 / 96;
console.log(`content height ${mm.toFixed(1)}mm of 297mm`);
if (mm > 290) { console.error('CV no longer fits one page with a bottom margin'); process.exit(1); }
await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: false });
await b.close();
console.log(out);
