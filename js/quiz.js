// 출제 로직 — 기획서 §4 (모드 4종), §4.2 (오답 보기 규칙), §6 (복습 우선순위)
import { HANJA, BY_ID, GRADE8, displayHunEum } from './data/hanja.js';
import { STAGE_BY_ID, STAGE_ORDER } from './data/stages.js';
import { progress, unlockedFruits } from './core/store.js';
import { shuffle, pick } from './core/ui.js';

/** 스테이지 순서상 배운 글자 집합 (8급 전체 + 해당 스테이지까지의 챕터 글자) */
export function learnedIds(stageId) {
  const ids = new Set(GRADE8.map(c => c.id));
  const idx = STAGE_ORDER.indexOf(stageId);
  for (let i = 1; i <= idx; i++) STAGE_BY_ID[STAGE_ORDER[i]].chars.forEach(id => ids.add(id));
  if (stageId === '1-5') STAGE_BY_ID['1-5'].chars.forEach(id => ids.add(id));
  return ids;
}

/** 진행 저장 기준으로 "본 적 있는" 글자 (도감·복습 손님용) */
export function seenIds() {
  return new Set(Object.keys(progress.chars));
}

/** 복습 우선순위: box 낮은 순 → 오답 많은 순 → 오래된 순 */
export function reviewPriority(ids) {
  return ids.slice().sort((a, b) => {
    const A = progress.chars[a] || { box: 0, wrongCount: 0, lastSeen: '' };
    const B = progress.chars[b] || { box: 0, wrongCount: 0, lastSeen: '' };
    if (A.box !== B.box) return A.box - B.box;
    if (A.wrongCount !== B.wrongCount) return B.wrongCount - A.wrongCount;
    return (A.lastSeen || '') < (B.lastSeen || '') ? -1 : 1;
  });
}

/** 낱말이 배운 글자로만 이루어졌는가 */
function wordUsable(word, learned) {
  return [...word].every(ch => learned.has(ch));
}

function usableWords(c, learned) {
  return c.words.filter(w => wordUsable(w.word, learned));
}

// ---------- 오답 보기 ----------
function hanjaDistractors(target, learned, n = 3) {
  const not = id => id !== target.id;
  const tiers = [
    HANJA.filter(c => not(c.id) && c.eum === target.eum && learned.has(c.id)),
    HANJA.filter(c => not(c.id) && c.chapter === target.chapter && c.chapter !== 0 && learned.has(c.id)),
    HANJA.filter(c => not(c.id) && learned.has(c.id)),
    HANJA.filter(c => not(c.id) && !learned.has(c.id)),
  ];
  const out = [];
  for (const t of tiers) {
    for (const c of shuffle(t)) { if (out.length >= n) break; if (!out.includes(c)) out.push(c); }
    if (out.length >= n) break;
  }
  return out.slice(0, n);
}

function hunEumDistractors(target, learned, n = 3) {
  const out = [];
  const sameEum = shuffle(HANJA.filter(c => c.id !== target.id && c.eum === target.eum));
  if (sameEum.length) out.push(sameEum[0]);
  const rest = shuffle(HANJA.filter(c => c.id !== target.id && learned.has(c.id) && !out.includes(c)));
  const unl = shuffle(HANJA.filter(c => c.id !== target.id && !learned.has(c.id) && !out.includes(c)));
  for (const c of rest.concat(unl)) { if (out.length >= n) break; if (displayHunEum(c) !== displayHunEum(target)) out.push(c); }
  return out.slice(0, n);
}

const SIMILAR = {
  천: '전', 지: '치', 해: '헤', 석: '섭', 추: '주', 춘: '준', 동: '둥', 공: '곤', 기: '끼', 산: '선', 강: '간', 화: '하', 초: '조',
  색: '섹', 림: '임', 식: '싯', 하: '화', 연: '영', 자: '차', 청: '정', 토: '도', 남: '람', 일: '을', 월: '얼', 문: '물', 교: '고',
  학: '악', 생: '셍', 모: '무', 부: '보', 형: '경', 제: '재', 왕: '양', 실: '신', 년: '련', 중: '종', 외: '애', 인: '임', 수: '소',
  대: '데', 소: '서', 서: '세', 북: '복', 금: '검', 백: '벡', 목: '몹', 민: '빈', 군: '근', 국: '극', 전: '천', 여: '어', 촌: '존',
};
const ALL_EUM = [...new Set(HANJA.map(c => c.eum))];

function readingDistractors(reading, n = 3) {
  const s = [...reading];
  const cands = new Set();
  // 1) 음절 순서 바꾸기
  if (s.length === 2) cands.add(s[1] + s[0]);
  else for (let i = 0; i < s.length - 1; i++) { const t = s.slice(); [t[i], t[i + 1]] = [t[i + 1], t[i]]; cands.add(t.join('')); }
  // 2) 비슷한 음으로 한 글자 교체
  s.forEach((ch, i) => { if (SIMILAR[ch]) { const t = s.slice(); t[i] = SIMILAR[ch]; cands.add(t.join('')); } });
  // 3) 다른 음으로 한 글자 교체
  let guard = 0;
  while (cands.size < n + 2 && guard++ < 40) {
    const i = Math.floor(Math.random() * s.length); const t = s.slice(); t[i] = pick(ALL_EUM); cands.add(t.join(''));
  }
  cands.delete(reading);
  return shuffle([...cands]).slice(0, n);
}

