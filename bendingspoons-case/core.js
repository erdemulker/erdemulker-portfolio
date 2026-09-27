/* TripUp prototype · core: state, router, sheets, helpers */
(() => {
const $app = document.getElementById('app');
const IMG = n => `assets/img/${n}.jpg`;
const ic = (n, cls = '') => `<i data-lucide="${n}" class="${cls}"></i>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const eur = n => `${Math.round(n)}€`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const vibrate = (p = 8) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* ---------- people ---------- */
const PEOPLE = {
  A: { id: 'A', name: 'Ari', full: 'Ari Lopes' },
  C: { id: 'C', name: 'Clara', photo: 'clara' },
  R: { id: 'R', name: 'Ren', full: 'Ren Costa', photo: 'ren' },
  N: { id: 'N', name: 'Nic' },
  M: { id: 'M', name: 'Mia', full: 'Mia Santos' },
  J: { id: 'J', name: 'João', full: 'João Silva' },
};
const ORDER = ['A', 'C', 'R', 'N'];
const nameOf = (id, me = 'A') => id === me ? 'You' : PEOPLE[id].name;
const av = (id, size = '', extra = '') => {
  const p = PEOPLE[id] || { name: id };
  return `<span class="av ${size} ${extra}">${p.photo ? `<img src="${IMG(p.photo)}" alt="${p.name}">` : esc(p.name[0])}</span>`;
};
const stack = (ids, size = '', dim = []) => `<span class="stack ${size}">${ids.map(i => av(i, size, dim.includes(i) ? 'dim' : '')).join('')}</span>`;

/* ---------- places ---------- */
const PLACES = {
  cavo:   { id: 'cavo',   name: 'Cavo Rooftop',  type: 'Italian · rooftop', dist: '60 m',  img: 'cavo',   x: 22, y: 30, price: '€€',  addr: 'R. da Rosa 12', walk: '1 min walk' },
  altar:  { id: 'altar',  name: 'Altar',         type: 'Portuguese',        dist: '90 m',  img: 'altar',  x: 66, y: 22, price: '€€',  addr: 'R. de São Bento 12', walk: '2 min walk' },
  fogo:   { id: 'fogo',   name: 'Fogo de chão',  type: 'Brazilian steakhouse', dist: '150 m', img: 'fogo', x: 72, y: 50, price: '€€€', addr: 'R. Artilharia 1 51', walk: '3 min walk', desc: 'All-you-can-eat meat carved tableside, plus a large salad bar.' },
  sushi:  { id: 'sushi',  name: 'Sushi Yama',    type: 'Japanese',          dist: '200 m', img: 'r-sushi-yama', x: 36, y: 62, price: '€€', addr: 'Av. Liberdade 90', walk: '4 min walk' },
  trat:   { id: 'trat',   name: 'La Trattoria',  type: 'Italian',           dist: '220 m', img: 'r-la-trattoria', x: 80, y: 70, price: '€€', addr: 'R. Castilho 40', walk: '4 min walk' },
  cafe:   { id: 'cafe',   name: 'Café Parisien', type: 'French café',       dist: '275 m', img: 'cafe',   x: 18, y: 72, price: '€',   addr: 'R. Braamcamp 8', walk: '5 min walk' },
  torel:  { id: 'torel',  name: 'Jardim do Torel', type: 'City park',        dist: '400 m', img: 'torel',  x: 50, y: 14, price: 'Free', addr: 'R. Júlio de Andrade', walk: '6 min walk' },
  gulb:   { id: 'gulb',   name: 'Gulbenkian Museum', type: 'Museum',        dist: '1.2 km', img: 'gulb', x: 58, y: 40, price: '€',  addr: 'Av. de Berna 45A', walk: '15 min walk' },
};
PLACES.cavo.desc = 'Wood-fired pizza and pasta on a terrace over the city.';
PLACES.cafe.desc = 'Small, warm French café with a short evening menu.';
PLACES.altar.desc = 'Seasonal Portuguese plates and natural wine in a tiled room.';

/* ---------- state ---------- */
const initial = () => ({
  me: 'A',
  day: 'tue',
  people: ['A', 'C', 'N'],
  plan: {
    mon: [
      { id: 'e1', cat: 'Museum', title: 'Gulbenkian Museum', time: '10:00', cost: '160€', img: 'gulb' },
      { id: 'e2', cat: 'Food hall', title: 'Time Out Market', time: '13:30', cost: '120€', img: 'baixa' },
    ],
    tue: [
      { id: 'e3', cat: 'City attraction', title: 'Castelo de São Jorge', time: '10:00', cost: '90€', img: 'castelo' },
      { id: 'e4', cat: 'City park', title: 'Jardim do Torel', time: '15:00', cost: 'Free', img: 'torel' },
      { id: 'slot', slot: true, label: 'This evening · free from 18:00' },
    ],
  },
  poll: null,          // {question, day, time, options:[{id,placeId?,label?}], votes:{A:'fogo'}, status:'live'|'closed', winner}
  // Pre-dinner: 440€. Nets → Ari +10, Clara +30, Nic −40, Ren 0 (guest from tonight).
  expenses: [
    // today, not settled yet: Ari paid the castle tickets for three → Clara and Nic owe 30€ each
    { id: 'x1', title: 'Castelo tickets', payer: 'A', total: 90, when: 'today', img: 'castelo', link: 'e3', shares: { A: 30, C: 30, N: 30 } },
    // yesterday, settled last night
    { id: 'x4', title: 'Taxis', payer: 'N', total: 70, when: '15 Sep', img: 'baixa', settled: true, shares: { A: 23.33, C: 23.33, N: 23.34 } },
    { id: 'x3', title: 'Time Out Market', payer: 'A', total: 120, when: '15 Sep', img: 'baixa', link: 'e2', settled: true, shares: { A: 40, C: 40, N: 40 } },
    { id: 'x2', title: 'Gulbenkian Museum', payer: 'C', total: 160, when: '15 Sep', img: 'gulb', link: 'e1', settled: true, shares: { A: 53.33, C: 53.33, N: 53.34 } },
  ],
  trips: [],
  settled: {},         // {N:true}
  requested: false,
  seen: {},
});
// balances are computed from a simple share table so the numbers stay consistent everywhere
function shares(st) {
  // each expense: payer paid total; shares by person
  const rows = [];
  for (const e of st.expenses) {
    if (e.settled) continue;
    let sh = e.shares;
    if (!sh) {
      const who = e.who || ['A', 'C', 'N'];
      sh = {}; who.forEach(p => sh[p] = e.total / who.length);
    }
    rows.push({ payer: e.payer, total: e.total, sh });
  }
  const bal = { A: 0, C: 0, R: 0, N: 0 };
  for (const r of rows) {
    bal[r.payer] += r.total;
    for (const [p, v] of Object.entries(r.sh)) bal[p] -= v;
  }
  for (const p of Object.keys(st.settled)) if (st.settled[p]) { const v = st.settled[p]; bal[p] += v; bal.A -= v; }
  return bal;
}
const total = st => st.expenses.reduce((s, e) => s + e.total, 0);

let S = load() || initial();
function load() { try { return JSON.parse(localStorage.getItem('tripup-v3')); } catch (e) { return null; } }
function save() { try { localStorage.setItem('tripup-v3', JSON.stringify(S)); } catch (e) {} }
function set(fn) { fn(S); save(); rerenderTop(); }

/* ---------- router / stack ---------- */
const stackEls = [];   // {el, name, params, mode}
const routes = {};
const def = (name, fn) => routes[name] = fn;

function mount(name, params = {}) {
  const r = routes[name](params) || {};
  const el = document.createElement('div');
  el.className = 'page';
  el.dataset.route = name;
  el.innerHTML = r.html || '';
  el._r = r;
  el._params = params;
  return el;
}
function hydrate(el) {
  if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 1.75 }, nameAttr: 'data-lucide' });
  bindScroll(el);
  el._r.after && el._r.after(el);
}
function bindScroll(el) {
  const sc = el.querySelector('.scroll'); const tb = el.querySelector('.topbar');
  if (!sc || !tb) return;
  const hero = el.querySelector('.hero img');
  const onS = () => {
    const y = sc.scrollTop;
    if (tb.classList.contains('clear')) tb.classList.toggle('solid', y > 220);
    else tb.classList.toggle('scrolled', y > 4);
    if (hero) hero.style.transform = y < 0 ? `scale(${1 + -y / 300})` : `translate3d(0,${y * 0.4}px,0)`;
    el._r.onScroll && el._r.onScroll(y, el);
  };
  sc.addEventListener('scroll', onS, { passive: true }); onS();
}

function push(name, params = {}, mode = 'push') {
  vibrate(4);
  const top = stackEls[stackEls.length - 1];
  const el = mount(name, params);
  el.classList.add(mode === 'modal' ? 'enter-modal' : 'enter-push');
  $app.appendChild(el); hydrate(el);
  stackEls.push({ el, name, params, mode });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.add('in');
    if (top) top.el.classList.add(mode === 'modal' ? 'under-modal' : 'under');
  }));
  toggleTabbar();
}
function pop(n = 1) {
  vibrate(4);
  for (let i = 0; i < n; i++) {
    if (stackEls.length <= 1) return;
    const cur = stackEls.pop();
    const prev = stackEls[stackEls.length - 1];
    const modal = cur.mode === 'modal';
    const animate = i === n - 1;
    if (animate) {
      cur.el.classList.remove('in');
      cur.el.classList.add(modal ? 'leave-modal' : 'leave-push');
      prev.el.classList.remove('under', 'under-modal');
      prev.el.classList.add(modal ? 'back-under-modal' : 'back-under');
      setTimeout(() => { cur.el.remove(); prev.el.classList.remove('back-under', 'back-under-modal'); }, 500);
    } else { cur.el.remove(); prev.el.classList.remove('under', 'under-modal'); }
  }
  refresh(stackEls[stackEls.length - 1]);
  toggleTabbar();
}
function popTo(name) {
  let n = 0; for (let i = stackEls.length - 1; i > 0; i--) { if (stackEls[i].name === name) break; n++; }
  if (n) pop(n);
}
function resetTo(name, params = {}, anim = 'fade') {
  for (const s of stackEls) s.el.remove(); stackEls.length = 0;
  const el = mount(name, params);
  if (anim) el.classList.add('enter-' + anim);
  $app.appendChild(el); hydrate(el); stackEls.push({ el, name, params, mode: 'root' });
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  toggleTabbar();
}
// re-render a page in place (keeps scroll)
function refresh(entry, stagger = false) {
  if (!entry) return;
  const SCR = '.scroll, .inner, .chips';
  const keep = [...entry.el.querySelectorAll(SCR)].map(n => [n.scrollTop, n.scrollLeft]);
  const r = routes[entry.name](entry.params) || {};
  entry.el._r = r; entry.el.innerHTML = r.html;
  if (!stagger) entry.el.classList.add('no-anim');
  hydrate(entry.el);
  [...entry.el.querySelectorAll(SCR)].forEach((n, i) => { if (keep[i]) { n.scrollTop = keep[i][0]; n.scrollLeft = keep[i][1]; } });
  if (!stagger) requestAnimationFrame(() => entry.el.classList.remove('no-anim'));
}
function rerenderTop() { /* pages call refresh explicitly */ }
function current() { return stackEls[stackEls.length - 1]; }

/* ---------- tab bar ---------- */
let tab = 'trips';
const TABS = [['trips', 'home', 'Trips'], ['budget', 'coins', 'Budget'], ['profile', 'user-cog', 'Profile']];
const $tabbar = document.createElement('div');
$tabbar.className = 'tabbar';
function renderTabbar() {
  const bal = shares(S);
  const owe = Object.entries(bal).filter(([p, v]) => p !== 'A' && v < -0.5).length;
  $tabbar.innerHTML = `<nav class="tabs">${TABS.map(([k, i, l]) => `<button class="tab tap ${tab === k ? 'on' : ''}" data-tab="${k}">${ic(i)}${l}${k === 'budget' && owe && !S.requested ? `<span class="bubble"></span>` : ''}</button>`).join('')}</nav>
    <button class="fab tap" data-act="create" aria-label="Create">${ic('plus')}</button>`;
  lucide.createIcons();
}
$tabbar.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { const k = t.dataset.tab; if (k === tab && stackEls.length > 1) { pop(stackEls.length - 1); return; } tab = k; renderTabbar(); resetTo(k === 'trips' ? 'trips' : k); vibrate(6); return; }
  if (e.target.closest('[data-act=create]')) App.openCreate();
});
const TAB_ROUTES = new Set(['trips', 'trip', 'budget', 'profile']);
function toggleTabbar() {
  const c = current(); const show = c && TAB_ROUTES.has(c.name) && c.mode !== 'modal';
  $tabbar.style.transition = 'transform 420ms var(--spring), opacity 260ms';
  $tabbar.style.transform = show ? 'none' : 'translate3d(0,140%,0)';
  $tabbar.style.opacity = show ? 1 : 0;
  renderTabbar();
}

/* ---------- mobile Safari bleed (content under the glass toolbars) ---------- */
function setupBleed() {
  const mq = matchMedia('(max-width:600px)'); const root = document.documentElement;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const T = 130, B = 110;           // runway above / below the visible viewport (css px)
  let snapT = 0;
  const layout = () => {
    const on = mq.matches && !standalone;
    root.classList.toggle('bleed', on);
    App.bleed = on ? { t: T, b: B } : { t: 0, b: 0 };
    root.style.setProperty('--bt', App.bleed.t + 'px'); root.style.setProperty('--bb', App.bleed.b + 'px');
    root.style.setProperty('--app-h', on ? `${window.innerHeight + T + B}px` : '');
    if (on) window.scrollTo(0, T);
  };
  layout();
  requestAnimationFrame(layout); setTimeout(layout, 300);
  window.addEventListener('resize', () => { clearTimeout(snapT); snapT = setTimeout(layout, 60); });
  window.addEventListener('orientationchange', () => setTimeout(layout, 300));
  // keep the document parked on the runway
  window.addEventListener('scroll', () => { if (!root.classList.contains('bleed')) return; clearTimeout(snapT); snapT = setTimeout(() => { if (Math.abs(window.scrollY - T) > 1) window.scrollTo({ top: T, behavior: 'smooth' }); }, 140); }, { passive: true });
  // only real scrollers inside the app may scroll; everything else must not drag the document
  const canScroll = n => { const cs = getComputedStyle(n); return (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) || (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1); };
  document.addEventListener('touchmove', e => {
    if (!root.classList.contains('bleed') || e.defaultPrevented || !e.cancelable) return;
    for (let n = e.target; n && n !== document.body; n = n.parentElement) if (n.nodeType === 1 && canScroll(n)) return;
    e.preventDefault();
  }, { passive: false });
}

/* ---------- vertical drag (touch + mouse) ---------- */
function scrolledUp(t, root) { for (let n = t; n && n !== root; n = n.parentElement) if (n.scrollTop > 0 && n.scrollHeight > n.clientHeight) return true; return false; }
function dragY(root, h) {
  let s = null;
  const pt = e => e.touches ? e.touches[0] : e;
  const move = e => {
    if (!s) return; const p = pt(e); const dy = p.clientY - s.y0, dx = p.clientX - s.x0;
    if (!s.on) {
      if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
      if (Math.abs(dx) > Math.abs(dy) || !h.can(dy, s.t)) { s = null; return; }
      s.on = true; s.y0 = p.clientY; s.last = p.clientY; h.start && h.start();
    }
    if (e.cancelable) e.preventDefault();
    const now = performance.now(); s.v = (p.clientY - s.last) / Math.max(1, now - s.lt); s.last = p.clientY; s.lt = now;
    h.move(p.clientY - s.y0);
  };
  const end = () => {
    window.removeEventListener('mousemove', move);
    if (s && s.on) {
      h.end(s.last - s.y0, performance.now() - s.lt > 90 ? 0 : s.v);
      const blk = e => { e.stopPropagation(); e.preventDefault(); };
      window.addEventListener('click', blk, true); setTimeout(() => window.removeEventListener('click', blk, true), 0);
    }
    s = null;
  };
  const start = e => {
    if (e.type === 'mousedown') { if (e.button !== 0 || !e.target.closest(h.handle || '.grabber')) return; window.addEventListener('mousemove', move); window.addEventListener('mouseup', end, { once: true }); }
    const p = pt(e); s = { y0: p.clientY, x0: p.clientX, t: e.target, on: false, last: p.clientY, lt: performance.now(), v: 0 };
  };
  root.addEventListener('touchstart', start, { passive: true });
  root.addEventListener('touchmove', move, { passive: false });
  root.addEventListener('touchend', end); root.addEventListener('touchcancel', end);
  root.addEventListener('mousedown', start);
}
/* map drawer: half <-> full, drag down from half to close */
function drawer(el, { half = .46, onClose, onChange } = {}) {
  const dr = el.querySelector('.drawer'); const inner = dr.querySelector('.inner');
  const H = () => el.clientHeight;
  const fullH = () => { const tb = el.querySelector('.topbar .row'); return H() - (tb ? tb.getBoundingClientRect().bottom - el.getBoundingClientRect().top + 8 : 120); };
  const halfH = () => { const b = App.bleed; return Math.round((H() - b.t - b.b) * half + b.b); };
  const apply = (st, instant) => {
    if (instant) dr.style.transition = 'none';
    const hpx = st === 'full' ? fullH() : halfH(); dr.style.transform = ''; dr.style.height = hpx + 'px'; el.style.setProperty('--dr-h', hpx + 'px');
    const was = el.dataset.drawer; if (!instant && st === 'half' && was === 'full' && inner) inner.scrollTo({ top: 0, behavior: 'smooth' }); el.dataset.drawer = st; el.classList.toggle('tall', st === 'full');
    if (was !== st) onChange && onChange(st);
    if (instant) requestAnimationFrame(() => requestAnimationFrame(() => dr.style.transition = ''));
  };
  let h0 = 0;
  dragY(dr, { handle: '.grabber',
    can: (dy, t) => { if (!inner || !inner.contains(t)) return true; return dy > 0 ? !scrolledUp(t, dr) : el.dataset.drawer !== 'full'; },
    start: () => { h0 = dr.getBoundingClientRect().height; dr.style.transition = 'none'; const a = document.activeElement; if (a && a.blur && dr.contains(a)) a.blur(); },
    move: dy => {
      const h = h0 - dy, hh = halfH(), fh = fullH();
      if (h > fh) { dr.style.height = fh + (h - fh) / 5 + 'px'; dr.style.transform = ''; }
      else if (h >= hh || !onClose) { dr.style.height = Math.max(h, hh - (hh - h) / 5) + 'px'; dr.style.transform = ''; }
      else { dr.style.height = hh + 'px'; dr.style.transform = `translate3d(0,${hh - h}px,0)`; }
    },
    end: (dy, v) => {
      dr.style.transition = ''; const h = h0 - dy, hh = halfH(), fh = fullH();
      if (onClose && (h < hh - 90 || (v > .6 && h < hh + 12))) { dr.style.transform = 'translate3d(0,110%,0)'; vibrate(4); setTimeout(onClose, 160); return; }
      const proj = h - v * 220; apply(proj > (hh + fh) / 2 ? 'full' : 'half'); vibrate(4);
    } });
  apply(el.dataset.drawer || 'half', true);
  const onR = () => { if (!dr.isConnected) return window.removeEventListener('resize', onR); apply(el.dataset.drawer, true); };
  window.addEventListener('resize', onR);
  return { set: st => apply(st), toggle: () => apply(el.dataset.drawer === 'full' ? 'half' : 'full') };
}

/* ---------- sheets ---------- */
function sheet(html, { onClose, after } = {}) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet';
  sh.innerHTML = `<div class="grabber"></div>${html}`;
  $app.append(scrim, sh); lucide.createIcons();
  requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('in'); sh.classList.add('in'); }));
  const close = () => { scrim.classList.remove('in'); sh.classList.remove('in'); sh.style.transform = ''; setTimeout(() => { scrim.remove(); sh.remove(); }, 480); onClose && onClose(); };
  scrim.onclick = close;
  sh.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  // drag down anywhere to dismiss (unless the content under the finger is scrolled)
  dragY(sh, { handle: '.grabber, .sheet-head',
    can: (dy, t) => dy > 0 && !scrolledUp(t, sh),
    start: () => sh.classList.add('dragging'),
    move: dy => { const d = dy > 0 ? dy : dy / 6; sh.style.transform = `translate3d(0,${d}px,0)`; scrim.style.opacity = 1 - Math.max(0, d) / 400; },
    end: (dy, v) => { sh.classList.remove('dragging'); scrim.style.opacity = ''; if (dy > 110 || (v > .5 && dy > 16)) close(); else sh.style.transform = ''; } });
  after && after(sh, close);
  vibrate(6);
  return close;
}

/* ---------- notifications / toast ---------- */
function notify({ title, body, time = 'now', onTap, icon = 'playing-cards-fan' }) {
  const n = document.createElement('button');
  n.className = 'notif tap-soft';
  n.innerHTML = `<span class="appic">${ic(icon)}</span><span style="flex:1;text-align:left"><span class="t">${esc(title)}<span>${time}</span></span><span class="s">${esc(body)}</span></span>`;
  $app.appendChild(n); lucide.createIcons();
  requestAnimationFrame(() => requestAnimationFrame(() => n.classList.add('in')));
  vibrate([10, 40, 10]);
  const hide = () => { n.classList.remove('in'); setTimeout(() => n.remove(), 600); };
  const t = setTimeout(hide, 4200);
  n.onclick = () => { clearTimeout(t); hide(); onTap && onTap(); };
  let y0; n.addEventListener('touchstart', e => y0 = e.touches[0].clientY, { passive: true });
  n.addEventListener('touchmove', e => { if (e.touches[0].clientY - y0 < -20) { clearTimeout(t); hide(); } }, { passive: true });
}
function toast(msg, icon = 'check') {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `${ic(icon)}${esc(msg)}`; $app.appendChild(t); lucide.createIcons();
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 2200);
}

/* ---------- delegated actions ---------- */
const actions = {};
const act = (name, fn) => actions[name] = fn;
$app.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const fn = actions[b.dataset.a]; if (fn) { e.preventDefault(); fn(b.dataset, b, e); }
});
act('back', () => pop());
act('go', d => push(d.to, d.p ? JSON.parse(d.p) : {}, d.mode || 'push'));

/* ---------- shared UI helpers ---------- */
const topbar = ({ title = '', lead = 'back', trail = '', clear = false } = {}) =>
  `<header class="topbar ${clear ? 'clear' : ''}"><div class="row">
    ${lead ? `<button class="icon-btn tap" data-a="back" aria-label="${lead === 'x' ? 'Close' : 'Back'}">${ic(lead === 'x' ? 'x' : 'arrow-left')}</button>` : '<span style="width:44px"></span>'}
    <div class="title">${esc(title)}</div>
    ${trail || '<span style="width:44px"></span>'}
  </div></header>`;
const lrow = ({ lead = '', t, s = '', val = '', chev = true, a = '', data = '', cls = '' }) =>
  `<button class="lrow ${cls}" ${a ? `data-a="${a}"` : ''} ${data}>${lead}<span class="txt"><span class="t">${t}</span>${s ? `<span class="s">${s}</span>` : ''}</span>${val ? `<span class="val num">${val}</span>` : ''}${chev ? ic('chevron-right', 'chev') : ''}</button>`;
const list = (rows, inset = 76) => `<div class="card">${rows.map((r, i) => (i ? `<div class="divider" style="--div-inset:${inset}px"></div>` : '') + r).join('')}</div>`;
const thumb = img => `<img class="thumb" src="${IMG(img)}" alt="">`;
const ibox = n => `<span class="ibox">${ic(n)}</span>`;

const JOINED = { R: 'Joined 16 Sep', M: 'Joined 16 Sep', J: 'Joined 16 Sep' };
window.App = {
  group: () => ORDER.concat(['M', 'J']).filter(p => S.people.includes(p)),
  others: () => ORDER.concat(['M', 'J']).filter(p => S.people.includes(p) && p !== 'A'),
  names: ids => ids.map(p => PEOPLE[p].name).join(', ').replace(/, ([^,]*)$/, ' and $1'),
  roleOf: id => id === 'C' ? 'Organiser' : JOINED[id] || '',
  reveal: el => { const sc = el.closest('.scroll'); if (!sc) return; const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect(); sc.scrollTo({ top: sc.scrollTop + (r.top - s.top) - (s.height - r.height) / 2, behavior: 'smooth' }); },
  S: () => S, set, save, IMG, ic, esc, eur, wait, vibrate, PEOPLE, ORDER, PLACES, nameOf, av, stack, shares, total,
  drawer, dragY, def, act, push, pop, popTo, resetTo, refresh, current, stackEls, sheet, notify, toast, topbar, lrow, list, thumb, ibox,
  setTab: t => { tab = t; renderTabbar(); },
  reset: () => { localStorage.removeItem('tripup-v3'); S = initial(); tab = 'trips'; resetTo('trips'); },
  bleed: { t: 0, b: 0 },
  boot: () => { setupBleed(); $app.appendChild($tabbar); resetTo('trips', {}, 'fade'); },
};
})();
