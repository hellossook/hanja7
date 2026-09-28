// S4 게임 화면 (탕후루 만들기) + S5 판매 흐름 (코팅 고르기 → 저어주기 → 완성 → 판매) — v2 스티커 스타일
import { el, img, icon, go, button, registerScreen, wait, sparkles, bgLayer, tile, pill, noteCard, ribbon, roundBtn, chatBubble, faceBadge, frameBadge, shuffle, pick, backBtn, toast, fitText } from '../core/ui.js';
import { STAGE_BY_ID, jellyFor, starsFor, REVIEW_BONUS, COATINGS, ORDER_LINES, CHAT_LINES, UNLOCKS, CUSTOMERS } from '../data/stages.js';
import { buildStage, buildReview } from '../quiz.js';
import { progress, recordAnswer, recordStage, addJelly, grantSticker, grantUnlock, unlockedCoats, addWallSticker, save } from '../core/store.js';
import { stickerEl, randomWallSpot, VARIANT_COUNT } from '../wall.js';
import { sfx, buzz, buzzOnRelease } from '../core/audio.js';
import { logicalRect, toLogical } from '../core/scale.js';
import { BY_ID, displayHunEum } from '../data/hanja.js';
import { tune } from '../core/tune.js';

const fruitH = fw => Math.round(fw * 128 / 120);          // 과일 조각 그림 비율 120:128
/** 꼬치에 꽂힐 때의 모양: 과일마다 따로 그린 조각 (assets/fruits/<id>_piece.png) */
export const skewerImg = name => 'piece_' + name;

/** 세로 꼬치 요소. fruits: 먼저 꽂은 것부터. 첫 과일이 막대 끝(뾰족한 쪽)을 tip 만큼 덮고, 그 아래로 gap 간격으로 쌓인다.
 *  fw: 과일 크기 · gap: 과일 크기 대비 간격(%) · stickH: 막대 길이 (0 이면 과일 5개 높이 = 막대가 밖으로 안 나온다)
 *  flip: 꼬치 전체(막대 + 과일)를 180° 돌려서 손잡이가 위, 뾰족한 끝이 아래 (코팅 냄비에 담글 때) */
export function skewerEl(fruits, { fw = 100, gap = 76, stickH = 0, tip = null, coated = false, coat = 'sugar', target = false, flip = false } = {}) {
  const pitch = Math.round(fw * gap / 100);
  if (tip == null) tip = Math.round(fruitH(fw) * 0.06);
  if (!stickH) stickH = fruitH(fw) + 4 * pitch - tip;
  const w = fw + 16;
  const sk = el('div.skewer' + (flip ? '.flip' : ''), { style: { width: w + 'px', height: stickH + 'px', marginLeft: (-w / 2) + 'px', transform: flip ? 'rotate(180deg)' : '' } });
  Object.assign(sk.dataset, { fw, stickH, pitch, tip, flip: flip ? 1 : 0 });
  sk.append(el('div.stick', { style: { top: '0', height: stickH + 'px' } }));   // 꼬치 막대 그림 (skin.js 'stick')
  if (target) sk.append(el('div.target', { style: { width: '104px', height: '104px', marginLeft: '-52px', top: '-36px' } }));
  fruits.forEach((f, i) => addFruit(sk, f, i, coated, coat));
  return sk;
}
const geo = sk => ({ fw: +sk.dataset.fw, stickH: +sk.dataset.stickH, pitch: +sk.dataset.pitch, tip: +sk.dataset.tip, flip: sk.dataset.flip === '1' });
/** i 번째 과일의 top (꼬치 요소 안 좌표). 처음 꽂은 0번이 5칸 중 가장 아래, 이후 위로 쌓여 5번째가 막대 끝을 덮는다.
 *  뒤집힌 꼬치는 요소째 돌아가므로 계산은 같다 */
export function slotTop(sk, i) {
  const g = geo(sk);
  return -g.tip + (4 - i) * g.pitch;
}
export function addFruit(sk, name, i, coated = false, coat = 'sugar') {
  const g = geo(sk);
  const node = el('div.fruit', { 'data-fruit': name, style: { top: slotTop(sk, i) + 'px', marginLeft: (-g.fw / 2) + 'px', width: g.fw + 'px' } }, img(skewerImg(name), { style: { width: g.fw + 'px' } }));
  sk.append(node);
  if (coated) coatFruit(sk, i, coat);
  return node;
}
/** 코팅: 같은 자리에 코팅된 조각 그림을 겹친다 (설탕 · 초코 · 무지개 껍질). 저어줄 때는 투명도로 서서히 입혀진다 */
export function coatFruit(sk, i, coat = 'sugar') {
  const g = geo(sk);
  const f = sk.querySelectorAll('.fruit')[i];
  const name = f ? f.dataset.fruit : 'strawberry';
  sk.append(img(`piece_${name}_${coat}`, { class: 'coat', style: { top: slotTop(sk, i) + 'px', marginLeft: (-g.fw / 2) + 'px', width: g.fw + 'px' } }));
}