// ---------- 문제 만들기 ----------
function makeQuestion(mode, c, learned) {
  let prompt, options, answerLabel;
  if (mode === 'A') {
    prompt = { type: 'hun', text: displayHunEum(c) };
    options = shuffle([c, ...hanjaDistractors(c, learned)]).map(o => ({ label: o.hanja, kind: 'hanja', correct: o.id === c.id }));
  } else if (mode === 'B') {
    prompt = { type: 'hanja', text: c.hanja };
    options = shuffle([c, ...hunEumDistractors(c, learned)]).map(o => ({ label: displayHunEum(o), kind: 'hun', correct: o.id === c.id }));
  } else if (mode === 'C') {
    prompt = { type: 'picture', text: c.picture };
    options = shuffle([c, ...hanjaDistractors(c, learned)]).map(o => ({ label: o.hanja, kind: 'hanja', correct: o.id === c.id }));
  } else {
    const w = pick(usableWords(c, learned));
    prompt = { type: 'word', text: w.word, meaning: w.meaning };
    options = shuffle([{ r: w.reading, ok: true }, ...readingDistractors(w.reading).map(r => ({ r, ok: false }))]).map(o => ({ label: o.r, kind: 'read', correct: o.ok }));
  }
  const fruits = shuffle(unlockedFruits()).slice(0, 4);
  options.forEach((o, i) => { o.fruit = fruits[i]; });
  return { mode, char: c, prompt, options, answer: { hanja: c.hanja, hunEum: displayHunEum(c) } };
}

function feasible(mode, c, learned) {
  if (mode === 'C') return c.pictureMode;
  if (mode === 'D') return usableWords(c, learned).length > 0;
  return true;
}

/** 스테이지 15문제 (탕후루 3개 × 5) */
export function buildStage(stageId) {
  const stage = STAGE_BY_ID[stageId];
  const learned = learnedIds(stageId);
  let targets;
  if (stageId === '8') {
    targets = shuffle(stage.chars).slice(0, 15);
  } else if (stageId === '1-5') {
    targets = reviewPriority(stage.chars).slice(0, 12).concat(shuffle(stage.chars).slice(0, 3));
    targets = shuffle(targets).slice(0, 15);
  } else {
    const fresh = stage.chars;
    const reviewPool = [...learned].filter(id => !fresh.includes(id));
    const review = reviewPriority(reviewPool).slice(0, 8);
    const newQ = shuffle(fresh.concat(fresh));                 // 새 글자 5자 × 2 = 10
    const revQ = shuffle(review).slice(0, 5);
    targets = shuffle(newQ.concat(revQ));
  }
  const modes = [];
  for (const [m, n] of Object.entries(stage.modes)) for (let i = 0; i < n; i++) modes.push(m);
  return assignModes(targets, shuffle(modes), learned);
}

function assignModes(targetIds, modes, learned) {
  const qs = [];
  const remaining = modes.slice();
  for (const id of targetIds) {
    const c = BY_ID[id];
    let idx = remaining.findIndex(m => feasible(m, c, learned));
    let mode;
    if (idx >= 0) { mode = remaining[idx]; remaining.splice(idx, 1); }
    else mode = pick(['A', 'B']);
    qs.push(makeQuestion(mode, c, learned));
  }
  // 같은 글자가 연속으로 나오지 않게 가볍게 정리
  for (let i = 1; i < qs.length; i++) {
    if (qs[i].char.id === qs[i - 1].char.id) {
      const j = qs.findIndex((q, k) => k > i && q.char.id !== qs[i - 1].char.id);
      if (j > 0) [qs[i], qs[j]] = [qs[j], qs[i]];
    }
  }
  return qs;
}

/** 복습 5문제 (복습 손님 / 도감 복습하기). ids: 출제할 글자들 */
export function buildReview(ids) {
  const learned = learnedIds('1-5');
  const seen = seenIds();
  let pool = ids.slice();
  if (pool.length < 5) {
    const extra = reviewPriority([...seen].filter(id => !pool.includes(id)));
    pool = pool.concat(extra).slice(0, 5);
  }
  while (pool.length < 5) pool.push(pick(GRADE8).id);
  const modes = shuffle(['A', 'B', 'A', 'B', 'C']);
  return assignModes(pool.slice(0, 5), modes, learned);
}

/** box 0인 글자 (본 적 있고 한 번 이상 출제된 것) */
export function box0Ids() {
  return Object.entries(progress.chars).filter(([, s]) => s.box === 0 && s.asked > 0).map(([id]) => id);
}
