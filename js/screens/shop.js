// S9 상점 — 젤리로 사장님 코스튬을 산다. 위: 사장님(입고 있는 옷) 배너 + 차양, 아래: 코스튬 카드 3열
import { el, img, icon, go, registerScreen, pill, button, backBtn, toast, bgLayer, scrollBar, sparkles } from '../core/ui.js';
import { progress, buyCostume, wearCostume, save } from '../core/store.js';
import { COSTUMES } from '../data/costumes.js';
import { sfx, buzz } from '../core/audio.js';

registerScreen('shop', (root, params = {}) => {
  root.classList.add('shop-screen');
  root.append(bgLayer('peach'));
  // ---- 위: 배너 (사장님 + 젤리) ----
  const jellyTxt = el('span.txt', { text: String(progress.jelly) });
  const banner = el('div.shop-banner', {},
    el('div.shop-hero', {}, img('char_boss', { class: 'hero' })),
    el('div.shop-top', {}, backBtn(() => go('map'), 50), el('div.pill.pink', {}, el('div.ico', {}, img('jelly')), jellyTxt)));
  const awning = el('div.shop-awning');
  root.append(banner, awning);
  // ---- 아래: 코스튬 목록 ----
  const head = el('div.shop-head', {}, img('jelly', { class: 'hi' }), el('span', { text: '코스튬' }));
  const grid = el('div.shop-grid');
  const scroll = el('div.shop-scroll', {}, head, grid);
  root.append(scroll);
  const sbar = scrollBar(scroll); Object.assign(sbar.style, { right: '6px', top: '0', bottom: 'calc(var(--safe-bottom) + 8px)', width: '6px' }); root.append(sbar);

  function refresh() {
    jellyTxt.textContent = String(progress.jelly);
    banner.querySelector('.hero').src = img('char_boss').src;
    grid.innerHTML = '';
    for (const c of COSTUMES) {
      const owned = progress.costumes.includes(c.id), wearing = progress.costume === c.id;
      const card = el('div.shop-card' + (wearing ? '.on' : ''), {},
        el('div.cname', { text: c.name }),
        el('div.cpic', {}, img(c.id === 'default' ? 'char_costume:' + 'default' : 'char_costume:' + c.id, { onError: e => { e.target.src = 'assets/chars/boss.png'; } })),
        owned ? button(wearing ? '입는 중' : '입기', wearing ? 'small disabled' : 'small mint', () => { wearCostume(c.id); sfx.pop(); buzz(10); refresh(); })
              : button(el('span.price', {}, img('jelly'), el('span', { text: String(c.price) })), 'small yellow', () => confirmBuy(c)));
      grid.append(card);
    }
    requestAnimationFrame(sbar.sync);
  }
  function confirmBuy(c) {
    sfx.tap();
    const ov = el('div.overlay');
    ov.append(el('div.scrim', { onClick: () => ov.remove() }));
    const dlg = el('div.dialog.shop-dialog.pop-in', { style: { top: 'calc(var(--safe-top) + 110px)' } },
      el('div.dtitle', { text: c.name }),
      el('div.dart', {}, img('char_costume:' + c.id, { style: { width: '150px' } })),
      el('div.dbody', { html: `젤리 <b>${c.price}</b>개로 살까요?<br><span class="muted">가지고 있는 젤리 ${progress.jelly}개</span>` }),
      el('div.dbtn.two', {}, button('아니요', 'small', () => { sfx.tap(); ov.remove(); }), button('살래요', 'yellow small', () => {
        if (!buyCostume(c.id, c.price)) { sfx.wrong(); toast('젤리가 모자라요. 탕후루를 더 팔아요!'); return; }
        ov.remove(); sfx.jelly(); buzz(20);
        refresh();
        sparkles(banner, [[40, 60, '#fff'], [320, 50, '#FFD84F'], [60, 200, '#FFD84F'], [330, 190, '#fff'], [200, 30, '#FFE9A8']], 22);
        setTimeout(() => banner.querySelectorAll('.sparkle').forEach(s => s.remove()), 1800);
        toast(`${c.name}을(를) 입었어요!`);
      })));
    ov.append(dlg); root.append(ov);
  }
  refresh();
  if (params.demoConfirm) setTimeout(() => confirmBuy(COSTUMES[3]), 0);
});
