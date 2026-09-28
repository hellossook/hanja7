// 꼬치 · 냄비 배치 수치. 실제 값은 js/data/tuning.json 에 있고, 조정 모드(index.html?tune=1)에서 슬라이더로 바꿔 파일에 저장한다.
// 좌표 단위는 논리 px (화면 폭 393). x 는 화면 가운데 기준, y 는 화면 위(안전영역 아래) 기준.

/** 파일이 없거나 항목이 빠졌을 때 쓰는 값 (2026-09-24 화면과 같다) */
export const TUNE_DEFAULTS = {
  stickers: { bookX: 0, bookY: 60, bookW: 340, nbDotsY: 408, nbDotSize: 16, nbDotGap: 10, panelTop: 470, panelW: 0, cols: 3, cellSize: 0, gridGapX: 12, gridGapY: 14, labelSize: 13,
              panelPadX: 18, panelPadTop: 22, sbX: 12, sbTop: 118, sbBottom: 12, scrollW: 6, labelY: 5, stickerScale: 74, hanjaScale: 84, hanjaFont: 56, hunSize: 30, tabSize: 58, tabGap: 12, hintSize: 13, hintGap: 10 },
  map:    { profX: 12, profY: 6, profW: 208, profH: 82, profAvatar: 60, nameSize: 14.5, nameX: 0, nameY: 0, barW: 0, barH: 14, barX: 0, barY: 0,
            n1X: 88, n1Y: 1080, n2X: 262, n2Y: 898, n3X: 72, n3Y: 640, n4X: 300, n4Y: 480, n5X: 320, n5Y: 330, n6X: 255, n6Y: 215, gateX: 182, gateY: 95, gateLockX: 33, gateLockY: 34, gateLockSize: 40,
            cam1Y: 528, cam2Y: 333, cam3Y: 0, camView: 0 },
  book:   { sbX: 8, sbTop: 100, sbBottom: 26, scrollW: 6 },
  game:   { fruitSize: 137, gap: 64, stickLength: 0, tipCover: 9, x: 0, y: 0, pillsX: 16, pillsY: 38,
            backX: 14, backY: 2, backSize: 42, noteX: 0, noteY: 0, noteW: 300, noteH: 146, tilesX: 14, tilesY: 0, tileSize: 0, tileGap: 0, fruitScale: 72, tagX: 0, tagY: 0, tagScale: 100, dotsX: 30, dotsY: 4, dotSize: 30, dotGap: 12 },
  coat:   { fruitSize: 110, gap: 76, stickLength: 486, tipCover: 7, x: 0, y: 252, scale: 100, rotate: 0, potX: 30, potY: 480, potWidth: 330 },
  stir:   { fruitSize: 122, gap: 76, stickLength: 564, tipCover: 8, x: 0, y: 150, scale: 100, rotate: 0, potX: 30, potY: 480, potWidth: 330, hintY: 380 },
  done:   { fruitSize: 142, gap: 50, stickLength: 0, tipCover: 9, x: 0, y: 260, scale: 100, rotate: 6 },
  sale:   { fruitSize: 100, gap: 46, stickLength: 0, tipCover: 6, x: 76, y: 150, scale: 100, rotate: 0, custX: 30, custY: 170, custSize: 210, bubbleX: 40, bubbleY: 70 },
  result: { fruitSize: 114, gap: 45, stickLength: 0, tipCover: 7, x: -50, y: 142, scale: 100, rotate: -16, spacing: 64, fan: 10,
            titleX: 0, titleY: 22, titleSize: 0, titleTextY: 24, starsY: 484, wrongY: 536, doneX: 0, doneY: 658, doneSize: 24, lineY: 780, lineSize: 15, rewardY: 500, rewardSize: 28, sparkX: 0, sparkY: 290, sparkSpread: 160, sparkSize: 30 },
};

const FILE = 'js/data/tuning.json';
const DRAFT_KEY = 'hanja7.tuningDraft';
export const tuneMode = new URLSearchParams(location.search).has('tune');

const clone = o => JSON.parse(JSON.stringify(o));
function merge(dst, src) {
  for (const [scene, vals] of Object.entries(src || {})) {
    if (!dst[scene] || typeof vals !== 'object') continue;
    for (const [k, v] of Object.entries(vals)) if (k in dst[scene] && typeof v === 'number' && isFinite(v)) dst[scene][k] = v;
  }
  return dst;
}

let cur = clone(TUNE_DEFAULTS);
let saved = clone(TUNE_DEFAULTS);     // 파일에 저장돼 있는 값 (되돌리기 기준)

/** 게임 시작 전에 한 번: 파일 값을 읽고, 조정 모드면 저장 안 한 초안까지 얹는다 */
export async function loadTuning() {
  try {
    const r = await fetch(FILE, { cache: 'no-store' });
    if (r.ok) merge(cur, await r.json());
  } catch (e) { /* 파일이 없으면 기본값 */ }
  saved = clone(cur);
  if (tuneMode) {
    try { merge(cur, JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')); } catch (e) { /* 초안 없음 */ }
  }
}

export const tune = () => cur;
export const savedTune = () => saved;
export const isDirty = () => JSON.stringify(cur) !== JSON.stringify(saved);

export function setTune(scene, key, value) {
  cur[scene][key] = value;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(cur)); } catch (e) { /* 저장 공간 없음 */ }
}
export function revertScene(scene) { cur[scene] = clone(saved[scene]); setTune(scene, Object.keys(cur[scene])[0], cur[scene][Object.keys(cur[scene])[0]]); }
export function defaultScene(scene) { cur[scene] = clone(TUNE_DEFAULTS[scene]); setTune(scene, Object.keys(cur[scene])[0], cur[scene][Object.keys(cur[scene])[0]]); }
export const tuneJSON = () => JSON.stringify(cur, null, 2);

/** 개발 서버(tools/serve.py)에 저장을 부탁한다. 성공하면 초안을 지운다 */
export async function saveTuningFile() {
  const r = await fetch('/__save_tuning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: tuneJSON() });
  const msg = await r.text();
  if (!r.ok) throw new Error(msg || r.status);
  saved = clone(cur);
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* 무시 */ }
  return msg;
}
