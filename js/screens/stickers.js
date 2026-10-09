// S8 스티커북 — 위(화면의 3/5): 노트 스티커북, 넘기면 다음 장. 아래: 핑크 패널(탭 + 격자)에서 스티커를 끌어다 붙인다
import { el, img, icon, go, registerScreen, pill, faceBadge, backBtn, toast } from '../core/ui.js';
import { tune } from '../core/tune.js';
import { progress, save, addWallSticker, removeWallSticker, stageState } from '../core/store.js';
import { STAGES, STAGE_CHARS } from '../data/stages.js';
import { COSTUMES } from '../data/costumes.js';
import { toLogical, logicalRect, view } from '../core/scale.js';
import { renderWall, stickerEl, stickerName, baseSize } from '../wall.js';
import { sfx, buzz } from '../core/audio.js';

let filter = 'all';   // all | char | hanja
let page = 0;
const PAGES = 5;
// 노트 그림(panel_notebook.png 1040×1283)에서 종이 부분 (비율)
// 짧게 자른 노트(notebook_short.png 1040×1035) 안 종이 칸 (build_ui.py build_notebook 이 잰 값)
const PAPER = { x0: 0.1404, y0: 0.0773, x1: 0.9192, y1: 0.9227 };
const NB_RATIO = 1040 / 1035;

