// 진행 저장 (로컬). 기획서 §9.2
import { BASE_FRUITS, UNLOCKS, WALL_MAX } from '../data/stages.js';

const KEY = 'hanja7.progress';

function fresh() {
  return {
    version: 3,
    jelly: 0,
    stickers: [],          // 획득한 스티커 id
    unlocks: [],           // 열린 과일·코팅 id
    wall: [],              // 스티커북에 붙인 스티커 [{uid, kind:'cust'|'char'|'hanja', id, x, y, rot, scale, page, placed}]
    nextUid: 1,
    stages: {},            // { '1-1': { cleared, bestStars, plays } }
    chars: {},             // { '天': { box, wrongCount, lastSeen, asked } }
    settings: { sound: true },
    tutorialDone: false,
  };
}

export const progress = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const p = Object.assign(fresh(), JSON.parse(raw));
    p.settings = Object.assign({ sound: true }, p.settings || {});
    delete p.diary; delete p.gallery;
    p.unlocks = p.unlocks.map(id => id === 'goldberry' ? 'rainbowjelly' : id);   // 황금 딸기 → 무지개 젤리 (그림 교체)
    for (const id of p.stickers) {
      /* 기념 스티커는 없앴다 */
    }
    p.wall = p.wall.filter(w => w.kind !== 'memo' && w.placed !== false);   // 기념 스티커 · 안 붙인 스티커 정리 (상자는 무제한이라 필요 없다)
    return p;
  } catch (e) {
    return fresh();
  }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) { /* 저장 실패는 무시 */ }
}

export function resetProgress() {
  Object.assign(progress, fresh());
  save();
}

export function charState(id) {
  return progress.chars[id] || null;
}

/** 학습 카드에서 처음 본 글자: box 0으로 등록 */
export function markSeen(id) {
  if (!progress.chars[id]) progress.chars[id] = { box: 0, wrongCount: 0, lastSeen: new Date().toISOString(), asked: 0 };
}

/** 문제 결과 반영. firstTry: 첫 시도에 맞혔는가 */
export function recordAnswer(id, firstTry) {
  const c = progress.chars[id] || (progress.chars[id] = { box: 0, wrongCount: 0, lastSeen: null, asked: 0 });
  if (firstTry) c.box = Math.min(3, c.box + 1);
  else { c.box = 0; c.wrongCount += 1; }
  c.asked += 1;
  c.lastSeen = new Date().toISOString();
}

export function stageState(id) {
  return progress.stages[id] || { cleared: false, bestStars: 0, plays: 0 };
}

export function recordStage(id, stars) {
  const s = progress.stages[id] || (progress.stages[id] = { cleared: false, bestStars: 0, plays: 0 });
  const first = !s.cleared;
  s.cleared = true;
  s.bestStars = Math.max(s.bestStars, stars);
  s.plays += 1;
  return first;
}

export function addJelly(n) { progress.jelly += n; }

export function grantSticker(id) {
  if (progress.stickers.includes(id)) return false;
  progress.stickers.push(id);
  return true;
}

/** 스테이지 해금 지급. 처음이면 해금 정보를, 이미 있으면 null */
export function grantUnlock(stageId) {
  const u = UNLOCKS[stageId];
  if (!u || progress.unlocks.includes(u.id)) return null;
  progress.unlocks.push(u.id);
  return u;
}

export function unlockedFruits() {
  return BASE_FRUITS.concat(Object.values(UNLOCKS).filter(u => u.type === 'fruit' && progress.unlocks.includes(u.id)).map(u => u.id));
}

export function unlockedCoats() {
  return ['sugar'].concat(Object.values(UNLOCKS).filter(u => u.type === 'coat' && progress.unlocks.includes(u.id)).map(u => u.id));
}

/** 벽 스티커 인스턴스 추가. placed=false면 트레이에 들어간다 */
export function addWallSticker(inst) {
  const it = Object.assign({ uid: progress.nextUid++, placed: false, x: 0.5, y: 0.3, rot: 0 }, inst);
  progress.wall.push(it);
  // 너무 많으면 가장 오래된 손님 스티커부터 정리
  while (progress.wall.length > WALL_MAX) {
    const idx = 0;                                                 // 가장 오래된 것부터
    if (idx < 0) break;
    progress.wall.splice(idx, 1);
  }
  return it;
}

export function removeWallSticker(uid) {
  progress.wall = progress.wall.filter(w => w.uid !== uid);
}
