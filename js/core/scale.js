// 뷰포트 스케일: 폭 393 논리 px 고정, 높이는 640~1000 사이에서 유동. 안전영역은 기기값을 읽어 CSS 변수로 전달.
export const BASE_W = 393;
export const MIN_H = 640;
export const MAX_H = 1000;

export const view = { w: BASE_W, h: 852, scale: 1, safeTop: 12, safeBottom: 12, left: 0, top: 0 };

export function applyScale() {
  const app = document.getElementById('app');
  const probe = document.getElementById('safe-probe');
  const stage = document.getElementById('stage');                      // 조정 모드 패널이 붙으면 그만큼 좁아진다
  const vw = stage ? stage.clientWidth : window.innerWidth, vh = stage ? stage.clientHeight : window.innerHeight;
  let scale = vw / BASE_W;
  let h = vh / scale;
  if (document.body.classList.contains('tuning')) {       // 조정 모드: 항상 기준 화면(393×852)으로 보여 준다 → 조정한 값이 스크린샷과 같다
    scale = Math.min(vw / BASE_W, vh / 852); h = 852;
  }
  else if (h < MIN_H) { scale = vh / MIN_H; h = MIN_H; }      // 넓은 화면(iPad 등): 양옆 여백
  else if (h > MAX_H) { h = MAX_H; }                          // 아주 긴 화면: 위아래 여백
  const cs = getComputedStyle(probe);
  const st = parseFloat(cs.paddingTop) || 0, sb = parseFloat(cs.paddingBottom) || 0;
  // 앱이 화면 전체를 채울 때만 기기 안전영역이 의미 있다 (여백이 생기면 이미 안전함)
  const fills = Math.abs(h * scale - vh) < 2;
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
}
