// ===== DFA definition =====
const N = 10;                       // PNR length
const DEAD = 'qd';
const stateName = i => 'q' + i;
const isDigit = c => c >= '0' && c <= '9';

// delta: (state, char) -> state
function delta(state, ch) {
  if (state === DEAD) return DEAD;
  if (!isDigit(ch)) return DEAD;
  if (state === 'q0') return ch === '0' ? DEAD : 'q1';
  const i = parseInt(state.slice(1), 10);
  if (i >= 1 && i < N) return stateName(i + 1);
  return DEAD;                      // q10 on any symbol
}
const START = 'q0', ACCEPT = 'q' + N;

function simulate(input) {
  const steps = [];
  let s = START;
  for (let k = 0; k < input.length; k++) {
    const to = delta(s, input[k]);
    steps.push({ idx: k, from: s, ch: input[k], to });
    s = to;
  }
  return { steps, finalState: s, accepted: s === ACCEPT };
}

// ===== SVG drawing =====
const svg = document.getElementById('dfa');
const NS = 'http://www.w3.org/2000/svg';
const X0 = 60, DX = 100, Y = 110, R = 24, DEADX = 560, DEADY = 260;
const pos = {};
for (let i = 0; i <= N; i++) pos[stateName(i)] = { x: X0 + i * DX, y: Y };
pos[DEAD] = { x: DEADX, y: DEADY };

function el(name, attrs = {}, parent = svg) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e); return e;
}

function buildSVG() {
  svg.innerHTML = '';
  const defs = el('defs');
  [['arr', '#475569'], ['arrOn', '#38bdf8'], ['arrDead', '#7f1d1d'], ['arrDeadOn', '#ef4444']].forEach(([id, c]) => {
    const m = el('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0L10 5L0 10z', fill: c }, m);
  });

  // start arrow
  el('line', { x1: 8, y1: Y, x2: X0 - R - 2, y2: Y, class: 'edge', 'marker-end': 'url(#arr)' });
  el('text', { x: 22, y: Y - 10, class: 'elabel' }).textContent = 'start';

  // forward edges
  for (let i = 0; i < N; i++) {
    const a = pos[stateName(i)], b = pos[stateName(i + 1)];
    el('line', { id: `e-q${i}-q${i + 1}`, x1: a.x + R, y1: Y, x2: b.x - R - 2, y2: Y, class: 'edge', 'marker-end': 'url(#arr)' });
    el('text', { x: (a.x + b.x) / 2, y: Y - 10, class: 'elabel' }).textContent = i === 0 ? '1-9' : '0-9';
  }

  // edges to dead state
  for (let i = 0; i <= N; i++) {
    const a = pos[stateName(i)];
    const cx = (a.x + DEADX) / 2, cy = (Y + DEADY) / 2 + 10;
    const sx = a.x, sy = Y + R;
    el('path', { id: `e-q${i}-qd`, d: `M${sx} ${sy} Q${cx + (a.x < DEADX ? -20 : 20)} ${cy} ${DEADX + (a.x < DEADX ? -18 : a.x > DEADX ? 18 : 0)} ${DEADY - R - 2}`, class: 'edge deadedge', 'marker-end': 'url(#arrDead)' });
  }
  el('text', { x: 130, y: 200, class: 'elabel' }).textContent = i0label();
  el('text', { x: 1000, y: 200, class: 'elabel' }).textContent = 'non-digit / any symbol at q10';

  // dead self-loop
  el('path', { id: 'e-qd-qd', d: `M${DEADX - 14} ${DEADY + R - 2} C${DEADX - 40} ${DEADY + 70} ${DEADX + 40} ${DEADY + 70} ${DEADX + 14} ${DEADY + R - 2}`, class: 'edge deadedge', 'marker-end': 'url(#arrDead)' });
  el('text', { x: DEADX, y: DEADY + 62, class: 'elabel' }).textContent = 'any';

  // nodes
  for (let i = 0; i <= N; i++) drawNode(stateName(i), i === 0, i === N, false);
  drawNode(DEAD, false, false, true);
}
function i0label() { return 'q0 on 0, or any non-digit'; }

function drawNode(id, start, accept, dead) {
  const p = pos[id];
  const g = el('g', { id: 'n-' + id, class: 'node' + (start ? ' start' : '') + (accept ? ' accept' : '') + (dead ? ' dead' : '') });
  el('circle', { cx: p.x, cy: p.y, r: R, class: 'main' }, g);
  if (accept) el('circle', { cx: p.x, cy: p.y, r: R - 5, class: 'ring' }, g);
  el('text', { x: p.x, y: p.y }, g).textContent = id;
}

// ===== UI state =====
let sim = null, cur = 0, timer = null;
const $ = id => document.getElementById(id);

function clearHighlights() {
  document.querySelectorAll('.node.active').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.edge.taken').forEach(e => {
    e.classList.remove('taken');
    e.setAttribute('marker-end', e.classList.contains('deadedge') ? 'url(#arrDead)' : 'url(#arr)');
  });
}

