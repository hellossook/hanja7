// 뷰포트 스케일: 폭 393 논리 px 고정, 높이는 640~1000 사이에서 유동. 안전영역은 기기값을 읽어 CSS 변수로 전달.
export const BUILD = 'c412866f70';          // tools/build_pwa.py 가 배포 때 버전으로 바꾼다
export const BASE_W = 393, BASE_H = 852;   // 아이폰 15 논리 크기 = 디자인 기준
export const MIN_H = 640;                  // (예전 값, 지금은 안 씀)
export const MAX_H = 1000;
export const SIM_SAFE_TOP = 59, SIM_SAFE_BOTTOM = 34;   // 아이폰 15 (다이내믹 아일랜드 · 홈 바)

export const view = { w: BASE_W, h: 852, scale: 1, safeTop: 12, safeBottom: 12, left: 0, top: 0 };

export function applyScale() {
  const app = document.getElementById('app');
  const probe = document.getElementById('safe-probe');
  const stage = document.getElementById('stage');                      // 조정 모드 패널이 붙으면 그만큼 좁아진다
  const tuning = document.body.classList.contains('tuning');
  const q = new URLSearchParams(location.search);
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const vw = stage ? stage.clientWidth : window.innerWidth;
  let vh = stage && tuning ? stage.clientHeight : window.innerHeight;
  if (!tuning) {
    if (standalone) {
      // 홈 화면 앱: iOS 26 은 페이지를 상태 막대 밑까지 끌어올리면서 높이(innerHeight)는 상태 막대만큼 작게 알려 준다 → 아래 59px 가 비었다.
      // 화면 전체 높이(screen.height)를 쓰고, 무대 높이도 그만큼 직접 지정한다
      const portrait = vw <= screen.width + 1;
      const sh = portrait ? screen.height : screen.width;
      vh = Math.max(window.innerHeight, document.documentElement.clientHeight, sh);
    } else if (window.visualViewport && visualViewport.height && visualViewport.height < vh) {
      vh = Math.floor(visualViewport.height);                           // 사파리 안: 주소창·도구 막대를 뺀 실제 보이는 높이
    }
    if (stage) stage.style.height = vh + 'px';
  }
  // 폭에 맞춰 키우고(393 = 화면 폭), 세로는 기기만큼 쓴다. 세로가 852 보다 짧으면(사파리 도구 막대) 852 가 다 들어가게 줄이고 양옆은 배경으로 채운다
  let scale, h;
  if (tuning) { scale = Math.min(vw / BASE_W, vh / BASE_H); h = BASE_H; }   // 조정 모드: 항상 기준 화면(393×852)
  else {
    scale = vw / BASE_W; h = vh / scale;
    if (h < BASE_H) { scale = vh / BASE_H; h = BASE_H; }
    else if (h > MAX_H) h = MAX_H;
  }
  const bleed = Math.max(0, (vw / scale - BASE_W) / 2);                   // 양옆 빈 곳 (논리 px) — 배경이 이만큼 더 넓게 깔린다
  const cs = getComputedStyle(probe);
  let st = parseFloat(cs.paddingTop) || 0, sb = parseFloat(cs.paddingBottom) || 0;
  // 마우스로 보는 곳(맥 미리보기·스크린샷·조정 모드)에서는 아이폰 15 홈 화면 앱의 안전영역(위 59 · 아래 34)으로 가정한다 → 폰과 똑같이 보인다
  // 홈 화면 앱이 아닌 곳(맥 미리보기·크롬 기기 모드·사파리 안)에서는 기기가 안전영역을 0 으로 알려 준다 → 홈 화면 앱과 똑같이 보이게 59/34 로 가정
  if (!st && !sb && !standalone && !q.has('nosafe')) { st = SIM_SAFE_TOP * scale; sb = SIM_SAFE_BOTTOM * scale; }
  // 안전영역은 앱이 화면 위·아래 끝까지 닿을 때만 의미가 있다
  const fills = Math.abs(h * scale - vh) < 2 || tuning;
  view.safeTop = Math.max(12, fills ? st / scale : 0);
  view.safeBottom = Math.max(12, fills ? sb / scale : 0);
  view.scale = scale; view.h = h;
  app.style.width = BASE_W + 'px';
  app.style.height = h + 'px';
  app.style.transform = `translate(-50%, -50%) scale(${scale})`;
  app.style.setProperty('--bleed', bleed.toFixed(1) + 'px');
  document.body.classList.toggle('bleed', bleed > 0.5 && !tuning);
  const r = app.getBoundingClientRect();
  view.left = r.left; view.top = r.top;
  document.documentElement.style.setProperty('--safe-top', view.safeTop.toFixed(1) + 'px');
  document.documentElement.style.setProperty('--safe-bottom', view.safeBottom.toFixed(1) + 'px');
  // --safe-top: 위 막대(뒤로·젤리·프로필)는 상태 막대 바로 아래. --ct: 그 아래 본문(문제 카드·과일·꼬치·책…)의 기준선.
  // 본문은 조정 모드에서 맞춘 자리(기준 12)에서 상태 막대가 늘어난 만큼의 40% 만 내려간다 → 위 막대와 안 겹치면서 에디터에서 본 배치에 가깝다
  const ct = 12 + Math.max(0, view.safeTop - 12) * 0.4;
  view.contentTop = ct;
  document.documentElement.style.setProperty('--ct', ct.toFixed(1) + 'px');
  document.documentElement.style.setProperty('--safe-shift', (ct - 12).toFixed(1) + 'px');
  if (standalone && !tuning) {                                            // 홈 화면 앱: 문서 높이도 화면 전체로 (아래가 비지 않게)
    document.documentElement.style.height = document.body.style.height = vh + 'px';
  }
  document.documentElement.classList.toggle('standalone', standalone);
  if (q.has('debug') || debugOn) debugReadout(vw, vh, st, sb, scale, h, standalone, bleed);
  else document.getElementById('dbg-readout')?.remove();
}

