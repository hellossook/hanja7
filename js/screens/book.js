// S7 한자도감 — 스프링 노트 (v2)
import { el, icon, go, button, registerScreen, stars, toast, bgLayer, tile, pill, img, roundBtn, closeBtn , backBtn, scrollBar } from '../core/ui.js';
import { tune } from '../core/tune.js';
import { GRADE8, CHAPTER1, displayHunEum } from '../data/hanja.js';
import { progress } from '../core/store.js';
import { reviewPriority, seenIds } from '../quiz.js';
import { sfx } from '../core/audio.js';

let tab = 1;   // 0: 8급, 1: 1장

registerScreen('book', (root, params = {}) => {
  root.append(bgLayer('mint'));
  root.append(el('div.topbar', {}, el('div', {}, backBtn(() => go('map'), 50)), el('div'), el('div', {}, pill(img('jelly'), progress.jelly))));
  const page = el('div.book-page', { style: { top: 'calc(var(--ct) + 92px)', bottom: 'calc(var(--safe-bottom) + 96px)' } });
  const rings = el('div.rings'); for (let i = 0; i < 6; i++) rings.append(el('i'));
  const tabs = el('div.tabs');
  const grid = el('div.book-grid');
  const scroll = el('div.book-scroll', {}, grid);
  const count = el('div.book-count');
  const T = tune().book;
  const sbar = scrollBar(scroll);                                          // 분홍 스크롤 막대 (위치는 조정 모드 '도감')
  Object.assign(sbar.style, { right: T.sbX + 'px', top: T.sbTop + 'px', bottom: T.sbBottom + 'px', width: T.scrollW + 'px' });
  Object.assign(sbar.dataset, { ty: 'sbTop', tmode: 'plain' });
  page.append(rings, el('div.head', { text: '한자 도감' }), tabs, scroll, count, sbar);
  root.append(page);
  root.append(el('div.book-nav.l', { style: { left: '40px' } }, roundBtn(tab === 1, () => { tab = 0; renderTabs(); renderGrid(); }, 64)),
    el('div.book-nav', { style: { right: '40px' } }, roundBtn(tab === 0, () => { tab = 1; renderTabs(); renderGrid(); }, 64)));

  function renderTabs() {
    tabs.innerHTML = '';
    tabs.append(el('button.tab' + (tab === 0 ? '.on' : ''), { text: '8급', onClick: () => { tab = 0; sfx.tap(); renderTabs(); renderGrid(); } }),
      el('button.tab' + (tab === 1 ? '.on' : ''), { text: '1장 하늘과 땅', onClick: () => { tab = 1; sfx.tap(); renderTabs(); renderGrid(); } }),
      el('button.tab.lock', { onClick: () => toast('챕터 2는 준비 중이에요') }, icon.lock(14, '#8E827A'), '2장'));
    root.querySelectorAll('.book-nav .round-btn').forEach((b, i) => b.classList.toggle('active', i === 0 ? tab === 1 : tab === 0));
  }
  function cellState(c) {
    const s = progress.chars[c.id];
    if (!s) return c.level === 8 ? 'learn' : 'none';
    if (s.box === 0 && s.asked > 0) return 'review';
    return 'learn';
  }
  function renderGrid() {
    grid.innerHTML = '';
    const list = tab === 0 ? GRADE8 : CHAPTER1;
    let learned = 0;
    for (const c of list) {
      const st = cellState(c);
      const s = progress.chars[c.id];
      const cell = el('div.cell-h' + (st === 'none' ? '.none' : ''));
      if (st === 'none') cell.append(el('span.hanja', { text: '?' }), el('span.hun', { text: '???' }));
      else {
        learned += 1;
        if (s && s.box > 0) cell.append(el('div.st', {}, stars(s.box, 3, 12)));
        if (st === 'review') cell.append(el('div.dot'));
        cell.append(el('span.hanja', { text: c.hanja }), el('span.hun', { text: displayHunEum(c) }));
        cell.addEventListener('click', () => { sfx.pop(); openDetail(c); });
      }
      grid.append(cell);
    }
    count.textContent = `${learned} / ${list.length}`;
    requestAnimationFrame(sbar.sync);
  }
  function openDetail(c) {
    const s = progress.chars[c.id];
    const ov = el('div.overlay');
    ov.append(el('div.scrim', { onClick: () => ov.remove() }));
    const words = el('div.words');
    c.words.forEach(w => words.append(el('div.w', {}, el('span.hanja', { text: w.word }), el('span.jua', { text: w.reading }), el('span.m', { text: w.meaning }))));
    if (!c.words.length) words.append(el('div.muted', { text: '아직 낱말이 없어요', style: { fontSize: '14px' } }));
    const card = el('div.detail.pop-in', {},
      stars(s ? s.box : 0, 3, 24), el('div.hanja.big', { text: c.hanja }), el('div.hun', { text: displayHunEum(c) }), el('div.pic', { text: c.picture || '' }), words,
      el('div', { style: { marginTop: '12px', width: '100%' } }, button('복습하기', 'block yellow small', () => {
        const others = reviewPriority([...seenIds()].filter(id => id !== c.id)).slice(0, 4);
        go('game', { review: [c.id, ...others], bonus: false });
      })));
    card.append(el('div.close', {}, closeBtn(() => ov.remove(), 52)));
    ov.append(card);
    root.append(ov);
  }
  renderTabs(); renderGrid();
  if (params.demoDetail) setTimeout(() => openDetail(CHAPTER1.find(c => c.id === params.demoDetail) || CHAPTER1[0]), 0);
});
