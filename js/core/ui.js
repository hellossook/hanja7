// 공통 UI 조각: 라우터, 요소 생성, 아이콘, v2 스티커 스타일 부품, 에셋 경로
import { sfx } from './audio.js';

// 에셋 매니페스트 — PNG(@3x)로 교체할 때 여기 확장자만 바꾸면 된다.
const ASSET_DIR = 'assets/img/';
const UI_ICON_DIR = 'assets/ui/icon/';
// 아이콘 시트(assets/ui/_src/icon_sheet.png)에서 잘라낸 PNG 로 대체하는 에셋
const ICON_OVERRIDE = { jelly: 'icon_jelly', star_on: 'icon_star_full_2', star_off: 'icon_star_empty_2' };   // 별: 갈색 외곽선 별 + 같은 모양의 빈 별
// 캐릭터: assets/chars/<역할>.png (tools/build_chars.py). 기쁨 포즈 그림이 따로 없어 같은 그림을 쓴다.
const CHAR_DIR = 'assets/chars/';
const FRUIT_DIR = 'assets/fruits/';
const COOK_DIR = 'assets/ui/cook/';
const ASSET_MAP = {
  pot_sugar: COOK_DIR + 'jar_sugar.png', pot_choco: COOK_DIR + 'jar_choco.png', pot_rainbow: COOK_DIR + 'jar_rainbow.png',   // 코팅 고르기 시럽 냄비
  bowl: COOK_DIR + 'pot.png',                                                                                              // 조리 냄비 (빈 냄비)
  sticker_ribbon: 'assets/ui/sticker/sticker_ribbon.png',                                                                  // 오픈 기념 스티커 (로제트)
};
export function asset(name) {
  if (ICON_OVERRIDE[name]) return UI_ICON_DIR + ICON_OVERRIDE[name] + '.png';
  if (name.startsWith('char_')) return CHAR_DIR + name.slice(5).replace(/_happy$/, '') + '.png';
  if (name.startsWith('face_')) return CHAR_DIR + name + '.png';
  // 과일 (tools/build_fruits.py): fruit_<id> 진열용 통과일 · piece_<id>[_<코팅>] 꼬치 조각
  if (name.startsWith('fruit_')) return FRUIT_DIR + name.slice(6) + '.png';
  if (name.startsWith('piece_')) { const [id, coat] = name.slice(6).split('_'); return FRUIT_DIR + id + '_piece' + (coat ? '_' + coat : '') + '.png'; }
  if (name.startsWith('syrup_')) return COOK_DIR + 'pot_syrup_' + name.slice(6) + '.png';   // 조리 냄비 안 시럽
  if (ASSET_MAP[name]) return ASSET_MAP[name];
  return ASSET_DIR + name + '.svg';
}

/** 아이콘 시트 PNG. name: book sticker speaker pencil lock star_full star_empty pin jelly skewer_progress heart notif_dot step_done step_current dropzone stir_arrow */
export function uiIcon(name, size = 28, attrs = {}) {
  return el('img', Object.assign({ src: UI_ICON_DIR + 'icon_' + name + '.png', alt: '', class: 'ui-icon', style: { width: size + 'px', height: size + 'px', display: 'block' } }, attrs));
}

export const INK = '#5A3E2B';