/** js/data/tuning.json 의 한 장면 수치로 꼬치를 만들어 자리까지 잡아 준다.
 *  바깥(.tuned-skewer)이 위치·크기·기울기, 안쪽(.inner)이 등장 애니메이션 · 저어주기 흔들림을 맡는다 */
export function tunedSkewer(scene, fruits, { cls = '', anim = '', coated = false, coat = 'sugar', flip = false } = {}) {
  const c = tune()[scene];
  const sk = skewerEl(fruits, { fw: c.fruitSize, gap: c.gap, stickH: c.stickLength, tip: c.tipCover, coated, coat, flip });
  const h = +sk.dataset.stickH;
  return el('div.tuned-skewer' + (cls ? '.' + cls : ''), {
    'data-scene': scene,
    style: { left: `calc(50% + ${c.x}px)`, top: `calc(var(--safe-top) + ${c.y}px)`, transformOrigin: `0 ${h / 2}px`, transform: `rotate(${c.rotate || 0}deg) scale(${(c.scale || 100) / 100})` },
  }, el('div.inner' + (anim ? '.' + anim : ''), {}, sk));
}
/** 조리 냄비 (빈 냄비 또는 시럽이 담긴 냄비) */
function cookPot(scene, coat) {
  const c = tune()[scene];
  return el('div.bowl-wrap', { style: { left: c.potX + 'px', top: `calc(var(--safe-top) + ${c.potY}px)`, width: c.potWidth + 'px' } },
    el('div.cook-pot', {}, img('bowl'), coat ? img('syrup_' + coat, { class: 'syrup' }) : null));
}

