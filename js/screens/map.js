// S2 메인 맵 — 캔디맵 (2026-09-27 새 디자인): 사탕 배경 길 위에 설탕 코팅 과일 알 노드
import { el, img, icon, go, registerScreen, stars, toast, pill, faceBadge, button, tile, uiIcon, menuBtn, petals } from '../core/ui.js';
import { tune, tuneMode } from '../core/tune.js';
import { progress, stageState } from '../core/store.js';
import { STAGES, STAGE_ORDER, STAGE_BY_ID, CHAPTERS, CHAPTER_BY_ID, stageLabel, REVIEW_THRESHOLD, REVIEW_BONUS } from '../data/stages.js';
import { box0Ids, reviewSet } from '../quiz.js';
import { BY_ID, displayHunEum } from '../data/hanja.js';
import { sfx, setSound, buzz } from '../core/audio.js';
import { profileCard } from './title.js';
import { save, resetProgress } from '../core/store.js';

// 챕터마다 맵 그림이 다르다 (CHAPTERS). 노드 위치는 js/data/tuning.json 의 그 챕터 장면(map, map2…)에 — 조정 모드에서 끌어 옮긴다
// 과일 알: 8급 = 딸기, 챕터 안 1~5번째 = 귤·청포도·블루베리·키위·포도 (같은 그림을 챕터마다 다시 쓴다)
const BALLS = ['orange', 'muscat', 'blue', 'kiwi', 'grape'];
const BALL_COLOR = { straw: '#F0363C', orange: '#F6A62C', muscat: '#A8E752', blue: '#4249DB', kiwi: '#BCE243', grape: '#B851D4' };
const BALL_LOCK = { straw: 'pink', orange: 'blue', muscat: 'green', blue: 'orange', kiwi: 'purple', grape: 'silver' };
const LOCK_GRAY = '#B5B2AE';
const lastCamBy = {};   // 챕터별 지난번 맵 화면 위치 (구간이 바뀌면 거기서부터 움직인다)
const PAD = 200;   // 헤더에 가려지는 만큼 위쪽 여백 (맵 세로 = 1180 + PAD)
const MAP = 'assets/ui/map/';
function mapImg(name, cls) { return el('img', { src: MAP + name + '.png', alt: '', class: cls }); }

function nodeState(id) {
  const st = stageState(id);
  if (st.cleared) return 'clear';
  const idx = STAGE_ORDER.indexOf(id);
  if (idx === 0) return 'open';
  return stageState(STAGE_ORDER[idx - 1]).cleared ? 'open' : 'lock';
}

/** 복습 손님 다이얼로그: 틀렸던 글자를 모두 보여 주고(모자라면 무작위로 채운 글자는 점선 카드), 그 글자들로 복습 탕후루를 만든다 */
export function reviewDialog(root, demoIds) {
  const set = demoIds ? { wrong: demoIds, extra: [] } : reviewSet();
  const ids = set.wrong.concat(set.extra);
  const chips = el('div.review-chips');
  for (const id of ids) {
    const c = BY_ID[id]; if (!c) continue;
    chips.append(el('div.rc' + (set.wrong.includes(id) ? '' : '.extra'), {}, el('span.h', { text: c.hanja }), el('span.m', { text: displayHunEum(c) })));
  }
  const skewers = Math.ceil(ids.length / 5);
  const ov = el('div.overlay');
  ov.append(el('div.scrim', { onClick: () => ov.remove() }));
  const dlg = el('div.dialog.pop-in', { style: { top: 'calc(var(--safe-top) + 60px)' } },
    el('div.dtitle', { html: `복습하면 젤리 ${REVIEW_BONUS}개를<br>더 받을 수 있어요!` }),
    el('div.dart', {}, img('char_owl_happy'), el('div.sparkle', { style: { left: '0', top: '40px' } }, icon.sparkle(24)), el('div.sparkle', { style: { right: '0', top: '20px', animationDelay: '300ms' } }, icon.sparkle(18))),
    el('div.dbody', { html: set.wrong.length ? `판다 손님이 틀렸던 글자 ${set.wrong.length}개로<br>탕후루 ${skewers}개를 주문했어요.` : `판다 손님이 글자 ${ids.length}개로<br>탕후루를 주문했어요.` }),
    chips,
    el('div.dbtn', {}, button('복습하기', '', () => go('game', { review: ids, bonus: true })), img('sticker_ribbon', { class: 'gift' })));
  ov.append(dlg);
  root.append(ov);
  return ov;
}

