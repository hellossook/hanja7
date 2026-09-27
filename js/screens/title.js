// S0 스플래시 (타이틀 겸) — 로고 + 오늘의 팁 + 프로필 카드 + 시작하기. 타이틀 화면은 없고 바로 맵으로 간다.
import { el, icon, go, button, registerScreen, bgLayer, faceBadge, pick, petals } from '../core/ui.js';
import { progress, save, stageState } from '../core/store.js';
import { TIPS, STAGES } from '../data/stages.js';

function dayCount() {
  const d = progress.firstDay ? Math.floor((Date.now() - new Date(progress.firstDay).getTime()) / 86400000) + 1 : 1;
  return Math.max(1, d);
}
function stagePct() { return Math.round(STAGES.filter(s => stageState(s.id).cleared).length / STAGES.length * 100); }

/** 프로필 카드 (스플래시·맵 공용) */
export function profileCard(glow = false, compact = false) {
  const av = el('div.av', {}, faceBadge('boss', compact ? 52 : 66), el('div.day', { text: `${dayCount()}일차` }));
  const card = el('div.profile' + (compact ? '.compact' : ''), {}, av,
    el('div.info', {}, el('div.name', {}, '사장님네 탕후루', icon.pencil(compact ? 15 : 18)), el('div.bar', {}, el('i', { style: { width: Math.max(6, stagePct()) + '%' } }))));
  if (glow) return el('div', { style: { position: 'relative' } }, el('div.splash-glow', { style: { left: '-60px', top: '-60px' } }), card);
  return card;
}

export function logo() {
  return el('div.title-logo', {}, el('div.grade', { text: '7급' }),
    el('div.row', {}, el('span.h', { text: '한자' }), el('span.e', { text: '의' }), el('span.d', { text: '달인' })));
}

registerScreen('splash', root => {
  if (!progress.firstDay) { progress.firstDay = new Date().toISOString(); save(); }
  // 배경 일러스트에 로고까지 그려져 있어서(assets/ui/bg/bg_splash.jpg) 글자 로고·팁·프로필 카드는 올리지 않는다
  root.append(el('div.splash-art'), petals(18));
  root.append(el('div.title-cta.boing', { style: { bottom: 'calc(var(--safe-bottom) + 46px)' } }, button('시작하기', 'block', () => go('map'))));
});
