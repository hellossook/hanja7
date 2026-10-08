// UI 스킨 엔진 — assets/ui 의 PNG 프레임을 요소 크기에 맞춰 "한 장의 비트맵"으로 합성해 배경으로 깐다.
//
// 왜 CSS border-image 를 안 쓰나:
//  - 화면이 소수 배율로 확대·축소되면 9조각 사이에 실선(이음매)이 보인다.
//  - 가운데를 그냥 늘리면 수채 질감이 줄무늬로 번지고, 타일로 반복하면 광택 띠가 계단처럼 쌓인다.
//  - filter 로 색을 바꾸면 안에 든 과일·글자까지 같이 물든다.
// 여기서는 조각을 정수 픽셀 경계로 캔버스에 그려서 이음매가 없고, 색 변형은 프레임 이미지에만 적용된다.
//
// 에셋을 바꾸려면: 같은 파일명으로 PNG 를 교체하고, 광택·장식이 모서리 밖으로 나오면 아래 SKINS 의 l/t/r/b 만 고친다.

const DIR = 'assets/ui/';
const DPR = 3;            // 에셋이 @3x 라서 3배로 그린다 (소스 1px = 화면 1px)

/** mode
 *  'h'   가로 3조각. 요소 높이에 맞춰 통째로 축소하고 가운데만 가로로 늘린다 (버튼·알약·바)
 *  '9'   9조각. 모서리는 원본 비율 고정, 변과 가운데만 늘린다 (카드·패널)
 *  'v'   세로 3조각. 요소 폭에 맞춰 통째로 축소하고 가운데만 세로로 늘린다 (꼬치 막대)
 *  'fit' 늘리지 않는다. 비율을 지켜 가운데에 맞춘다 (원형·정사각)
 *  l t r b = 늘리면 안 되는 모서리 크기(소스 px). 광택·꼬리·장식이 전부 이 안에 들어가야 한다.
 *  k = 소스 px → 논리 px 배율. 기본 1/3(@3x). 작은 칸에 쓸 땐 더 작게.
 */
export const SKINS = {
  cta:      { src: 'btn/btn_cta.png',              mode: 'h', l: 180, r: 130 },
  modal:    { src: 'btn/btn_modal.png',            mode: 'h', l: 160, r: 120 },
  pill:     { src: 'panel/panel_currency_pill.png', mode: 'h', l: 140, r: 110, stretch: true, mid: [150, 158] },   // 가운데는 깨끗한 열(150~158)로 채움
  label:    { src: 'panel/panel_label_pill.png',   mode: 'h', l: 130, r: 100, stretch: true, mid: [140, 148] },
  header:   { src: 'panel/panel_header_pill.png',  mode: 'h', l: 100, r: 100 },
  xptrack:  { src: 'panel/panel_xpbar_track.png',  mode: 'h', l: 140, r: 110, stretch: true, mid: [150, 158] },   // 가운데는 깨끗한 열로 (선 끊김·얼룩이 늘어나지 않게)
  xpfill:   { src: 'panel/panel_xpbar_fill.png',   mode: 'h', l: 140, r: 110, stretch: true, mid: [150, 158] },
  profile:  { src: 'panel/panel_profile.png',      mode: 'h', l: 138, r: 108 },   // 흰 외곽선 2배 버전 (build_ui.py build_profile_outline)
  mission:  { src: 'panel/panel_mission.png',      mode: '9', l: 210, t: 180, r: 120, b: 110 },
  card:     { src: 'panel/panel_modal_card.png',   mode: '9', l: 130, t: 130, r: 90,  b: 110 },
  product:  { src: 'panel/panel_product_card.png', mode: '9', l: 140, t: 140, r: 90,  b: 110, k: 0.16 },
  chat:     { src: 'panel/panel_chat_bubble.png',  mode: '9', l: 110, t: 70,  r: 70,  b: 85, k: 0.22 },
  speech:   { src: 'panel/panel_chat_bubble_2_body.png', mode: '9', l: 110, t: 70, r: 110, b: 85 },   // 손님 말풍선 몸통 (꼬리는 CSS 로 하나만 얹는다)
  sheet:    { src: 'panel/panel_bottom_sheet.png', mode: '9', l: 90,  t: 90,  r: 90,  b: 10 },
  slot:     { src: 'btn/btn_slot.png',             mode: 'fit' },
  stick:    { src: 'cook/stick.png',               mode: 'v', t: 70, b: 34 },   // 꼬치 막대: 뾰족한 끝·아래 끝은 그대로, 가운데만 세로로
  node:     { src: 'btn/btn_map_node.png',         mode: 'fit' },
  next:     { src: 'btn/btn_next_round.png',       mode: 'fit' },
};

