// S2 메인 맵 — 캔디맵 (2026-09-27 새 디자인): 사탕 배경 길 위에 설탕 코팅 과일 알 노드
import { el, img, icon, go, registerScreen, stars, toast, pill, faceBadge, button, tile, uiIcon, menuBtn, petals } from '../core/ui.js';
import { tune, tuneMode } from '../core/tune.js';
import { progress, stageState } from '../core/store.js';
import { STAGES, STAGE_ORDER, REVIEW_THRESHOLD, REVIEW_BONUS } from '../data/stages.js';
import { box0Ids, reviewSet } from '../quiz.js';
import { BY_ID, displayHunEum } from '../data/hanja.js';
import { sfx, setSound, buzz } from '../core/audio.js';
import { profileCard } from './title.js';
import { save } from '../core/store.js';

// 캔디맵 노드 좌표 (393x1180 맵 기준, bg_map_candy 길 위) + 과일 알
// 노드 위치는 js/data/tuning.json 의 map.n1X~n6Y · gateX/Y (조정 모드 '맵'에서 끌어 옮긴다)
const NODE_FRUIT = { '8': 'straw', '1-1': 'orange', '1-2': 'muscat', '1-3': 'blue', '1-4': 'kiwi', '1-5': 'grape' };
// 스테이지별 자물쇠 색 (가게=분홍, 하늘과 땅=하늘, 꽃과 풀=연두, 사계절=주황, 하늘의 기운=보라, 종합=은, 2장 문=금)
/** 과일 알 색 (node_*.png 에서 뽑음): 클리어·진행 중 노드의 손님 얼굴 테두리. 잠긴 노드는 회색 */
const NODE_COLOR = { '8': '#F0363C', '1-1': '#F6A62C', '1-2': '#A8E752', '1-3': '#4249DB', '1-4': '#BCE243', '1-5': '#B851D4' };
const LOCK_GRAY = '#B5B2AE';
const NODE_LOCK = { '8': 'pink', '1-1': 'blue', '1-2': 'green', '1-3': 'orange', '1-4': 'purple', '1-5': 'silver' };
let lastCam = null;   // 지난번 맵 화면 위치 (구간이 바뀌면 여기서부터 움직인다)
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
    el('div.dbtn.two', {}, button('취소', 'small', () => { sfx.tap(); ov.remove(); }), button('확인', 'yellow small', ok)));
  ov.append(dlg); root.append(ov);
  setTimeout(() => { input.focus(); input.select(); }, 60);
  return ov;
}

