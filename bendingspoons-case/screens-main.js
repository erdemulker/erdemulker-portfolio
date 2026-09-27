/* TripUp · main screens: Trips, Trip, Budget, Profile, Create, Add to plan, Invite, New trip */
(() => {
const { def, act, push, pop, popTo, resetTo, refresh, current, sheet, toast, notify, topbar, lrow, list, thumb, ibox, ic, esc, eur, IMG, av, stack, shares, total, PLACES, PEOPLE, nameOf, set, wait, vibrate } = App;
const S = () => App.S();
const owersTxt = st => { const b = shares(st); const o = App.others().filter(x => b[x] < -0.5).map(x => PEOPLE[x].name); return o.length ? 'From ' + o.join(', ').replace(/, ([^,]*)$/, ' and $1') : 'Across the whole trip'; };
const balTxtOf = v => Math.abs(v) < 1 ? 'All settled' : v > 0 ? `You’re owed ${eur(v)}` : `You owe ${eur(-v)}`;
const xsum = (st, label = 'Trip total') => { const bal = shares(st).A; return `<div class="xsum"><div><div class="lbl">${label}</div><div class="val num"><b>${Math.round(total(st))}</b><span>€</span></div></div><hr><div class="bal"><span style="flex:1;min-width:0"><span class="t">${balTxtOf(bal)}</span><span class="s">${owersTxt(st)}</span></span>${bal > 0.5 ? `<button class="btn btn-sm btn-primary tap" data-a="settle">Settle up</button>` : ''}</div></div>`; };
App.xsum = xsum;

/* ================= A1 Trips ================= */
def('trips', () => {
  const s = S(); const bal = shares(s).A;
  const pollLive = s.poll && s.poll.status === 'live';
  const nextLine = pollLive ? ['playing-cards-fan', 'Dinner poll · ' + (s.poll.votes.A ? `${Object.keys(s.poll.votes).length} of ${App.group().length} voted` : 'vote now')]
    : s.poll && s.poll.status === 'closed' ? ['utensils', `Tonight · ${PLACES[s.poll.winner].name}, 20:00`]
    : ['calendar-clock', 'Tonight · free from 18:00'];
  const balLine = Math.abs(bal) < 1 ? 'All settled' : bal > 0 ? `You’re owed ${eur(bal)}` : `You owe ${eur(-bal)}`;
  return { html: `
  <div class="scroll"><div class="largetitle"><h1 class="h1" style="font-size:32px;line-height:38px">Trips</h1></div>
  <div class="content stagger" style="padding-top:12px">
    <button class="tripcard tap-soft" data-a="openTrip">
      <div class="cover"><img src="${IMG('castelo')}" alt=""></div>
      <div class="body">
        <span class="badge" style="align-self:flex-start"><span class="dot live"></span>Ongoing</span>
        <span class="h3" style="margin-top:6px">Lisboa trip, with friends</span>
        <span class="b14 sec">15 – 16 Sep · ${s.people.length} people</span>
        <span class="next"><span class="ic">${ic(nextLine[0])}</span><span style="flex:1;min-width:0"><span class="b16b" style="display:block">${nextLine[1]}</span><span class="b14 sec">${balLine}</span></span>${ic('chevron-right', 'chev')}</span>
      </div>
    </button>
    <div class="section-head"><h2 class="h3">Upcoming</h2></div>
    ${list([lrow({ lead: thumb('torel'), t: 'Porto weekend', s: '7 – 9 Nov · 5 people · planning', a: 'soon' })])}
    <div class="section-head"><h2 class="h3">Past</h2></div>
    ${list([lrow({ lead: thumb('baixa'), t: 'Madrid', s: 'March · settled', a: 'soon' })])}
  </div></div>` };
});
act('openTrip', () => push('trip'));
act('soon', () => toast('Only the Lisbon trip is live in this demo', 'info'));

/* ================= A2 Trip ================= */
const evCard = (e, fresh) => e.slot
  ? `<button class="slot tap-soft" data-a="slot"><span class="ic">${ic('plus')}</span><span style="flex:1"><span class="eyebrow" style="display:block">${esc(e.label)}</span><span class="b16b">${S().poll && S().poll.status === 'live' ? 'Dinner · the group is deciding' : 'Add or decide together'}</span></span></button>`
  : `<div class="ev ${fresh ? 'fresh' : ''}"><img src="${IMG(e.img)}" alt=""><div class="txt"><div class="eyebrow">${esc(e.cat)}</div><div class="t">${esc(e.title)}</div><div class="m num">${e.time} · <b>${esc(e.cost)}</b></div></div><button class="icon-btn tap" data-a="evMenu" data-id="${e.id}">${ic('ellipsis')}</button></div>`;

def('trip', (p) => {
  const s = S(); const bal = shares(s).A; const tot = total(s);
  const poll = s.poll; const live = poll && poll.status === 'live';
  const nVotes = poll ? Object.keys(poll.votes).length : 0;
  const balTxt = Math.abs(bal) < 1 ? 'All settled' : bal > 0 ? `You’re owed ${eur(bal)}` : `You owe ${eur(-bal)}`;
  const recent = s.expenses.slice(0, 3);
  return { html: `
  ${topbar({ title: 'Lisboa trip', clear: true, trail: `<button class="icon-btn tap" data-a="soon">${ic('ellipsis')}</button>` })}
  <div class="scroll">
    <div class="hero"><img src="${IMG('castelo')}" alt="Castelo de São Jorge"></div>
    <div class="sheet-body"><div class="content stagger">
      <div>
        <div class="eyebrow">Lisboa, Portugal</div>
        <h1 class="h1" style="margin-top:6px">Lisboa trip, with friends</h1>
        <div class="b14 sec" style="display:flex;gap:6px;align-items:center;margin-top:6px">${ic('calendar', '')}<span>15 – 16 Sep · 2 days</span></div>
      </div>
      <div class="row2">
        <button class="tile tile-top tap-soft" data-a="people"><div class="tile-head b14 sec">${s.people.length} people ${ic('chevron-right')}</div><div style="margin-top:16px">${stack(App.group())}</div></button>
        <button class="tile tile-top inverse spend tap-soft" data-a="tripExpenses"><div class="tile-head b14" style="opacity:.72">Trip total ${ic('chevron-right')}</div><div class="amt num">${eur(tot)}</div><div class="bal"><i></i>${balTxt}</div></button>
      </div>
      ${live ? `<button class="pollcard tap-soft" data-a="openPoll">
        <span class="thumbs">${poll.options.slice(0, 3).map(o => `<img src="${IMG(o.place ? PLACES[o.place].img : 'baixa')}" alt="">`).join('')}</span>
        <span style="flex:1;min-width:0"><span class="badge"><span class="dot live"></span>Poll</span><span class="b16b" style="display:block;margin-top:6px">Dinner tonight</span><span class="b14 sec">${poll.votes.A ? `You voted · ${nVotes} of ${App.group().length} in` : `${nVotes} of ${App.group().length} voted`}</span></span>
        <span class="btn btn-sm ${poll.votes.A ? 'btn-secondary' : 'btn-primary'}">${poll.votes.A ? 'Results' : 'Vote'}</span></button>` : ''}
      <div class="section-head"><h2 class="h2">Trip plan</h2><button class="link-btn tap" data-a="planAdd">Add ${ic('plus')}</button></div>
      <div class="chips">${[['mon', 'Mon 15'], ['tue', 'Today · Tue 16']].map(([k, l]) => `<button class="chip tap ${s.day === k ? 'on' : ''}" data-a="day" data-d="${k}">${l}</button>`).join('')}</div>
      <div class="dayplan" style="display:flex;flex-direction:column;gap:12px">${s.plan[s.day].map(e => evCard(e, e.id === s.freshId)).join('')}</div>
    </div></div>
  </div>`, after: el => { if (p.scrollTo) setTimeout(() => { const t = el.querySelector(p.scrollTo); t && App.reveal(t); }, 520); } };
});
act('day', d => { if (S().day === d.d) return; set(s => s.day = d.d); const c = current(); const dp = c.el.querySelector('.dayplan'); dp.style.transition = 'opacity 160ms'; dp.style.opacity = 0; c.el.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('on', ch.dataset.d === d.d)); setTimeout(() => { const s = S(); dp.innerHTML = s.plan[s.day].map(e => evCard(e)).join(''); lucide.createIcons(); dp.classList.add('stagger'); dp.style.opacity = 1; }, 170); });
act('slot', () => { const s = S(); if (s.poll && s.poll.status === 'live') return push('pollView'); planAddSheet('Today · free from 18:00'); });
act('planAdd', () => planAddSheet(S().day === 'mon' ? 'Mon 15 Sep' : 'Today · Tue 16'));
function planAddSheet(sub) {
  const s = S(); const live = s.poll && s.poll.status === 'live';
  sheet(`<div class="sheet-head"><div><h2 class="h2">Add to trip plan</h2><div class="b14 sec">${sub}</div></div><button class="close-circle tap" data-close>${ic('x')}</button></div>
    <div class="stagger" style="display:flex;flex-direction:column;gap:12px">
      <button class="lrow card tap-soft" data-a="${live ? 'openPoll' : 'slotPoll'}" data-close>${ibox('playing-cards-fan')}<span class="txt"><span class="t">Decide together</span><span class="s">${live ? 'A poll is running · see results' : 'Start a poll · everyone votes'}</span></span>${ic('chevron-right', 'chev')}</button>
      <button class="lrow card tap-soft" data-a="addPlan" data-close>${ibox('map-pinned')}<span class="txt"><span class="t">Add an event</span><span class="s">Pick a place and a time yourself</span></span>${ic('chevron-right', 'chev')}</button>
    </div>`);
}
act('slotPoll', () => App.startPoll({ fromSlot: true }));
act('tripExpenses', () => push('tripExpenses'));
act('evMenu', d => {
  const s = S(); const e = [...s.plan.mon, ...s.plan.tue].find(x => x.id === d.id);
  sheet(`<div class="sheet-head"><div><h2 class="h2">${esc(e.title)}</h2><div class="b14 sec">${e.time} · ${esc(e.cost)}</div></div><button class="close-circle tap" data-close>${ic('x')}</button></div>
  <div class="card">${[lrow({ lead: ibox('banknote'), t: 'Add expense for this', a: 'newExpense', data: `data-link="${e.id}" data-close` }), lrow({ lead: ibox('clock-4'), t: 'Change time', a: 'soon', data: 'data-close' }), lrow({ lead: `<span class="ibox" style="color:var(--error)">${ic('trash-2')}</span>`, t: '<span style="color:var(--error)">Delete event</span>', a: 'delEvent', chev: false, data: `data-id="${e.id}" data-close` })].join('<div class="divider" style="--div-inset:68px"></div>')}</div>`);
});
act('delEvent', d => {
  const c = current(); const card = c.el.querySelector(`[data-a=evMenu][data-id="${d.id}"]`); const ev = card && card.closest('.ev');
  const done = () => { let removed; set(s => { for (const k of ['mon', 'tue']) { const i = s.plan[k].findIndex(e => e.id === d.id); if (i > -1) { removed = s.plan[k][i]; s.plan[k].splice(i, 1); if (d.id === 'win' || (k === 'tue' && parseInt(removed.time) >= 18 && !s.plan.tue.some(e => e.slot))) s.plan.tue.push({ id: 'slot', slot: true, label: 'This evening · free from 18:00' }); } } }); refresh(current()); toast(`${removed ? removed.title : 'Event'} deleted`, 'trash-2'); };
  if (ev) { ev.style.transition = 'transform 360ms var(--spring), opacity 260ms, max-height 360ms var(--spring), margin 360ms'; ev.style.maxHeight = ev.offsetHeight + 'px'; requestAnimationFrame(() => { ev.style.transform = 'translateX(-24px)'; ev.style.opacity = 0; ev.style.maxHeight = 0; ev.style.marginBottom = '-12px'; }); setTimeout(done, 380); } else done();
});
act('people', () => sheet(`<div class="sheet-head"><div><h2 class="h2">${S().people.length} people</h2><div class="b14 sec">Clara organises</div></div><button class="close-circle tap" data-close>${ic('x')}</button></div>
  <div class="card stagger">${App.group().map(id => lrow({ lead: av(id), t: id === 'A' ? 'You' : PEOPLE[id].name, s: App.roleOf(id), chev: false })).join('<div class="divider" style="--div-inset:68px"></div>')}</div>
  <button class="btn btn-secondary btn-block tap" style="margin-top:16px" data-a="invite" data-close>${ic('users-round')}Add people</button>`));

/* ================= A5 Create ================= */
App.openCreate = () => {
  const fab = document.querySelector('.fab svg'); if (fab) fab.style.transform = 'rotate(45deg)';
  sheet(`<div class="sheet-head"><div><h2 class="h2">Create</h2><div class="b14 sec">Lisboa trip · Today</div></div><button class="close-circle tap" data-close>${ic('x')}</button></div>
  <div class="cgrid stagger">
    ${[['addPlan', 'calendar', 'Add to plan', 'Place, activity or time block'], ['newPoll', 'playing-cards-fan', 'Poll', 'Let the group decide anything'], ['newExpense', 'banknote', 'Expense', 'Log a cost, split per item'], ['invite', 'users-round', 'Invite people', 'Share a link or pick contacts']]
      .map(([a, i, t, s]) => `<button class="ctile tap" data-a="${a}" data-close><span class="ic">${ic(i)}</span><span><span class="t" style="display:block">${t}</span><span class="s">${s}</span></span></button>`).join('')}
  </div>
  <button class="lrow card tap-soft" style="margin-top:12px" data-a="newTrip" data-close>${ibox('plus')}<span class="txt"><span class="t">New trip</span><span class="s">Start planning somewhere else</span></span>${ic('chevron-right', 'chev')}</button>`,
  { onClose: () => { const f = document.querySelector('.fab svg'); if (f) f.style.transform = ''; } });
};

/* ================= B1 Add to plan (map, single select) ================= */
const mapLayer = (pins, sel = []) => `<div class="map"><img class="tiles" src="${IMG('map')}" alt="">
  <span class="me" style="left:46%;top:36%"></span>
  ${pins.map(id => { const pl = PLACES[id]; const i = sel.indexOf(id); return `<button class="pin ${i > -1 ? 'on' : ''}" style="left:${pl.x}%;top:${pl.y * 0.62 + 6}%" data-a="pin" data-id="${id}"><span class="pi">${i > -1 && sel.length > 1 ? i + 1 : ic('utensils')}</span>${esc(pl.name)}</button>`; }).join('')}</div>`;
const FOOD = ['cavo', 'altar', 'fogo', 'sushi', 'trat', 'cafe'];
def('addPlan', () => ({ html: `
  ${mapLayer(FOOD)}
  <div class="topbar clear" style="z-index:11"><div class="row"><button class="icon-btn tap" data-a="back">${ic('x')}</button></div></div>
  <div class="drawer" style="height:56%"><div class="grabber" style="margin-top:8px"></div>
    <div class="inner">
      <label class="search">${ic('search')}<input placeholder="Search places" data-in="q"></label>
      <div class="chips" style="margin-top:12px"><button class="chip on">${ic('utensils')}Food</button><button class="chip" data-a="soon">${ic('landmark')}Sights</button><button class="chip" data-a="soon">${ic('trees')}Outdoors</button></div>
      <div class="stagger" style="margin-top:8px;padding-bottom:calc(var(--safe-bot) + 16px)">${FOOD.map(id => { const p = PLACES[id]; return `<button class="placerow tap-soft" data-a="placeOpen" data-id="${id}"><img src="${IMG(p.img)}" alt=""><span style="flex:1;min-width:0"><span class="b16b" style="display:block">${esc(p.name)}</span><span class="b14 sec">${esc(p.type)} · ${p.dist}</span></span>${ic('chevron-right', 'chev')}</button>`; }).join('')}</div>
    </div></div>`,
  after: el => { const q = el.querySelector('[data-in=q]'); q.oninput = () => { const v = q.value.toLowerCase(); el.querySelectorAll('.placerow').forEach(r => r.style.display = PLACES[r.dataset.id].name.toLowerCase().includes(v) ? '' : 'none'); }; } }));
act('addPlan', () => push('addPlan', {}, 'modal'));
act('pin', d => { const c = current(); if (c.name === 'addPlan') push('placeAdd', { id: d.id }); else App.pollPin && App.pollPin(d.id); });
act('placeOpen', d => push('placeAdd', { id: d.id }));

/* B2 Place · add to plan */
def('placeAdd', ({ id }) => { const p = PLACES[id]; return { html: `
  ${topbar({ title: p.name, clear: true, trail: `<button class="icon-btn tap" data-a="soon">${ic('ellipsis')}</button>` })}
  <div class="scroll"><div class="hero" style="height:320px"><img src="${IMG(p.img)}" alt=""></div>
  <div class="sheet-body"><div class="content stagger" style="padding-bottom:40px">
    <div><h1 class="h1">${esc(p.name)}</h1><div class="b16 sec" style="margin-top:6px">${esc(p.type)} · ${p.price} · ${p.dist}</div></div>
    ${p.desc ? `<p class="b16 sec">${esc(p.desc)}</p>` : ''}
    <div style="display:flex;gap:14px;align-items:center">${ibox('map-pinned')}<div><div class="b16b">${esc(p.addr)}</div><div class="b14 sec">${p.walk}</div></div></div>
    <div class="section-head"><h2 class="h3">When</h2></div>
    <div class="row2"><label class="field"><span class="lbl">Day</span><div class="v">Today · Tue 16</div></label><label class="field"><span class="lbl">Time</span><input value="20:00" data-in="time" inputmode="numeric"></label></div>
  </div></div></div>
  <div class="actionbar"><button class="btn btn-primary btn-block tap" data-a="addToPlan" data-id="${id}">Add to plan</button></div>` }; });
act('addToPlan', d => {
  const p = PLACES[d.id]; const t = current().el.querySelector('[data-in=time]').value || '20:00';
  set(s => { const ev = { id: 'e' + Date.now(), cat: p.type.split(' ·')[0], title: p.name, time: t, cost: p.price, img: p.img }; const i = s.plan.tue.findIndex(x => x.slot); if (i > -1 && parseInt(t) >= 18) s.plan.tue.splice(i, 1, ev); else s.plan.tue.push(ev); s.plan.tue.sort((a, b) => (a.slot ? '18' : a.time).localeCompare(b.slot ? '18' : b.time)); s.day = 'tue'; s.freshId = ev.id; });
  pop(2); toast(`${p.name} added to today`);
  setTimeout(() => { const c = current(); if (c.name === 'trip') { refresh(c); const f = c.el.querySelector('.ev.fresh'); f && App.reveal(f); } }, 520);
  setTimeout(() => set(s => delete s.freshId), 2500);
});

/* ================= B5 Invite ================= */
def('invite', () => ({ html: `
  ${topbar({ title: 'Invite people', lead: 'x' })}
  <div class="scroll"><div class="content stagger" style="padding-top:8px">
    <div class="card" style="display:flex;align-items:center;gap:12px;padding:16px">${ibox('link')}<div style="flex:1"><div class="b16b">Invite link</div><div class="b14 sec">tripup.app/j/lisboa-4f2</div></div><button class="btn btn-sm btn-secondary tap" data-a="copyLink">Share</button></div>
    <label class="search">${ic('search')}<input placeholder="Search contacts"></label>
    <div class="section-head"><h2 class="h3">Contacts</h2></div>
    <div class="card">${[['R', 'Ren Costa', '+351 912 •••• · in your contacts'], ['M', 'Mia Santos', 'Travelled with you · Madrid'], ['J', 'João Silva', 'In your contacts']].filter(([id]) => !S().people.includes(id)).map(([id, n, s], i) => `${i ? '<div class="divider" style="--div-inset:68px"></div>' : ''}<button class="lrow" data-a="pick" data-id="${id}">${av(id)}<span class="txt"><span class="t">${n}</span><span class="s">${s}</span></span><span class="cbx">${ic('check')}</span></button>`).join('')}</div>
  </div></div>
  <div class="actionbar"><button class="btn btn-primary btn-block tap" data-a="sendInvite" disabled>Invite</button></div>`,
  after: el => segInit(el) }));
function segInit(el) { el.querySelectorAll('.seg').forEach(sg => { const on = sg.querySelector('button.on'); const ind = sg.querySelector('.thumb-ind'); const bs = [...sg.querySelectorAll('button')]; ind.style.width = `calc(${100 / bs.length}% - 4px)`; ind.style.transform = `translateX(${bs.indexOf(on) * 100}%)`; }); }
App.segInit = segInit;
act('seg', (d, b) => { const sg = b.closest('.seg'); sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); segInit(sg.parentElement); vibrate(4);
  const note = current().el.querySelector('.scope-note'); if (note) note.textContent = d.v === 'event' ? 'They see tonight’s dinner and only share its costs.' : 'They see the whole plan and share all trip costs from now on.';
  App.onSeg && App.onSeg(d.v, b); });