/** 색 변형: HSL 공간에서 색상 회전(rot, 도) · 채도 배율(sat) · 밝기 배율(lum). 프레임 이미지에만 적용 */
export const TINTS = {
  gray:      { sat: 0, lum: 1.08 },
  grayDark:  { sat: 0.08, lum: 0.62 },
  grayLight: { sat: 0.12, lum: 1.04 },
  ctaOrange: { rot: 49, sat: 1.05, lum: 1.06 },      // 빨강 CTA → 주황 (결정 #7)
  ctaMint:   { rot: 176, sat: 0.75, lum: 1.12 },
  pillPink:  { hue: 274, setSat: 0.92, keepLight: 0.74 }, // 젤리 박스: 테두리를 젤리와 같은 보라(#B565F7)로. 안쪽 바탕·광택 띠는 흰색 그대로
  pillYellow:{ rot: -170, sat: 1.2, lum: 1.02, keepLight: 0.74 },   // → 노랑(진행)
  pillMint:  { rot: -47, sat: 0.95, keepLight: 0.74 },   // → 민트
  pillSticker: { hue: 298, setSat: 0.62, keepLight: 0.74 },   // 스티커 수량 박스: 스티커 아이콘과 같은 분홍보라
  noteMint:  { rot: -118, sat: 1.0, lum: 1.0 },      // 라벤더 미션 패널 → 민트(정답)
  slotMint:  { rot: 132, sat: 1.9, lum: 1.02 },      // 갈색 슬롯 → 민트(정답 선택)
  headPink:  { rot: 123, sat: 1.0, lum: 1.02 },      // 파랑 헤더 → 핑크
  nodeClear: { rot: 165, sat: 0.6, lum: 1.12 },       // 클리어한 노드: 하늘색 (노란 별이 잘 보이게)
  labelYellow: { hue: 44, setSat: 0.95, lum: 1.18 }, // 회색 라벨 pill → 노랑 (일차)
  labelBright: { lum: 1.18 },                         // 캔디맵 노드 이름표
  labelLock:  { sat: 0, lum: 1.08 },
  labelPink:  { hue: 340, setSat: 0.78, keepLight: 0.8 },   // 열린 문 라벨("2장으로 ▶"): 갈색 테두리 → 분홍, 크림 바탕은 그대로
};

/** 어떤 요소에 어떤 스킨을 입힐지. 위에서부터 처음 맞는 규칙 하나만 적용. tints 도 처음 맞는 것 하나. */
const RULES = [
  { sel: '.speech',           skin: 'speech',  tints: [] },
  { sel: '.btn.small',        skin: 'modal',   tints: [['.disabled', 'gray'], ['.yellow', 'ctaOrange'], ['.mint', 'ctaMint']] },
  { sel: '.btn',              skin: 'cta',     tints: [['.disabled', 'gray'], ['.yellow', 'ctaOrange'], ['.mint', 'ctaMint']] },
  { sel: '.pill',             skin: 'pill',    tints: [['.yellow', 'pillYellow'], ['.sticker', 'pillSticker'], ['.mint', 'pillMint'], ['.sky', null], ['*', 'pillPink']] },
  { sel: '.profile .bar i',   skin: 'xpfill',  tints: [] },
  { sel: '.profile .bar',     skin: 'xptrack', tints: [] },
  { sel: '.profile',          skin: 'profile', tints: [] },
  { sel: '.cnode.gate.gate-open .clabel', skin: 'xptrack', tints: [['*', 'labelPink']] },   // 열린 문: 분홍 테두리
  { sel: '.cnode.lock .clabel', skin: 'label',   tints: [['*', 'labelLock']] },   // 잠긴 노드 이름표: 회색 라벨
  { sel: '.cnode .clabel',     skin: 'xptrack', tints: [] },                     // 클리어·진행 중 노드 이름표: panel_xpbar_track
  { sel: '.book-page .head',  skin: 'header',  tints: [['*', 'headPink']] },   // 도감 제목: 헤더 알약을 분홍으로
  { sel: '.book-count',       skin: 'header',  tints: [] },                     // 도감 아래 숫자: 헤더 알약 (파랑 그대로)
  { sel: '.note, .splash-tip, .owl-node .bub', skin: 'mission', tints: [['.mint', 'noteMint']] },
  { sel: '.dialog, .detail, .book-page', skin: 'card', tints: [] },
  { sel: '.cell-h, .wrong-chip', skin: 'product', tints: [['.none', 'grayLight']] },
  { sel: '.chat-item .msg',   skin: 'chat',    tints: [] },
  { sel: '.pink-panel',       skin: 'sheet',   tints: [] },
  { sel: '.skewer .stick',    skin: 'stick',   tints: [] },
  { sel: '.tile',             skin: 'slot',    tints: [['.selected', 'slotMint'], ['.dim', 'grayLight'], ['.locked', 'grayDark']] },
  { sel: '.node',             skin: 'node',    tints: [['.clear', 'nodeClear'], ['.lock', 'grayDark']] },
  { sel: '.round-btn',        skin: 'next',    tints: [['.active', null], ['*', 'gray']] },
];
const ALL_SEL = RULES.map(r => r.sel).join(', ');

