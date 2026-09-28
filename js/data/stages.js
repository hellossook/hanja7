// 스테이지·해금·스티커·손님 정의. 기획서 §5, §7
import { GRADE8, CHAPTER1 } from './hanja.js';

export const CUSTOMERS = {
  rabbit: '토끼', bear: '곰', cat: '고양이', dog: '강아지', boss: '사장님', owl: '판다',   // 'owl' 은 복습 손님의 내부 이름 (그림은 판다)
};

export const STAGES = [
  { id: '8', name: '가게 오픈 준비', short: '8급', chars: GRADE8.map(c => c.id), customer: 'boss',
    modes: { A: 5, B: 5, C: 3, D: 2 }, sticker: '00', learn: false, tutorial: true },
  { id: '1-1', name: '하늘과 땅', short: '1-1', chars: ['天', '地', '川', '江', '海'], customer: 'rabbit',
    modes: { A: 6, B: 5, C: 3, D: 1 }, sticker: '01-1', learn: true },
  { id: '1-2', name: '꽃과 풀', short: '1-2', chars: ['林', '花', '草', '植', '色'], customer: 'bear',
    modes: { A: 6, B: 5, C: 3, D: 1 }, sticker: '01-2', learn: true },
  { id: '1-3', name: '사계절', short: '1-3', chars: ['春', '夏', '秋', '冬', '夕'], customer: 'cat',
    modes: { A: 6, B: 5, C: 3, D: 1 }, sticker: '01-3', learn: true },
  { id: '1-4', name: '하늘의 기운', short: '1-4', chars: ['空', '氣', '電', '然', '自'], customer: 'dog',
    modes: { A: 6, B: 5, C: 3, D: 1 }, sticker: '01-4', learn: true },
  { id: '1-5', name: '종합', short: '1-5', chars: CHAPTER1.map(c => c.id), customer: 'boss',
    modes: { A: 4, B: 4, C: 3, D: 4 }, sticker: '01-5', learn: true, boss: true },   // 종합: 시작 전에 챕터 한자 20장을 모두 본다
];

/** 탕후루 시작 때 손님이 하는 주문 멘트 (탕후루 1·2·3번째 순서로 돌아가며) */
export const ORDER_LINES = {
  rabbit: ['깡총! 딸기 듬뿍 탕후루 하나 주세요!', '당근 맛은 없죠? 그럼 제일 달콤한 걸로!', '귀가 길어서 맛도 오래 남아요. 하나 더!'],
  bear: ['곰 손바닥만 한 탕후루 주세요!', '꿀보다 달콤하게 부탁해요~', '겨울잠 자기 전에 딱 하나만 더!'],
  cat: ['야옹~ 반짝반짝 탕후루 주세요!', '생선 맛은 없나요? 그럼 달콤한 걸로!', '수염에 설탕 묻어도 괜찮아요. 하나 더!'],
  dog: ['멍! 꼬리가 흔들리는 탕후루 주세요!', '주인님 몰래 먹을 거예요. 쉿!', '던져 주면 받아먹을게요. 하나 더!'],
  boss: ['사장님이 직접 주문! 제일 맛있는 걸로요.', '손님이 줄을 섰어요. 빨리빨리 부탁해요!', '이번엔 코팅을 반짝반짝 확실하게!'],
  owl: ['잊어버린 글자로 탕후루 하나 주세요!', '복습은 달콤하게, 냠냠!'],
};

/** 판매 장면에서 다른 손님들이 남기는 한마디 */
export const CHAT_LINES = {
  rabbit: ['와, 맛있겠다! 깡총!', '다음은 내 차례!', '딸기 많이 넣어 주세요~'],
  bear: ['꿀처럼 달콤해 보여요', '한 입만… 안 될까요?', '곰도 줄 섰어요!'],
  cat: ['반짝반짝 예쁘다냥', '다음은 내 차례야옹', '설탕 냄새가 솔솔~'],
  dog: ['멍! 꼬리가 멈추지 않아요', '초코 코팅 최고! 멍!', '저도 하나 주세요!'],
  boss: ['역시 우리 가게 최고!', '손님이 또 늘었네요', '코팅이 아주 반짝이는군요'],
  owl: ['글자도 달콤하게 냠냠', '복습 잘했어요, 최고!'],
};

/** 스플래시 팁 */
export const TIPS = ['과일 위 한자를 잘 보고 고르세요!', '틀려도 괜찮아요. 다시 골라보면 돼요!', '탕후루 5개를 팔면 별을 받아요', '손님이 벽에 스티커를 붙이고 가요', '스테이지를 깨면 새 과일이 열려요'];

