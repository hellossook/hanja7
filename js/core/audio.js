// 효과음: 외부 파일 없이 WebAudio로 합성. 기획서 §11.3의 6종.
import { progress } from './store.js';

let ctx = null;
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** 첫 터치에서 오디오 컨텍스트를 깨운다 (iOS 필수) */
export function unlockAudio() {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  g.gain.value = 0; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.01);
}

function tone(freq, dur, { type = 'sine', vol = 0.18, at = 0, slide = null } = {}) {
  const c = ac(); if (!c || !progress.settings.sound) return;
  const t0 = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

/** 한국어로 읽어 준다 (기기 음성 합성). 소리를 끄면 읽지 않는다 */
let koVoice = null;
function pickVoice() {
  const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  koVoice = vs.find(v => /^ko/i.test(v.lang) && /yuna|sora|female|여/i.test(v.name)) || vs.find(v => /^ko/i.test(v.lang)) || null;
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text) {
  if (!window.speechSynthesis || !progress.settings.sound || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR'; u.rate = 0.85; u.pitch = 1.1;
  if (koVoice) u.voice = koVoice;
  speechSynthesis.speak(u);
}

export const sfx = {
  tap() { tone(660, 0.06, { vol: 0.08 }); },
  stick() { tone(520, 0.09, { type: 'triangle', slide: 880 }); tone(1320, 0.08, { at: 0.06, vol: 0.1 }); },           // 과일 꽂힘 (톡)
  wrong() { tone(180, 0.12, { type: 'sawtooth', vol: 0.09 }); tone(160, 0.12, { type: 'sawtooth', vol: 0.09, at: 0.14 }); }, // 오답 (부르르)
  coat() { [880, 1108, 1318, 1760].forEach((f, i) => tone(f, 0.22, { at: i * 0.07, vol: 0.09 })); },               // 설탕 코팅 (샤르르)
  bell() { tone(1568, 0.25, { type: 'triangle', vol: 0.14 }); tone(2093, 0.35, { type: 'triangle', vol: 0.12, at: 0.12 }); }, // 판매 (딸랑)
  jelly() { tone(784, 0.08, { slide: 1568, vol: 0.14 }); tone(1568, 0.14, { at: 0.08, vol: 0.1 }); },                // 젤리 획득
  clear() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, { type: 'triangle', at: i * 0.13, vol: 0.14 })); tone(1318, 0.6, { type: 'triangle', at: 0.55, vol: 0.14 }); }, // 스테이지 클리어
  pop() { tone(440, 0.05, { slide: 660, vol: 0.1 }); },
  swipe() { tone(300, 0.18, { slide: 900, vol: 0.08 }); },
  pick() { tone(880, 0.05, { type: 'triangle', slide: 1100, vol: 0.07 }); },                                            // 과일 집기 (톡)
  stamp() { tone(95, 0.16, { type: 'sine', slide: 60, vol: 0.32 }); tone(240, 0.05, { type: 'square', vol: 0.06 }); noiseBurst(0.08, 0.16); },   // 도장 (쿵)
  unlock() { [659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.16, { type: 'triangle', at: i * 0.06, vol: 0.1 })); tone(1568, 0.5, { at: 0.26, vol: 0.09 }); },   // 다음 가게 열림 (띠링)
};

/** 짧은 잡음 (도장 찍는 소리의 '탁'). iOS 웹은 진동을 지원하지 않아 소리로 대신한다 */
function noiseBurst(dur, vol) {
  const c = ac(); if (!c || !progress.settings.sound) return;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 900; src.buffer = buf; g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(c.destination); src.start();
}

/** 진동. 안드로이드: navigator.vibrate. 아이폰: 웹에 진동 API 가 없어서 iOS 18+ 가 <input type=checkbox switch> 를 켤 때 내는 햅틱을 빌린다
 *  (터치 이벤트 안에서 불러야 울린다. 진동 한 번 = 스위치 한 번 토글) */
let hapticSwitch = null;
function iosHaptic() {
  if (!hapticSwitch) {
    const lab = document.createElement('label');
    lab.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;overflow:hidden;pointer-events:none;z-index:-1';
    hapticSwitch = document.createElement('input'); hapticSwitch.type = 'checkbox'; hapticSwitch.setAttribute('switch', '');
    lab.append(hapticSwitch); document.body.append(lab);
  }
  hapticSwitch.click();
}
export function buzz(ms = 15) {
  try {
    if (navigator.vibrate) { navigator.vibrate(ms); return; }
    const strong = Array.isArray(ms) ? ms.length : (ms >= 30 ? 2 : 1);
    for (let i = 0; i < strong; i++) setTimeout(iosHaptic, i * 70);
  } catch (e) { /* 지원 안 함 */ }
}