registerScreen('map', (root, params = {}) => {
  const scroll = el('div.map-scroll');
  const world = el('div.map-world.candy');
  world.append(el('img', { src: MAP + 'bg_map_candy.jpg', alt: '', class: 'bg', style: { position: 'absolute', left: 0, top: PAD + 'px', width: '393px', height: '1180px' } }));

  let currentId = null;
  const pending = progress.pendingClear;                                   // 방금 처음 깬 스테이지: 도장 → 다음 가게 열림 연출
  const nextOfPending = pending ? STAGE_ORDER[STAGE_ORDER.indexOf(pending) + 1] : null;
  const fx = { stampNode: null, unlockNode: null, unlockOv: null };
  STAGES.forEach((s, si) => {
    const m = tune().map, k = si + 1;
    const x = m['n' + k + 'X'], y0 = m['n' + k + 'Y'], y = y0 + PAD;   // 노드 위치 (맵 그림 기준) — 조정 모드 '맵'
    const state = nodeState(s.id);
    if (state === 'open' && !currentId) currentId = s.id;
    const node = el('div.cnode.' + state, { 'data-tx': 'n' + k + 'X', 'data-ty': 'n' + k + 'Y', 'data-tmode': 'plain', 'data-toff': PAD, style: { left: x + 'px', top: y + 'px' } });
    node.append(mapImg(state === 'lock' ? 'node_lock' : 'node_' + NODE_FRUIT[s.id], 'ball'));
    if (state === 'lock') node.append(mapImg('lock_' + NODE_LOCK[s.id], 'lockico'));
    if (state === 'clear') {
      const st = stageState(s.id).bestStars;
      const row = el('div.cstars' + (s.id === pending ? '.hid' : ''));
      for (let i = 0; i < 3; i++) row.append(img(i < st ? 'star_on' : 'star_off', { class: 'st' }));   // 노란 별 (icon_star_full_2)
      node.append(row);
    }
    node.append(el('div.clabel', { text: `${si + 1}. ${s.name}` }));   // "2. 하늘과 땅"
    if (state === 'clear') node.append(el('div.cclear' + (s.id === pending ? '.hid' : '')));   // 클리어 리본 (방금 깼으면 도장 연출 뒤에)
    if (s.id === pending) fx.stampNode = node;
    if (s.id === nextOfPending && state === 'open') {                    // 다음 가게: 잠긴 모습으로 시작했다가 열린다
      node.classList.add('pre');
      const ov = el('div.unlock-ov', {}, mapImg('node_lock', 'ball'), mapImg('lock_' + NODE_LOCK[s.id], 'lockico'));
      node.append(ov); fx.unlockNode = node; fx.unlockOv = ov;
    }
    const face = el('div.cface', {}, faceBadge(s.customer, 34));         // 손님 얼굴 (테두리 = 스테이지 색)
    face.style.setProperty('--ring', state === 'lock' ? LOCK_GRAY : NODE_COLOR[s.id]);
    node.append(face);
    node.addEventListener('click', () => {
      if (state === 'lock') { node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake'); sfx.wrong(); toast('앞 가게를 먼저 열어요!'); return; }
      sfx.tap();
      go(s.learn ? 'learn' : 'game', { stageId: s.id });
    });
    world.append(node);
  });
  // 2장 — 구름 속 커튼 문
  const tm = tune().map;
  /** 2장 문 자물쇠: 위치·크기는 조정 모드 '맵' (gateLockX/Y/Size, 문 안 좌표) */
  const gateLock = () => {
    const l = mapImg('lock_pink', 'lockico gate-lock');
    Object.assign(l.dataset, { tx: 'gateLockX', ty: 'gateLockY', tmode: 'plain' });
    Object.assign(l.style, { left: tm.gateLockX + 'px', top: tm.gateLockY + 'px', width: tm.gateLockSize + 'px', height: Math.round(tm.gateLockSize * 1.15) + 'px' });
    return l;
  };
  const ch2 = el('div.cnode.lock.gate', { 'data-tx': 'gateX', 'data-ty': 'gateY', 'data-tmode': 'plain', 'data-toff': PAD, style: { left: tm.gateX + 'px', top: (tm.gateY + PAD) + 'px' } },
    gateLock(), el('div.clabel', { text: '준비 중' }));   // 분홍 커튼 문 → 분홍 자물쇠
  ch2.addEventListener('click', () => toast('챕터 2는 준비 중이에요'));
  world.append(ch2);

  const cur = currentId || STAGE_ORDER[STAGE_ORDER.length - 1];
  const ci = STAGE_ORDER.indexOf(cur) + 1;

  const dueIds = box0Ids();
  if (dueIds.length >= REVIEW_THRESHOLD) {
    const owl = el('div.owl-node' + (tm.owlX < 196 ? '.bub-right' : ''), { 'data-tx': 'owlX', 'data-ty': 'owlY', 'data-tmode': 'plain', 'data-toff': PAD, style: { left: tm.owlX + 'px', top: (tm.owlY + PAD) + 'px' } },   // 위치: 조정 모드 '맵'
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
          menuBtn(icon.book(44), '도감', () => { sfx.tap(); go('book'); }),
          menuBtn(icon.sticker(44), '스티커', () => { sfx.tap(); go('stickers'); }),
          snd))));
  root.append(top);

  /** 처음 깬 스테이지: 클리어 리본이 도장처럼 쿵 찍히고, 다음 가게의 자물쇠가 터지며 열린다 (한 번만) */
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
  }

  /** 왼쪽 위 프로필: 위치·크기·이름·게이지를 조정 모드 '맵'에서 */
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

  // 손으로 스크롤하지 않는다. 진행에 따라 화면이 정해진다: 1~3번 → 맨 아래, 4~5번 → 3·4·5번, 6번(또는 다 깸) → 맨 위까지
  const view = tuneMode && tm.camView ? tm.camView : (ci <= 3 ? 1 : ci <= 5 ? 2 : 3);
  setTimeout(() => {
    const max = Math.max(0, 1180 + PAD - scroll.clientHeight);
    const to = Math.max(0, Math.min(max, tm['cam' + view + 'Y']));
    const from = lastCam == null || tuneMode ? to : lastCam;   // 조정 모드에서는 바로 그 화면으로
    lastCam = to;
    scroll.scrollTop = from;
    const camDelay = pending ? 2100 : 350;                // 도장 · 열림 연출이 끝난 뒤에 움직인다
    if (from !== to) {                                    // 다음 구간이 열렸으면 부드럽게 올라간다
      const t0 = performance.now(), D = 1100;
      const step = t => { const k = Math.min(1, (t - t0 - camDelay) / D); if (k > 0) scroll.scrollTop = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    if (pending) playClearFx();
    if (params.demoDialog) reviewDialog(root, reviewSet().wrong.length ? null : ['天', '地', '川', '海', '林']);
  }, 0);
});