registerScreen('game', (root, params) => {
  const isReview = !!params.review;
  const stage = isReview ? null : STAGE_BY_ID[params.stageId];
  const questions = isReview ? buildReview(params.review) : buildStage(params.stageId);
  const skewerCount = Math.ceil(questions.length / 5);
  const customer = isReview ? 'owl' : stage.customer;
  const tutorial = !!(stage && stage.tutorial && !progress.tutorialDone);
  const coats = unlockedCoats();

  const S = { made: [], qi: 0, tanghulu: 0, onSkewer: [], firstTry5: 0, firstTryTotal: 0, jellyTotal: 0, wrongIds: [], attempts: 0, locked: false, fw: 70, tileSize: 84, stickH: 400, coat: 'sugar', last: null };

  // ---------- 레이아웃 ----------
  root.append(bgLayer('peach'));
  const gt = tune().game;
  /** 재화 박스 묶음: 오른쪽 · 위 위치는 조정 모드(게임 탭)에서 */
  const placePills = node => Object.assign(node, { style: `right:${gt.pillsX}px; top:calc(var(--safe-top) + ${gt.pillsY}px)` }) && Object.assign(node.dataset, { tx: 'pillsX', ty: 'pillsY', tmode: 'right' }) && node;
  const jellyCount = el('span.txt', { text: String(progress.jelly) });
  const progPill = pill(icon.miniSkewer(true, 18), `${S.tanghulu + 1} / ${skewerCount}`, 'yellow');
  root.append(placePills(el('div.pills', {}, el('div.pill.pink', {}, el('div.ico', {}, img('jelly')), jellyCount), progPill)));
  const noteWrap = el('div.game-note', { 'data-tx': 'noteX', 'data-ty': 'noteY', 'data-tmode': 'plain', style: { left: gt.noteX + 'px', top: gt.noteY + 'px' } });
  const note = noteCard([]);
  Object.assign(note.style, { width: gt.noteW + 'px', height: gt.noteH + 'px' });
  noteWrap.append(note);
  const body = el('div.game-body');
  const wallLayer = el('div.wall-layer');
  const opts = el('div.opts', { 'data-tx': 'tilesX', 'data-ty': 'tilesY', 'data-tmode': 'plain', style: { left: gt.tilesX + 'px', top: gt.tilesY + 'px' } });
  const skewerWrap = el('div.skewer-wrap');
  const dots = el('div.dots', { 'data-tx': 'dotsX', 'data-ty': 'dotsY', 'data-tmode': 'right plain', style: { right: gt.dotsX + 'px', top: gt.dotsY + 'px', gap: gt.dotGap + 'px' } });
  dots.style.setProperty('--dot', gt.dotSize + 'px');   // 진행 표시 크기 (CSS 변수)
  opts.style.setProperty('--tag-x', gt.tagX + 'px'); opts.style.setProperty('--tag-y', gt.tagY + 'px'); opts.style.setProperty('--tag-s', gt.tagScale / 100);   // 한자 글자 위치·크기
  body.append(wallLayer, opts, skewerWrap, dots);
  root.append(noteWrap, body, el('div.bottom-safe'));
  const gameBack = backBtn(() => go('map'), gt.backSize);
  Object.assign(gameBack.style, { position: 'absolute', left: gt.backX + 'px', top: `calc(var(--safe-top) + ${gt.backY}px)`, zIndex: 7 });
  Object.assign(gameBack.dataset, { tx: 'backX', ty: 'backY' });
  root.append(gameBack);
  // 과일 꽂는 화면에서는 벽 스티커를 그리지 않는다 (스티커는 스티커 화면에서 본다)

  let sk = null;
  function layout() {
    const h = Math.max(240, body.clientHeight);
    S.tileSize = tune().game.tileSize || Math.max(58, Math.min(84, Math.floor((h - 16 - 3 * 18) / 4)));   // 0 = 화면 높이에 맞춤
    let tgap = tune().game.tileGap || (S.tileSize > 70 ? 20 : 14);
    const room = h - tune().game.tilesY - 8;                                 // 과일 칸 4개가 들어갈 자리 (아이폰 안전영역이 크면 좁아진다)
    if (4 * S.tileSize + 3 * tgap > room) tgap = Math.max(6, Math.floor((room - 4 * S.tileSize) / 3));
    if (4 * S.tileSize + 3 * tgap > room) S.tileSize = Math.max(48, Math.floor((room - 3 * tgap) / 4));
    opts.style.gap = tgap + 'px';
    const c = tune().game;
    S.stickH = c.stickLength || (h - 16 - c.y);             // 막대 길이 0 = 화면 아래까지
    // 과일 5개가 막대보다 길면(작은 화면) 들어가게 과일 크기를 줄인다
    const need = fw => fruitH(fw) + 4 * Math.round(fw * c.gap / 100) - c.tipCover;
    S.fw = c.fruitSize;
    if (need(S.fw) > S.stickH - 24) S.fw = Math.max(40, Math.floor(S.fw * (S.stickH - 24) / need(S.fw)));
    skewerWrap.innerHTML = '';
    Object.assign(skewerWrap.style, { left: `calc(50% + ${c.x}px)`, top: c.y + 'px' });
    sk = skewerEl(S.onSkewer, { stickH: S.stickH, fw: S.fw, gap: c.gap, tip: c.tipCover, target: true });
    skewerWrap.append(sk);
    placeTarget();
    renderDots();
  }
  /** 점선 원: 과일을 갖다 댈 꼬치 끝. 꽂히기 시작하면(hide) · 5개 다 꽂으면 숨김 */
  function placeTarget(hide = false) {
    const tg = sk && sk.querySelector('.target'); if (!tg) return;
    tg.style.display = hide || S.onSkewer.length >= 5 ? 'none' : '';
    const d = Math.round(S.fw * 0.86);
    Object.assign(tg.style, { width: d + 'px', height: d + 'px', marginLeft: (-d / 2) + 'px', top: Math.round(-d * 0.2) + 'px' });
  }
  /** 문제 글자가 카드보다 길면 자동으로 작게 */
  function fitQuestion() {
    const inner = note.clientWidth - 52;
    note.querySelectorAll('.q-hun, .q-hanja, .q-word, .q-pic, .q-answer').forEach(n => fitText(n, inner, 18));
  }
  function renderDots() {
    dots.innerHTML = '';
    for (let i = 0; i < 5; i++) dots.append(el('i' + (i < S.onSkewer.length ? '.on' : '')));
  }
  function renderProgress() { progPill.querySelector('.txt').textContent = `${Math.min(S.tanghulu + 1, skewerCount)} / ${skewerCount}`; }

  // ---------- 손님 주문 토스트 ----------
  function showOrder(index, hold = false) {
    const lines = ORDER_LINES[customer] || ORDER_LINES.boss;
    S.locked = true;
    opts.innerHTML = ''; opts.style.visibility = 'hidden';
    return new Promise(resolve => {
      const t = el('div.order-toast.rise-in', {},                  // 말풍선(위) + 손님(아래) 화면 가운데
        el('div.speech', {}, el('span.chip', { text: isReview ? '복습 주문!' : '주문!' }), el('div.line', { text: lines[index % lines.length] })),
        img('char_' + customer));
      const dim = el('div.order-dim');                            // 손님이 말하는 동안 뒷배경을 살짝 어둡게
      let done = false;
      const close = () => { if (done) return; done = true; t.classList.add('out'); dim.classList.add('out'); setTimeout(() => { t.remove(); dim.remove(); opts.style.visibility = ''; resolve(); }, 240); };
      t.addEventListener('pointerdown', close); dim.addEventListener('pointerdown', close);
      root.append(dim, t); sfx.bell();
      if (!hold) setTimeout(close, 2600);
    });
  }

  // ---------- 문제 ----------
  function renderQuestion() {
    const q = questions[S.qi];
    S.attempts = 0; S.locked = false;
    note.className = 'note'; note.innerHTML = ''; note.append(el('div.tape'));
    const label = q.prompt.type === 'hun' || q.prompt.type === 'picture' ? '어떤 한자일까?' : '어떻게 읽을까?';
    note.append(el('span.chip', { text: label }));
    if (q.prompt.type === 'hun') note.append(el('div.q-hun', { text: q.prompt.text }));
    else if (q.prompt.type === 'hanja') note.append(el('div.hanja.q-hanja', { text: q.prompt.text }));
    else if (q.prompt.type === 'word') note.append(el('div.hanja.q-word', { text: q.prompt.text }));
    else note.append(el('div.q-pic', { text: q.prompt.text }));
    fitQuestion();
    opts.innerHTML = '';
    q.options.forEach(o => {
      const t = tile(img('fruit_' + o.fruit, { style: { width: Math.round(S.tileSize * tune().game.fruitScale / 100) + 'px' } }), { size: S.tileSize, tag: o.label, tagKind: o.kind });
      attachDrag(t, o, q);                                         // 과일은 꼬치까지 끌어서 꽂는다
      opts.append(t);
    });
    root.querySelectorAll('.tap-guide').forEach(n => n.remove());
    if (tutorial && S.qi === 0) setTimeout(() => {                 // 튜토리얼: 손가락이 정답 과일에서 꼬치까지 끌어 보인다
      const t = [...opts.children][q.options.findIndex(o => o.correct)]; if (!t) return;
      const r = logicalRect(t), g = logicalRect(sk.querySelector('.target') || sk);
      const hand = img('hand', { class: 'tap-guide drag', style: { left: (r.x + r.w / 2 - 8) + 'px', top: (r.y + r.h / 2 - 6) + 'px' } });
      hand.style.setProperty('--dx', Math.round(g.x + g.w / 2 - r.x - r.w / 2) + 'px');
      hand.style.setProperty('--dy', Math.round(g.y + g.h / 2 - r.y - r.h / 2) + 'px');
      root.append(hand);
    }, 30);
  }

  // ---------- 과일 꽂기: 꼬치 끝(맨 위)에 대면 꽂히고, 아래로 밀어 내리면 제자리까지 내려간다 (탕후루의 달인 방식) ----------
  let dragHinted = false;
  const tipPoint = () => { const r = logicalRect(sk); return { x: r.x + r.w / 2, y: r.y }; };
  function attachDrag(t, o, q) {
    t.addEventListener('pointerdown', e => {
      if (S.locked || S.dragging || t.classList.contains('dim')) return;
      e.preventDefault();
      sfx.pick(); buzz(12);                                        // 과일을 집었다 (톡 + 진동)
      const src = t.querySelector('.tile-in img');
      const r0 = logicalRect(src), p0 = toLogical(e.clientX, e.clientY);
      const ghost = el('div.drag-fruit', { style: { left: r0.x + 'px', top: r0.y + 'px', width: r0.w + 'px', height: r0.h + 'px' } }, img('fruit_' + o.fruit));
      let moved = false, mode = 'free', slotY = 0, skX = 0;
      const fh = fruitH(S.fw);
      S.dragging = true;
      const finish = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); S.dragging = false; };
      const back = async () => {                                   // 제자리로 돌아간다
        mode = 'back';
        Object.assign(ghost.style, { transition: 'left 220ms ease-out, top 220ms ease-out', left: r0.x + 'px', top: r0.y + 'px' });
        await wait(230); ghost.remove(); src.style.opacity = '';
      };
      const land = async () => {                                   // 제자리에 닿았다 → 꽂힘
        if (mode === 'done') return;
        mode = 'done'; finish();
        Object.assign(ghost.style, { transition: 'top 160ms ease-in', top: slotY + 'px' });
        await wait(170);
        ghost.remove(); src.style.opacity = '';
        correct(t, o, q);
      };
      const move = ev => {
        if (mode === 'back' || mode === 'done') return;
        const p = toLogical(ev.clientX, ev.clientY);
        if (!moved && Math.hypot(p.x - p0.x, p.y - p0.y) < 6) return;
        if (!moved) { moved = true; root.append(ghost); src.style.opacity = '0.25'; root.querySelectorAll('.tap-guide').forEach(n => n.remove()); sfx.tap(); }
        if (mode === 'free') {
          const gx = r0.x + p.x - p0.x, gyy = r0.y + p.y - p0.y;
          ghost.style.left = gx + 'px'; ghost.style.top = gyy + 'px';
          const tp = tipPoint(), cx = gx + r0.w / 2, cy = gyy + r0.h / 2;
          if (Math.hypot(cx - tp.x, cy - tp.y) < Math.max(46, S.fw * 0.5)) {       // 꼬치 끝에 닿았다
            if (!o.correct) { reject(t); back(); return; }
            mode = 'thread'; S.locked = true;                      // 꽂히기 시작 → 점선 원 사라짐, 이제 막대를 따라 아래로만
            placeTarget(true);
            const r = logicalRect(sk); skX = r.x + r.w / 2 - S.fw / 2;
            slotY = r.y + slotTop(sk, S.onSkewer.length);
            ghost.innerHTML = ''; ghost.append(img(skewerImg(o.fruit)));
            Object.assign(ghost.style, { width: S.fw + 'px', height: fh + 'px', left: skX + 'px' });
            ghost.classList.add('threaded'); sfx.stick(); buzzOnRelease(20);
          }
        }
        if (mode === 'thread') {
          const tp = tipPoint();
          const gy = Math.max(tp.y - fh * 0.6, Math.min(slotY, p.y - fh / 2));
          ghost.style.top = gy + 'px';
          if (gy >= slotY - 1) land();
        }
      };
      const up = () => {
        if (mode === 'thread') { land(); return; }                 // 손을 떼도 막대를 따라 끝까지 스르륵
        finish();
        if (mode === 'back') return;
        if (!moved) {                                              // 그냥 톡 눌렀을 때
          if (!dragHinted) { dragHinted = true; toast('과일을 꼬치 끝에 대고 아래로 밀어 꽂아요!'); }
          t.classList.remove('nudge'); void t.offsetWidth; t.classList.add('nudge');
          return;
        }
        back();
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
  }

  function reject(t) {
    S.attempts += 1; sfx.wrong(); buzzOnRelease([40, 40, 40]);
    t.classList.add('shake'); setTimeout(() => t.classList.add('dim'), 320);
    const chip = note.querySelector('.chip'); if (chip) { chip.textContent = '다시 골라보자!'; chip.classList.add('retry'); }
  }

  async function correct(t, o, q) {
    S.locked = true;
    root.querySelectorAll('.tap-guide').forEach(n => n.remove());
    const firstTry = S.attempts === 0;
    recordAnswer(q.char.id, firstTry);
    if (firstTry) { S.firstTry5 += 1; S.firstTryTotal += 1; } else if (!S.wrongIds.includes(q.char.id)) S.wrongIds.push(q.char.id);
    save();
    t.classList.add('selected'); sfx.pop();
    note.className = 'note mint'; note.innerHTML = ''; note.append(el('div.tape'), el('span.chip', { text: '정답!' }),
      el('div.q-answer', {}, el('span.hanja', { text: q.answer.hanja }), el('span.jua', { text: q.answer.hunEum })));
    fitQuestion();
    const i = S.onSkewer.length;
    S.onSkewer.push(o.fruit);
    addFruit(sk, o.fruit, i);
    renderDots();
    await wait(650);
    S.qi += 1;
    if (S.onSkewer.length >= 5 || S.qi >= questions.length) startCoating();
    else { renderQuestion(); placeTarget(); }
  }

  // ---------- 판매 흐름 ----------
  let layer = null;
  function newLayer(bg) { if (layer) layer.remove(); layer = el('div.stage-layer'); layer.append(bgLayer(bg)); root.append(layer); return layer; }

  function startCoating() {
    const L = newLayer('yellow');
    L.append(el('div.heading', { text: coats.length > 1 ? '코팅을 골라 넣어주세요' : '설탕을 넣어주세요' }));
    const jars = el('div.jars');
    const all = ['sugar', 'choco', 'rainbow'];
    all.forEach(c => {
      const open = coats.includes(c);
      const from = Object.entries(UNLOCKS).find(([, u]) => u.id === c);
      const j = el('div.jar' + (open ? '' : '.locked.small'), {}, el('div.pot', {}, img(COATINGS[c].img)), el('div.lbl', { text: open ? COATINGS[c].name : (from ? from[0] + ' 클리어' : '') }));
      if (open) j.addEventListener('click', () => { sfx.tap(); startStir(c); });
      jars.append(j);
    });
    L.append(jars);
    L.append(cookPot('coat'));                                          // 빈 조리 냄비
    L.append(tunedSkewer('coat', S.onSkewer, { flip: true }));          // 손잡이가 위, 끝이 냄비 안
    if (tutorial) L.append(el('div', { style: { position: 'absolute', left: '50%', bottom: 'calc(var(--safe-bottom) + 30px)', transform: 'translateX(-50%)' } },
      el('div.stage-caption', { style: { position: 'static', whiteSpace: 'nowrap' }, text: '병을 탭하면 코팅이 시작돼요' })));
  }

  function startStir(coat) {
    S.coat = coat;
    const L = newLayer('yellow');
    L.append(el('div.heading', { text: '꼬치를 좌우로 저어주세요' }));
    L.append(cookPot('stir', coat));                                    // 고른 시럽이 담긴 냄비
    const stirWrap = tunedSkewer('stir', S.onSkewer, { flip: true });
    const skw = stirWrap.querySelector('.inner');                      // 흔들림은 안쪽에만 (바깥은 조정 모드의 위치·크기)
    skw.style.transition = 'transform 120ms';
    L.append(stirWrap, el('div.stir-hint', { style: { top: `calc(var(--safe-top) + ${tune().stir.hintY}px)` } }, icon.stir(150, 40)));
    L.append(el('div', { style: { position: 'absolute', right: '14px', bottom: 'calc(var(--safe-bottom) + 92px)' } }, img('char_' + customer, { style: { width: '92px' } })));   // 냄비 아래 오른쪽
    // 좌우로 4번 (왼쪽↔오른쪽 방향이 바뀔 때마다 1번) 저으면 코팅 완성. 손가락을 떼면(탭) 그것도 1번으로 친다
    const SWIPES = 4;
    let lastX = null, dir = 0, swipes = 0, run = 0, done = false;
    const paint = () => {
      const k = Math.min(1, (swipes + Math.min(1, run / 90)) / SWIPES);   // 지금 젓는 중인 만큼도 조금씩 칠해진다
      const inner = skw.querySelector('.skewer');
      for (let i = 0; i < S.onSkewer.length; i++) { if (!inner.querySelectorAll('.coat')[i]) coatFruit(inner, i, coat); }
      inner.querySelectorAll('.coat').forEach(c => { c.style.opacity = String(k); });
      if (k >= 1 && !done) { done = true; sfx.coat(); sparkles(L, [[60, 300, '#fff'], [320, 320, '#FFD84F'], [100, 460, '#FFD84F'], [280, 500, '#fff'], [200, 260, '#fff']], 22); setTimeout(finishStir, 700); }
    };
    const countSwipe = () => { swipes += 1; run = 0; sfx.swipe(); paint(); };
    L.addEventListener('pointerdown', e => { lastX = e.clientX; dir = 0; run = 0; });
    L.addEventListener('pointermove', e => {
      if (lastX == null || done) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      if (Math.abs(dx) < 1) return;
      const d = Math.sign(dx);
      if (dir && d !== dir && run > 24) countSwipe();                    // 방향이 바뀌었다 = 한 번 저었다
      dir = d; run += Math.abs(dx);
      skw.style.transform = `translateX(${Math.max(-40, Math.min(40, dx * 1.5))}px) rotate(${Math.max(-10, Math.min(10, dx * 0.4))}deg)`;
      paint();
    });
    L.addEventListener('pointerup', () => { if (lastX == null) return; lastX = null; skw.style.transform = ''; if (!done) countSwipe(); });   // 손을 떼면 그 획도 1번
  }

  function finishStir() {
    const L = newLayer('done');   // 설탕까지 바른 완성 화면 배경 (bg_done.jpg)
    [[40, 300, 22], [330, 260, 18], [60, 560, 16], [320, 520, 20]].forEach(([x, y, s], i) => L.append(el('div.sparkle', { style: { left: x + 'px', top: y + 'px', animationDelay: i * 200 + 'ms' } }, icon.sparkle(s, '#fff'))));
    L.append(el('div', { style: { position: 'absolute', left: '45px', top: 'calc(var(--safe-top) + 30px)' } }, ribbon('탕후루 완성!', 'blue')));
    L.append(tunedSkewer('done', S.onSkewer, { cls: 'done-skewer', anim: 'pop-in', coated: true, coat: S.coat }));
    L.append(el('div.stage-caption', { style: { bottom: 'calc(var(--safe-bottom) + 118px)' }, text: `${COATINGS[S.coat].name} 코팅 · 첫 시도 정답 ${S.firstTry5}개` }));
    L.append(el('div.stage-cta', {}, button('손님에게 팔기', 'block', showCustomer)));
    sfx.bell();
  }

  async function showCustomer() {
    const L = newLayer('sale');   // 손님이 먹는 장면 배경 (bg_sale.jpg) — 벽과 바닥이 이미지에 들어 있다
    L.append(placePills(el('div.pills', {}, el('div.pill.pink', {}, el('div.ico', {}, img('jelly')), el('span.txt', { text: String(progress.jelly) })), pill(icon.miniSkewer(true, 18), `${S.tanghulu + 1} / ${skewerCount}`, 'yellow'))));
    const sc = tune().sale;
    const custEl = el('div.sale-customer.rise-in', { 'data-tx': 'custX', 'data-ty': 'custY', style: { left: sc.custX + 'px', top: `calc(var(--safe-top) + ${sc.custY}px)` } },
      img('char_' + customer, { style: { width: sc.custSize + 'px' } }));
    L.append(custEl);
    L.append(tunedSkewer('sale', S.onSkewer, { cls: 'sale-skewer', anim: 'rise-in', coated: true, coat: S.coat }));
    await wait(450);
    custEl.querySelector('img').src = img('char_' + customer + '_happy').src;
    L.append(el('div.sale-bubble.pop-in', { 'data-tx': 'bubbleX', 'data-ty': 'bubbleY', style: { left: sc.bubbleX + 'px', top: `calc(var(--safe-top) + ${sc.bubbleY}px)` } }, el('div.speech', {}, el('div.line', { text: isReview ? '고마워요!' : '맛있어요!' }))));
    sfx.bell();
    await wait(500);
    let jelly = jellyFor(S.firstTry5);
    if (isReview && params.bonus) jelly += REVIEW_BONUS;
    S.jellyTotal += jelly;
    addJelly(jelly); save();
    L.querySelector('.pills .txt').textContent = String(progress.jelly);
    jellyCount.textContent = String(progress.jelly);
    L.append(el('div.sale-jelly.pop-in', { style: { top: 'calc(var(--safe-top) + 448px)' } }, pill(img('jelly'), `+ 젤리 ${jelly}`)));
    sfx.jelly();
    // 다른 손님들의 한마디
    const others = shuffle(Object.keys(CHAT_LINES).filter(c => c !== customer && c !== 'owl')).slice(0, 3);
    const list = el('div.chat-list', { style: { top: 'calc(var(--safe-top) + 490px)' } });
    L.append(list);
    for (let i = 0; i < others.length; i++) {
      await wait(260);
      list.append(el('div.chat-item', {}, faceBadge(others[i], 58), el('div.msg', { text: pick(CHAT_LINES[others[i]]) })));
    }
    await stickCustomerSticker(L, custEl);
    S.last = { fruits: S.onSkewer.slice(), coat: S.coat };
    S.made.push(S.last);                                        // 이 스테이지에서 만든 탕후루 (결과 화면에 전부)
    const last = S.qi >= questions.length;
    if (last) L.append(el('div.done-bubble.plain.pop-in', {}, el('div.done-text', { text: isReview ? '새콤달콤 복습 탕후루를 다 팔았어요!' : `새콤달콤 탕후루 ${skewerCount}개 모두 판매했어요!` })));
    const cta = el('div.sale-cta.rise-in', {}, button(last ? '결과 보기' : '다음 탕후루', last ? 'yellow' : '', () => last ? finish() : nextTanghulu()));
    L.append(cta);
  }

  /** 손님이 벽에 자기 스티커를 붙이고 간다 */
  async function stickCustomerSticker(L, custEl) {
    const spot = randomWallSpot();
    const inst = { kind: 'cust', id: `${customer}_${1 + Math.floor(Math.random() * VARIANT_COUNT)}`, x: spot.x, y: spot.y, rot: spot.rot, placed: true };
    const from = logicalRect(custEl);
    const size = 60;
    const fly = el('div.fly-sticker', { style: { left: (from.x + from.w * 0.6) + 'px', top: (from.y + from.h * 0.3) + 'px', width: size + 'px', height: size + 'px' } }, stickerEl(inst, size));
    L.append(fly); sfx.pop();
    await wait(30);
    Object.assign(fly.style, { left: '300px', top: 'calc(var(--safe-top) + 120px)', transform: `rotate(${spot.rot}deg) scale(0.8)` });
    await wait(560);
    fly.remove();
    addWallSticker(inst); save();
    sfx.stick(); buzz(20);
    const note = el('div.sale-note-wrap', {}, el('div.sale-note.pop-in', {}, '벽에 스티커를 붙이고 갔어요!'));   // 화면 한가운데
    L.append(note);
    setTimeout(() => { note.classList.add('fade-out'); setTimeout(() => note.remove(), 320); }, 2000);   // 2초 뒤 사라짐
    await wait(300);
  }

  function nextTanghulu() {
    if (layer) { layer.remove(); layer = null; }
    S.tanghulu += 1; S.firstTry5 = 0; S.onSkewer = []; S.coat = 'sugar';
    layout(); renderProgress();
    showOrder(S.tanghulu).then(renderQuestion);
  }
  function finish() {
    if (layer) { layer.remove(); layer = null; }
    if (isReview) { save(); go('result', { review: true, jelly: S.jellyTotal, firstTry: S.firstTryTotal, wrongIds: S.wrongIds, last: S.last, made: S.made }); return; }
    const stars = starsFor(S.firstTryTotal);
    recordStage(stage.id, stars);
    const unlock = grantUnlock(stage.id);
    const sticker = null;                                        // 기념 스티커는 없앴다 (스티커는 캐릭터 · 한자만)
    if (tutorial) progress.tutorialDone = true;
    save();
    go('result', { stageId: stage.id, stars, jelly: S.jellyTotal, firstTry: S.firstTryTotal, wrongIds: S.wrongIds, sticker, unlock, last: S.last, made: S.made });
  }

  // ---------- 데모 모드 (스크린샷용) ----------
  function demoQuestion(state) {
    const c = BY_ID['天'];
    const opt = (label, kind, correct, fruit) => ({ label, kind, correct, fruit });
    const hanjaOpts = [opt('天', 'hanja', true, 'strawberry'), opt('川', 'hanja', false, 'tangerine'), opt('地', 'hanja', false, 'apple'), opt('花', 'hanja', false, 'grape')];
    const base = { mode: 'A', char: c, prompt: { type: 'hun', text: displayHunEum(c) }, options: hanjaOpts, answer: { hanja: '天', hunEum: '하늘 천' } };
    if (state === 'B') return { ...base, mode: 'B', prompt: { type: 'hanja', text: '天' }, options: [opt('하늘 천', 'hun', true, 'kiwi'), opt('내 천', 'hun', false, 'strawberry'), opt('땅 지', 'hun', false, 'grape'), opt('꽃 화', 'hun', false, 'tangerine')] };
    if (state === 'C') return { ...base, mode: 'C', prompt: { type: 'picture', text: c.picture } };
    if (state === 'D') return { ...base, mode: 'D', char: BY_ID['秋'], prompt: { type: 'word', text: '秋夕' }, answer: { hanja: '秋', hunEum: '가을 추' },
      options: [opt('추석', 'read', true, 'tangerine'), opt('추일', 'read', false, 'apple'), opt('석추', 'read', false, 'strawberry'), opt('춘석', 'read', false, 'kiwi')] };
    return base;
  }
  async function runDemo(state) {
    questions[0] = demoQuestion(state);
    S.onSkewer = ['strawberry', 'tangerine'];
    layout();
    if (state === 'toast') { showOrder(0, true); return; }
    if (state === 'full') { S.onSkewer = ['strawberry', 'tangerine', 'grape', 'blueberry', 'kiwi']; layout(); renderQuestion(); return; }
    if (['jars', 'stir', 'done', 'sale', 'sticker'].includes(state)) {
      S.onSkewer = ['strawberry', 'tangerine', 'grape', 'blueberry', 'kiwi']; S.firstTry5 = 4;
      layout(); renderQuestion();
      if (state === 'jars') return startCoating();
      if (state === 'stir') return startStir('choco');
      S.coat = 'choco';
      if (state === 'done') return finishStir();
      return showCustomer();
    }
    renderQuestion();
    const q = questions[0]; const cells = [...opts.children];
    if (state === 'wrong') { cells[q.options.findIndex(o => !o.correct)].classList.add('dim'); const chip = note.querySelector('.chip'); chip.textContent = '다시 골라보자!'; chip.classList.add('retry'); }
    if (state === 'correct') {
      S.locked = true; cells[q.options.findIndex(o => o.correct)].classList.add('selected');
      note.className = 'note mint'; note.innerHTML = ''; note.append(el('div.tape'), el('span.chip', { text: '정답!' }), el('div.q-answer', {}, el('span.hanja', { text: q.answer.hanja }), el('span.jua', { text: q.answer.hunEum })));
    }
  }

  renderProgress();
  if (params.demo) setTimeout(() => runDemo(params.demo), 0);
  else setTimeout(() => { layout(); showOrder(0).then(renderQuestion); }, 0);
  window.addEventListener('resize', () => { if (root.isConnected && !layer) layout(); });
});