act('pick', (d, b) => { b.querySelector('.cbx').classList.toggle('on'); vibrate(4); const n = current().el.querySelectorAll('.cbx.on').length; const btn = current().el.querySelector('[data-a=sendInvite]'); btn.disabled = !n; btn.textContent = n ? `Invite ${n} ${n > 1 ? 'people' : 'person'}` : 'Invite'; });
act('copyLink', () => toast('Link copied', 'link'));
act('invite', () => push('invite', {}, 'modal'));
act('sendInvite', () => {
  const ids = [...current().el.querySelectorAll('.cbx.on')].map(c => c.closest('[data-id]').dataset.id);
  set(s => ids.forEach(id => { if (!s.people.includes(id)) s.people.push(id); }));
  pop(); toast(`${App.names(ids)} joined the trip`, 'users-round');
  setTimeout(() => { const c = current(); if (c) refresh(c); }, 480);
});

/* ================= B6 New trip ================= */
def('newTrip', () => ({ html: `
  ${topbar({ title: 'New trip', lead: 'x' })}
  <div class="scroll"><div class="content stagger" style="padding-top:8px">
    <button class="tile tap-soft" style="height:160px;display:grid;place-items:center;border:1.5px dashed var(--border-strong);background:var(--bg-subtle)" data-a="soon"><span style="display:grid;justify-items:center;gap:6px">${ic('image-plus')}<span class="b14 sec">Add a cover photo</span></span></button>
    <label class="field"><span class="lbl">Where</span><input placeholder="City or place" data-in="where"></label>
    <div class="row2"><label class="field"><span class="lbl">From</span><input value="Fri 7 Nov"></label><label class="field"><span class="lbl">To</span><input value="Sun 9 Nov"></label></div>
    <div class="section-head"><h2 class="h3">Who’s coming</h2></div>
    <div class="card">${lrow({ lead: av('A'), t: 'You', s: 'Organiser', chev: false })}<div class="divider" style="--div-inset:68px"></div>${lrow({ lead: ibox('users-round'), t: 'Invite people', a: 'soon' })}</div>
  </div></div>
  <div class="actionbar"><button class="btn btn-primary btn-block tap" data-a="createTrip">Create trip</button></div>` }));