// ---------- 배경 음악: 파일 없이 WebAudio 로 연주하는 8마디 루프 (잔잔하고 경쾌하게, 다장조 112 BPM) ----------
const BPM = 112, STEP = 60 / BPM / 2;   // 8분음표 하나의 길이 (초)
const NOTE = { A2: 110, C3: 130.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5 };
// 멜로디: 8마디 × 8분음표 8개. '-' 는 앞 음을 잇는다, '.' 는 쉼
const MELODY = ('E5 G5 A5 G5 E5 D5 C5 D5  E5 - G5 - A5 - C6 -  A5 G5 E5 G5 A5 G5 E5 D5  C5 D5 E5 - G5 - - -  ' +
  'E5 G5 A5 G5 E5 D5 C5 D5  E5 - D5 - C5 - A4 -  C5 D5 E5 G5 A5 G5 E5 D5  C5 - - - . . E5 G5').split(/\s+/);
const BASS = ['C3', 'A2', 'F3', 'G3', 'C3', 'A2', 'F3', 'G3'];                                   // 마디마다 근음
const CHORD = [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']];  // 마디마다 (4마디 반복)
let bgmOn = false, bgmTimer = null, bgmStep = 0, bgmNext = 0, bgmGain = null;

function voice(c, freq, t0, dur, type, vol, attack = 0.015, release = 0.12) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.setValueAtTime(vol, Math.max(t0 + attack, t0 + dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(bgmGain);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function scheduleStep(c, i, t0) {
  const bar = Math.floor(i / 8), beat = i % 8;
  const m = MELODY[i];
  if (m && m !== '-' && m !== '.') {                                                    // 멜로디 (부드러운 삼각파)
    let len = 1; while (MELODY[(i + len) % 64] === '-') len++;
    voice(c, NOTE[m], t0, STEP * len * 0.95, 'triangle', 0.09, 0.012, 0.1);
  }
  if (beat === 0 || beat === 4) voice(c, NOTE[BASS[bar]] * (beat ? 2 : 1), t0, STEP * 1.6, 'sine', 0.13, 0.01, 0.2);   // 베이스 (통통)
  if (beat === 0) for (const n of CHORD[bar % 4]) voice(c, NOTE[n], t0, STEP * 7.5, 'sine', 0.032, 0.35, 1.2);      // 은은한 코드
  if (beat % 2 === 1) {                                                                 // 가벼운 하이햇 (잡음)
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * 0.03), c.sampleRate), d = buf.getChannelData(0);
    for (let k = 0; k < d.length; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / d.length);
    const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 6000; src.buffer = buf; g.gain.value = beat === 3 || beat === 7 ? 0.05 : 0.03;
    src.connect(f); f.connect(g); g.connect(bgmGain); src.start(t0);
  }
}
function pump() {
  const c = ac(); if (!c || !bgmOn) return;
  while (bgmNext < c.currentTime + 0.35) {                                              // 0.35초 앞까지 미리 예약
    scheduleStep(c, bgmStep, bgmNext);
    bgmStep = (bgmStep + 1) % 64; bgmNext += STEP;
  }
}
export const bgm = {
  /** 첫 터치 뒤에 부른다 (iOS 는 터치 전에는 소리를 못 낸다). 소리 설정이 꺼져 있으면 아무것도 안 한다 */
  start() {
    const c = ac(); if (!c || !progress.settings.sound || bgmOn) return;
    if (!bgmGain) { bgmGain = c.createGain(); bgmGain.connect(c.destination); }
    bgmGain.gain.setValueAtTime(0.0001, c.currentTime); bgmGain.gain.exponentialRampToValueAtTime(0.55, c.currentTime + 1.2);   // 서서히 커진다
    bgmOn = true; bgmStep = 0; bgmNext = c.currentTime + 0.05;
    pump(); bgmTimer = setInterval(pump, 120);
  },
  stop() {
    if (!bgmOn) return;
    bgmOn = false; clearInterval(bgmTimer); bgmTimer = null;
    const c = ctx; if (c && bgmGain) { bgmGain.gain.cancelScheduledValues(c.currentTime); bgmGain.gain.setValueAtTime(bgmGain.gain.value, c.currentTime); bgmGain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4); }
  },
  get playing() { return bgmOn; },
};
// 앱이 뒤로 가면(홈 화면·다른 앱) 멈추고, 돌아오면 다시 (소리가 켜져 있을 때)
document.addEventListener('visibilitychange', () => { if (document.hidden) bgm.stop(); else if (progress.settings.sound && document.body.dataset.bgm === '1') bgm.start(); });

export function setSound(on) { progress.settings.sound = on; if (on) bgm.start(); else { bgm.stop(); if (window.speechSynthesis) speechSynthesis.cancel(); } }
