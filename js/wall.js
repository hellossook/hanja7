// 가게 벽 스티커 — 게임 화면·스티커 화면·판매 연출이 함께 쓰는 그리기 함수
import { el, img } from './core/ui.js';
import { progress } from './core/store.js';
import { STICKER_BY_ID, CUSTOMERS } from './data/stages.js';
import { BY_ID, displayHunEum } from './data/hanja.js';
import { CHAR_STICKERS } from './data/charStickers.js';
const CHAR_BY_ID = Object.fromEntries(CHAR_STICKERS.map(c => [c.id, c]));

/** 손님 스티커 변형: 1 노랑 테두리(기쁨) · 2 민트(기본) · 3 라벤더(기쁨) */
export const VARIANT_RING = { 1: '#FFD24A', 2: '#4ED8B5', 3: '#B9A7F5' };
export const VARIANT_COUNT = 3;

/** 손님 스티커: 동그란 테두리 없이 캐릭터 전신 (가장자리에 얇은 흰 스티커 테두리만) */
export function custStickerEl(customer, variant, size) {
  return el('div.cust-sticker', { style: { width: size + 'px', height: size + 'px' } },
    img('char_' + customer, { style: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' } }));
}

export function parseCust(id) { const [customer, v] = id.split('_'); return { customer, variant: Number(v) || 1 }; }

/** 스티커 인스턴스 {kind:'cust'|'memo', id} → 요소 */
export function stickerEl(inst, size) {
  if (inst.kind === 'cust') { const { customer, variant } = parseCust(inst.id); return custStickerEl(customer, variant, size); }
  if (inst.kind === 'char')                                  // 캐릭터 스티커 (수채화 18종)
    return el('img', { src: 'assets/chars/stk/' + inst.id + '.png', alt: '', class: 'char-sticker', style: { width: size + 'px', height: size + 'px', display: 'block' } });
  if (inst.kind === 'hanja') {                               // 공부한 한자 스티커: 종이 카드에 한자 + 훈음
    const c = BY_ID[inst.id];
    return el('div.hanja-sticker', { style: { width: size + 'px', height: size + 'px', fontSize: `calc(${size}px * var(--hanja-font, 0.56))` } },
      el('span.hanja', { text: c ? c.hanja : inst.id }), el('span.hs-hun', { text: c ? displayHunEum(c) : '' }));
  }
  const s = STICKER_BY_ID[inst.id];
  return img(s ? s.img : 'sticker_ribbon', { style: { width: size + 'px', height: size + 'px', display: 'block' } });
}

export function stickerName(inst) {
  if (inst.kind === 'cust') { const { customer } = parseCust(inst.id); return `${CUSTOMERS[customer] || ''} 스티커`; }
  if (inst.kind === 'hanja') { const c = BY_ID[inst.id]; return c ? displayHunEum(c) : inst.id; }
  if (inst.kind === 'char') return (CHAR_BY_ID[inst.id] || {}).name || '';
  const s = STICKER_BY_ID[inst.id];
  return s ? s.name : '';
}

export function baseSize(inst) { return inst.kind === 'hanja' ? 62 : 84; }

/** 벽 컨테이너에 붙은 스티커를 그린다. scale: 게임 화면처럼 작게 보일 때 */
export function renderWall(container, scale = 1, page = null) {
  container.querySelectorAll('.wall-sticker').forEach(n => n.remove());
  for (const inst of progress.wall) {
    if (!inst.placed || inst.kind === 'memo') continue;     // 기념 스티커는 없앴다
    if (page != null && (inst.page || 0) !== page) continue;   // 스티커북: 지금 보는 장만
    const size = Math.round(baseSize(inst) * scale * (inst.scale || 1));   // 스티커마다 크기 조절 (스티커 화면 손잡이)
    const node = el('div.wall-sticker', { 'data-uid': String(inst.uid), style: {
      left: (inst.x * 100) + '%', top: (inst.y * 100) + '%', width: size + 'px', height: size + 'px',
      marginLeft: (-size / 2) + 'px', marginTop: (-size / 2) + 'px', transform: `rotate(${inst.rot}deg)` } }, stickerEl(inst, size));
    container.append(node);
  }
}

/** 손님이 붙일 자리: 벽 위쪽(진열장에 가리지 않는 곳)에서 랜덤 */
export function randomWallSpot() {
  return { x: 0.08 + Math.random() * 0.84, y: 0.2 + Math.random() * 0.3, rot: Math.round(Math.random() * 24 - 12) };
}
