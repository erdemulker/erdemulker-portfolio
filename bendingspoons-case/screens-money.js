/* TripUp · money: new expense (per item), balances updated, settle up, pay (Nic), settled */
(() => {
const { def, act, push, pop, refresh, current, sheet, toast, notify, topbar, lrow, list, thumb, ibox, ic, esc, eur, IMG, av, stack, shares, total, PLACES, PEOPLE, set, wait, vibrate, nameOf } = App;
const S = () => App.S();
const G = () => App.group();
let X = null;

App.newExpense = (link) => {
  const s = S(); const win = s.plan.tue.find(e => e.id === 'win');
  const ev = link ? [...s.plan.mon, ...s.plan.tue].find(e => e.id === link) : win;
  const isDinner = ev && ev.id === 'win';
  X = { link: ev ? { id: ev.id, title: ev.title, sub: `${isDinner ? 'Dinner' : ev.cat} · today ${ev.time}`, img: ev.img } : null, payer: 'A',
    items: [{ name: '', amount: 0, who: G() }],
    open: 0 };
  push('expense', {}, 'modal');
};
act('newExpense', d => App.newExpense(d.link));

const itemHTML = (it, i) => {
  const open = X.open === i; const n = it.who.length; const each = n ? it.amount / n : 0;
  return `<div class="item ${open ? 'open' : ''}" data-i="${i}">
    <button class="item-head" data-a="itemToggle" data-i="${i}"><span class="txt" style="flex:1"><span class="b16b" style="display:block">${esc(it.name || 'New item')}</span><span class="b14 sec">${n === G().length ? `Split equally · ${n} people` : n ? `Split ${n} of ${G().length} · ${it.who.map(p => nameOf(p)).join(', ')}` : 'No one selected'}</span></span>
      <span style="text-align:right"><span class="b16b num" style="display:block">${eur(it.amount)}</span><span class="b14 ter num" style="font-size:12px">${n ? eur(each) + ' each' : ''}</span></span>${ic('chevron-down', 'chev')}</button>
    <div class="item-edit"><div>
      <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:10px"><label class="field" style="background:#fff"><span class="lbl">Item</span><input value="${esc(it.name)}" placeholder="e.g. Wine" data-f="name" data-i="${i}"></label><label class="field" style="background:#fff"><span class="lbl">Amount</span><input value="${it.amount || ''}" placeholder="0€" inputmode="decimal" data-f="amount" data-i="${i}"></label></div>
      <div class="b14 sec" style="margin:14px 0 4px">Who shares this item</div>
      ${G().map(p => { const on = it.who.includes(p); return `<button class="who ${on ? '' : 'off'}" style="width:100%" data-a="whoToggle" data-i="${i}" data-p="${p}">${av(p, 's')}<span class="n" style="text-align:left">${nameOf(p)}</span><span class="a num">${on ? eur(each) : '—'}</span><span class="tgl ${on ? 'on' : ''}"></span></button>`; }).join('')}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px"><span class="b14 sec" style="font-size:12px">${n === G().length ? `Split ${n} ways` : `Split ${n} of ${G().length}`} · ${eur(each)} each</span><button class="btn btn-sm btn-secondary tap" data-a="itemDone" style="background:#fff">Done</button></div>
    </div></div></div>`;
};
def('expense', () => {
  const tot = X.items.reduce((a, b) => a + (+b.amount || 0), 0);
  return { html: `
  ${topbar({ title: 'New expense', lead: 'x' })}
  <div class="scroll"><div class="content" style="padding-top:8px;gap:20px">
    <div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 16px">
      <button data-a="linkPick" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;text-align:left">${X.link ? thumb(X.link.img) : ibox('calendar')}
      <span style="flex:1;min-width:0"><span class="b16b" style="display:block;${X.link ? '' : 'color:var(--text-secondary)'}">${X.link ? esc(X.link.title) : 'Not linked to the plan'}</span><span class="b14 sec">${X.link ? esc(X.link.sub) : 'Tap to link a place or event'}</span></span></button>
      <button style="text-align:right" data-a="payer"><span class="b14 sec" style="display:block;font-size:12px">Paid by</span><span class="b16b">${nameOf(X.payer)}</span></button>
    </div>
    <div class="section-head" style="margin-bottom:-12px"><h2 class="h3">Items</h2></div>
    <div class="card items">${X.items.map(itemHTML).join('')}
      <button class="lrow" data-a="addItem" style="border-top:1px solid var(--border-default)"><span class="ibox" style="border-radius:99px;background:transparent;border:1.5px dashed var(--border-strong)">${ic('plus')}</span><span class="txt"><span class="t">Add item</span></span></button></div>
  </div></div>
  <div class="actionbar"><div class="sum"><div class="t num">${eur(tot)}</div><div class="s">${X.items.length} item${X.items.length > 1 ? 's' : ''} · paid by ${nameOf(X.payer).toLowerCase() === 'you' ? 'you' : nameOf(X.payer)}</div></div><button class="btn btn-primary tap" data-a="saveExpense" ${tot > 0 ? '' : 'disabled'}>Save expense</button></div>`,
  after: el => el.querySelectorAll('[data-f]').forEach(inp => inp.oninput = () => { const it = X.items[+inp.dataset.i]; if (inp.dataset.f === 'amount') it.amount = parseFloat(inp.value.replace(',', '.')) || 0; else it.name = inp.value; updateItem(el, +inp.dataset.i); }) };
});
function updateItem(el, i) {
  // light update without losing focus
  const it = X.items[i]; const n = it.who.length; const each = n ? it.amount / n : 0; const box = el.querySelector(`.item[data-i="${i}"]`);
  box.querySelector('.item-head .b16b').textContent = it.name || 'New item';
  box.querySelector('.item-head .num').textContent = eur(it.amount);
  box.querySelector('.item-head .ter').textContent = n ? eur(each) + ' each' : '';
  box.querySelectorAll('.who').forEach(w => w.querySelector('.a').textContent = it.who.includes(w.dataset.p) ? eur(each) : '—');
  box.querySelector('.item-edit .b14.sec[style*="12px"]').textContent = `${n === G().length ? `Split ${n} ways` : `Split ${n} of ${G().length}`} · ${eur(each)} each`;
  const tot = X.items.reduce((a, b) => a + (+b.amount || 0), 0);
  el.querySelector('.actionbar .t').textContent = eur(tot); el.querySelector('[data-a=saveExpense]').disabled = !(tot > 0);
}
act('itemToggle', d => { const i = +d.i; X.open = X.open === i ? -1 : i; const el = current().el; el.querySelectorAll('.item').forEach(x => x.classList.toggle('open', +x.dataset.i === X.open)); vibrate(4); });
act('itemDone', () => { X.open = -1; current().el.querySelectorAll('.item').forEach(x => x.classList.remove('open')); vibrate(4); });
act('whoToggle', (d, b) => { const it = X.items[+d.i]; const k = it.who.indexOf(d.p); if (k > -1) it.who.splice(k, 1); else it.who.push(d.p); it.who.sort((a, b) => G().indexOf(a) - G().indexOf(b)); b.classList.toggle('off', k > -1); b.querySelector('.tgl').classList.toggle('on', k < 0); vibrate(4);
  const el = current().el; updateItem(el, +d.i); const head = el.querySelector(`.item[data-i="${d.i}"] .item-head .b14.sec`); const n = it.who.length; head.textContent = n === G().length ? `Split equally · ${n} people` : n ? `Split ${n} of ${G().length} · ${it.who.map(p => nameOf(p)).join(', ')}` : 'No one selected'; });
act('addItem', () => { X.items.push({ name: '', amount: 0, who: G() }); X.open = X.items.length - 1; refresh(current()); setTimeout(() => { const f = current().el.querySelector(`.item[data-i="${X.open}"] [data-f=name]`); f && f.focus(); }, 380); });
act('payer', () => sheet(`<div class="sheet-head"><h2 class="h2">Paid by</h2><button class="close-circle tap" data-close>${ic('x')}</button></div><div class="card">${G().map(p => lrow({ lead: av(p), t: nameOf(p), chev: false, a: 'setPayer', data: `data-p="${p}" data-close`, val: X.payer === p ? ic('check') : '' })).join('<div class="divider" style="--div-inset:68px"></div>')}</div>`));
act('linkPick', () => {
  const s = S(); const days = [['tue', 'Today · Tue 16'], ['mon', 'Mon 15']];
  sheet(`<div class="sheet-head"><div><h2 class="h2">Link to the plan</h2><div class="b14 sec">Which activity is this for?</div></div><button class="close-circle tap" data-close>${ic('x')}</button></div>
  <div class="stagger" style="display:flex;flex-direction:column;gap:12px;overflow-y:auto">
    ${days.map(([k, l]) => { const evs = s.plan[k].filter(e => !e.slot); return evs.length ? `<div><div class="b14 sec" style="margin-bottom:8px">${l}</div>${list(evs.map(e => lrow({ lead: thumb(e.img), t: esc(e.title), s: `${esc(e.cat.split(' · ')[0])} · ${e.time}`, chev: false, a: 'setLink', data: `data-id="${e.id}" data-d="${k}" data-close`, val: X.link && X.link.id === e.id ? ic('check') : '' })))}</div>` : ''; }).join('')}
    ${list([lrow({ lead: ibox('x'), t: 'Not linked', s: 'Keep it as a general trip cost', chev: false, a: 'setLink', data: 'data-id="" data-close', val: !X.link ? ic('check') : '' })], 68)}
  </div>`);
});
act('setLink', d => {
  const s = S(); const e = d.id && [...s.plan.mon, ...s.plan.tue].find(x => x.id === d.id);
  X.link = e ? { id: e.id, title: e.title, sub: `${e.cat.split(' · ')[0]} · ${d.d === 'tue' ? 'today' : 'Mon 15'} ${e.time}`, img: e.img } : null;
  refresh(current()); vibrate(4);
});
act('setPayer', d => { X.payer = d.p; refresh(current()); });
act('saveExpense', () => {
  const before = shares(S());
  const sh = {}; let tot = 0;
  for (const it of X.items) { const a = +it.amount || 0; if (!a || !it.who.length) continue; tot += a; it.who.forEach(p => sh[p] = (sh[p] || 0) + a / it.who.length); }
  set(s => { const ev = X.link && s.plan.tue.concat(s.plan.mon).find(e => e.title === X.link.title); if (ev) ev.cost = eur(tot); }); set(s => s.expenses.unshift({ id: 'x' + Date.now(), title: X.link ? X.link.title : (X.items[0].name || 'Expense'), payer: X.payer, total: tot, when: 'today', img: X.link ? X.link.img : 'baixa', shares: sh }));
  App._delta = { before, title: X.link ? X.link.title : 'Expense', tot };
  pop(); setTimeout(() => push('balances', {}, 'modal'), 380);
});

/* ---------- Balances updated (S09) ---------- */
def('balances', () => {
  const s = S(); const b = shares(s); const d = App._delta || { before: b, tot: 0, title: '' };
  return { html: `
  ${topbar({ title: 'Balances', lead: 'x' })}
  <div class="scroll"><div class="content" style="padding-top:0;gap:24px">
    <div class="success"><span class="check-big">${ic('check')}</span><div class="h2" style="margin-top:8px">${esc(d.title)} logged · ${eur(d.tot)}</div><div class="b14 sec">Balances updated for everyone</div></div>
    <div class="section-head"><h2 class="h3">Trip balances</h2><span class="b14 ter">Change from this</span></div>
    <div class="card stagger">${G().map((p, i) => { const v = b[p]; const dv = v - d.before[p]; return (i ? '<div class="divider" style="--div-inset:68px"></div>' : '') +
      `<div class="lrow" style="cursor:default">${av(p)}<span class="txt"><span class="t">${nameOf(p)}</span>${App.roleOf(p) ? `<span class="s">${App.roleOf(p)}</span>` : ''}</span><span class="val num"><span class="countup" data-to="${Math.round(v)}" data-from="${Math.round(d.before[p])}">${Math.round(d.before[p])}</span>€<small>${dv >= 0 ? '+' : '−'}${eur(Math.abs(dv))} now</small></span></div>`; }).join('')}</div>
  </div></div>
  <div class="actionbar"><button class="btn btn-secondary tap" style="flex:1" data-a="back">Done</button><button class="btn btn-primary tap" style="flex:1" data-a="settleFromBal">Settle up</button></div>`,
  after: el => setTimeout(() => el.querySelectorAll('.countup').forEach(c => countUp(c, +c.dataset.from, +c.dataset.to)), 450) };
});
function countUp(el, a, b, ms = 900) { const t0 = performance.now(); const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v)); const step = t => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(a + (b - a) * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
act('settleFromBal', () => { pop(); setTimeout(() => push('settle'), 420); });
act('settle', () => push('settle'));

/* ---------- Settle up (S10) ---------- */
def('settle', () => {
  const s = S(); const b = shares(s); const tr = App.others().filter(p => b[p] < -0.5).map(p => [p, -b[p]]); const sum = tr.reduce((a, [, v]) => a + v, 0);
  return { html: `
  ${topbar({ title: 'Settle up' })}
  <div class="scroll"><div class="content stagger" style="padding-top:8px">
    <div><div class="b14 sec">You receive</div><div class="amount-big num" style="margin-top:2px">${Math.round(sum)}<sup>€</sup></div><div class="b14 sec" style="margin-top:4px">${tr.length} transfer${tr.length > 1 ? 's' : ''} · every debt in the trip netted</div></div>
    <div class="section-head"><h2 class="h3">Transfers</h2></div>
    ${list(tr.map(([p, v]) => lrow({ lead: av(p), t: `${PEOPLE[p].name} → You`, s: s.settled[p] ? 'Paid' : s.requested ? 'Requested' : 'One request', val: eur(v), chev: false })), 68)}
    <details class="tile" style="padding:14px 16px"><summary class="b14b" style="cursor:pointer;list-style:none;display:flex;justify-content:space-between">Why only ${tr.length} ${ic('chevron-down', 'chev')}</summary><p class="b14 sec" style="margin-top:8px">Paying back expense by expense would take ${s.expenses.length + tr.length} transfers. TripUp adds up every expense in the trip and leaves the fewest transfers.</p></details>
  </div></div>
  <div class="actionbar"><div class="sum"><div class="t">To IBAN •••• 7730</div><div class="s">Paid out on arrival</div></div>${s.requested ? `<button class="btn btn-secondary tap" data-a="nicPay">See Nic’s side</button>` : `<button class="btn btn-primary tap" data-a="sendReq">Send requests</button>`}</div>` };
});
act('sendReq', async () => {
  set(s => s.requested = true); vibrate([6, 30, 6]); refresh(current()); toast(`Requests sent to ${App.names(App.others().filter(p => shares(S())[p] < -0.5))}`, 'send');
  simPayments();
});
let payT = [];
function simPayments() {
  payT.forEach(clearTimeout); payT = [];
  const b = shares(S());
  [['R', 5000, 'Apple Pay'], ['C', 9000, 'Bank transfer']].filter(([p]) => App.group().includes(p)).forEach(([p, t, m]) => payT.push(setTimeout(() => pay(p, m), t)));
}
function pay(p, method) {
  const b = shares(S()); if (b[p] > -0.5) return;
  const v = -b[p]; set(s => { s.settled[p] = (s.settled[p] || 0) + v; s.methods = s.methods || {}; s.methods[p] = method; });
  const c = current(); if (['settle', 'budget', 'trip', 'trips'].includes(c.name)) refresh(c);
  notify({ title: `${PEOPLE[p].name} paid you ${eur(v)}`, body: method + ' · Lisboa trip', icon: 'banknote', onTap: () => {} });
  checkDone();
}
function checkDone() { const b = shares(S()); if (App.others().every(p => b[p] > -0.5)) { set(s => { s.expenses.forEach(e => e.settled = true); s.paidOut = s.settled; s.settled = {}; }); } if (App.others().every(p => b[p] > -0.5)) setTimeout(() => { App.stackEls.slice(-1)[0].name !== 'settled' && push('settled', {}, 'modal'); }, 1600); }

/* ---------- Pay Ari · Nic's side (S11) ---------- */
act('nicPay', () => push('pay', {}, 'modal'));
def('pay', () => {
  const b = shares(S()); const v = Math.max(0, -b.N);
  return { html: `
  <span class="phone-tag">Nic’s phone</span>
  ${topbar({ title: '', lead: 'x' })}
  <div class="scroll"><div class="content stagger" style="padding-top:8px;gap:20px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:8px">${av('A', 'l')}<div class="b16 sec">You owe Ari</div><div class="amount-big num" style="font-size:64px;line-height:68px">${Math.round(v)}<sup>€</sup></div></div>
    <div class="card"><div class="b14 sec" style="padding:14px 16px 0">What for</div>
      ${S().expenses.filter(e => !e.settled && e.payer === 'A' && e.shares && e.shares.N).map(e => lrow({ lead: thumb(e.img), t: esc(e.title), s: `Your share of ${eur(e.total)}`, val: eur(e.shares.N), chev: false })).join('')}
      <div class="divider"></div><div class="lrow" style="min-height:52px;cursor:default"><span class="txt"><span class="t">Total</span></span><span class="val num">${eur(v)}</span></div></div>
    <div><div class="b14 sec" style="margin-bottom:8px">Pay with</div><div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 16px"><span style="width:52px;height:36px;border-radius:8px;background:#000;color:#fff;display:grid;place-items:center;font-weight:600;font-size:14px"> Pay</span><span style="flex:1"><span class="b16b" style="display:block">Apple Pay</span><span class="b14 sec">Visa •••• 2291</span></span><span class="badge">Default</span></div></div>
  </div></div>
  <div class="actionbar col" style="gap:4px"><button class="btn btn-primary btn-block tap" data-a="applePay" ${v ? '' : 'disabled'}>${v ? `Pay ${eur(v)} with  Pay` : 'Paid'}</button><button class="btn btn-ghost tap" data-a="applePay">Pay by bank transfer</button></div>` };
});
act('applePay', async (d, b) => {
  b.disabled = true; b.innerHTML = `<span class="spin" style="width:20px;height:20px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:99px;animation:spin .8s linear infinite"></span>`;
  await wait(1100); vibrate([10, 40, 10]);
  b.classList.add('paid'); b.innerHTML = `${ic('check')}Paid`; lucide.createIcons();
  await wait(1800); pop();
  setTimeout(() => pay('N', 'Apple Pay'), 400);
});

/* ---------- Settled (S12) ---------- */
def('settled', () => { const s0 = S(); const s = Object.assign({}, s0, { settled: s0.paidOut || s0.settled }); const m = s.methods || {};
  return { html: `
  ${topbar({ title: '', lead: 'x' })}
  <div class="scroll"><div class="content" style="padding-top:8px">
    <div class="collage"><img src="${IMG('castelo')}" alt=""><img src="${IMG('fogo')}" alt=""><img src="${IMG('torel')}" alt=""></div>
    <div class="success" style="padding-top:0"><span class="badge"><span class="dot live"></span>All settled</span><div class="h1" style="margin-top:8px">Everyone’s squared up</div><div class="b16 sec">${eur(Object.values(s.settled).reduce((a, b) => a + b, 0))} received · Lisboa trip</div></div>
    <div class="card stagger">${App.others().filter(p => s.settled[p]).map((p, i) => (i ? '<div class="divider" style="--div-inset:68px"></div>' : '') + lrow({ lead: av(p), t: `${PEOPLE[p].name} paid you`, s: m[p] || 'Apple Pay', val: eur(s.settled[p]), chev: false })).join('')}</div>
  </div></div>
  <div class="actionbar" style="border-top:0"><button class="btn btn-primary btn-block tap" data-a="goHome">Back to home</button></div>` }; });
act('goHome', () => { App.setTab('trips'); App.resetTo('trips', {}, 'fade'); });
})();
