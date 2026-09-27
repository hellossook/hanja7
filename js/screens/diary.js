// S8 스티커 다이어리 — 트레이의 스티커를 페이지로 끌어다 붙인다
import { el, img, icon, go, registerScreen, toast } from '../core/ui.js';
import { progress, save } from '../core/store.js';
import { STICKERS, STICKER_BY_ID } from '../data/stages.js';
import { toLogical, logicalRect } from '../core/scale.js';
import { sfx } from '../core/audio.js';

registerScreen('diary', root => {
  root.classList.add('diary-screen');
  const back = el('button.circle-btn', { onClick: () => { sfx.tap(); go('map'); } }, icon.back());
  root.append(el('div.topbar', {}, el('div', {}, back), el('div.title', { text: '스티커 다이어리' }), el('div.jua.muted', { text: `${progress.stickers.length} / ${STICKERS.length}`, style: { fontSize: '18px' } })));
  const page = el('div.diary-page');
  const rings = el('div.rings'); for (let i = 0; i < 7; i++) rings.append(el('i'));
  page.append(rings, el('div.pt', { text: '나의 탕후루 가게' }));
  const tray = el('div.diary-tray');
  const trayRow = el('div.row');
  tray.append(el('div.hd', {}, el('span', { text: '스티커 트레이 · 페이지로 끌어다 붙여요' }), el('small', { text: '→ 옆으로 넘기기' })), trayRow);
  root.append(page, tray, el('div.bottom-safe'));

  let selected = null;

  function placedOf(id) { return progress.diary.find(d => d.sticker === id); }

  function renderPage() {
    page.querySelectorAll('.placed').forEach(n => n.remove());
    for (const d of progress.diary) {
      const s = STICKER_BY_ID[d.sticker]; if (!s) continue;
      const node = el('div.placed' + (selected === d.sticker ? '.sel' : ''), { style: { left: (d.x * 100) + '%', top: (d.y * 100) + '%', transform: `rotate(${d.rot}deg)` } }, img(s.img));
      const x = el('div.x', { text: '✕' });
      x.addEventListener('pointerdown', e => e.stopPropagation());
      x.addEventListener('click', e => { e.stopPropagation(); removeSticker(d.sticker); });
      node.append(x);
      attachDrag(node, d.sticker, 'page');
      page.append(node);
    }
  }
  function renderTray() {
    trayRow.innerHTML = '';
    const owned = STICKERS.filter(s => progress.stickers.includes(s.id));
    const free = owned.filter(s => !placedOf(s.id));
    const placed = owned.filter(s => placedOf(s.id));
    const none = STICKERS.filter(s => !progress.stickers.includes(s.id));
    for (const s of free) { const c = el('div.tchip.free', {}, img(s.img), el('span', { text: s.name })); attachDrag(c, s.id, 'tray'); trayRow.append(c); }
    for (const s of placed) trayRow.append(el('div.tchip.placed', {}, img(s.img), el('span.lbl', { text: '붙임' })));
    for (const s of none) trayRow.append(el('div.tchip.none', {}, img(s.img), el('span.lbl', {}, icon.lock(12, '#BDB1A6'), s.from + ' 클리어')));
    if (!owned.length) toast('스테이지를 깨면 스티커를 받아요');
  }
  function removeSticker(id) {
    progress.diary = progress.diary.filter(d => d.sticker !== id);
    selected = null; save(); sfx.pop(); renderPage(); renderTray();
  }

  // 드래그: 트레이 칩 또는 페이지 스티커 → 페이지에 놓으면 붙음, 밖이면 트레이로
  function attachDrag(node, id, from) {
    let ghost = null, start = null, moved = false, placeholder = null;
    node.addEventListener('pointerdown', e => {
      e.preventDefault();
      start = { x: e.clientX, y: e.clientY }; moved = false;
      node.setPointerCapture(e.pointerId);
    });
    node.addEventListener('pointermove', e => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 8) return;
      if (!moved) {
        moved = true; sfx.tap();
        ghost = el('div.drag-ghost', {}, img(STICKER_BY_ID[id].img));
        root.append(ghost);
        if (from === 'tray') { placeholder = el('div.tchip.empty', { text: '옮기는 중' }); node.replaceWith(placeholder); }
        else node.style.visibility = 'hidden';
      }
      const p = toLogical(e.clientX, e.clientY);
      ghost.style.left = p.x + 'px'; ghost.style.top = p.y + 'px';
    });
    const end = e => {
      if (!start) return;
      const wasMoved = moved; start = null;
      if (!wasMoved) {
        if (from === 'page') { selected = selected === id ? null : id; sfx.pop(); renderPage(); }
        return;
      }
      moved = false;
      if (ghost) { ghost.remove(); ghost = null; }
      const p = toLogical(e.clientX, e.clientY);
      const r = logicalRect(page);
      const inside = p.x > r.x + 20 && p.x < r.x + r.w - 20 && p.y > r.y + 20 && p.y < r.y + r.h - 20;
      const existing = placedOf(id);
      if (inside) {
        const x = (p.x - r.x) / r.w, y = (p.y - r.y) / r.h;
        if (existing) { existing.x = x; existing.y = y; }
        else progress.diary.push({ sticker: id, x, y, rot: Math.round(Math.random() * 20 - 10) });
        selected = null; sfx.stick();
      } else if (existing) {
        progress.diary = progress.diary.filter(d => d.sticker !== id); sfx.pop();
      }
      save(); renderPage(); renderTray();
    };
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
  }
  page.addEventListener('pointerdown', e => { if (e.target === page) { selected = null; renderPage(); } });
  renderPage(); renderTray();
});