const images = {};      // src → HTMLImageElement
const tinted = {};      // src|tint → canvas
const cache = new Map(); // skin|tint|w|h → dataURL

/** 모든 프레임 이미지를 미리 읽는다. 첫 화면을 그리기 전에 await 한다. */
export function loadSkins() {
  const srcs = [...new Set(Object.values(SKINS).map(s => s.src))];
  return Promise.all(srcs.map(src => new Promise(res => {
    const im = new Image();
    im.onload = () => { images[src] = im; res(); };
    im.onerror = () => { console.warn('[skin] 이미지를 못 읽음:', src); res(); };
    im.src = DIR + src;
  })));
}

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hue2rgb(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
function hsl2rgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; h /= 360;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

/** 색 변형한 소스(캔버스)를 돌려준다. 한 번 만들면 캐시. 흰 외곽선·광택(무채색)은 그대로 남는다. */
function source(src, tintName) {
  const im = images[src];
  if (!im) return null;
  if (!tintName) return im;
  const key = src + '|' + tintName;
  if (tinted[key]) return tinted[key];
  const t = TINTS[tintName];
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(im, 0, 0);
  try {
    const d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
    const rot = t.rot || 0, sat = t.sat == null ? 1 : t.sat, lum = t.lum == null ? 1 : t.lum;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      let [h, s, l] = rgb2hsl(p[i], p[i + 1], p[i + 2]);
      if (t.keepLight && l > t.keepLight) { s = 0; l = Math.min(1, l + 0.02); }   // 흰 바탕이 색에 물들어 뿌옇게 보이지 않게
      else if (t.hue != null) { h = t.hue; s = t.setSat == null ? s : t.setSat * (1 - Math.abs(2 * l - 1) * 0.5); }
      else { h = (h + rot + 360) % 360; s = Math.min(1, s * sat); }
      // 밝기는 흰색(광택·외곽선)을 덜 건드리도록 어두운 쪽에 더 세게 건다
      l = lum >= 1 ? l + (1 - l) * (1 - 1 / lum) : l * lum;
      const [r, g, b] = hsl2rgb(h, s, Math.min(1, l));
      p[i] = r; p[i + 1] = g; p[i + 2] = b;
    }
    ctx.putImageData(d, 0, 0);
  } catch (e) { /* file:// 등에서 픽셀 접근이 막히면 원본 색으로 */ }
  return (tinted[key] = c);
}

/** 한 축을 조각으로 나눈다. 반환: [{s0,s1,d0,d1,flip}] (소스 구간 → 대상 구간, 정수 경계) */
function spans(srcLen, a, b, dstLen, c, stretch = false) {
  let da = Math.round(a * c), db = Math.round(b * c);
  if (da + db > dstLen) { const f = dstLen / (da + db); da = Math.floor(da * f); db = dstLen - da; }
  const out = [];
  if (da) out.push({ s0: 0, s1: a, d0: 0, d1: da });
  const mid = dstLen - da - db, smid = srcLen - a - b;
  if (mid > 0 && smid > 0) {
    // 많이 늘어나야 하면 그냥 늘리지 않고 "거울 반복"으로 채운다 → 질감이 번지지 않고 이음매도 없다.
    // 홀수 개로 맞춰야 마지막 조각 끝이 오른쪽(아래) 모서리와 자연스럽게 이어진다.
    const ratio = mid / (smid * c);
    let n = !stretch && ratio > 1.7 ? Math.round(ratio) : 1;   // stretch: 광택이 반복돼 얼룩지지 않게 그냥 늘린다
    if (n % 2 === 0) n += 1;
    for (let i = 0; i < n; i++) {
      out.push({ s0: a, s1: srcLen - b, d0: da + Math.round(mid * i / n), d1: da + Math.round(mid * (i + 1) / n), flip: i % 2 === 1 });
    }
  }
  if (db) out.push({ s0: srcLen - b, s1: srcLen, d0: dstLen - db, d1: dstLen });
  return out;
}