act('newTrip', () => push('newTrip', {}, 'modal'));
act('createTrip', () => { pop(); toast('Trip created · invite your group next'); });

/* ================= D2 Budget ================= */
def('budget', () => {
  const s = S(); const b = shares(s); const bal = b.A;
  const owe = App.others().filter(x => b[x] < -0.5);
  return { html: `
  <div class="scroll"><div class="largetitle"><h1 class="h1" style="font-size:32px;line-height:38px">Budget</h1></div>
  <div class="content stagger" style="padding-top:12px">
    <div class="xsum"><div><div class="lbl">Your balance · all trips</div><div class="val num"><b>${bal > 0.5 ? '+' : bal < -0.5 ? '−' : ''}${Math.round(Math.abs(bal))}</b><span>€</span></div></div><hr>
      <div class="bal"><span style="flex:1;min-width:0"><span class="t">${balTxtOf(bal)}</span><span class="s">${owe.length ? owe.length + ' open in 1 trip' : 'Nothing open'}</span></span>${bal > 0.5 ? `<button class="btn btn-sm btn-primary tap" data-a="settle">Settle up</button>` : ''}</div></div>
    ${owe.length ? `<div class="section-head"><h2 class="h3">To settle</h2></div>${list(owe.map(x => lrow({ lead: av(x), t: `${PEOPLE[x].name} owes you`, s: `Lisboa trip · ${S().requested ? 'request sent' : 'not requested yet'}`, val: eur(-b[x]), chev: false })), 68)}` : ''}
    <div class="section-head"><h2 class="h3">By trip</h2></div>
    ${list([lrow({ lead: thumb('castelo'), t: 'Lisboa trip', s: `${eur(total(s))} · ${balTxtOf(bal).toLowerCase()}`, a: 'tripExpenses' }), lrow({ lead: thumb('torel'), t: 'Porto weekend', s: 'No expenses yet', a: 'soon' }), lrow({ lead: thumb('baixa'), t: 'Madrid', s: '1.240€ · all settled', a: 'soon' })])}
  </div></div>` };
});