/** 요소 생성 헬퍼: el('div.cls#id', {attrs}, ...children) */
export function el(spec, attrs = {}, ...children) {
  const m = spec.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const node = document.createElement((m && m[1]) || 'div');
  if (m && m[2]) {
    m[2].match(/[.#][\w-]+/g).forEach(t => t[0] === '.' ? node.classList.add(t.slice(1)) : (node.id = t.slice(1)));
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function img(name, attrs = {}) { return el('img', Object.assign({ src: asset(name), alt: '' }, attrs)); }

/** 화면 라우터 */
const screens = {};
let current = null;
export function registerScreen(name, fn) { screens[name] = fn; }
export function go(name, params = {}) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const root = el('div.screen.screen-enter', { 'data-screen': name });
  app.append(root);
  current = name;
  screens[name](root, params);
}
export function currentScreen() { return current; }

export function toast(msg) {
  const app = document.getElementById('app');
  const t = el('div.toast', { text: msg });
  app.append(t);
  setTimeout(() => t.remove(), 1700);
}

/** 큰 버튼: 클릭 사운드 포함. cls: 'block', 'yellow', 'mint', 'small', 'disabled' */
export function button(label, cls, onClick) {
  const b = el('button.btn' + (cls || '').split(' ').filter(Boolean).map(c => '.' + c).join(''));
  if (typeof label === 'string') b.textContent = label; else b.append(label);
  b.addEventListener('click', e => { if (b.classList.contains('disabled')) return; sfx.tap(); onClick && onClick(e); });
  return b;
}

// ---------- 인라인 아이콘 (stroke 기반 SVG) ----------
const NS = 'http://www.w3.org/2000/svg';
function svg(w, h, inner, viewBox = '0 0 24 24') {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', viewBox);
  s.innerHTML = inner;
  return s;
}
export const icon = {
  back(s = 26, c = INK) { return svg(s, s, `<path d="M15 5 L8 12 L15 19" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`); },
  next(s = 26, c = INK) { return svg(s, s, `<path d="M9 5 L16 12 L9 19" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`); },
  arrow(s = 26, c = '#fff') { return svg(s, s, `<path d="M6 12 H17 M12 6 L18 12 L12 18" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`); },
  close(s = 22, c = '#fff') { return svg(s, s, `<path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>`); },
  check(s = 20, c = '#fff') { return svg(s, s, `<path d="M5 12 L10 17 L19 7" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`); },
  lock(s = 28) { return uiIcon('lock', Math.round(s * 1.15)); },
  book(s = 24) { return uiIcon('book', s); },
  sticker(s = 24) { return uiIcon('sticker', s); },
  gear(s = 40) { return svg(s, s, `<path d="M12 2.5 L14 4.5 L16.8 3.8 L17.8 6.5 L20.5 7.5 L19.8 10.3 L21.8 12 L19.8 13.7 L20.5 16.5 L17.8 17.5 L16.8 20.2 L14 19.5 L12 21.5 L10 19.5 L7.2 20.2 L6.2 17.5 L3.5 16.5 L4.2 13.7 L2.2 12 L4.2 10.3 L3.5 7.5 L6.2 6.5 L7.2 3.8 L10 4.5 Z" fill="#BFB6AF" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="4" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`); },
  pencil(s = 18) { return uiIcon('pencil', Math.round(s * 1.2)); },
  sound(on, s = 26) { return uiIcon('speaker', s, { class: 'ui-icon' + (on ? '' : ' off') }); },
  miniSkewer(filled, s = 22) { return uiIcon('skewer_progress', Math.round(s * 1.9), { class: 'ui-icon' + (filled ? '' : ' off') }); },
  sparkle(s = 18, c = '#FFD24A') { return svg(s, s, `<path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" fill="${c}"/>`, '0 0 20 20'); },
  curve(w = 160, h = 90) { return svg(w, h, `<path d="M8 70 Q60 6 138 30" fill="none" stroke="#FF6F8E" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 10"/><path d="M124 14 L146 32 L120 40 Z" fill="#FF6F8E"/>`, '0 0 160 90'); },
  stir(w = 150, h = 40) { return el('div.stir-arrows', { style: { width: w + 'px' } }, el('span.sa.l', {}, uiIcon('stir_arrow', 54, { class: 'ui-icon flip' })), el('span.sa.r', {}, uiIcon('stir_arrow', 54))); },
  pin(s = 50) { return uiIcon('pin', Math.round(s * 1.2)); },
};

export function stars(n, total = 3, size = 28) {
  const w = el('div.stars');
  for (let i = 0; i < total; i++) w.append(img(i < n ? 'star_on' : 'star_off', { style: { width: size + 'px', height: size + 'px' } }));
  return w;
}

export function sparkles(container, spots, size = 18) {
  spots.forEach(([x, y, c, delay], i) => {
    const s = el('div.sparkle', { style: { left: x + 'px', top: y + 'px', animationDelay: (delay || i * 150) + 'ms' } }, icon.sparkle(size, c || '#FFD24A'));
    container.append(s);
  });
}

// ---------- v2 스티커 스타일 부품 ----------
/** 파스텔 배경 레이어: 그라데이션 + 흰 점선 사선 + 보케. kind: peach | yellow | sky | mint */
export function bgLayer(kind = 'peach') {
  const layer = el('div.bg-layer.' + kind);
  const bokeh = [[40, 120, 7, .7], [330, 90, 5, .6], [300, 260, 9, .5], [60, 420, 6, .6], [360, 520, 7, .5], [120, 700, 5, .6], [250, 780, 8, .45]]
    .map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`).join('');
  layer.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 393 1000" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;display:block">
    <defs><pattern id="dl" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-34)"><line x1="0" y1="20" x2="120" y2="20" stroke="#fff" stroke-width="3" stroke-dasharray="16 12"/><line x1="0" y1="80" x2="120" y2="80" stroke="#fff" stroke-width="3" stroke-dasharray="16 12"/></pattern>
    <pattern id="dr" width="140" height="140" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="30" x2="140" y2="30" stroke="#fff" stroke-width="3" stroke-dasharray="16 12"/></pattern></defs>
    <rect width="393" height="1000" fill="url(#dl)" opacity="0.55"/><rect width="393" height="1000" fill="url(#dr)" opacity="0.4"/>${bokeh}</svg>`;
  return layer;
}

/** 스티커 타일. state: '' | locked | dim | selected. tag: 모서리 종이 라벨(한자·훈음) */
export function tile(inner, { size = 84, state = '', tag = null, tagKind = 'hanja', cls = '' } = {}) {
  const t = el('div.tile' + (state ? '.' + state : '') + (cls ? '.' + cls : ''), { style: { width: size + 'px', height: size + 'px' } });
  if (inner) t.append(el('div.tile-in', {}, inner));
  if (tag != null) t.append(el('div.tag.' + tagKind, { text: tag }));
  return t;
}

/** 알약 카운터: 아이콘이 왼쪽에 걸친다. color: pink | yellow | mint | sky */
export function pill(iconEl, text, color = 'pink') {
  return el('div.pill.' + color, {}, el('div.ico', {}, iconEl), el('span.txt', { text: String(text) }));
}

/** 리본 배너. color: pink | blue */
export function ribbon(text, color = 'pink') {
  const f = color === 'blue' ? ['#8ED2FF', '#3B8FD1', '#D7F0FF'] : ['#FF8FB0', '#E14C6E', '#FFD1E0'];
  const r = el('div.ribbon.' + color);
  r.append(svg(300, 86, `<path d="M20 30 L70 36 L70 76 L38 66 L20 78 Z" fill="${f[1]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M280 30 L230 36 L230 76 L262 66 L280 78 Z" fill="${f[1]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M60 18 Q150 4 240 18 L240 62 Q150 76 60 62 Z" fill="${f[0]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M70 24 Q150 12 230 24" fill="none" stroke="${f[2]}" stroke-width="6" stroke-linecap="round" opacity="0.8"/>`, '0 0 300 86'));
  r.append(el('span', { text, style: { fontSize: ribbonFont(text) + 'px' } }));
  return r;
}

/** 리본 띠 안쪽(≈264px)에 맞춰 글자 크기를 줄여줘요. 긴 스테이지명이 날개로 넘치는 걸 막아요. */
function ribbonFont(text, max = 264) {
  const c = ribbonFont._c || (ribbonFont._c = document.createElement('canvas').getContext('2d'));
  for (let fs = 28; fs > 20; fs--) {
    c.font = `${fs}px 'ONE Mobile POP', Jua, 'Noto Sans KR', sans-serif`;
    if (c.measureText(text).width <= max) return fs;
  }
  return 20;
}

/** 종이 메모 카드 (마스킹 테이프). cls: 'mint' 정답 / 'pink'(기본) */
export function noteCard(children, cls = '') {
  return el('div.note' + (cls ? '.' + cls : ''), {}, el('div.tape'), ...(Array.isArray(children) ? children : [children]));
}

export function roundBtn(active, onClick, size = 72) {
  const b = el('button.round-btn' + (active ? '.active' : ''), { style: { width: size + 'px', height: size + 'px' } }, icon.arrow(Math.round(size * 0.5)));
  b.addEventListener('click', () => { if (!b.classList.contains('active')) return; sfx.tap(); onClick && onClick(); });
  return b;
}

/** 뒤로가기: 노란 원형 버튼 (화살표가 에셋에 들어 있다) */
export function backBtn(onClick, size = 48) {
  const b = el('button.back-btn', { style: { width: size + 'px', height: size + 'px' } });
  b.addEventListener('click', () => { sfx.tap(); onClick && onClick(); });
  return b;
}

/** 맵 상단 메뉴: 배경 없는 아이콘 + 라벨 */
export function menuBtn(iconEl, label, onClick) {
  const b = el('div.menu-btn', {}, iconEl, el('div.lbl', { text: label }));
  b.addEventListener('click', () => { onClick && onClick(); });
  return b;
}

export function closeBtn(onClick, size = 64) {
  const b = el('button.close-btn', { style: { width: size + 'px', height: size + 'px' } }, icon.close(Math.round(size * 0.45)));
  b.addEventListener('click', () => { sfx.tap(); onClick && onClick(); });
  return b;
}

/** 손님 얼굴 말풍선 아이콘 (좌상단) */
export function chatBubble(customer, size = 60) {
  return el('div.chat-bubble', { style: { width: size + 'px', height: size + 'px' } },
    el('div.face', {}, img('face_' + customer, { style: { width: '100%', height: '100%' } })), el('div.dot'));
}

/** 벚꽃잎이 흩날리는 층 (누르기를 막지 않는다). count: 꽃잎 수 */
export function petals(count = 14) {
  const layer = el('div.petals');
  const petal = c => `<svg viewBox="0 0 20 20" width="100%" height="100%"><path d="M10 1 C14 3 18 8 16 13 C14.5 17 11 19 10 17.5 C9 19 5.5 17 4 13 C2 8 6 3 10 1 Z" fill="${c}"/><path d="M10 4 L10 15" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" stroke-linecap="round"/></svg>`;
  const cols = ['#FFC7D9', '#FFB3CB', '#FFD6E3', '#FFA9C4'];
  for (let i = 0; i < count; i++) {
    const s = 13 + Math.round(Math.random() * 11), dur = 7 + Math.random() * 6;
    const p = el('div.petal', { style: { left: (Math.random() * 100) + '%', width: s + 'px', height: s + 'px', animationDuration: dur + 's', animationDelay: (-Math.random() * dur) + 's' } },
      el('div.petal-in', { style: { animationDuration: (2 + Math.random() * 2) + 's' }, html: petal(cols[i % cols.length]) }));
    layer.append(p);
  }
  return layer;
}

/** 글자가 칸보다 길면 들어갈 때까지 글자 크기를 줄인다 (maxW: 논리 px, minPx: 최소 글자 크기) */
export function fitText(node, maxW, minPx = 16) {
  if (!node) return;
  node.style.fontSize = ''; node.style.whiteSpace = 'nowrap';
  let fs = parseFloat(getComputedStyle(node).fontSize) || 40;
  while (node.scrollWidth > maxW && fs > minPx) { fs -= 1; node.style.fontSize = fs + 'px'; }
}

/** 손님 프로필: 빨간 프로필 프레임(panel_avatar_frame.png) + 얼굴 + 아래 띠에 이름 */
export function frameBadge(customer, size = 64, label = '') {
  return el('div.frame-badge', { style: { width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.16) + 'px' } },
    el('div.fb-face', {}, img('face_' + customer)), label ? el('div.fb-label', { text: label }) : null);
}

/** 원형 얼굴 배지 */
export function faceBadge(customer, size = 52, happy = false, ring = 'chat') {
  return el('div.face-badge' + (ring === 'profile' ? '.ring-profile' : ''), { style: { width: size + 'px', height: size + 'px' } },
    img('face_' + customer, { style: { width: '100%', height: '100%' } }));   // 얼굴 크롭 이미지 (assets/chars/face_*.png)
}

export const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const wait = ms => new Promise(r => setTimeout(r, ms));

/** 직접 그린 스크롤 막대. scrollEl 의 스크롤에 맞춰 손잡이가 움직이고, 손잡이를 끌면 목록이 움직인다. 돌려주는 .sbar 를 원하는 곳에 붙이고 위치는 CSS/스타일로 */
export function scrollBar(scrollEl) {
  const sbar = el('div.sbar', {}, el('div.sbar-thumb'));
  const sync = () => {
    const th = sbar.firstChild, H = sbar.clientHeight, max = scrollEl.scrollHeight - scrollEl.clientHeight;
    sbar.style.display = max > 24 || document.body.classList.contains('tuning') ? '' : 'none';   // 겨우 몇 px 남는 정도면 막대를 안 그린다 (조정 모드에서는 항상)
    const h = Math.max(24, H * scrollEl.clientHeight / Math.max(1, scrollEl.scrollHeight));
    Object.assign(th.style, { height: h + 'px', top: (max > 0 ? (H - h) * scrollEl.scrollTop / max : 0) + 'px' });
  };
  scrollEl.addEventListener('scroll', sync);
  sbar.firstChild.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    const y0 = e.clientY, s0 = scrollEl.scrollTop, H = sbar.getBoundingClientRect().height, h = sbar.firstChild.getBoundingClientRect().height;
    const move = ev => { const max = scrollEl.scrollHeight - scrollEl.clientHeight; scrollEl.scrollTop = s0 + (ev.clientY - y0) * max / Math.max(1, H - h); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  });
  sbar.sync = sync;
  return sbar;
}
