/* TripUp · poll flow: new poll (C1/B3/C5), map pick (C2–C4), vote (C7–C9), result (C10), Nic's lock screen */
(() => {
const { def, act, push, pop, refresh, current, sheet, toast, notify, topbar, lrow, list, ibox, ic, esc, IMG, av, stack, PLACES, PEOPLE, set, wait, vibrate } = App;
const S = () => App.S();
const MAX = 4;
let D = null; // draft

App.startPoll = () => {
  D = { question: 'Where for dinner tonight?', time: '20:00', options: [], multi: false };
  push('pollNew', {}, 'modal');
};
act('newPoll', () => { if (S().poll && S().poll.status === 'live') { toast('A poll is already running for tonight', 'playing-cards-fan'); return push('pollView'); } App.startPoll(); });

const optRow = (o, i) => {
  const p = o.place && PLACES[o.place];
  return `<div class="lrow" style="cursor:default"><span class="badge" style="width:24px;height:24px;padding:0;justify-content:center">${i + 1}</span>
    ${p ? `<img class="thumb" src="${IMG(p.img)}" alt="">` : `<span class="ibox" style="width:48px;height:48px;font-weight:600;color:var(--text-secondary)">Aa</span>`}
    <span class="txt"><span class="t">${esc(p ? p.name : o.label)}</span>${p ? `<span class="s">${esc(p.type)} · ${p.dist}</span>` : ''}</span>
    <button class="icon-btn tap" data-a="rmOpt" data-i="${i}" aria-label="Remove">${ic('x', 'chev')}</button></div>`;
};

/* ---------- New poll form ---------- */
def('pollNew', () => {
  const n = D.options.length; const hasPlaces = D.options.some(o => o.place);
  return { html: `
  ${topbar({ title: 'New poll', lead: 'x' })}
  <div class="scroll"><div class="content" style="padding-top:8px;gap:16px">
    <label class="field"><span class="lbl">Question</span><input value="${esc(D.question)}" data-in="question"></label>
    <div class="row2"><div class="field"><span class="lbl">Day</span><div class="v">Today · Tue 16</div></div><label class="field"><span class="lbl">Time</span><input value="${esc(D.time)}" data-in="time" inputmode="numeric"></label></div>
    <div class="section-head" style="margin:8px 0 -4px"><h2 class="h3">Options</h2>${n >= MAX ? `<span class="b14 ter">${MAX} of ${MAX}</span>` : ''}</div>
    <div class="card opts">
      ${D.options.map((o, i) => (i ? '<div class="divider" style="--div-inset:112px"></div>' : '') + optRow(o, i)).join('')}
      ${n ? '<div class="divider" style="--div-inset:16px"></div>' : ''}
      ${!hasPlaces && n < MAX ? `<button class="lrow" data-a="pollMap" ${n ? '' : ''}>${ic('map-pinned')}<span class="txt"><span class="t">Add from map</span></span></button><div class="divider" style="--div-inset:52px"></div>` : ''}
      ${n < MAX ? `<div class="lrow typerow">${ic('plus')}<span class="txt"><input placeholder="Type an option" data-in="custom" enterkeyhint="done" style="font-weight:600"></span><button class="btn btn-sm btn-secondary tap addtyped" data-a="addTyped" style="display:none">Add</button></div>` : ''}
    </div>
    ${hasPlaces ? `<button class="link-btn tap" style="align-self:center" data-a="pollMap">${ic('map-pinned')}Edit on map</button>` : ''}
    <div class="card"><button class="lrow" data-a="multi" style="min-height:56px"><span class="txt"><span class="t" style="font-weight:400">Allow multiple choices</span></span><span class="tgl ${D.multi ? 'on' : ''}"></span></button></div>
  </div></div>
  <div class="actionbar"><div class="sum">${n < 2 ? `<div class="t">${n ? '1 option' : 'No options yet'}</div><div class="s">Add at least 2</div>` : `<div class="t">Notifies ${App.others().length} people</div><div class="s">${App.names(App.others())}</div>`}</div>
    <button class="btn btn-primary tap" data-a="sendPoll" ${n < 2 ? 'disabled' : ''}>Send poll</button></div>`,
  after: el => {
    el.querySelector('[data-in=question]').oninput = e => D.question = e.target.value;
    el.querySelector('[data-in=time]').oninput = e => D.time = e.target.value;
    const c = el.querySelector('[data-in=custom]');
    if (c) { const b = el.querySelector('.addtyped'); c.oninput = () => b.style.display = c.value.trim() ? '' : 'none'; c.onkeydown = e => { if (e.key === 'Enter') App.addTyped(); }; }
  } };
});
App.addTyped = () => { const c = current().el.querySelector('[data-in=custom]'); const v = c && c.value.trim(); if (!v) return; D.options.push({ label: v }); vibrate(6); refresh(current()); setTimeout(() => { const n = current().el.querySelector('[data-in=custom]'); n && n.focus(); }, 30); };
act('addTyped', () => App.addTyped());
act('rmOpt', d => { D.options.splice(+d.i, 1); vibrate(4); refresh(current()); });
act('multi', (d, b) => { D.multi = !D.multi; b.querySelector('.tgl').classList.toggle('on', D.multi); vibrate(4); });

/* ---------- Map pick (C2–C4) ---------- */
const FOOD = ['cavo', 'altar', 'fogo', 'sushi', 'trat', 'cafe'];
let sel = [];
def('pollMap', () => { const tall = current() && current().name === 'pollMap' && current().el.classList.contains('tall');
  return { html: `
  <div class="map"><img class="tiles" src="${IMG('map')}" alt=""><span class="me" style="left:46%;top:36%"></span>
    ${FOOD.map(id => { const pl = PLACES[id]; const i = sel.indexOf(id); return `<button class="pin ${i > -1 ? 'on' : ''}" style="left:${pl.x}%;top:${pl.y * 0.62 + 6}%" data-a="pin" data-id="${id}"><span class="pi">${i > -1 ? i + 1 : ic('utensils')}</span>${esc(pl.name)}</button>`; }).join('')}</div>
  <div class="topbar clear" style="z-index:11"><div class="row"><button class="icon-btn tap" data-a="back">${ic('arrow-left')}</button></div></div>
  <div class="preview" style="bottom:calc(46% + 12px)"></div>
  <div class="drawer" style="height:46%"><div class="grabber" style="margin-top:8px" data-a="drawer"></div>
    <div class="inner">
      <label class="search">${ic('search')}<input placeholder="Restaurants" data-in="q">${ic('x', 'clearq')}</label>
      <div class="chips" style="margin-top:12px"><button class="chip on">${ic('utensils')}Restaurants</button><button class="chip" data-a="soon">${ic('landmark')}Sights</button><button class="chip" data-a="soon">${ic('coffee')}Cafés</button></div>
      <div class="plist" style="margin-top:8px">${FOOD.map(id => { const p = PLACES[id]; const i = sel.indexOf(id); return `<div class="placerow" data-id="${id}"><img src="${IMG(p.img)}" alt=""><span style="flex:1;min-width:0"><span class="b16b" style="display:block">${esc(p.name)}</span><span class="b14 sec">${esc(p.type)} · ${p.dist}</span></span><button class="addbtn tap ${i > -1 ? 'on' : ''}" data-a="toggleSel" data-id="${id}" ${i < 0 && sel.length >= MAX ? 'style="opacity:.3"' : ''}>${i > -1 ? i + 1 : ic('plus')}</button></div>`; }).join('')}</div>
    </div>
    <div class="actionbar"><div class="sum"><div class="t">${sel.length ? sel.length + ' selected' : 'Pick 2 or more'}</div><div class="s">${sel.length >= MAX ? `${MAX} of ${MAX} · the maximum` : sel.map(id => PLACES[id].name).join(' · ') || 'Tap a pin or a row'}</div></div><button class="btn btn-primary tap" data-a="confirmSel" ${sel.length < 2 ? 'disabled' : ''}>Confirm</button></div>
  </div>`,
  after: el => {
    const q = el.querySelector('[data-in=q]'); const cq = el.querySelector('.clearq'); cq.style.display = 'none'; cq.style.cursor = 'pointer';
    q.onfocus = () => expandDrawer(el, true);
    q.oninput = () => { const v = q.value.toLowerCase(); cq.style.display = v ? '' : 'none'; el.querySelectorAll('.placerow').forEach(r => r.style.display = PLACES[r.dataset.id].name.toLowerCase().includes(v) || PLACES[r.dataset.id].type.toLowerCase().includes(v) ? '' : 'none'); };
    cq.onclick = () => { q.value = ''; q.oninput(); q.blur(); expandDrawer(el, false); };
    if (tall) expandDrawer(el, true, true);
    // drag drawer
    const dr = el.querySelector('.drawer'); let y0 = null;
    dr.querySelector('.grabber').addEventListener('touchstart', e => y0 = e.touches[0].clientY, { passive: true });
    dr.addEventListener('touchend', e => { if (y0 === null) return; const dy = e.changedTouches[0].clientY - y0; if (dy < -30) expandDrawer(el, true); if (dy > 30) expandDrawer(el, false); y0 = null; });
  } }; });
function expandDrawer(el, on, instant) { const dr = el.querySelector('.drawer'); if (instant) dr.style.transition = 'none'; dr.style.height = on ? 'calc(100% - var(--safe-top) - 64px)' : "46%"; el.classList.toggle('tall', on); closePreview(el); if (instant) requestAnimationFrame(() => dr.style.transition = ''); }
function closePreview(el) { const pv = el.querySelector('.preview'); pv && pv.classList.remove('in'); }
act('drawer', () => { const el = current().el; expandDrawer(el, !el.classList.contains('tall')); });
act('pollMap', () => { sel = D.options.filter(o => o.place).map(o => o.place); push('pollMap'); });
App.pollPin = id => {
  const el = current().el; const p = PLACES[id]; const pv = el.querySelector('.preview'); const i = sel.indexOf(id);
  el.querySelectorAll('.pin').forEach(x => x.style.zIndex = x.dataset.id === id ? 2 : '');
  pv.innerHTML = `<img src="${IMG(p.img)}" alt=""><div style="padding:14px 16px 16px"><div class="h3">${esc(p.name)}</div><div class="b14 sec">${esc(p.type)} · ${p.price} · ${p.dist}</div>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-secondary btn-sm tap" style="flex:1" data-a="placeInfo" data-id="${id}">Details</button><button class="btn ${i > -1 ? 'btn-secondary' : 'btn-primary'} btn-sm tap" style="flex:1" data-a="toggleSel" data-id="${id}" data-pv="1">${i > -1 ? 'Remove' : 'Add as option'}</button></div></div>`;
  lucide.createIcons(); pv.classList.remove('in'); void pv.offsetWidth; pv.classList.add('in'); vibrate(4);
};
act('toggleSel', d => {
  const i = sel.indexOf(d.id);
  if (i > -1) sel.splice(i, 1); else { if (sel.length >= MAX) { toast(`Up to ${MAX} options`, 'info'); return; } sel.push(d.id); }
  vibrate(6); const c = current(); const pv = d.pv; refresh(c);
  if (pv) { const el = c.el; closePreview(el); }
});
act('placeInfo', d => push('placeInfo', { id: d.id }));
act('confirmSel', () => {
  const typed = D.options.filter(o => !o.place);
  D.options = [...sel.map(id => ({ place: id })), ...typed].slice(0, MAX);
  pop(); setTimeout(() => refresh(current()), 10);
});

/* Place details (poll) · C3/C8 */
def('placeInfo', ({ id, vote }) => { const p = PLACES[id]; const s = S(); const poll = s.poll; const voters = poll ? Object.entries(poll.votes).filter(([, v]) => v === id).map(([k]) => k) : [];
  const mine = poll && poll.votes.A === id;
  return { html: `
  ${topbar({ title: p.name, clear: true })}
  <div class="scroll"><div class="hero" style="height:340px"><img src="${IMG(p.img)}" alt=""></div>
  <div class="sheet-body"><div class="content stagger" style="padding-bottom:40px">
    <div><h1 class="h1">${esc(p.name)}</h1><p class="b16 sec" style="margin-top:6px">${esc(p.desc || p.type)}</p></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);text-align:center;border-top:1px solid var(--border-default);border-bottom:1px solid var(--border-default);padding:14px 0">
      <div><div class="b16b">${p.dist}</div><div class="cap ter" style="text-transform:none;letter-spacing:0;font-size:12px">from you</div></div>
      <div><div class="b16b">${p.price}</div><div class="cap ter" style="text-transform:none;letter-spacing:0;font-size:12px">price</div></div>
      <div><div class="b16b">20:00</div><div class="cap ter" style="text-transform:none;letter-spacing:0;font-size:12px">table for 4</div></div></div>
    <div style="display:flex;gap:14px;align-items:center">${ibox('map-pinned')}<div><div class="b16b">${esc(p.addr)}</div><div class="b14 sec">${p.walk}</div></div></div>
    <div style="display:flex;gap:14px;align-items:center">${ibox('clock-4')}<div><div class="b16b">Open until 23:30</div><div class="b14 sec">Reservations recommended</div></div></div>
    ${voters.length ? `<div class="tile" style="display:flex;align-items:center;gap:12px">${stack(voters, 's')}<span class="b14 sec">${voters.map(v => App.nameOf(v)).join(', ')} chose this</span></div>` : ''}
  </div></div></div>
  ${vote ? `<div class="actionbar"><div class="sum"><div class="t">${voters.length ? voters.length + ' vote' + (voters.length > 1 ? 's' : '') + ' so far' : 'No votes yet'}</div></div><button class="btn btn-primary tap" data-a="vote" data-id="${id}">${mine ? 'Your vote' : poll && poll.votes.A ? 'Change to this' : 'Vote for this'}</button></div>` : ''}` }; });

/* ---------- Send + simulated group ---------- */
act('sendPoll', async () => {
  const el = current().el; D.question = el.querySelector('[data-in=question]').value || D.question;
  set(s => { s.poll = { question: D.question, time: D.time, options: D.options.map((o, i) => ({ id: o.place || 'c' + i, place: o.place, label: o.label })), votes: {}, status: 'live', multi: D.multi, at: Date.now() };
    const sl = s.plan.tue.find(x => x.slot); if (sl) sl.label = `Tonight · ${D.time}`; s.day = 'tue'; });
  pop(); toast(`Poll sent to ${App.names(App.others())}`, 'send');
  setTimeout(() => { const c = current(); if (c.name === 'trip') refresh(c, true); }, 520);
  simulateVotes();
});
let simT = [];
function simulateVotes() {
  simT.forEach(clearTimeout); simT = [];
  const opts = S().poll.options.map(o => o.id);
  const pickFor = { C: opts.includes('fogo') ? 'fogo' : opts[0], N: opts.includes('fogo') ? 'fogo' : opts[1] || opts[0], R: opts.includes('cavo') ? 'cavo' : opts[opts.length - 1] };
  const plan = [['C', 3500], ['N', 9000]];
  plan.forEach(([who, t]) => simT.push(setTimeout(() => castVote(who, pickFor[who]), t)));
  App._pickRen = pickFor.R;
}
function castVote(who, id) {
  const s = S(); if (!s.poll || s.poll.status !== 'live') return;
  set(s => s.poll.votes[who] = id);
  const opt = S().poll.options.find(o => o.id === id); const name = opt.place ? PLACES[opt.place].name : opt.label;
  const c = current();
  if (c.name === 'pollView') refreshResults(c); else if (c.name === 'trip' || c.name === 'trips') refresh(c);
  if (c.name !== 'pollView') notify({ title: 'Dinner poll', body: `${PEOPLE[who].name} voted ${name}`, icon: 'playing-cards-fan', onTap: () => push('pollView') });
  checkClose();
}
function checkClose() {
  const s = S(); const v = s.poll.votes;
  // Ren votes last, a few seconds after Ari has voted
  if (v.A && App.group().includes('R') && !v.R && !App._renQueued) { App._renQueued = true; simT.push(setTimeout(() => { App._renQueued = false; castVote('R', App._pickRen); }, 5000)); }
  if (App.group().every(k => v[k])) setTimeout(closePoll, 1400);
}
function tally(p) { const t = {}; p.options.forEach(o => t[o.id] = 0); Object.values(p.votes).forEach(id => t[id]++); return t; }
function closePoll() {
  const s = S(); if (s.poll.status !== 'live') return;
  const t = tally(s.poll); const max = Math.max(...Object.values(t)); const lead = Object.keys(t).filter(k => t[k] === max);
  const winner = lead.includes(s.poll.votes.A) ? s.poll.votes.A : lead[0];   // tie → poll creator's choice
  const opt = s.poll.options.find(o => o.id === winner); const p = opt.place && PLACES[opt.place];
  const score = `${t[winner]}–${Object.values(t).reduce((a, b) => a + b, 0) - t[winner]}`;
  set(s => {
    s.poll.status = 'closed'; s.poll.winner = winner; s.poll.score = score;
    const ev = { id: 'win', cat: 'Dinner · from poll ' + score, title: p ? p.name : opt.label, time: s.poll.time, cost: "0€", img: p ? p.img : 'baixa', place: opt.place };
    const i = s.plan.tue.findIndex(x => x.slot); if (i > -1) s.plan.tue.splice(i, 1, ev); else s.plan.tue.push(ev);
    s.freshId = 'win'; s.day = 'tue';
  });
  vibrate([10, 60, 10]);
  const c = current();
  if (c.name === 'pollView') refreshResults(c);
  notify({ title: `${p ? p.name : opt.label} won · ${score}`, body: 'Added to tonight’s plan for everyone', icon: 'party-popper', onTap: () => openPlanAfterPoll() });
  if (c.name === 'trip') { refresh(c); setTimeout(() => { const f = c.el.querySelector('.ev.fresh'); f && App.reveal(f); }, 200); }
  setTimeout(() => set(s => delete s.freshId), 6000);
}
function openPlanAfterPoll() {
  const st = App.stackEls; const i = st.findIndex(x => x.name === 'trip');
  if (i > -1) { App.pop(st.length - 1 - i); setTimeout(() => { const c = current(); refresh(c); const f = c.el.querySelector('.ev.fresh') || c.el.querySelector('.dayplan'); f && App.reveal(f); }, 520); }
  else push('trip', { scrollTo: '.ev.fresh' });
}
App.openPlanAfterPoll = openPlanAfterPoll;

/* ---------- Poll view: options → results ---------- */
act('openPoll', () => push('pollView'));
def('pollView', () => {
  const s = S(); const p = s.poll; if (!p) return { html: topbar({ title: 'Poll' }) };
  const t = tally(p); const n = Object.keys(p.votes).length; const closed = p.status === 'closed';
  const voted = !!p.votes.A;
  const sorted = [...p.options].sort((a, b) => voted || closed ? t[b.id] - t[a.id] : 0);
  const max = Math.max(1, ...Object.values(t)); const lead = voted || closed ? sorted[0].id : null;
  const waiting = App.group().filter(k => !p.votes[k]).map(k => App.nameOf(k));
  const optHTML = o => { const pl = o.place && PLACES[o.place]; const vs = Object.entries(p.votes).filter(([, v]) => v === o.id).map(([k]) => k);
    return voted || closed
      ? `<button class="opt ${o.id === lead && t[lead] > 0 ? 'lead' : ''}" data-id="${o.id}" data-a="${pl ? 'optInfo' : 'noop'}">${pl ? `<img src="${IMG(pl.img)}" alt="">` : `<span class="ibox" style="width:56px;height:56px">Aa</span>`}
          <span class="txt"><span style="display:flex;align-items:center;gap:8px"><span class="b16b" style="flex:1">${esc(pl ? pl.name : o.label)}</span>${o.id === lead && t[lead] > 0 ? `<span class="badge ink">${closed ? 'Winner' : 'Leading'}</span>` : ''}</span>
          ${p.votes.A === o.id ? '<span class="b14 sec" style="font-size:12px">Your vote</span>' : ''}
          <span class="vrow"><span class="bar"><i style="width:${(t[o.id] / max) * 100}%"></i></span>${stack(vs, 's')}<span class="cnt num">${t[o.id]}</span></span></span></button>`
      : `<button class="lrow" data-a="${pl ? 'optInfo' : 'voteNow'}" data-id="${o.id}">${pl ? `<img class="thumb" src="${IMG(pl.img)}" alt="" style="width:56px;height:56px;border-radius:14px">` : '<span class="ibox" style="width:56px;height:56px">Aa</span>'}<span class="txt"><span class="t">${esc(pl ? pl.name : o.label)}</span>${pl ? `<span class="s">${esc(pl.type)} · ${pl.dist}</span>` : ''}</span><span class="b14 sec">${t[o.id] ? t[o.id] + ' vote' + (t[o.id] > 1 ? 's' : '') : 'No votes'}</span>${ic('chevron-right', 'chev')}</button>`; };
  const acts = Object.entries(p.votes).map(([k, v]) => [k, v]).reverse();
  return { html: `
  ${topbar({ title: 'Dinner poll', trail: `<button class="icon-btn tap" data-a="pollMenu">${ic('ellipsis')}</button>` })}
  <div class="scroll"><div class="content stagger" style="padding-top:4px;gap:20px">
    <div><div style="display:flex;align-items:center;gap:8px"><span class="badge">${closed ? '<span class="dot"></span>Closed' : '<span class="dot live"></span>Live'}</span><span class="b14 sec">Started by you</span></div>
      <h1 class="h1" style="margin-top:10px">${esc(p.question)}</h1></div>
    <div class="card results">${sorted.map((o, i) => (i ? '<div class="divider" style="--div-inset:86px"></div>' : '') + optHTML(o)).join('')}</div>
    ${acts.length ? `<div><div class="b14 sec" style="margin-bottom:8px">Activity</div>${acts.map(([k, v], i) => { const o = p.options.find(x => x.id === v); return `<div style="display:flex;align-items:center;gap:12px;padding:6px 0">${av(k, 's')}<span class="b14" style="flex:1">${App.nameOf(k)} voted ${esc(o.place ? PLACES[o.place].name : o.label)}</span><span class="b14 ter" style="font-size:12px">${i === 0 ? 'just now' : (i * 2) + ' min'}</span></div>`; }).join('')}</div>`
      : ''}
  </div></div>
  ${closed ? `<div class="actionbar"><div class="sum"><div class="t">Added to tonight</div><div class="s">${p.time} · everyone notified</div></div><button class="btn btn-primary tap" data-a="seePlan">See plan</button></div>`
    : voted ? `<div class="actionbar"><div class="sum"><div class="t num">${n} of ${App.group().length} voted</div><div class="s">Waiting for ${waiting.join(', ').replace(/, ([^,]*)$/, ' and $1')}</div></div><button class="btn btn-secondary tap" data-a="changeVote">Change vote</button></div>` : ''}` };
});
function refreshResults(c) {
  // FLIP: animate reorder and bars
  const before = {}; c.el.querySelectorAll('.results [data-id]').forEach(x => before[x.dataset.id] = x.getBoundingClientRect().top);
  const widths = {}; c.el.querySelectorAll('.results [data-id] .bar i').forEach(x => widths[x.closest('[data-id]').dataset.id] = x.style.width);
  refresh(c);
  c.el.querySelectorAll('.results [data-id]').forEach(x => {
    const id = x.dataset.id; const b = before[id]; const a = x.getBoundingClientRect().top;
    if (b !== undefined && b !== a) { x.style.transform = `translateY(${b - a}px)`; requestAnimationFrame(() => { x.style.transition = 'transform 600ms var(--spring)'; x.style.transform = ''; }); }
    const bar = x.querySelector('.bar i'); if (bar && widths[id] !== undefined) { const w = bar.style.width; bar.style.width = widths[id]; requestAnimationFrame(() => requestAnimationFrame(() => bar.style.width = w)); }
  });
}
act('optInfo', d => { if (S().poll.status === 'closed') return; push('placeInfo', { id: d.id, vote: 1 }); });
act('noop', () => {});
act('voteNow', d => App.doVote(d.id));
act('vote', d => App.doVote(d.id));
App.doVote = id => {
  const first = !S().poll.votes.A;
  set(s => s.poll.votes.A = id); vibrate([6, 30, 6]);
  const st = App.stackEls; const i = st.findIndex(x => x.name === 'pollView');
  const go = () => { const c = current(); if (c.name === 'pollView') { refresh(c, true); } };
  if (current().name !== 'pollView') { pop(); setTimeout(go, 20); } else go();
  toast(first ? 'Vote in · results are live' : 'Vote changed', 'check');
  checkClose();
};
act('changeVote', () => { set(s => delete s.poll.votes.A); refresh(current(), true); });
act('seePlan', () => openPlanAfterPoll());
act('pollMenu', () => sheet(`<div class="sheet-head"><div><h2 class="h2">Dinner poll</h2><div class="b14 sec">Demo tools</div></div><button class="close-circle tap" data-close>${ic('x')}</button></div>
  <div class="card">${lrow({ lead: ibox('smartphone'), t: 'See Nic’s lock screen', s: 'What participants receive', a: 'nicLock', data: 'data-close' })}<div class="divider" style="--div-inset:68px"></div>${lrow({ lead: ibox('fast-forward'), t: 'Everyone votes now', s: 'Skip the waiting', a: 'skipVotes', data: 'data-close' })}</div>`));
act('skipVotes', () => { const p = S().poll; const ids = p.options.map(o => o.id); simT.forEach(clearTimeout); ['C', 'N'].forEach(k => { if (!p.votes[k]) set(s => s.poll.votes[k] = ids.includes('fogo') ? 'fogo' : ids[0]); }); if (!S().poll.votes.A) set(s => s.poll.votes.A = ids.includes('fogo') ? 'fogo' : ids[0]); if (App.group().includes('R')) set(s => s.poll.votes.R = App._pickRen || ids[ids.length - 1]); refresh(current(), true); setTimeout(closePoll, 900); });

/* ---------- Nic's lock screen (W04) ---------- */
def('nicLock', () => { const p = S().poll; return { html: `
  <div class="lock" style="background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.5)),url(${IMG('torel')})">
    <span class="phone-tag" style="background:#fff;color:var(--ink)">Nic’s phone</span>
    <div class="date">Tuesday 16 September</div><div class="time">18:12</div>
    <div class="n"><div style="display:flex;gap:10px;align-items:center"><span class="notif-ic" style="width:32px;height:32px;border-radius:9px;background:var(--ink);color:#fff;display:grid;place-items:center">${ic('playing-cards-fan')}</span><span class="b14b" style="flex:1">Ari started a poll</span><span class="b14 ter" style="font-size:12px">now</span></div>
      <div class="b14" style="margin-top:6px">${esc(p ? p.question : 'Where for dinner tonight?')} ${p ? p.options.length : 3} places to choose from</div>
      <div style="display:flex;gap:6px;margin-top:10px">${(p ? p.options : []).filter(o => o.place).map(o => `<img src="${IMG(PLACES[o.place].img)}" style="flex:1;height:64px;object-fit:cover;border-radius:10px" alt="">`).join('')}</div></div>
    <div class="acts">${(p ? p.options : []).map(o => `<button data-a="nicVote" data-id="${o.id}">Vote ${esc(o.place ? PLACES[o.place].name : o.label)}</button>`).join('')}<button data-a="back">Open poll</button></div>
    <button class="demo-pill tap" data-a="back">Back to Ari’s phone</button>
  </div>` }; });
act('nicLock', () => push('nicLock', {}, 'modal'));
act('nicVote', d => { pop(); simT.forEach(clearTimeout); setTimeout(() => castVote('N', d.id), 500); if (!S().poll.votes.C) simT.push(setTimeout(() => castVote('C', 'fogo'), 2500)); });
})();