/* ================= Trip · Expenses (sub-page) ================= */
def('tripExpenses', () => { const s = S(); const b = shares(s);
  const cat = { Settled: 0, Unsettled: 0 }; s.expenses.forEach(e => cat[e.settled ? 'Settled' : 'Unsettled'] += e.total);
  const tot = total(s);
  return { html: `
  ${topbar({ title: 'Lisboa trip · expenses', trail: `<button class="icon-btn tap" data-a="newExpense">${ic('plus')}</button>` })}
  <div class="scroll"><div class="content stagger" style="padding-top:8px">
    ${xsum(s)}
    <div><div style="display:flex;height:8px;border-radius:9px;overflow:hidden;gap:2px">${Object.entries(cat).filter(([, v]) => v > 0).map(([k, v]) => `<i style="flex:${v};background:${k === 'Settled' ? 'var(--ink)' : 'rgba(9,9,11,.16)'};transition:flex 700ms var(--spring)"></i>`).join('')}</div>
      <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">${Object.entries(cat).map(([k, v]) => `<span class="b14 sec" style="display:flex;align-items:center;gap:6px"><i style="width:8px;height:8px;border-radius:9px;background:${k === 'Settled' ? 'var(--ink)' : 'rgba(9,9,11,.16)'}"></i>${k} · <b style="color:var(--ink);font-weight:600">${eur(v)}</b></span>`).join('')}</div></div>
    <div class="section-head"><h2 class="h3">Balances</h2></div>
    ${list(App.group().map(p => lrow({ lead: av(p), t: nameOf(p), s: App.roleOf(p), val: `<span style="color:${b[p] > 0.5 ? 'var(--ink)' : 'var(--text-secondary)'}">${Math.abs(b[p]) < 1 ? '0€' : (b[p] > 0 ? '+' : '−') + eur(Math.abs(b[p]))}</span>`, chev: false })), 68)}
    <div class="section-head"><h2 class="h3">All expenses</h2><span class="b14 ter">${s.expenses.length}</span></div>
    ${list(s.expenses.map(e => lrow({ lead: thumb(e.img), t: esc(e.title), s: `${nameOf(e.payer)} paid · ${e.when}`, val: `${eur(e.total)}<small>${e.settled ? 'Settled' : 'Unsettled'}</small>`, chev: false })))}
  </div></div>` }; });

