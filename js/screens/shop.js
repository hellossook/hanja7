// S9 상점 — 젤리로 사장님 코스튬을 산다. 위: 사장님(입고 있는 옷) 배너 + 차양, 아래: 흰 상자 안 코스튬 카드 3열. 위치·크기는 조정 모드 '상점'
import { el, img, go, registerScreen, button, backBtn, toast, bgLayer, sparkles, uiIcon } from '../core/ui.js';
import { tune } from '../core/tune.js';
import { progress, buyCostume, wearCostume } from '../core/store.js';
import { COSTUMES } from '../data/costumes.js';
import { sfx, buzz } from '../core/audio.js';

registerScreen('shop', (root, params = {}) => {
  const T = tune().shop;
  root.classList.add('shop-screen');
  root.append(bgLayer('peach'));
  // ---- 위: 배너 (과일 무늬 배경 + 사장님 + 젤리) ----
  const jellyTxt = el('span.txt', { text: String(progress.jelly) });
  const hero = img('char_boss', { class: 'hero', style: { width: T.heroSize + 'px', transform: `translateY(${T.heroY}px)` } });
  const banner = el('div.shop-banner', { style: { height: `calc(var(--safe-top) + ${T.awningY - 12}px)` } },
    el('div.shop-hero', {}, hero),
    el('div.shop-top', {}, backBtn(() => go('map'), 50), el('div.pill.pink', {}, el('div.ico', {}, img('jelly')), jellyTxt)));
  const awning = el('div.shop-awning', { 'data-ty': 'awningY', style: { top: `calc(var(--safe-top) + ${T.awningY}px)`, height: T.awningH + 'px' } });
  root.append(banner, awning);
  // ---- 아래: 흰 상자 안 코스튬 목록 ----
  const head = el('div.shop-head', { 'data-ty': 'headY', 'data-tmode': 'plain', style: { marginTop: T.headY + 'px' } }, el('span', { text: '코스튬' }));
  const grid = el('div.shop-grid');
  const box = el('div.shop-box', { style: { marginTop: (T.awningH + 22) + 'px' } }, head, el('div.shop-scroll', {}, grid));   // 차양 아래로 (차양이 제목을 안 가리게)
  root.append(box);

  function refresh() {
    jellyTxt.textContent = String(progress.jelly);
    hero.src = img('char_boss').src;
    grid.innerHTML = '';
    for (const c of COSTUMES) {
      const owned = progress.costumes.includes(c.id), wearing = progress.costume === c.id;
      const card = el('div.shop-card' + (wearing ? '.on' : ''), {},
        el('div.cname', { text: c.name }),
        el('div.cpic', {}, img('char_costume:' + c.id)),
        owned ? button(wearing ? '착용 중' : '착용', wearing ? 'small disabled' : 'small mint', () => { wearCostume(c.id); sfx.pop(); buzz(10); refresh(); })
              : button(el('span.price', {}, uiIcon('jelly_purple', 20), el('span', { text: String(c.price) })), 'small yellow', () => confirmBuy(c)));
      grid.append(card);
    }
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
