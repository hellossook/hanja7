// 스크린샷·디자인용 데모 모드: index.html?demo=1&screen=<화면>&state=<상태>
import { progress } from './store.js';
import { go } from './ui.js';

function seed() {
  progress.jelly = 128;
  progress.stickers = ['00', '01-1'];
  progress.unlocks = ['tomato', 'blueberry', 'choco'];
  progress.stages = { '8': { cleared: true, bestStars: 3, plays: 1 }, '1-1': { cleared: true, bestStars: 2, plays: 1 } };
  progress.tutorialDone = true;
  progress.firstDay = new Date().toISOString();
  const t = new Date().toISOString();
  progress.chars = {
    天: { box: 3, wrongCount: 0, lastSeen: t, asked: 3 }, 地: { box: 0, wrongCount: 1, lastSeen: t, asked: 2 }, 川: { box: 0, wrongCount: 2, lastSeen: t, asked: 2 },
    江: { box: 2, wrongCount: 0, lastSeen: t, asked: 2 }, 海: { box: 1, wrongCount: 0, lastSeen: t, asked: 1 },
    校: { box: 2, wrongCount: 0, lastSeen: t, asked: 2 }, 學: { box: 3, wrongCount: 0, lastSeen: t, asked: 3 }, 水: { box: 1, wrongCount: 1, lastSeen: t, asked: 2 },
    山: { box: 0, wrongCount: 1, lastSeen: t, asked: 1 }, 火: { box: 2, wrongCount: 0, lastSeen: t, asked: 2 },
  };
  progress.wall = [
    { uid: 1, kind: 'cust', id: 'rabbit_1', x: 0.16, y: 0.2, rot: -8, placed: true },
    { uid: 2, kind: 'char', id: '20', x: 0.42, y: 0.16, rot: 5, placed: true },
    { uid: 3, kind: 'cust', id: 'boss_3', x: 0.7, y: 0.24, rot: -4, placed: true },
    { uid: 4, kind: 'cust', id: 'rabbit_2', x: 0.86, y: 0.1, rot: 9, placed: true },
    { uid: 5, kind: 'char', id: '04', x: 0.3, y: 0.62, rot: -6, placed: true },
    { uid: 6, kind: 'hanja', id: '天', x: 0.72, y: 0.66, rot: 8, placed: true },
  ];
  progress.nextUid = 50;
}

export function runDemo(q) {
  seed();
  const screen = q.get('screen') || 'splash';
  const state = q.get('state') || '';
  const last = { fruits: ['strawberry', 'tangerine', 'grape', 'blueberry', 'kiwi'], coat: 'choco' };
  const routes = {
    splash: () => go('splash'),
    map: () => go('map', { demoDialog: state === 'dialog', chapter: state.startsWith('ch') ? Number(state.slice(2)) : undefined }),   // state=ch3 → 3장 맵
    learn: () => go('learn', { stageId: '1-2', demoExpanded: state === 'expanded' }),
    game: () => go('game', { stageId: '1-2', demo: state || 'A' }),
    result: () => go('result', { stageId: '1-2', stars: 2, jelly: 52, firstTry: 12, wrongIds: ['川', '地'], unlock: { type: 'coat', id: 'choco' }, last, demoReward: state === 'reward',
      made: [{ fruits: ['kiwi', 'apple', 'strawberry', 'grape', 'tangerine'], coat: 'sugar' }, { fruits: ['tangerine', 'strawberry', 'kiwi', 'apple', 'grape'], coat: 'sugar' }, last] }),
    book: () => go('book', { demoDetail: state === 'detail' ? '天' : null }),
    shop: () => go('shop', { demoConfirm: state === 'confirm' }),
    stickers: () => go('stickers', { demoTurn: state.startsWith('turn') ? (Number(state.slice(4)) || 42) / 100 : 0 }),   // state=turn55 → 55% 넘긴 모습
  };
  (routes[screen] || routes.splash)();
}
