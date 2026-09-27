// S3 학습 카드 — 새 한자 5장을 좌우로 넘겨 본다 (v2 스타일)
import { el, icon, go, button, registerScreen, bgLayer, roundBtn, tile , backBtn } from '../core/ui.js';
import { BY_ID, displayHunEum } from '../data/hanja.js';
import { STAGE_BY_ID } from '../data/stages.js';
import { markSeen, stageState, save } from '../core/store.js';
import { sfx, speak } from '../core/audio.js';

registerScreen('learn', (root, params) => {
  const { stageId } = params;
  const stage = STAGE_BY_ID[stageId];
  const chars = stage.chars.map(id => BY_ID[id]);
  let idx = 0;
  const seen = new Set([0]);
  const replay = stageState(stageId).cleared;
  const expanded = true;   // 낱말 예시는 처음부터 보인다

  root.append(bgLayer('mint'));
  const back = backBtn(() => go('map'), 50);
  const dots = el('div.learn-dots' + (chars.length > 8 ? '.many' : ''));
  root.append(el('div.topbar', {}, el('div', {}, back), el('div.title', { text: stage.boss ? `종합 한자 ${chars.length}개` : `새로운 한자 ${chars.length}개` }), el('div', { style: { width: '50px' } })));
  root.append(dots);
  const body = el('div.learn-body');
  const cardHolder = el('div', { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } });
  const left = el('div.learn-arrow.l', {}, roundBtn(true, () => move(-1), 60));
  const right = el('div.learn-arrow.r', {}, roundBtn(true, () => move(1), 60));
  body.append(cardHolder, left, right);
  root.append(body);
  const cta = button('판매 시작', 'block', () => { chars.forEach(c => markSeen(c.id)); save(); go('game', { stageId }); });
  const ctaWrap = el('div.learn-cta', {}, cta);
  root.append(ctaWrap, el('div.bottom-safe'));

  function renderDots() { dots.innerHTML = ''; chars.forEach((_, i) => dots.append(el('i' + (i <= idx ? '.on' : '')))); }
  function updateCta() {
    const ready = replay || seen.size === chars.length;
    cta.classList.toggle('disabled', !ready);
    ctaWrap.classList.toggle('boing', ready);   // 누를 수 있게 되면 통통 튄다
  }
  function renderCard(dir = 0) {
    const c = chars[idx];
    const card = el('div.note.learn-card' + (dir > 0 ? '.flip' : dir < 0 ? '.flip-back' : ''), {}, el('div.tape'));
    const front = el('div.front', {}, el('div.hanja', { text: c.hanja }), el('div.hun', { text: displayHunEum(c) }), el('div.pic', { text: c.picture || '' }));
    const words = el('div.words');
    const drawWords = () => {
      words.innerHTML = '';
      words.append(el('div.muted', { text: '낱말 예시', style: { fontSize: '14px' } }));
      const list = el('div.w-list');                     // 줄들은 왼쪽 정렬, 묶음은 가운데
      c.words.forEach(w => list.append(el('div.w', {}, el('span.hanja', { text: w.word }), el('span.jua', { text: w.reading }), el('span.m', { text: w.meaning }))));
      words.append(list);
      if (!c.words.length) words.append(el('div.muted', { text: '아직 낱말이 없어요', style: { fontSize: '14px' } }));
    };
    // 새 한자가 나오면 훈음을 읽어 준다 (예: "하늘 천"). 한자·훈음을 누르면 다시 읽는다
    const say = () => speak(displayHunEum(c));
    front.addEventListener('click', e => { e.stopPropagation(); say(); });
    setTimeout(say, 280);
    drawWords();
    card.append(front, words);
    cardHolder.innerHTML = '';
    cardHolder.append(card);
    left.style.visibility = idx === 0 ? 'hidden' : 'visible';
    right.style.visibility = idx === chars.length - 1 ? 'hidden' : 'visible';
    renderDots(); updateCta();
  }
  function move(d) {
    const n = idx + d;
    if (n < 0 || n >= chars.length) return;
    idx = n; seen.add(n); sfx.tap();
    renderCard(d);
  }
  let sx = null;
  body.addEventListener('pointerdown', e => { sx = e.clientX; });
  body.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1); });
  renderCard();
});
