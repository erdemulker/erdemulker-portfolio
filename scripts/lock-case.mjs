#!/usr/bin/env node
/*
  Locks one case behind a password, so its text and images never reach the
  site in readable form.

  The readable source lives outside this repo:
    <src>/case.json      the full case object, as it would sit in `P`
    <src>/images/*       every image the case references

  What it writes:
    images/<dir>/<file>.enc   each image, AES-GCM encrypted (12 byte IV, then ciphertext)
    index.html                the case's `lock:{...}` field: salt, iterations and the
                              encrypted case JSON, whose image paths point at the .enc files

  The key is PBKDF2-SHA256 over the upper-cased password. The page derives the
  same key in the browser (see unlockCase in index.html).

  Usage: node scripts/lock-case.mjs <src dir> <slug> <password>
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [src, slug, password] = process.argv.slice(2);
if (!src || !slug || !password) throw new Error('usage: lock-case.mjs <src dir> <slug> <password>');

const ITER = 600000;
const b64 = (u8) => Buffer.from(u8).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password.trim().toUpperCase()), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
async function seal(bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
  return out;
}

const c = JSON.parse(readFileSync(join(src, 'case.json'), 'utf8'));
// images: encrypt each referenced file, and point the case at the .enc copy
const refs = [...new Set(JSON.stringify(c).match(/images\/[^"]+\.(?:gif|png|jpe?g|webp)/g) || [])];
for (const r of refs) {
  if (r.startsWith('images/preview/')) continue; // fallbacks are dropped below
  const enc = await seal(readFileSync(join(src, 'images', basename(r))));
  mkdirSync(dirname(join(ROOT, r)), { recursive: true });
  writeFileSync(join(ROOT, r + '.enc'), enc);
  console.log(r + '.enc', (enc.length / 1048576).toFixed(2), 'MB');
}
const body = JSON.stringify(c, (k, v) => (k === 'fb' ? undefined : typeof v === 'string' && refs.includes(v) ? v + '.enc' : v));
const lock = `lock:{s:'${b64(salt)}',n:${ITER},d:'${b64(await seal(new TextEncoder().encode(body)))}'}`;

// write the payload into this slug's case in index.html
const file = join(ROOT, 'index.html');
let html = readFileSync(file, 'utf8');
const re = new RegExp(`(/\\*@lock:${slug}\\*/)lock:\\{[^}]*\\}`);
if (!re.test(html)) throw new Error(`no /*@lock:${slug}*/lock:{...} marker in index.html`);
html = html.replace(re, (_, m) => m + lock);
writeFileSync(file, html);
console.log(`locked ${slug}: ${refs.length} images, ${body.length} chars of case text`);
