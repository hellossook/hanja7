// 뷰포트 스케일: 폭 393 논리 px 고정, 높이는 640~1000 사이에서 유동. 안전영역은 기기값을 읽어 CSS 변수로 전달.
export const BASE_W = 393;
export const MIN_H = 640;
export const MAX_H = 1000;
export const SIM_SAFE_TOP = 59, SIM_SAFE_BOTTOM = 34;   // 아이폰 15 (다이내믹 아일랜드 · 홈 바)

export const view = { w: BASE_W, h: 852, scale: 1, safeTop: 12, safeBottom: 12, left: 0, top: 0 };

export function applyScale() {
  const app = document.getElementById('app');
  const probe = document.getElementById('safe-probe');
  const stage = document.getElementById('stage');                      // 조정 모드 패널이 붙으면 그만큼 좁아진다
  // 아이폰 홈 화면 앱은 innerHeight 가 실제 보이는 높이보다 클 때가 있다 → visualViewport(실제 보이는 영역)와 비교해 작은 쪽을 쓴다
  const vv = window.visualViewport;
  const tuning = document.body.classList.contains('tuning');
  const vw = stage ? stage.clientWidth : window.innerWidth;
  let vh = stage ? stage.clientHeight : window.innerHeight;
  if (!tuning && vv && vv.height && vv.height < vh) vh = Math.floor(vv.height);
  if (stage && !tuning) stage.style.height = vh + 'px';                  // 무대도 보이는 높이에 맞춘다 (가운데 정렬이 어긋나지 않게)
  let scale = vw / BASE_W;
  let h = vh / scale;
  if (document.body.classList.contains('tuning')) {       // 조정 모드: 항상 기준 화면(393×852)으로 보여 준다 → 조정한 값이 스크린샷과 같다
    scale = Math.min(vw / BASE_W, vh / 852); h = 852;
  }
  else if (h < MIN_H) { scale = vh / MIN_H; h = MIN_H; }      // 넓은 화면(iPad 등): 양옆 여백
  else if (h > MAX_H) { h = MAX_H; }                          // 아주 긴 화면: 위아래 여백
  const cs = getComputedStyle(probe);
  let st = parseFloat(cs.paddingTop) || 0, sb = parseFloat(cs.paddingBottom) || 0;
  // 기기 안전영역이 없는 곳(맥 브라우저·스크린샷·조정 모드)에서는 아이폰 15 값(위 59 · 아래 34)으로 가정한다 → 미리보기가 실제 아이폰과 같아진다
  const q = new URLSearchParams(location.search);
  if (!st && !sb && !q.has('nosafe')) { st = SIM_SAFE_TOP * scale; sb = SIM_SAFE_BOTTOM * scale; }
  // 앱이 화면 전체를 채울 때만 기기 안전영역이 의미 있다 (여백이 생기면 이미 안전함)
  const fills = Math.abs(h * scale - vh) < 2 || document.body.classList.contains('tuning');
  view.safeTop = Math.max(12, fills ? st / scale : 0);
  view.safeBottom = Math.max(12, fills ? sb / scale : 0);
  view.scale = scale; view.h = h;
  app.style.width = BASE_W + 'px';
  app.style.height = h + 'px';
  app.style.transform = `translate(-50%, -50%) scale(${scale})`;
  const r = app.getBoundingClientRect();
  view.left = r.left; view.top = r.top;
  document.documentElement.style.setProperty('--safe-top', view.safeTop.toFixed(1) + 'px');
  document.documentElement.style.setProperty('--safe-bottom', view.safeBottom.toFixed(1) + 'px');
  if (q.has('debug')) debugReadout(vw, vh, st, sb, scale, h);
}

/** ?debug=1: 화면 왼쪽 아래에 수치를 보여 준다 (아이폰에서 잘림 원인을 볼 때) */
function debugReadout(vw, vh, st, sb, scale, h) {
  let d = document.getElementById('dbg-readout');
  if (!d) { d = document.createElement('div'); d.id = 'dbg-readout'; d.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:9999;background:rgba(0,0,0,.7);color:#fff;font:11px/1.3 monospace;padding:4px 6px;border-radius:6px;pointer-events:none;white-space:pre'; document.body.append(d); }
  const vv = window.visualViewport;
  d.textContent = `win ${window.innerWidth}x${window.innerHeight}  vv ${vv ? Math.round(vv.width) + 'x' + Math.round(vv.height) : '-'}\nstage ${vw}x${vh}  screen ${screen.width}x${screen.height}\nsafe ${st.toFixed(0)}/${sb.toFixed(0)}  scale ${scale.toFixed(3)}  h ${h.toFixed(0)}\nstandalone ${navigator.standalone ? 'yes' : 'no'}`;
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