/** ?debug=1: 화면 왼쪽 아래에 수치를 보여 준다 (아이폰에서 잘림 원인을 볼 때) */
let debugOn = false;
/** 화면 왼쪽 위 구석을 1.5초 안에 5번 누르면 수치 표시를 켜고 끈다 (홈 화면 앱에서는 주소에 ?debug=1 을 못 붙여서) */
let taps = [];
window.addEventListener('pointerdown', e => {
  if (e.clientX > 60 || e.clientY > 60) return;
  const now = performance.now(); taps = taps.filter(t => now - t < 1500); taps.push(now);
  if (taps.length >= 5) { taps = []; debugOn = !debugOn; applyScale(); }
}, true);
function debugReadout(vw, vh, st, sb, scale, h, standalone, bleed) {
  let d = document.getElementById('dbg-readout');
  if (!d) { d = document.createElement('div'); d.id = 'dbg-readout'; d.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:9999;background:rgba(0,0,0,.7);color:#fff;font:11px/1.3 monospace;padding:4px 6px;border-radius:6px;pointer-events:none;white-space:pre'; document.body.append(d); }
  const vv = window.visualViewport;
  d.textContent = `win ${window.innerWidth}x${window.innerHeight}  vv ${vv ? Math.round(vv.width) + 'x' + Math.round(vv.height) : '-'}\nstage ${vw}x${vh}  screen ${screen.width}x${screen.height}\nsafe ${st.toFixed(0)}/${sb.toFixed(0)}  scale ${scale.toFixed(3)}  h ${h.toFixed(0)}\nstandalone ${standalone ? 'yes' : 'no'}  bleed ${bleed.toFixed(0)}\nbuild ${BUILD}  app ${Math.round(document.getElementById('app').getBoundingClientRect().height)}px`;
}

/** 화면(클라이언트) 좌표 → 앱 논리 좌표 */
export function toLogical(clientX, clientY) {
  return { x: (clientX - view.left) / view.scale, y: (clientY - view.top) / view.scale };
}

/** 요소의 앱 내 논리 사각형 */
export function logicalRect(el) {
  const r = el.getBoundingClientRect();
  return { x: (r.left - view.left) / view.scale, y: (r.top - view.top) / view.scale, w: r.width / view.scale, h: r.height / view.scale };
}

export function initScale() {
  applyScale();
  window.addEventListener('resize', applyScale);
  window.addEventListener('orientationchange', () => setTimeout(applyScale, 120));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', applyScale);
  window.addEventListener('pageshow', applyScale);
  [150, 500, 1200, 2500].forEach(ms => setTimeout(applyScale, ms));      // 홈 화면 앱은 처음 몇 백 ms 동안 뷰포트 값이 바뀐다
}