function render() {
  clearHighlights();
  if (!sim) { $('stepInfo').textContent = ''; document.getElementById('n-' + START).classList.add('active'); return; }
  const stateNow = cur === 0 ? START : sim.steps[cur - 1].to;
  document.getElementById('n-' + stateNow).classList.add('active');
  if (cur > 0) {
    const s = sim.steps[cur - 1];
    const eid = s.from === s.to && s.to === DEAD ? 'e-qd-qd' : `e-${s.from}-${s.to}`;
    const e = document.getElementById(eid);
    if (e) { e.classList.add('taken'); e.setAttribute('marker-end', e.classList.contains('deadedge') ? 'url(#arrDeadOn)' : 'url(#arrOn)'); }
  }
  // chips
  document.querySelectorAll('.chip').forEach((c, i) => {
    c.className = 'chip' + (i < cur ? ' done' : '') + (i < cur && sim.steps[i].to === DEAD ? ' badc' : '') + (i === cur ? ' now' : '');
  });
  // trace rows
  document.querySelectorAll('#trace tbody tr').forEach((r, i) => {
    r.classList.toggle('hl', i === cur - 1 && sim.steps[i].to !== DEAD);
    r.classList.toggle('hlbad', i === cur - 1 && sim.steps[i].to === DEAD);
    r.style.opacity = i < cur ? 1 : .35;
  });
  $('stepInfo').textContent = `Step ${cur}/${sim.steps.length} — state: ${stateNow}`;
}

function validate() {
  stop();
  const raw = $('pnr').value;
  const box = $('result');
  if (raw.length === 0) {
    box.className = 'result bad'; box.textContent = 'Please enter a PNR to validate.';
    sim = null; $('chips').innerHTML = ''; $('trace').tBodies[0].innerHTML = ''; render(); return;
  }
  sim = simulate(raw); cur = 0;
  // chips
  $('chips').innerHTML = '';
  [...raw].forEach(ch => { const d = document.createElement('div'); d.className = 'chip'; d.textContent = ch === ' ' ? '␣' : ch; $('chips').appendChild(d); });
  // trace table
  const tb = $('trace').tBodies[0]; tb.innerHTML = '';
  sim.steps.forEach((s, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${s.from}</td><td>${s.ch === ' ' ? '␣' : s.ch}</td><td>${s.to}</td>`;
    tb.appendChild(tr);
  });
  // verdict
  let why;
  if (sim.accepted) why = 'Valid PNR — DFA halted in final state q10.';
  else if (sim.finalState === DEAD) {
    const bad = sim.steps.find(s => s.to === DEAD);
    if (bad.from === 'q0' && bad.ch === '0') why = 'Invalid — first digit cannot be 0.';
    else if (!isDigit(bad.ch)) why = `Invalid — non-digit character "${bad.ch}" at position ${bad.idx + 1}.`;
    else why = `Invalid — more than ${N} digits (extra symbol at position ${bad.idx + 1}).`;
  } else why = `Invalid — only ${raw.length} digit(s); need exactly ${N}. DFA stopped in ${sim.finalState}, not final state q10.`;
  box.className = 'result ' + (sim.accepted ? 'ok' : 'bad');
  box.textContent = (sim.accepted ? '✔ ' : '✘ ') + why;
  render();
}

function next() { if (sim && cur < sim.steps.length) { cur++; render(); return true; } return false; }
function prev() { if (sim && cur > 0) { cur--; render(); } }
function stop() { clearInterval(timer); timer = null; $('btnPlay').textContent = '▶ Play'; }
function play() {
  if (!sim) validate(); if (!sim) return;
  if (timer) { stop(); return; }
  if (cur >= sim.steps.length) cur = 0;
  $('btnPlay').textContent = '⏸ Pause';
  const tick = () => { if (!next()) stop(); };
  timer = setInterval(tick, +$('speed').value);
}

// transition table
function buildTable() {
  const t = $('ttable');
  let h = '<thead><tr><th>State</th><th>0</th><th>1-9</th><th>other</th></tr></thead><tbody>';
  for (let i = 0; i <= N; i++) {
    const s = stateName(i);
    h += `<tr><td>${i === 0 ? '→ ' : ''}${i === N ? '* ' : ''}${s}</td><td>${delta(s, '0')}</td><td>${delta(s, '5')}</td><td>${delta(s, 'x')}</td></tr>`;
  }
  h += `<tr><td>${DEAD}</td><td>${DEAD}</td><td>${DEAD}</td><td>${DEAD}</td></tr></tbody>`;
  t.innerHTML = h;
}

// events
$('btnValidate').onclick = validate;
$('btnNext').onclick = () => { stop(); if (!sim) validate(); next(); };
$('btnPrev').onclick = () => { stop(); prev(); };
$('btnPlay').onclick = play;
$('btnReset').onclick = () => { stop(); $('pnr').value = ''; $('result').className = 'result hidden'; sim = null; cur = 0; $('chips').innerHTML = ''; $('trace').tBodies[0].innerHTML = ''; render(); };
$('pnr').addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
document.querySelectorAll('.examples a').forEach(a => a.onclick = e => { e.preventDefault(); $('pnr').value = a.dataset.ex; validate(); });

buildSVG(); buildTable(); render();