function compose(skin, tintName, w, h) {
  const im = source(skin.src, tintName);
  if (!im) return null;
  const SW = im.naturalWidth || im.width, SH = im.naturalHeight || im.height;
  const W = Math.max(1, Math.round(w * DPR)), H = Math.max(1, Math.round(h * DPR));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (skin.mode === 'fit') {
    const c = Math.min(W / SW, H / SH), dw = Math.round(SW * c), dh = Math.round(SH * c);
    ctx.drawImage(im, 0, 0, SW, SH, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
    return cv;
  }
  let xs, ys;
  if (skin.mode === 'v') {
    const c = W / SW;
    xs = [{ s0: 0, s1: SW, d0: 0, d1: W }];
    ys = spans(SH, skin.t, skin.b, H, c);
  } else if (skin.mode === 'h') {
    const c = H / SH;
    xs = spans(SW, skin.l, skin.r, W, c, skin.stretch);
    if (skin.mid) xs.forEach(x => { if (x.s0 === skin.l && x.s1 === SW - skin.r) { x.s0 = skin.mid[0]; x.s1 = skin.mid[1]; } });
    ys = [{ s0: 0, s1: SH, d0: 0, d1: H }];
  } else {
    const k = (skin.k || 1 / 3) * DPR;
    const c = Math.min(k, W / (skin.l + skin.r), H / (skin.t + skin.b));
    xs = spans(SW, skin.l, skin.r, W, c, skin.stretch);
    ys = spans(SH, skin.t, skin.b, H, c);
  }
  for (const y of ys) for (const x of xs) {
    const dw = x.d1 - x.d0, dh = y.d1 - y.d0;
    if (dw <= 0 || dh <= 0) continue;
    ctx.save();
    ctx.translate(x.flip ? x.d1 : x.d0, y.flip ? y.d1 : y.d0);
    ctx.scale(x.flip ? -1 : 1, y.flip ? -1 : 1);
    ctx.drawImage(im, x.s0, y.s0, x.s1 - x.s0, y.s1 - y.s0, 0, 0, dw, dh);
    ctx.restore();
  }
  return cv;
}

function ruleFor(node) {
  for (const r of RULES) if (node.matches(r.sel)) return r;
  return null;
}
function tintFor(node, rule) {
  for (const [sel, name] of rule.tints) if (sel === '*' || node.matches(sel)) return name;
  return null;
}

function paint(node) {
  const rule = ruleFor(node);
  if (!rule) return;
  const w = node.offsetWidth, h = node.offsetHeight;
  if (!w || !h) return;
  const tint = tintFor(node, rule);
  const key = `${rule.skin}|${tint || ''}|${w}|${h}`;
  if (node.__skinKey === key) return;
  node.__skinKey = key;
  let url = cache.get(key);
  if (!url) {
    const cv = compose(SKINS[rule.skin], tint, w, h);
    if (!cv) return;
    try { url = cv.toDataURL('image/png'); } catch (e) { return; }
    cache.set(key, url);
  }
  // style.css 의 상태 규칙(.disabled, .on …)이 background 축약형으로 크기·반복을 되돌리기 때문에 인라인으로 고정한다
  const st = node.style;
  st.background = `url(${url}) center / 100% 100% no-repeat transparent`;
}

let ro = null;
function adopt(node) {
  if (node.nodeType !== 1) return;
  const list = node.matches(ALL_SEL) ? [node] : [];
  node.querySelectorAll(ALL_SEL).forEach(n => list.push(n));
  for (const n of list) { ro.observe(n); paint(n); }
}

/** #app 아래에 생기는 요소를 지켜보다가 규칙에 맞으면 스킨을 입힌다. 크기·클래스가 바뀌면 다시 그린다. */
export function startSkins(root = document.getElementById('app')) {
  ro = new ResizeObserver(entries => { for (const e of entries) paint(e.target); });
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'childList') m.addedNodes.forEach(adopt);
      else if (m.target.nodeType === 1) { if (m.target.matches(ALL_SEL)) { ro.observe(m.target); paint(m.target); } }
    }
  }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  adopt(root);
}
