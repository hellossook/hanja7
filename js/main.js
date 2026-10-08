// 진입점
import { initScale } from './core/scale.js';
import { go } from './core/ui.js';
import { unlockAudio, bgm } from './core/audio.js';
import { loadSkins, startSkins } from './core/skin.js';
import { loadTuning, tuneMode } from './core/tune.js';
import { HANJA } from './data/hanja.js';
import { resetProgress, progress, save } from './core/store.js';
import { STAGE_ORDER, UNLOCKS } from './data/stages.js';
import './screens/title.js';
import './screens/map.js';
import './screens/learn.js';
import './screens/game.js';
import './screens/result.js';
import './screens/book.js';
import './screens/stickers.js';
import './screens/shop.js';

initScale();
window.addEventListener('pointerdown', () => { unlockAudio(); document.body.dataset.bgm = '1'; bgm.start(); }, { once: true });   // 첫 터치에서 오디오를 깨우고 배경 음악 시작
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

const query = new URLSearchParams(location.search);
// UI 프레임 이미지를 다 읽은 뒤에 첫 화면을 그린다 (버튼이 빈 채로 깜빡이지 않게)
// 꼬치·냄비 배치 수치(js/data/tuning.json)도 먼저 읽는다
// 한자 글꼴(Noto Serif KR)은 글자별 조각으로 나뉘어 있어, 처음 보는 글자는 잠깐 다른 글꼴로 보일 수 있다 → 미리 전부 불러 둔다
const hanjaText = [...new Set(HANJA.map(c => c.hanja + c.words.map(w => w.word).join('')).join(''))].join('');
const fontsReady = document.fonts ? Promise.race([document.fonts.load(`700 40px "Noto Serif KR"`, hanjaText), new Promise(r => setTimeout(r, 2500))]).catch(() => {}) : Promise.resolve();
if (new URLSearchParams(location.search).has('reset')) { resetProgress(); history.replaceState(null, '', location.pathname); }   // 주소에 ?reset=1 → 처음부터
// 테스트용: ?open=1-5 → 그 스테이지 앞까지 모두 깬 것으로 (별 3개), 그 스테이지가 열린다
const openTo = new URLSearchParams(location.search).get('open');
if (openTo && STAGE_ORDER.includes(openTo)) {
  for (const id of STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(openTo))) progress.stages[id] = { cleared: true, bestStars: 3, plays: 1 };
  for (const id of STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(openTo))) for (const u of [UNLOCKS[id]]) if (u && !progress.unlocks.includes(u.id)) progress.unlocks.push(u.id);
  progress.tutorialDone = true; save(); history.replaceState(null, '', location.pathname);
}
Promise.all([loadSkins(), loadTuning(), fontsReady]).then(() => {
  startSkins();
  if (tuneMode) import('./core/tunePanel.js').then(m => m.startTunePanel());   // 조정 모드: index.html?tune=1
  else if (query.has('demo')) import('./core/demo.js').then(m => m.runDemo(query));   // 스크린샷·디자인용
  else go('splash');
});
