// S6 결과 — 리본 + 체크무늬 카드 + 젤리 받기 (v2)
import { el, img, icon, go, button, registerScreen, stars, ribbon, bgLayer, pill, noteCard } from '../core/ui.js';
import { BY_ID, displayHunEum } from '../data/hanja.js';
import { STAGE_BY_ID, STAGE_ORDER, STICKER_BY_ID, unlockName, COATINGS, stageLabel } from '../data/stages.js';
import { sfx } from '../core/audio.js';
import { tunedSkewer } from './game.js';
import { tune } from '../core/tune.js';

// params: { stageId, stars, jelly, firstTry, wrongIds, sticker, unlock, last: {fruits, coat}, review, demoReward }
registerScreen('result', (root, p) => {
  root.append(bgLayer('result'));
  [[30, 120, 20], [350, 150, 16], [340, 700, 18], [40, 640, 14]].forEach(([x, y, s], i) =>
    root.append(el('div.sparkle', { style: { left: x + 'px', top: y + 'px', animationDelay: i * 200 + 'ms' } }, icon.sparkle(s, '#fff'))));
  const rc = tune().result;
  /** 글자 묶음을 가운데 기준으로 놓는다 (x = 가운데에서 옮긴 만큼, y = 화면 위에서). 조정 모드 '결과'에서 끌어 옮길 수 있다 */
  const place = (node, kx, ky, x, y, safe = false) => el('div.r-place', { 'data-tx': kx || null, 'data-ty': ky, 'data-tmode': (kx ? 'center' : '') + (safe ? '' : ' plain'), style: { left: `calc(50% + ${x}px)`, top: safe ? `calc(var(--safe-top) + ${y}px)` : y + 'px' } }, node);
  const title = p.review ? '복습 완료!' : `${stageLabel(p.stageId)} 클리어!`;
  const rib = ribbon(title, 'pink');
  if (rc.titleSize) rib.querySelector('span').style.fontSize = rc.titleSize + 'px';
  rib.querySelector('span').style.top = rc.titleTextY + 'px';   // 리본 안 글씨 높이
  root.append(place(el('div.result-ribbon.pop-in', {}, rib), 'titleX', 'titleY', rc.titleX, rc.titleY, true));   // 제목만 안전영역(노치) 아래로

  // 이번 스테이지에서 만든 탕후루를 전부 (부채꼴로 나란히). 위치·간격·벌림은 조정 모드 '결과'
  const last = p.last || { fruits: ['strawberry', 'tangerine', 'grape', 'blueberry', 'kiwi'], coat: 'sugar' };
  const made = (p.made && p.made.length) ? p.made : [last];
  const n = made.length;
  made.forEach((m, k) => {
    const off = k - (n - 1) / 2;
    const w = tunedSkewer('result', m.fruits, { cls: 'result-skewer', anim: 'pop-in', coated: true, coat: m.coat });
    w.style.left = `calc(50% + ${rc.x + off * rc.spacing}px)`;
    w.style.transform = `rotate(${rc.rotate + off * rc.fan}deg) scale(${rc.scale / 100})`;
    w.querySelector('.inner').style.animationDelay = (k * 120) + 'ms';
    root.append(w);
  });
  // 탕후루 주위 반짝이 (위치·퍼짐·크기는 조정 모드 '결과'. 가운데를 끌어도 돼요)
  const glitter = el('div.result-glitter', { 'data-tx': 'sparkX', 'data-ty': 'sparkY', 'data-tmode': 'center', style: { left: `calc(50% + ${rc.sparkX}px)`, top: `calc(var(--ct) + ${rc.sparkY}px)` } });
  const SPARK = [[-1, -0.9, '#fff', 1], [0.15, -1, '#FFD84F', 0.8], [1, -0.7, '#fff', 0.9], [-1.05, 0.05, '#FFD84F', 0.7], [1.05, 0.15, '#FFE9A8', 1], [-0.85, 0.85, '#fff', 0.8], [0.1, 1, '#FFD84F', 1], [0.95, 0.9, '#fff', 0.7], [-0.4, -0.5, '#FFE9A8', 0.5], [0.5, 0.45, '#fff', 0.55]];
  SPARK.forEach(([ux, uy, c, k], i) => glitter.append(el('div.sparkle', { style: { left: Math.round(ux * rc.sparkSpread) + 'px', top: Math.round(uy * rc.sparkSpread * 1.25) + 'px', animationDelay: (i * 170) % 900 + 'ms' } }, icon.sparkle(Math.round(rc.sparkSize * k), c))));
  root.append(glitter);
  if (!p.review) root.append(place(el('div.result-stars.pop-in', { style: { animationDelay: '300ms' } }, stars(p.stars, 3, 46)), null, 'starsY', 0, rc.starsY));
  if (p.wrongIds && p.wrongIds.length) {
    const row = el('div.result-wrong');
    p.wrongIds.slice(0, 4).forEach(id => { const c = BY_ID[id]; row.append(el('div.wrong-chip', {}, el('span.hanja', { text: c.hanja }), el('span.jua', { text: displayHunEum(c) }))); });
    root.append(place(row, null, 'wrongY', 0, rc.wrongY));
  }
  const extras = [];
  if (p.unlock) extras.push(`새 ${p.unlock.type === 'fruit' ? '과일' : '코팅'} ${unlockName(p.unlock)}`);
  const doneText = el('div.done-text', { style: { fontSize: rc.doneSize + 'px' }, text: p.review ? '새콤달콤 복습 탕후루를 다 팔았어요!' : '새콤달콤 탕후루 3개 모두 판매했어요!' });
  root.append(place(el('div.result-done', {}, doneText), 'doneX', 'doneY', rc.doneX, rc.doneY));
  const cta = el('div.result-cta', { style: { bottom: 'calc(var(--safe-bottom) + 44px)' } });
  const line = el('div.result-line', { style: { fontSize: rc.lineSize + 'px' }, text: extras.join(' · ') });
  root.append(cta, place(line, null, 'lineY', 0, rc.lineY));

  function reward() {
    cta.innerHTML = ''; line.textContent = '';
    ['.result-wrong', '.result-stars', '.result-done'].forEach(sel => root.querySelector(sel)?.closest('.r-place')?.remove());
    sfx.jelly();
    // 젤리가 하늘에서 떨어져 화면 아래로 사라진다 (두 번 쏟아짐)
    const drops = [[60, 34], [150, 30], [250, 36], [330, 28], [105, 26], [205, 32], [290, 30], [30, 28], [175, 36], [355, 26], [80, 30], [230, 28], [310, 34], [130, 26], [270, 30], [190, 28]];
    drops.forEach(([x, s], i) => {
      const d = el('div.rain', { style: { left: x + 'px', top: '-60px', animationDelay: (i * 110) + 'ms', animationDuration: (1500 + (i % 4) * 180) + 'ms' } }, img('jelly', { style: { width: s + 'px', height: s + 'px' } }));
      d.addEventListener('animationend', () => d.remove());
      root.append(d);
    });
    root.append(place(el('div.reward-text.pop-in', { style: { fontSize: rc.rewardSize + 'px' }, text: `젤리 ${p.jelly}개를 받았어요!` }), null, 'rewardY', 0, rc.rewardY));
    if (extras.length) root.append(place(el('div.result-line', { style: { fontSize: rc.lineSize + 'px' }, text: extras.join(' · ') }), null, null, 0, rc.rewardY + 50));
    const next = el('div.result-cta', { style: { bottom: 'calc(var(--safe-bottom) + 30px)' } }, button('가게로 돌아가기', 'block', () => go('map')));
    if (!p.review) next.append(el('div', { style: { textAlign: 'center', marginTop: '6px' } }, el('button.text-btn', { text: '한 번 더', onClick: () => { sfx.tap(); go('game', { stageId: p.stageId }); } })));
    setTimeout(() => root.append(next), 900);
  }
  cta.append(button(el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '10px' } }, img('jelly'), `젤리 ${p.jelly} 받기`), 'block', reward));
  setTimeout(() => sfx.clear(), 100);
  if (p.demoReward) setTimeout(reward, 50);
});
