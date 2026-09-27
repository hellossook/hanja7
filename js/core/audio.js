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
};

export function setSound(on) { progress.settings.sound = on; }