registerScreen('stickers', (root, params = {}) => {
  root.classList.add('stickers-screen');
  const T = tune().stickers;
  const top = el('div.wall-box', { style: { top: 0, bottom: 0, height: 'auto' } });   // 배경은 화면 전체
  const bookH = Math.round(T.bookW / NB_RATIO);
  const book = el('div.nb-book', { 'data-tx': 'bookX', 'data-ty': 'bookY', 'data-tmode': 'center', style: { left: `calc(50% + ${T.bookX}px)`, top: `calc(var(--safe-top) + ${T.bookY}px)`, width: T.bookW + 'px', height: bookH + 'px' } });
  const paper = el('div.nb-paper');                                        // 종이 한 장 (스티커와 함께 넘어간다)
  const hint = el('div.hint', { text: '스티커를 끌어다 붙여요' });
  paper.append(hint);
  book.append(paper);
  const dotsNav = el('div.nb-dots', { 'data-ty': 'nbDotsY', style: { top: `calc(var(--safe-top) + ${T.nbDotsY}px)`, gap: T.nbDotGap + 'px' } });
  dotsNav.style.setProperty('--dot', T.nbDotSize + 'px');
  top.append(book, dotsNav);
  root.append(top);
  root.append(el('div.topbar', { style: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 6 } },
    el('div', {}, backBtn(() => go('map'), 50)), el('div'), el('div', {}, pill(icon.sticker(24), '', 'sticker'))));
  const countPill = root.querySelector('.topbar .pill .txt');
  const panel = el('div.pink-panel', { 'data-ty': 'panelTop', 'data-tmode': 'plain', 'data-toff': Math.round(view.safeTop - 12), style: { top: `calc(var(--safe-top) - 12px + ${T.panelTop}px)` } });   // 책이 안전영역만큼 내려가면 상자도 같이
  const ptabs = el('div.ptabs');
  const grid = el('div.pgrid', { style: { columnGap: T.gridGapX + 'px', rowGap: T.gridGapY + 'px' } });
  grid.style.setProperty('--cell', T.cellSize + 'px');
  const pinner = el('div.pinner', {}, ptabs, el('div.phint', { text: '스티커를 위 스티커북으로 끌어다 붙여요' }), grid);   // 탭·안내·칸의 왼쪽 선을 맞춘다
  const sbar = el('div.sbar', { 'data-ty': 'sbTop', 'data-tmode': 'plain' }, el('div.sbar-thumb'));   // 스크롤 막대 (직접 그림)
  panel.append(pinner, sbar);
  root.append(panel);

  let selected = null;
  const learned = () => Object.keys(progress.chars);                        // 공부한 한자
  /** 스티커 상자: 캐릭터 18종 + 공부한 한자. 몇 장이든 붙일 수 있다 (끌어다 놓을 때마다 새로 만든다) */
  /** 캐릭터 스티커: 스테이지마다 손님 한 명. 그 스테이지를 클리어해야 붙일 수 있고, 아직이면 잠김 (스테이지 목록: data/stages.js STAGE_CHARS) */
  const charItems = () => [
    ...STAGES.filter(s => STAGE_CHARS[s.id]).map((s, si) => ({ kind: 'char', id: STAGE_CHARS[s.id], virtual: true, lock: !stageState(s.id).cleared, stage: `${si + 1}. ${s.name}` })),
    ...COSTUMES.filter(c => c.id !== 'default' && progress.costumes.includes(c.id)).map(c => ({ kind: 'char', id: c.id, virtual: true, lock: false })),   // 상점에서 산 코스튬도 스티커
  ];
  const openChars = () => charItems().filter(c => !c.lock).length;
  const trayItems = () => [                                  // 붙일 수 있는 것 먼저, 잠긴 캐릭터는 맨 뒤
    ...(filter !== 'hanja' ? charItems().filter(c => !c.lock) : []),
    ...(filter !== 'char' ? learned().map(id => ({ kind: 'hanja', id, virtual: true })) : []),
    ...(filter !== 'hanja' ? charItems().filter(c => c.lock) : []),
  ];

  /** 노트 그림 안의 종이 칸 */
  function layout() {
    // 아래 상자: 폭은 위 스티커북과 같게(panelW 0 = 책 폭), 가운데도 책과 같게. 칸은 cols 줄로 폭에 맞춰 자동 크기
    const pw = Math.min(393, T.panelW || T.bookW);
    // 상자는 화면 가운데. 칸 묶음은 상자 가운데, 스크롤 막대는 상자 오른쪽 끝(gutter = 끝에서 떨어진 거리)
    Object.assign(panel.style, { left: '50%', right: 'auto', width: pw + 'px', transform: 'translateX(-50%)', padding: `${T.panelPadTop}px 0 0` });
    const gap = T.gridGapX, cols = Math.max(2, T.cols);
    const inner = pw - 2 * T.panelPadX;                         // 칸이 들어갈 폭 (양쪽 여백 같게 → 가운데)
    CELL = T.cellSize || Math.floor((inner - (cols - 1) * gap) / cols);
    const cw = cols * CELL + (cols - 1) * gap;
    const side = Math.max(0, (pw - cw) / 2);                    // 칸 묶음 왼쪽 끝 = 탭·안내 문구 왼쪽 끝
    pinner.style.width = '100%';
    ptabs.style.marginLeft = side + 'px'; pinner.querySelector('.phint').style.marginLeft = side + 'px';
    Object.assign(grid.style, { gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, columnGap: gap + 'px', rowGap: T.gridGapY + 'px',
      paddingLeft: side + 'px', paddingRight: side + 'px', marginRight: 0, justifyContent: 'start' });
    Object.assign(sbar.style, { right: T.sbX + 'px', top: T.sbTop + 'px', bottom: T.sbBottom + 'px', width: T.scrollW + 'px' });
    syncBar();
    grid.style.setProperty('--cell', CELL + 'px');
    grid.style.setProperty('--label', T.labelSize + 'px');
    grid.style.setProperty('--label-y', T.labelY + 'px');
    grid.style.setProperty('--hanja-font', T.hanjaFont / 100);
    grid.style.setProperty('--hun', T.hunSize / 100);
    grid.style.setProperty('--scroll-w', T.scrollW + 'px');
    ptabs.style.gap = T.tabGap + 'px'; ptabs.style.setProperty('--tab', T.tabSize + 'px'); ptabs.style.setProperty('--tab-k', T.tabSize / 58);
    const hintEl = pinner.querySelector('.phint'); Object.assign(hintEl.style, { fontSize: T.hintSize + 'px', marginBottom: T.hintGap + 'px' });
    Object.assign(paper.style, { left: PAPER.x0 * 100 + '%', top: PAPER.y0 * 100 + '%', width: (PAPER.x1 - PAPER.x0) * 100 + '%', height: (PAPER.y1 - PAPER.y0) * 100 + '%' });
  }

  /** 책장 넘기기: 지금 종이(스티커 포함)를 한 장 떼어 왼쪽 고리 쪽으로 넘긴다. 뒤로 갈 때는 앞장이 넘어와 덮는다 */
  let turning = false;
  /** 종이 넘기기: 종이를 세로 띠 N 개로 나눠 이어 붙이고(띠마다 조금씩 더 꺾여 종이가 휘어 보인다),
   *  고리(왼쪽)를 축으로 180° 넘긴다. 앞면은 지금 장, 뒷면은 종이 뒷면. 꺾인 만큼 그늘이 지고, 아래 장에도 그림자가 드리운다. */
  const STRIPS = 8, DUR = 700;
  function makeLeaf(src) {
    const W = paper.offsetWidth, H = paper.offsetHeight, sw = W / STRIPS;
    const wrap = el('div.curl-wrap', { style: { left: paper.style.left, top: paper.style.top, width: W + 'px', height: H + 'px' } });
    let parent = wrap; const strips = [];
    for (let k = 0; k < STRIPS; k++) {
      const face = src.cloneNode(true);
      face.classList.remove('turn-out-next', 'turn-in-next'); face.querySelectorAll('.x, .rs').forEach(n => n.remove());
      Object.assign(face.style, { position: 'absolute', left: (-k * sw) + 'px', top: 0, width: W + 'px', height: H + 'px', visibility: 'visible' });
      const front = el('div.curl-front', {}, face, el('div.curl-shade'));
      const back = el('div.curl-back', {}, el('div.curl-shade'));
      back.style.backgroundPosition = `${-(W - (k + 1) * sw)}px 0`; back.style.backgroundSize = `${W}px ${H}px`;
      const st = el('div.curl-strip', { style: { left: (k ? sw : 0) + 'px', width: (sw + 0.6) + 'px', height: H + 'px' } }, front, back);
      parent.append(st); strips.push(st); parent = st;
    }
    const shadow = el('div.curl-cast', { style: { left: paper.style.left, top: paper.style.top, width: W + 'px', height: H + 'px' } });
    return { wrap, strips, shadow };
  }
  function poseLeaf(L, t) {                                    // t: 0 = 펼침, 1 = 다 넘어감
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   // 부드럽게 출발·도착
    const A = 180 * e, c = 0.95 * Math.sin(Math.PI * t);       // 가운데쯤 가장 많이 휜다 (바깥 끝이 먼저 들린다)
    const lift = 16 * Math.sin(Math.PI * Math.min(1, t * 1.6));   // 처음엔 바깥 끝만 살짝 들린다
    let acc = 0;
    L.strips.forEach((st, k) => {
      const w = (1 + c * (2 * k - (STRIPS - 1)) / (STRIPS - 1)) / STRIPS;   // 안쪽 띠는 적게, 바깥 띠는 많이 (합 = 1)
      const a = A * w + lift * (k === STRIPS - 1 ? 1 : k === STRIPS - 2 ? 0.5 : 0) * (1 - e);
      st.style.transform = `rotateY(${-a}deg)`;
      acc += a;
      const face = Math.cos(acc * Math.PI / 180);                  // 이 띠가 보는 쪽을 향한 정도
      st.querySelector('.curl-front .curl-shade').style.opacity = String(Math.min(0.85, (1 - Math.max(0, face)) * 0.9));   // 그늘 자체가 연해서 거의 다 보여 준다
      st.querySelector('.curl-back .curl-shade').style.opacity = String(Math.min(0.8, (1 - Math.max(0, -face)) * 0.85));
    });
    L.shadow.style.opacity = String(Math.sin(Math.PI * t) * 0.7);
    L.shadow.style.backgroundPosition = `${(1 - e) * 100}% 0`;
  }
  function animate(L, from, to) {
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / DUR);
        poseLeaf(L, from + (to - from) * p);
        if (p < 1) requestAnimationFrame(step); else res();
      };
      poseLeaf(L, from); requestAnimationFrame(step);
    });
  }
  async function turn(to) {
    if (turning || to === page || to < 0 || to >= PAGES) return;
    turning = true; sfx.swipe(); selected = null;
    const fwd = to > page;
    if (fwd) {                                                 // 지금 장이 넘어가고, 밑에서 다음 장이 나온다
      const L = makeLeaf(paper);
      page = to; renderAll();
      book.append(L.shadow, L.wrap);
      await animate(L, 0, 1);
      L.wrap.remove(); L.shadow.remove();
    } else {                                                   // 앞 장이 넘어와서 지금 장을 덮는다
      const under = paper.cloneNode(true); under.querySelectorAll('.x, .rs').forEach(n => n.remove()); under.classList.add('curl-under');
      page = to; renderAll();
      const L = makeLeaf(paper);
      paper.style.visibility = 'hidden';
      book.append(under, L.shadow, L.wrap);
      await animate(L, 1, 0);
      L.wrap.remove(); L.shadow.remove(); under.remove(); paper.style.visibility = '';
    }
    turning = false;
  }
  // 스티커북을 옆으로 밀어도 넘어간다
  let sx = null;
  book.addEventListener('pointerdown', e => { if (!e.target.closest('.wall-sticker')) sx = e.clientX; });
  window.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) turn(page + (dx < 0 ? 1 : -1)); });

  function renderTabs() {
    ptabs.innerHTML = '';
    const mk = (key, inner, badge) => { const t = el('div.tab-square' + (filter === key ? '.on' : ''), {}, inner); if (badge) t.append(el('div.badge', { text: String(badge) })); t.addEventListener('click', () => { filter = key; sfx.tap(); renderTabs(); renderGrid(); grid.scrollTop = 0; }); return t; };
    ptabs.append(mk('all', img('star_on', { style: { width: '30px' } })),
      mk('char', faceBadge('rabbit', 36), openChars() || null),
      mk('hanja', el('span.hanja.tab-hanja', { text: '字' }), learned().length || null));
  }
  function renderAll() {
    countPill.textContent = `${progress.wall.filter(w => w.placed && w.kind !== 'memo').length}장`;
    dotsNav.innerHTML = '';
    for (let i = 0; i < PAGES; i++) { const d = el('i' + (i === page ? '.on' : '')); d.addEventListener('click', () => turn(i)); dotsNav.append(d); }
    renderWall(paper, 1, page);
    paper.querySelectorAll('.wall-sticker').forEach(node => {
      const inst = progress.wall.find(w => String(w.uid) === node.dataset.uid);
      if (!inst) return;
      node.classList.toggle('sel', selected === inst.uid);
      const x = el('div.x', { text: '✕' });
      x.addEventListener('pointerdown', e => e.stopPropagation());
      x.addEventListener('click', e => { e.stopPropagation(); removeWallSticker(inst.uid); selected = null; save(); sfx.pop(); renderAll(); });
      const knob = el('div.rs', { html: '<svg viewBox="0 0 20 20" width="14" height="14"><path d="M4 10a6 6 0 1 0 2-4.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M3 3v4h4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' });
      attachKnob(knob, node, inst);                              // 끌면 크기 · 기울기가 바뀐다
      node.append(x, knob);
      attachDrag(node, inst, 'wall');
    });
    hint.style.display = paper.querySelector('.wall-sticker') ? 'none' : '';
    renderTabs(); renderGrid();
  }
  let CELL = 96;                                              // layout() 이 상자 폭에 맞춰 다시 정한다
  const sz = inst => Math.round(CELL * (inst.kind === 'hanja' ? T.hanjaScale : T.stickerScale) / 100);
  /** 스크롤 막대: 칸 목록 스크롤에 맞춰 손잡이를 움직이고, 손잡이를 끌면 목록이 움직인다 */
  function syncBar() {
    const th = sbar.firstChild, H = sbar.clientHeight, max = grid.scrollHeight - grid.clientHeight;
    sbar.style.display = max > 2 ? '' : 'none';
    const h = Math.max(24, H * grid.clientHeight / Math.max(1, grid.scrollHeight));
    Object.assign(th.style, { height: h + 'px', top: (max > 0 ? (H - h) * grid.scrollTop / max : 0) + 'px' });
  }
  grid.addEventListener('scroll', syncBar);
  sbar.firstChild.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    const y0 = e.clientY, s0 = grid.scrollTop, H = sbar.getBoundingClientRect().height, h = sbar.firstChild.getBoundingClientRect().height;
    const move = ev => { const max = grid.scrollHeight - grid.clientHeight; grid.scrollTop = s0 + (ev.clientY - y0) * max / Math.max(1, H - h); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  });
  function renderGrid() {
    grid.innerHTML = '';
    for (const inst of trayItems()) {
      if (inst.lock) {                                          // 잠긴 캐릭터: 회색 + 자물쇠, 어느 스테이지에서 받는지 보여 준다
        const c = el('div.tchip.locked', {}, el('div.box', {}, stickerEl(inst, sz(inst)), el('img.tlock', { src: 'assets/ui/map/lock_pink.png', alt: '' })), el('div.n', { text: inst.stage }));
        c.addEventListener('click', () => { sfx.wrong(); toast(`${inst.stage} 스테이지를 클리어하면 붙일 수 있어요`); });
        grid.append(c); continue;
      }
      const c = el('div.tchip.free', {}, el('div.box', {}, stickerEl(inst, sz(inst))), el('div.n', { text: stickerName(inst) }));
      attachDrag(c, inst, 'tray'); grid.append(c);
    }
    requestAnimationFrame(syncBar);
    if (!grid.children.length) grid.append(el('div.tchip.empty', {}, el('div.box'), el('div.n', { text: '한자를 공부하면 한자 스티커가 생겨요' })));
  }
  /** 손잡이: 스티커 가운데에서 손가락까지의 거리 → 크기, 각도 → 돌리기 */
  function attachKnob(knob, node, inst) {
    knob.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      const r = node.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1, a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
      const s0 = inst.scale || 1, rot0 = inst.rot || 0, base = baseSize(inst);
      const move = ev => {
        const d = Math.hypot(ev.clientX - cx, ev.clientY - cy), a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        inst.scale = Math.max(0.5, Math.min(2.5, s0 * d / d0));
        inst.rot = Math.round(rot0 + (a - a0) * 180 / Math.PI);
        const size = Math.round(base * inst.scale);
        Object.assign(node.style, { width: size + 'px', height: size + 'px', marginLeft: (-size / 2) + 'px', marginTop: (-size / 2) + 'px', transform: `rotate(${inst.rot}deg)` });
        const inner = node.firstElementChild; if (inner) Object.assign(inner.style, { width: size + 'px', height: size + 'px' });
        const hs = inner && inner.classList.contains('hanja-sticker'); if (hs) inner.style.fontSize = `calc(${size}px * var(--hanja-font, 0.56))`;
      };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); save(); renderAll(); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
  }
  function attachDrag(node, inst, from) {
    let ghost = null, start = null, moved = false, held = false, holdT = null, scrolling = false;
    const tray = from === 'tray';
    // 상자 칸은 세로로 쓸면 목록이 스크롤된다. 옆(또는 위 책 쪽 대각선)으로 끌거나, 0.2초 누르고 있다가 끌면 스티커를 집는다
    if (tray) node.addEventListener('touchmove', e => { if (moved || held) e.preventDefault(); }, { passive: false });
    node.addEventListener('pointerdown', e => {
      if (!tray) e.preventDefault();
      e.stopPropagation();
      start = { x: e.clientX, y: e.clientY, t: performance.now() }; moved = false; held = false; scrolling = false;
      clearTimeout(holdT);
      if (tray) holdT = setTimeout(() => { if (start && !moved && !scrolling) { held = true; node.classList.add('lift'); buzz(10); } }, 200);
      if (!tray || e.pointerType === 'mouse') { try { node.setPointerCapture(e.pointerId); } catch (err) { /* 합성 이벤트 */ } }
    });
    node.addEventListener('pointermove', e => {
      if (!start || scrolling) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 8) return;
      if (!moved && tray && !held && e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx) * 1.2) { scrolling = true; clearTimeout(holdT); return; }   // 세로 = 스크롤
      if (!moved) {
        clearTimeout(holdT);
        try { node.setPointerCapture(e.pointerId); } catch (err) { /* 합성 이벤트 */ }
        moved = true; sfx.tap();
        const size = baseSize(inst) * (inst.scale || 1) * 1.15;
        ghost = el('div.drag-ghost', { style: { width: size + 'px', height: size + 'px', marginLeft: (-size / 2) + 'px', marginTop: (-size / 2) + 'px' } }, stickerEl(inst, size));
        root.append(ghost);
        if (from !== 'tray') node.style.visibility = 'hidden';   // 상자의 스티커는 그대로 남는다 (또 쓸 수 있다)
      }
      const p = toLogical(e.clientX, e.clientY);
      ghost.style.left = p.x + 'px'; ghost.style.top = p.y + 'px';
    });
    const end = e => {
      clearTimeout(holdT); node.classList.remove('lift');
      if (!start) return;
      if (scrolling) { start = null; scrolling = false; return; }
      const wasMoved = moved; start = null; held = false;
      if (!wasMoved) { if (from === 'wall') { selected = selected === inst.uid ? null : inst.uid; sfx.pop(); renderAll(); } return; }
      moved = false; sx = null;
      if (ghost) { ghost.remove(); ghost = null; }
      const p = toLogical(e.clientX, e.clientY);
      const r = logicalRect(paper);
      const inside = p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
      if (inside) {
        if (inst.virtual) inst = addWallSticker({ kind: inst.kind, id: inst.id });   // 상자에서 끌어오면 새 스티커를 만든다
        inst.x = Math.min(0.94, Math.max(0.06, (p.x - r.x) / r.w));
        inst.y = Math.min(0.94, Math.max(0.06, (p.y - r.y) / r.h));
        inst.page = page;
        if (!inst.placed) inst.rot = Math.round(Math.random() * 20 - 10);
        inst.placed = true; selected = null; sfx.stick();
      } else if (inst.placed) { removeWallSticker(inst.uid); sfx.pop(); }   // 책 밖으로 끌어내면 떼어 낸다
      save(); renderAll();
    };
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
  }
  paper.addEventListener('pointerdown', e => { if (e.target === paper) { selected = null; renderAll(); } });
  renderAll();
  layout();
  setTimeout(() => {
    layout(); renderAll();
    if (params.demoTurn) {                                     // 스크린샷용: 넘기는 중간 모습에서 멈춘다
      const L = makeLeaf(paper); page = 1; renderAll(); book.append(L.shadow, L.wrap); poseLeaf(L, params.demoTurn);
    }
  }, 0);
  window.addEventListener('resize', () => { if (root.isConnected) layout(); });
});