/** 가게 이름 바꾸기 (프로필의 연필) */
export function renameDialog(root, onDone) {
  const ov = el('div.overlay');
  ov.append(el('div.scrim', { onClick: () => ov.remove() }));
  const input = el('input.rename-input', { type: 'text', maxlength: '12', value: progress.shopName, placeholder: '가게 이름 (12자까지)', autocomplete: 'off' });
  const ok = () => {
    const v = input.value.trim().slice(0, 12);
    if (!v) { input.focus(); return; }
    progress.shopName = v; save(); sfx.pop(); ov.remove(); onDone && onDone();
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
  const dlg = el('div.dialog.rename.pop-in', { style: { top: 'calc(var(--safe-top) + 120px)' } },
    el('div.dtitle', { text: '가게 이름 바꾸기' }),
    input,
    el('div.dbtn.two', {}, button('취소', 'small', () => { sfx.tap(); ov.remove(); }), button('확인', 'yellow small', ok)),
    el('button.text-btn.reset-link', { text: '처음부터 다시 시작', onClick: () => { sfx.tap(); ov.remove(); resetDialog(root); } }));
  ov.append(dlg); root.append(ov);
  setTimeout(() => { input.focus(); input.select(); }, 60);
  return ov;
}

/** 처음부터 다시: 진행(스테이지·젤리·스티커·한자 기록)을 모두 지운다. 두 번 확인 */
function resetDialog(root) {
  const ov = el('div.overlay');
  ov.append(el('div.scrim', { onClick: () => ov.remove() }));
  const dlg = el('div.dialog.pop-in', { style: { top: 'calc(var(--safe-top) + 140px)' } },
    el('div.dtitle', { text: '처음부터 다시 시작할까요?' }),
    el('div.dbody', { html: '지금까지의 가게, 젤리, 스티커,<br>한자 기록이 모두 지워져요.' }),
    el('div.dbtn.two', {}, button('취소', 'small', () => { sfx.tap(); ov.remove(); }),
      button('모두 지우기', 'yellow small', () => { resetProgress(); sfx.pop(); location.reload(); })));
  ov.append(dlg); root.append(ov);
}

registerScreen('map', (root, params = {}) => {
  const pending = progress.pendingClear;                                   // 방금 처음 깬 스테이지: 도장 → 다음 가게 열림 연출
  const curStage = STAGE_ORDER.find(id => nodeState(id) === 'open');       // 지금 도전할 스테이지
  const chapter = params.chapter || (pending ? STAGE_BY_ID[pending].chapter : curStage ? STAGE_BY_ID[curStage].chapter : CHAPTERS.length);
  const CH = CHAPTER_BY_ID[chapter];
  const tm = tune()[CH.scene];                                              // 이 챕터의 노드·문·카메라
  const stages = STAGES.filter(s => s.chapter === chapter);
  const lastId = stages[stages.length - 1].id;
  const nextChapterFirst = STAGE_ORDER[STAGE_ORDER.indexOf(lastId) + 1];   // 다음 챕터 첫 스테이지 (마지막 챕터면 없음)

  const scroll = el('div.map-scroll');
  const world = el('div.map-world.candy');
  world.style.setProperty('--map-bg', `url('${MAP + CH.map}')`);
  world.append(el('img', { src: MAP + CH.map, alt: '', class: 'bg', style: { position: 'absolute', left: 0, top: PAD + 'px', width: '393px', height: '1180px' } }));

  let currentId = null;
  const nextOfPending = pending ? STAGE_ORDER[STAGE_ORDER.indexOf(pending) + 1] : null;
  const fx = { stampNode: null, unlockNode: null, unlockOv: null, gateNode: null };
  stages.forEach((s, si) => {
    const k = si + 1;
    const x = tm['n' + k + 'X'], y0 = tm['n' + k + 'Y'], y = y0 + PAD;   // 노드 위치 (맵 그림 기준) — 조정 모드
    const state = nodeState(s.id);
    if (state === 'open' && !currentId) currentId = s.id;
    const ball = s.id === '8' ? 'straw' : BALLS[(chapter === 1 ? si - 1 : si) % BALLS.length];
    const node = el('div.cnode.' + state, { 'data-tx': 'n' + k + 'X', 'data-ty': 'n' + k + 'Y', 'data-tmode': 'plain', 'data-toff': PAD, style: { left: x + 'px', top: y + 'px' } });
    node.append(mapImg(state === 'lock' ? 'node_lock' : 'node_' + ball, 'ball'));
    if (state === 'lock') node.append(mapImg('lock_' + BALL_LOCK[ball], 'lockico'));
    if (state === 'clear') {
      const st = stageState(s.id).bestStars;
      const row = el('div.cstars' + (s.id === pending ? '.hid' : ''));
      for (let i = 0; i < 3; i++) row.append(img(i < st ? 'star_on' : 'star_off', { class: 'st' }));   // 노란 별 (icon_star_full_2)
      node.append(row);
    }
    node.append(el('div.clabel', { text: stageLabel(s.id) }));   // "2. 하늘과 땅"
    if (state === 'clear') node.append(el('div.cclear' + (s.id === pending ? '.hid' : '')));   // 클리어 리본 (방금 깼으면 도장 연출 뒤에)
    if (s.id === pending) fx.stampNode = node;
    if (s.id === nextOfPending && state === 'open') {                    // 다음 가게: 잠긴 모습으로 시작했다가 열린다
      node.classList.add('pre');
      const ov = el('div.unlock-ov', {}, mapImg('node_lock', 'ball'), mapImg('lock_' + BALL_LOCK[ball], 'lockico'));
      node.append(ov); fx.unlockNode = node; fx.unlockOv = ov;
    }
    const face = el('div.cface', {}, faceBadge(s.customer, 34));         // 손님 얼굴 (테두리 = 과일 알 색)
    face.style.setProperty('--ring', state === 'lock' ? LOCK_GRAY : BALL_COLOR[ball]);
    node.append(face);
    node.addEventListener('click', () => {
      if (state === 'lock') { node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake'); sfx.wrong(); toast('앞 가게를 먼저 열어요!'); return; }
      sfx.tap();
      go(s.learn ? 'learn' : 'game', { stageId: s.id });
    });
    world.append(node);
  });

  // 맨 위: 다음 장으로 가는 커튼 문 (마지막 챕터는 트로피 = 완주)
  const chapterDone = stageState(lastId).cleared && pending !== lastId;
  const gateLock = () => {
    const l = mapImg('lock_pink', 'lockico gate-lock');
    Object.assign(l.dataset, { tx: 'gateLockX', ty: 'gateLockY', tmode: 'plain' });
    Object.assign(l.style, { left: tm.gateLockX + 'px', top: tm.gateLockY + 'px', width: tm.gateLockSize + 'px', height: Math.round(tm.gateLockSize * 1.15) + 'px' });
    return l;
  };
  if (nextChapterFirst) {
    const open = chapterDone;
    const gate = el('div.cnode.gate' + (open ? '.gate-open' : '.lock'), { 'data-tx': 'gateX', 'data-ty': 'gateY', 'data-tmode': 'plain', 'data-toff': PAD, style: { left: tm.gateX + 'px', top: (tm.gateY + PAD) + 'px' } },
      open ? el('div.gate-glow') : gateLock(), el('div.clabel', { text: open ? `${chapter + 1}장으로 ▶` : `${chapter + 1}장` }));
    if (!open && pending === lastId) fx.gateNode = gate;                 // 방금 챕터를 끝냈다 → 자물쇠가 열리는 연출
    if (open) [[-44, -30, '#FFE27A', 0], [50, -36, '#fff', 300], [-52, 30, '#fff', 600], [58, 24, '#FFE27A', 900], [8, -58, '#FFF3B0', 450]].forEach(([x, y, c, d]) =>
      gate.append(el('div.sparkle.gate-twinkle', { style: { left: (33 + x) + 'px', top: (33 + y) + 'px', animationDelay: d + 'ms' } }, icon.sparkle(16, c))));   // 열린 문 주위 반짝임
    let going = false;
    gate.addEventListener('click', () => {
      if (!stageState(lastId).cleared) { sfx.wrong(); toast(`${stageLabel(lastId)}을 먼저 깨요!`); return; }
      if (going) return; going = true;
      gateTransition(gate, chapter + 1);
    });
    world.append(gate);
  } else if (stageState(lastId).cleared) {                                 // 마지막 챕터 정상: 완주
    world.append(el('div.cnode.gate.trophy', { 'data-tx': 'gateX', 'data-ty': 'gateY', 'data-tmode': 'plain', 'data-toff': PAD, style: { left: tm.gateX + 'px', top: (tm.gateY + PAD) + 'px' } },
      el('div.cclear.done-all'), el('div.clabel', { text: '7급 완주!' })));
  }
  // 맨 아래: 앞 장으로 돌아가는 문
  if (chapter > 1) {
    const prev = el('div.cnode.prev', { 'data-tx': 'prevX', 'data-ty': 'prevY', 'data-tmode': 'plain', 'data-toff': PAD, style: { left: tm.prevX + 'px', top: (tm.prevY + PAD) + 'px' } },
      el('div.clabel', { text: `◀ ${chapter - 1}장` }));
    prev.addEventListener('click', () => { sfx.tap(); go('map', { chapter: chapter - 1 }); });
    world.append(prev);
  }

  // 카메라: 1~3번은 아래, 4~5번은 가운데(챕터 1은 6번이 맨 위). 다 깼으면 맨 위(문)
  const ci = currentId ? stages.findIndex(s => s.id === currentId) + 1 : (stageState(lastId).cleared ? stages.length + 1 : 1);   // 다 깼으면 맨 위(문), 아직 못 온 챕터면 아래
  const autoView = chapter === 1 ? (ci <= 3 ? 1 : ci <= 5 ? 2 : 3) : (ci <= 3 ? 1 : 2);
  const view = tuneMode && tm.camView ? tm.camView : autoView;

  // 복습 손님 (판다)
  if (reviewSet().wrong.length >= REVIEW_THRESHOLD || box0Ids().length >= REVIEW_THRESHOLD) {
    const owl = el('div.owl-node' + (tm.owlX < 196 ? '.bub-right' : ''), { 'data-tx': 'owlX', 'data-ty': 'owlY', 'data-tmode': 'plain', 'data-toff': PAD, style: { left: tm.owlX + 'px', top: (tm.owlY + PAD) + 'px' } },   // 위치: 조정 모드
      el('div.owl-float', {}, el('div.speech.owl-bub', {}, el('div.line', { text: '복습하러 왔어요' })), img('char_owl')));   // 말풍선이 판다와 함께 둥실 (꼬리는 판다 쪽)
    owl.addEventListener('click', () => { sfx.pop(); reviewDialog(root); });
    world.append(owl);
  }
  scroll.append(world);
  root.append(scroll, petals(14));   // 벚꽃은 화면에 고정 (맵을 스크롤해도 계속 날린다)

  const snd = menuBtn(icon.sound(progress.settings.sound, 44), '소리', () => {
    setSound(!progress.settings.sound); save(); sfx.tap();
    snd.querySelector('.ui-icon').classList.toggle('off', !progress.settings.sound);
  });
  const top = el('div.map-top', {},
    el('div.map-head', {},
      mapProfile(),
      el('div.map-side', {},
        pill(img('jelly'), progress.jelly),
        el('div.map-tiles', {},
          menuBtn(el('div.shop-ico', {}, faceBadge('boss', 40, false, 'profile')), '상점', () => { sfx.tap(); go('shop'); }),   // 젤리로 코스튬 사기
          menuBtn(icon.book(44), '도감', () => { sfx.tap(); go('book'); }),
          menuBtn(icon.sticker(44), '스티커', () => { sfx.tap(); go('stickers'); }),
          snd))));
  root.append(top);

  /** 다음 장으로: 문에서 빛이 퍼지고 반짝이가 튀며 화면이 하얗게 차오른 뒤, 새 장 이름이 떴다가 새 맵이 나타난다 */
  function gateTransition(gate, nextChapter) {
    sfx.unlock(); buzz(20);
    const burst = el('div.gate-burst'); gate.append(burst);                 // 문에서 퍼지는 빛
    for (let i = 0; i < 14; i++) {                                           // 사방으로 튀는 반짝이
      const a = (i / 14) * Math.PI * 2, r = 70 + (i % 3) * 30;
      gate.append(el('div.sparkle.gate-shoot', { style: { left: '33px', top: '33px', '--dx': Math.cos(a) * r + 'px', '--dy': Math.sin(a) * r + 'px', animationDelay: (i % 4) * 60 + 'ms' } }, icon.sparkle(14 + (i % 3) * 5, i % 2 ? '#fff' : '#FFE27A')));
    }
    setTimeout(() => sfx.coat(), 250);
    const flash = el('div.chapter-flash', {}, el('div.chapter-title.pop-in', {}, el('div.ch-no', { text: `${nextChapter}장` }), el('div.ch-name', { text: CHAPTER_BY_ID[nextChapter].name })));
    document.getElementById('stage').append(flash);
    setTimeout(() => flash.classList.add('on'), 320);                       // 빛이 먼저 퍼지고, 그다음 하얗게 차오름 (700ms)
    setTimeout(() => {
      go('map', { chapter: nextChapter });                                   // 새 맵은 흰 화면 뒤에서 준비
      setTimeout(() => { flash.classList.add('off'); setTimeout(() => flash.remove(), 900); }, 900);   // 장 이름을 잠깐 보여 준 뒤 걷힌다
    }, 1100);
  }

  /** 처음 깬 스테이지: 클리어 리본이 도장처럼 쿵 찍히고, 다음 가게의 자물쇠가 터지며 열린다 (한 번만). 챕터 마지막이면 위 커튼 문이 열린다 */
  function playClearFx() {
    progress.pendingClear = null; save();
    const n = fx.stampNode;
    setTimeout(() => {
      if (n) {
        const rib = n.querySelector('.cclear'), st = n.querySelector('.cstars');
        if (rib) { rib.classList.remove('hid'); rib.classList.add('stamp'); }
        n.classList.add('thud'); sfx.stamp(); buzz(40);
        setTimeout(() => { if (st) { st.classList.remove('hid'); st.classList.add('pop'); } }, 380);
      }
    }, 450);
    if (fx.unlockNode) setTimeout(() => {
      fx.unlockOv.classList.add('go'); fx.unlockNode.classList.remove('pre'); fx.unlockNode.classList.add('born');
      sfx.unlock(); buzz(20);
      const r = fx.unlockNode;
      [[-30, -20, '#FFD84F'], [70, -26, '#fff'], [-38, 40, '#fff'], [78, 44, '#FFD84F'], [20, -44, '#FFE9A8'], [22, 84, '#FFD84F']].forEach(([x, y, c], i) =>
        r.append(el('div.sparkle.burst', { style: { left: (33 + x) + 'px', top: (33 + y) + 'px', animationDelay: (i * 60) + 'ms' } }, icon.sparkle(18, c))));
      setTimeout(() => { fx.unlockOv.remove(); r.querySelectorAll('.sparkle.burst').forEach(x => x.remove()); }, 1400);
    }, 1350);
    if (fx.gateNode) setTimeout(() => {                                    // 챕터 완주: 문 자물쇠가 톡 튀어 사라지고 "다음 장으로"
      const g = fx.gateNode, l = g.querySelector('.gate-lock');
      if (l) { l.classList.add('gate-unlock'); setTimeout(() => l.remove(), 800); }
      g.classList.remove('lock'); g.classList.add('gate-open');
      g.insertBefore(el('div.gate-glow'), g.firstChild);
      g.querySelector('.clabel').textContent = `${chapter + 1}장으로 ▶`;
      sfx.unlock(); buzz(20);
    }, 1350);
  }

  /** 왼쪽 위 프로필: 위치·크기·이름·게이지를 조정 모드 '맵'에서 (모든 챕터 공통) */
  function mapProfile() {
    const m = tune().map;
    const card = profileCard(false, true);
    card.style.height = m.profH + 'px';
    const av = card.querySelector('.av'); Object.assign(av.style, { width: m.profAvatar + 'px', height: m.profAvatar + 'px' });
    const name = card.querySelector('.name'); Object.assign(name.style, { fontSize: m.nameSize + 'px', transform: `translate(${m.nameX}px, ${m.nameY}px)` });
    const bar = card.querySelector('.bar'); Object.assign(bar.style, { height: m.barH + 'px', transform: `translate(${m.barX}px, ${m.barY}px)` });
    if (m.barW) Object.assign(bar.style, { width: m.barW + 'px', flex: 'none' });
    name.addEventListener('click', e => { e.stopPropagation(); sfx.tap(); renameDialog(root, () => { name.querySelector('.nm').textContent = progress.shopName; }); });   // 연필: 가게 이름 바꾸기
    name.style.cursor = 'pointer';
    return el('div.map-profile', { 'data-tx': 'profX', 'data-ty': 'profY', style: { left: m.profX + 'px', top: `calc(var(--safe-top) + ${m.profY}px)`, width: m.profW + 'px' } }, card);
  }

  setTimeout(() => {
    const max = Math.max(0, 1180 + PAD - scroll.clientHeight);
    const to = Math.max(0, Math.min(max, tm['cam' + view + 'Y']));
    const last = lastCamBy[chapter];
    const from = last == null || tuneMode ? to : last;   // 조정 모드에서는 바로 그 화면으로
    lastCamBy[chapter] = to;
    scroll.scrollTop = from;
    const camDelay = pending ? 2100 : 350;                // 도장 · 열림 연출이 끝난 뒤에 움직인다
    if (from !== to) {                                    // 다음 구간이 열렸으면 부드럽게 올라간다
      const t0 = performance.now(), D = 1100;
      const step = t => { const k = Math.min(1, (t - t0 - camDelay) / D); if (k > 0) scroll.scrollTop = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    if (pending && STAGE_BY_ID[pending].chapter === chapter) playClearFx();
    if (params.demoDialog) reviewDialog(root, reviewSet().wrong.length ? null : ['天', '地', '川', '海', '林']);
  }, 0);
});