/* ================= A4 Profile ================= */
def('profile', () => ({ html: `
  <div class="scroll"><div class="largetitle"><h1 class="h1" style="font-size:32px;line-height:38px">Profile</h1></div>
  <div class="content stagger" style="padding-top:12px">
    <div style="display:flex;align-items:center;gap:14px">${av('A', 'l')}<div style="flex:1"><div class="h3">Ari Lopes</div><div class="b14 sec">ari@mail.com</div></div><button class="btn btn-sm btn-secondary tap" data-a="soon">Edit</button></div>
    <div class="section-head"><h2 class="h3">Money</h2></div>
    ${list([lrow({ lead: ibox('credit-card'), t: 'Pay with', val: '<span class="b14 sec" style="font-weight:400">Apple Pay</span>', a: 'soon' }), lrow({ lead: ibox('banknote'), t: 'Get paid to', val: '<span class="b14 sec" style="font-weight:400">IBAN •••• 7730</span>', a: 'soon' }), lrow({ lead: ibox('coins'), t: 'Currency', val: '<span class="b14 sec" style="font-weight:400">EUR €</span>', a: 'soon' })], 68)}
    <div class="section-head"><h2 class="h3">App</h2></div>
    ${list([lrow({ lead: ibox('playing-cards-fan'), t: 'Notifications', val: '<span class="b14 sec" style="font-weight:400">Polls, payments</span>', a: 'soon' }), lrow({ lead: ibox('rotate-ccw'), t: 'Restart demo', s: 'Back to the start of the Lisbon evening', a: 'resetDemo' })], 68)}
    <p class="b14 ter" style="text-align:center">TripUp prototype · Bending Spoons case · Erdem Ulker</p>
  </div></div>` }));
act('resetDemo', () => { App.reset(); toast('Demo restarted', 'rotate-ccw'); });
})();