/** 스테이지 → 그 스테이지를 깨면 붙일 수 있는 캐릭터 스티커 (assets/chars/stk/<번호>.png, 번호는 characters_watercolor_600 파일명).
 *  스테이지 하나에 캐릭터 하나 = 그 스테이지의 손님. 새 챕터를 만들면 여기에 한 줄씩 더한다 */
export const STAGE_CHARS = {
  '8': '05',     // 가게 오픈 준비: 사장님 (노란 멜빵 소녀)
  '1-1': '19',   // 하늘과 땅: 파란 토끼
  '1-2': '17',   // 꽃과 풀: 분홍 곰
  '1-3': '23',   // 사계절: 갈색 고양이
  '1-4': '16',   // 하늘의 기운: 갈색 강아지
  '1-5': '18',   // 종합: 판다
};

export const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]));
export const STAGE_ORDER = STAGES.map(s => s.id);

// ---------- 과일 · 코팅 · 해금 ----------
export const BASE_FRUITS = ['strawberry', 'tangerine', 'grape', 'apple', 'kiwi'];
/** 과일 그림은 assets/fruits/ (tools/build_fruits.py). 해금에 안 쓰인 것도 다음 챕터용으로 준비돼 있다 */
export const FRUIT_NAME = {
  strawberry: '딸기', tangerine: '귤', grape: '청포도', apple: '사과', kiwi: '키위',
  tomato: '방울토마토', blueberry: '블루베리', pineapple: '파인애플', rainbowjelly: '무지개 젤리',
  cherry: '체리', dragonfruit: '용과', banana: '바나나', mushroom: '초코버섯', avocado: '아보카도', melon: '멜론',
  passionfruit: '패션프루트', gummybear: '곰젤리', peach: '복숭아', watermelon: '수박',
};
export const COATINGS = {
  sugar: { name: '설탕', img: 'pot_sugar' },
  choco: { name: '초코', img: 'pot_choco' },
  rainbow: { name: '무지개 설탕', img: 'pot_rainbow' },
};
/** 첫 클리어 해금 (스테이지 id → 과일 또는 코팅) */
export const UNLOCKS = {
  '8': { type: 'fruit', id: 'tomato' },
  '1-1': { type: 'fruit', id: 'blueberry' },
  '1-2': { type: 'coat', id: 'choco' },
  '1-3': { type: 'fruit', id: 'pineapple' },
  '1-4': { type: 'coat', id: 'rainbow' },
  '1-5': { type: 'fruit', id: 'rainbowjelly' },
};
export function unlockName(u) { return u.type === 'fruit' ? FRUIT_NAME[u.id] : COATINGS[u.id].name; }
export function unlockImg(u) { return u.type === 'fruit' ? 'fruit_' + u.id : COATINGS[u.id].img; }

export const STICKERS = [
  { id: '00', name: '오픈 기념 리본', img: 'sticker_ribbon', from: '8급' },
  { id: '01-1', name: '하늘과 땅', img: 'sticker_sky', from: '1-1' },
  { id: '01-2', name: '꽃과 풀', img: 'sticker_flower', from: '1-2' },
  { id: '01-3', name: '사계절', img: 'sticker_seasons', from: '1-3' },
  { id: '01-4', name: '하늘의 기운', img: 'sticker_energy', from: '1-4' },
  { id: '01-5', name: '챕터 1 완주', img: 'sticker_badge', from: '1-5' },
];
export const STICKER_BY_ID = Object.fromEntries(STICKERS.map(s => [s.id, s]));

/** 별 계산: 15문제 중 첫 시도 정답 수 */
export function starsFor(firstTryCorrect) {
  if (firstTryCorrect >= 13) return 3;
  if (firstTryCorrect >= 10) return 2;
  return 1;
}

/** 탕후루 1개 젤리: 기본 10 + 첫 시도 정답 1개당 2 (최대 20) */
export function jellyFor(firstTryCorrect5) { return 10 + 2 * Math.min(5, firstTryCorrect5); }
export const REVIEW_BONUS = 15;
export const REVIEW_THRESHOLD = 3;   // box 0 글자가 이 수 이상이면 복습 손님 등장 (2026-09-29: 5 → 3)
export const WALL_MAX = 400;  // 스티커북에 붙일 수 있는 최대 (넘치면 가장 오래된 것부터 정리)
