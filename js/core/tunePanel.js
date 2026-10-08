// 조정 모드 패널 (index.html?tune=1). 꼬치·냄비 수치를 슬라이더/숫자로 바꾸거나, 화면의 꼬치·냄비를 끌어서 옮긴다.
// 바꾼 값은 바로 이 브라우저에 초안으로 남고, '파일에 저장'을 누르면 js/data/tuning.json 에 기록된다.
import { el } from './ui.js';
import { tune, setTune, revertScene, defaultScene, saveTuningFile, isDirty, tuneJSON } from './tune.js';
import { view, applyScale } from './scale.js';

const SCENES = [
  { id: 'stickers', name: '스티커', screen: 'stickers', state: '' },
  { id: 'map', name: '맵', screen: 'map', state: '' },
  { id: 'map2', name: '맵2', screen: 'map', state: 'ch2' },
  { id: 'map3', name: '맵3', screen: 'map', state: 'ch3' },
  { id: 'map4', name: '맵4', screen: 'map', state: 'ch4' },
  { id: 'map5', name: '맵5', screen: 'map', state: 'ch5' },
  { id: 'book', name: '도감', screen: 'book', state: '' },
  { id: 'game', name: '게임', screen: 'game', state: 'full' },
  { id: 'coat', name: '코팅 고르기', screen: 'game', state: 'jars' },
  { id: 'stir', name: '저어주기', screen: 'game', state: 'stir' },
  { id: 'done', name: '완성', screen: 'game', state: 'done' },
  { id: 'sale', name: '판매', screen: 'game', state: 'sale' },
  { id: 'result', name: '결과', screen: 'result', state: '' },
];
/** 항목: [키, 이름, 최소, 최대, 설명] */
const FIELDS = {
  fruitSize: ['과일 크기', 40, 220, '과일 한 개의 폭 (px)'],
  gap: ['과일 간격 (%)', 20, 120, '과일 크기 대비. 100 = 딱 붙음, 작을수록 겹침'],
  stickLength: ['꼬치 길이', 0, 900, '0 = 자동 (게임: 화면 아래까지 / 나머지: 과일 5개 길이라 막대가 안 보임)'],
  tipCover: ['꼬치 끝 덮기', 0, 80, '첫 과일이 뾰족한 끝을 덮는 양 (px)'],
  x: ['꼬치 좌우', -200, 200, '화면 가운데 기준 (px)'],
  y: ['꼬치 위아래', -100, 800, '화면 위 기준 (px)'],
  scale: ['전체 크기 (%)', 40, 200, '과일·막대를 한꺼번에'],
  rotate: ['기울기 (°)', -45, 45, ''],
  potX: ['냄비 좌우', -150, 300, '냄비 왼쪽 끝 (px)'],
  potY: ['냄비 위아래', 0, 800, '냄비 위쪽 끝 (px)'],
  potWidth: ['냄비 크기', 150, 500, '냄비 폭 (px)'],
  hintY: ['화살표 위아래', 0, 800, '저어주기 화살표 (px)'],
  avatarX: ['손님 프로필 좌우', 0, 300, '왼쪽 끝에서 (px)'],
  avatarY: ['손님 프로필 위아래', 0, 300, '화면 위에서 (px)'],
  avatarSize: ['손님 프로필 크기', 40, 140, '(px)'],
  pillsX: ['재화 박스 좌우', 0, 250, '오른쪽 끝에서 (px)'],
  pillsY: ['재화 박스 위아래', 0, 300, '화면 위에서 (px)'],
  custX: ['손님 좌우', -100, 300, '왼쪽 끝에서 (px)'],
  custY: ['손님 위아래', 0, 700, '화면 위에서 (px)'],
  custSize: ['손님 크기', 100, 360, '(px)'],
  bubbleX: ['말풍선 좌우', -50, 300, '왼쪽 끝에서 (px)'],
  bubbleY: ['말풍선 위아래', 0, 700, '화면 위에서 (px)'],
  spacing: ['꼬치 사이 간격', 0, 160, '여러 개일 때 (px)'],
  bookX: ['스티커북 좌우', -150, 150, '가운데 기준 (px). 스티커북을 끌어도 돼요'],
  bookY: ['스티커북 위아래', 0, 400, '화면 위에서 (px)'],
  bookW: ['스티커북 크기', 200, 393, '폭 (px). 높이는 비율대로'],
  nbDotsY: ['넘김 점 위아래', 0, 800, '화면 위에서 (px). 점을 끌어도 돼요'],
  nbDotSize: ['넘김 점 크기', 8, 40, '(px)'],
  nbDotGap: ['넘김 점 사이', 0, 40, '(px)'],
  panelTop: ['아래 상자 위치', 250, 800, '화면 위에서 (px)'],
  panelW: ['아래 상자 폭', 0, 393, '0 = 위 스티커북과 같게 (px). 상자는 늘 화면 가운데'],
  cols: ['한 줄 칸 수', 2, 5, ''],
  cellSize: ['스티커 칸 크기', 0, 140, '0 = 상자 폭에 맞춰 자동 (px)'],
  labelSize: ['칸 이름 글씨 크기', 9, 20, '(px)'],
  labelY: ['칸 이름 위아래', -30, 30, '칸 아래에서 떨어진 거리 (px). 음수면 칸 위로 올라가요'],
  panelPadX: ['아래 상자 좌우 여백', 0, 50, '(px)'],
  panelPadTop: ['아래 상자 위 여백', 0, 60, '(px)'],
  sbX: ['스크롤 막대 좌우', -20, 60, '상자(노트) 오른쪽 끝에서 (px)'],
  sbTop: ['스크롤 막대 시작', 0, 600, '상자(노트) 위에서 (px). 막대를 끌어도 돼요'],
  sbBottom: ['스크롤 막대 끝', 0, 300, '상자(노트) 아래에서 (px)'],
  scrollW: ['스크롤 막대 굵기', 2, 16, '(px)'],
  stickerScale: ['칸 안 스티커 크기 (%)', 40, 110, '손님·기념 스티커'],
  hanjaScale: ['칸 안 한자 스티커 크기 (%)', 40, 110, ''],
  hanjaFont: ['한자 글씨 크기 (%)', 30, 90, '한자 스티커 크기 대비'],
  hunSize: ['훈음 글씨 크기 (%)', 15, 60, '한자 글씨 대비'],
  tabSize: ['탭 크기', 36, 90, '(px)'],
  tabGap: ['탭 사이', 0, 40, '(px)'],
  hintSize: ['안내 문구 글씨 크기', 9, 22, '"스티커를 위 스티커북으로…" (px)'],
  hintGap: ['안내 문구와 칸 사이', 0, 40, '(px)'],
  gridGapX: ['스티커 칸 좌우 간격', 0, 60, '(px)'],
  gridGapY: ['스티커 칸 위아래 간격', 0, 60, '(px)'],
  profX: ['프로필 좌우', 0, 200, '왼쪽 끝에서 (px)'],
  profY: ['프로필 위아래', -20, 200, '화면 위에서 (px)'],
  profW: ['프로필 폭', 150, 330, '(px)'],
  profH: ['프로필 높이', 50, 140, '(px)'],
  profAvatar: ['프로필 얼굴 크기', 30, 110, '(px)'],
  nameSize: ['이름 글씨 크기', 8, 30, '(px)'],
  nameX: ['이름 좌우', -60, 60, '원래 자리에서 (px)'],
  nameY: ['이름 위아래', -40, 40, '원래 자리에서 (px)'],
  barW: ['게이지 길이', 0, 260, '0 = 자동 (남은 폭 전부)'],
  barH: ['게이지 두께', 6, 30, '(px)'],
  barX: ['게이지 좌우', -60, 60, '원래 자리에서 (px)'],
  barY: ['게이지 위아래', -40, 40, '원래 자리에서 (px)'],
  n1X: ['1번 알 좌우', 0, 393, '과일 알 가운데 (px)'],
  n1Y: ['1번 알 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  n2X: ['2번 알 좌우', 0, 393, '과일 알 가운데 (px)'],
  n2Y: ['2번 알 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  n3X: ['3번 알 좌우', 0, 393, '과일 알 가운데 (px)'],
  n3Y: ['3번 알 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  n4X: ['4번 알 좌우', 0, 393, '과일 알 가운데 (px)'],
  n4Y: ['4번 알 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  n5X: ['5번 알 좌우', 0, 393, '과일 알 가운데 (px)'],
  n5Y: ['5번 알 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  n6X: ['6번 알 좌우', 0, 393, '과일 알 가운데 (px)'],
  n6Y: ['6번 알 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  gateX: ['다음 장 문 좌우', 0, 393, '맨 위 커튼 문 (마지막 장은 트로피) (px)'],
  gateY: ['다음 장 문 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  prevX: ['앞 장 문 좌우', 0, 393, '맨 아래 열린 커튼 문의 "◀ n장" 라벨 (px)'],
  prevY: ['앞 장 문 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  gateLockX: ['분홍 자물쇠 좌우', -100, 160, '문 안에서 (px). 화면에서 자물쇠를 끌어도 돼요'],
  gateLockY: ['분홍 자물쇠 위아래', -100, 160, '(px)'],
  gateLockSize: ['분홍 자물쇠 크기', 16, 120, '(px)'],
  owlX: ['복습 손님(판다) 좌우', 0, 340, '맵 그림 기준 (px). 판다를 끌어도 돼요. 왼쪽 절반이면 말풍선이 오른쪽에'],
  owlY: ['복습 손님(판다) 위아래', 0, 1180, '맵 그림 위에서 (px)'],
  camView: ['미리 볼 맵 화면', 0, 3, '조정 모드에서만: 0 = 진행 따라, 1 = 1~3번, 2 = 4~5번, 3 = 6번(챕터 1만)'],
  cam1Y: ['1~3번 화면 위치', 0, 700, '맵을 얼마나 내려서 보여 줄지 (px, 클수록 아래쪽). 528 = 맨 아래'],
  cam2Y: ['4~5번 화면 위치', 0, 700, '(px). 챕터 2~5는 여기가 맨 위(문)까지'],
  cam3Y: ['6번 화면 위치', 0, 700, '0 = 맨 위 (2장 문까지)'],
  sparkX: ['반짝이 가운데 좌우', -150, 150, '탕후루 주위 반짝이 (가운데 기준 px). 화면에서 끌어도 돼요'],
  sparkY: ['반짝이 가운데 위아래', 0, 700, '화면 위에서 (px)'],
  sparkSpread: ['반짝이 퍼짐', 40, 260, '가운데에서 얼마나 멀리 (px)'],
  sparkSize: ['반짝이 크기', 8, 60, '(px)'],
  titleX: ['제목 리본 좌우', -150, 150, '가운데 기준 (px)'],
  titleY: ['제목 리본 위아래', -50, 400, '화면 위에서 (px)'],
  titleSize: ['제목 글씨 크기', 0, 48, '0 = 자동 (리본에 맞춤)'],
  titleTextY: ['제목 글씨 위아래', 0, 60, '리본 안에서 (px)'],
  starsY: ['별 3개 위아래', 0, 800, '화면 위에서 (px)'],
  wrongY: ['오답 카드 위아래', 0, 800, '화면 위에서 (px)'],
  doneX: ['판매 완료 문구 좌우', -150, 150, '가운데 기준 (px)'],
  doneY: ['판매 완료 문구 위아래', 0, 850, '화면 위에서 (px)'],
  doneSize: ['판매 완료 문구 크기', 12, 48, '(px)'],
  lineY: ['아래 안내 줄 위아래', 0, 850, '스티커·새 코팅 안내 (px)'],
  lineSize: ['아래 안내 줄 크기', 8, 36, '(px)'],
  rewardY: ['젤리 받았어요 위아래', 0, 850, '젤리 받기 뒤 (px)'],
  rewardSize: ['젤리 받았어요 크기', 12, 60, '(px)'],
  backX: ['뒤로가기 좌우', 0, 300, '왼쪽 끝에서 (px)'],
  backY: ['뒤로가기 위아래', 0, 300, '화면 위에서 (px)'],
  backSize: ['뒤로가기 크기', 24, 90, '(px)'],
  noteX: ['문제 카드 좌우', -150, 150, '원래 자리에서 옮긴 만큼 (px)'],
  noteY: ['문제 카드 위아래', -150, 300, '원래 자리에서 옮긴 만큼 (px)'],
  noteW: ['문제 카드 폭', 180, 380, '(px). 글자는 폭에 맞춰 자동으로 줄어요'],
  noteH: ['문제 카드 높이', 90, 260, '(px)'],
  tilesX: ['과일 칸 좌우', -20, 250, '왼쪽 끝에서 (px)'],
  tilesY: ['과일 칸 위아래', -150, 400, '문제 카드 아래에서 (px)'],
  tileSize: ['과일 칸 크기', 0, 130, '0 = 자동 (화면 높이에 맞춤)'],
  tileGap: ['과일 칸 사이', 0, 160, '과일 카드끼리 (px). 0 = 자동'],
  fruitScale: ['칸 안 과일 크기 (%)', 30, 120, '과일 칸 크기 대비'],
  tagX: ['한자 글자 좌우', -80, 80, '과일 칸 오른쪽 위 모서리 기준 (px)'],
  tagY: ['한자 글자 위아래', -80, 80, '(px)'],
  tagScale: ['한자 글자 크기 (%)', 50, 200, ''],
  dotsX: ['진행 표시 좌우', 0, 250, '오른쪽 끝에서 (px)'],
  dotsY: ['진행 표시 위아래', -150, 400, '문제 카드 아래에서 (px)'],
  dotSize: ['진행 표시 크기', 12, 60, '(px)'],
  dotGap: ['진행 표시 사이', 0, 40, '(px)'],
  fan: ['부채꼴 벌림 (°)', 0, 40, '여러 개일 때 양쪽으로 기울이는 정도'],
};

let scene = sessionStorage.getItem('hanja7.tuneScene') || 'game';
let panel, body, status, timer;

async function rerender() {
  const s = SCENES.find(x => x.id === scene);
  const m = await import('./demo.js');
  m.runDemo(new URLSearchParams({ demo: 1, screen: s.screen, state: s.state }));
}
function later() { clearTimeout(timer); timer = setTimeout(rerender, 140); showStatus(); }
function showStatus(msg) {
  status.textContent = msg || (isDirty() ? '● 저장 안 한 변경이 있어요 (이 브라우저에는 남아 있어요)' : '파일과 같아요');
  status.className = 'tp-status' + (isDirty() && !msg ? ' dirty' : '');
}

function renderFields() {
  body.innerHTML = '';
  const vals = tune()[scene];
  for (const key of Object.keys(vals)) {
    const [name, min, max, help] = FIELDS[key];
    const range = el('input', { type: 'range', min, max, step: 1, value: vals[key] });
    const num = el('input.tp-num', { type: 'number', min, max, step: 1, value: vals[key] });
    const apply = v => { v = Math.round(Number(v)); if (!isFinite(v)) return; range.value = v; num.value = v; setTune(scene, key, v); later(); };
    range.addEventListener('input', () => apply(range.value));
    num.addEventListener('change', () => apply(num.value));
    const minus = el('button.tp-step', { text: '−', onClick: () => apply(+num.value - 1) });
    const plus = el('button.tp-step', { text: '+', onClick: () => apply(+num.value + 1) });
    body.append(el('div.tp-row', { 'data-key': key }, el('div.tp-label', {}, el('b', { text: name }), help ? el('small', { text: help }) : null),
      el('div.tp-ctl', {}, range, minus, num, plus)));
  }
}
/** 화면에서 끌어 옮긴 값을 패널 숫자에 반영 */
function syncField(key, v) {
  const row = body.querySelector(`.tp-row[data-key="${key}"]`);
  if (row) row.querySelectorAll('input').forEach(i => { i.value = v; });
}

function renderTabs(tabs) {
  tabs.innerHTML = '';
  for (const s of SCENES) tabs.append(el('button.tp-tab' + (s.id === scene ? '.on' : ''), { text: s.name, onClick: () => {
    scene = s.id; sessionStorage.setItem('hanja7.tuneScene', scene); renderTabs(tabs); renderFields(); rerender();
  } }));
}

/** 화면의 꼬치·냄비를 끌어서 옮기기 (조정 모드에서는 게임 조작 대신 이것만 동작) */
function enableDrag() {
  let drag = null;
  window.addEventListener('pointerdown', e => {
    const app = document.getElementById('app');
    if (!app.contains(e.target)) return;
    let node = e.target.closest('[data-tx], [data-ty], .tuned-skewer, .skewer-wrap, .bowl-wrap');
    if (!node) return;
    const pot = node.classList.contains('bowl-wrap');
    const yOnly = node.dataset.ty && !node.dataset.tx && node.matches('[data-ty]:not([data-tx])') && !node.classList.contains('tuned-skewer');
    const kx = yOnly ? null : (node.dataset.tx || (pot ? 'potX' : 'x')), ky = node.dataset.ty || (pot ? 'potY' : 'y');   // 위아래만 옮기는 것도 있다
    if (!(ky in tune()[scene])) return;
    e.preventDefault(); e.stopPropagation();
    drag = { node, kx, ky, off: +(node.dataset.toff || 0), mode: node.dataset.tmode || '', sx: e.clientX, sy: e.clientY, x0: kx ? tune()[scene][kx] : 0, y0: tune()[scene][ky] };
    node.classList.add('tp-dragging');
  }, true);
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    e.preventDefault(); e.stopPropagation();
    const dx = (e.clientX - drag.sx) / view.scale, right = drag.mode.includes('right'), plain = drag.mode.includes('plain'), center = drag.mode.includes('center');
    const x = Math.round(right ? drag.x0 - dx : drag.x0 + dx), y = Math.round(drag.y0 + (e.clientY - drag.sy) / view.scale);
    const base = /--ct/.test(drag.node.style.top) ? '--ct' : '--safe-top';
    if (!drag.kx) { drag.node.style.top = plain ? (y + drag.off) + 'px' : `calc(var(${base}) + ${y}px)`; }
    else if (drag.node.dataset.tx) { if (center) drag.node.style.left = `calc(50% + ${x}px)`; else drag.node.style[right ? 'right' : 'left'] = x + 'px'; drag.node.style.top = plain ? (y + drag.off) + 'px' : `calc(var(${base}) + ${y}px)`; }
    else if (drag.kx === 'potX') { drag.node.style.left = x + 'px'; drag.node.style.top = `calc(var(${base}) + ${y}px)`; }
    else if (drag.node.classList.contains('skewer-wrap')) { drag.node.style.left = `calc(50% + ${x}px)`; drag.node.style.top = y + 'px'; }
    else { drag.node.style.left = `calc(50% + ${x}px)`; drag.node.style.top = `calc(var(${base}) + ${y}px)`; }
    drag.x = x; drag.y = y;
    if (drag.kx) syncField(drag.kx, x); syncField(drag.ky, y);
  }, true);
  const end = e => {
    if (!drag) return;
    e.stopPropagation();
    drag.node.classList.remove('tp-dragging');
    if (drag.y != null) { if (drag.kx) setTune(scene, drag.kx, drag.x); setTune(scene, drag.ky, drag.y); later(); }
    drag = null;
  };
  window.addEventListener('pointerup', end, true);
  window.addEventListener('pointercancel', end, true);
  // 조정 모드에서는 화면 안 버튼·저어주기가 반응하지 않게
  window.addEventListener('click', e => { if (document.getElementById('app').contains(e.target)) { e.stopPropagation(); e.preventDefault(); } }, true);
}

export function startTunePanel() {
  document.body.classList.add('tuning');
  document.head.append(el('link', { rel: 'stylesheet', href: 'css/tune.css' }));
  const tabs = el('div.tp-tabs');
  body = el('div.tp-body');
  status = el('div.tp-status');
  const btnSave = el('button.tp-btn.primary', { text: '파일에 저장', onClick: async () => {
    showStatus('저장하는 중…');
    try {
      const msg = await saveTuningFile();
      // 미리보기(Claude 브라우저)는 프로젝트 사본에만 쓸 수 있다. 사본 값은 Claude 가 동기화할 때 프로젝트로 옮겨진다
      if (msg.includes('한자의 달인')) showStatus('프로젝트의 js/data/tuning.json 에 저장했어요 ✓');
      else showStatus('미리보기 사본에 저장했어요 ✓ Claude 에게 "동기화해줘"라고 하면 프로젝트에 반영돼요');
    }
    catch (err) { showStatus('파일 저장 실패: ' + err.message + ' — "값 복사"로 복사해 전달해 주세요'); }
  } });
  const btnRevert = el('button.tp-btn', { text: '이 장면 되돌리기', title: '파일에 저장된 값으로', onClick: () => { revertScene(scene); renderFields(); later(); } });
  const btnDefault = el('button.tp-btn', { text: '처음 값', title: '작업 시작 때의 기본값으로', onClick: () => { defaultScene(scene); renderFields(); later(); } });
  const btnCopy = el('button.tp-btn', { text: '값 복사', onClick: async () => {
    try { await navigator.clipboard.writeText(tuneJSON()); showStatus('전체 값을 복사했어요'); } catch (e) { showStatus('복사가 막혀 있어요'); }
  } });
  panel = el('div.tune-panel', {},
    el('div.tp-head', {}, el('b', { text: '꼬치 · 냄비 조정' }), el('small', { text: '화면의 꼬치·냄비를 끌어서 옮길 수도 있어요' })),
    tabs, body, el('div.tp-foot', {}, status, el('div.tp-btns', {}, btnSave, btnRevert, btnDefault, btnCopy)));
  document.body.append(panel);
  renderTabs(tabs); renderFields(); showStatus(); enableDrag();
  setTimeout(() => { applyScale(); rerender(); }, 0);
  window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });
}
