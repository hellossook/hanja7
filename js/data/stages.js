// 스테이지·해금·스티커·손님 정의. 기획서 §5, §5.2 (챕터 2~5: 2026-10-09), §7
import { GRADE8, CHAPTER1, chapterChars } from './hanja.js';
import { CHAR_STICKERS } from './charStickers.js';

/** 손님 이름. 챕터 1 손님은 역할 이름(rabbit…, 그림 assets/chars/<역할>.png), 챕터 2~5 손님은 수채화 캐릭터 번호(assets/chars/w/<번호>.png) */
export const CUSTOMERS = {
  rabbit: '토끼', bear: '곰', cat: '고양이', dog: '강아지', boss: '사장님', owl: '판다',   // 'owl' 은 복습 손님의 내부 이름 (그림은 판다)
  ...Object.fromEntries(CHAR_STICKERS.map(c => [c.id, c.name])),
};

/** 챕터: 맵 그림과 조정 모드 장면. 노드 위치·카메라는 tuning.json 의 그 장면에 */
export const CHAPTERS = [
  { id: 1, name: '하늘과 땅, 사계절', map: 'bg_map_candy.jpg', scene: 'map' },
  { id: 2, name: '사람과 가족, 몸', map: 'bg_map_ch2.jpg', scene: 'map2' },
  { id: 3, name: '숫자, 방향, 시간', map: 'bg_map_ch3.jpg', scene: 'map3' },
  { id: 4, name: '배움과 말, 움직임', map: 'bg_map_ch4.jpg', scene: 'map4' },
  { id: 5, name: '마을과 생활', map: 'bg_map_ch5.jpg', scene: 'map5' },
];
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map(c => [c.id, c]));

const NEW = { A: 6, B: 5, C: 3, D: 1 }, ALL = { A: 4, B: 4, C: 3, D: 4 };
/** 새 글자 5자 스테이지 */
const st = (id, name, chars, customer) => ({ id, chapter: parseInt(id, 10), name, short: id, chars, customer, modes: NEW, learn: true });
/** 종합 (챕터 20자): 시작 전에 20장을 모두 본다 */
const fin = (id, customer) => ({ id, chapter: parseInt(id, 10), name: '종합', short: id, chars: chapterChars(parseInt(id, 10)).map(c => c.id), customer, modes: ALL, learn: true, boss: true });

export const STAGES = [
  { id: '8', chapter: 1, name: '가게 오픈 준비', short: '8급', chars: GRADE8.map(c => c.id), customer: 'boss',
    modes: { A: 5, B: 5, C: 3, D: 2 }, learn: false, tutorial: true },
  { id: '1-1', chapter: 1, name: '하늘과 땅', short: '1-1', chars: ['天', '地', '川', '江', '海'], customer: 'rabbit', modes: NEW, learn: true },
  { id: '1-2', chapter: 1, name: '꽃과 풀', short: '1-2', chars: ['林', '花', '草', '植', '色'], customer: 'bear', modes: NEW, learn: true },
  { id: '1-3', chapter: 1, name: '사계절', short: '1-3', chars: ['春', '夏', '秋', '冬', '夕'], customer: 'cat', modes: NEW, learn: true },
  { id: '1-4', chapter: 1, name: '하늘의 기운', short: '1-4', chars: ['空', '氣', '電', '然', '自'], customer: 'dog', modes: NEW, learn: true },
  { id: '1-5', chapter: 1, name: '종합', short: '1-5', chars: CHAPTER1.map(c => c.id), customer: '20', modes: ALL, learn: true, boss: true },   // 보라 토끼
  // 챕터 2 — 사람과 가족, 몸
  st('2-1', '우리 가족', ['家', '祖', '夫', '男', '子'], '01'),
  st('2-2', '이름과 사람', ['姓', '名', '字', '老', '少'], '02'),
  st('2-3', '몸', ['手', '足', '口', '面', '心'], '03'),
  st('2-4', '살아가기', ['主', '住', '命', '育', '孝'], '04'),
  fin('2-5', '06'),
  // 챕터 3 — 숫자, 방향, 시간
  st('3-1', '큰 수', ['百', '千', '數', '算', '重'], '08'),
  st('3-2', '위아래 왼쪽 오른쪽', ['上', '下', '左', '右', '方'], '10'),
  st('3-3', '앞뒤와 사이', ['前', '後', '內', '間', '平'], '11'),
  st('3-4', '시간', ['午', '時', '每', '正', '直'], '12'),
  fin('3-5', '13'),
  // 챕터 4 — 배움과 말, 움직임
  st('4-1', '글과 말', ['文', '語', '話', '問', '答'], '24'),
  st('4-2', '쓰고 부르기', ['記', '歌', '紙', '登', '有'], 'n01'),
  st('4-3', '드나들기', ['出', '入', '來', '動', '活'], 'n02'),
  st('4-4', '일하고 쉬기', ['休', '立', '事', '工', '所'], 'n03'),
  fin('4-5', 'n04'),
  // 챕터 5 — 마을과 생활
  st('5-1', '우리 마을', ['邑', '洞', '村', '里', '道'], 'n05'),
  st('5-2', '시장 나들이', ['市', '場', '車', '食', '物'], 'n06'),
  st('5-3', '농사와 깃발', ['農', '旗', '安', '全', '力'], 'n07'),
  st('5-4', '한자와 세상', ['不', '便', '漢', '同', '世'], 'n08'),
  fin('5-5', 'n09'),
];

/** 스테이지 → 그 스테이지를 깨면 붙일 수 있는 캐릭터 스티커 = 그 스테이지 손님 (챕터 1 손님은 역할 → 수채화 번호) */
const ROLE_CHAR = { boss: '05', rabbit: '19', bear: '17', cat: '23', dog: '16', owl: '18' };
export const STAGE_CHARS = Object.fromEntries(STAGES.map(s => [s.id, ROLE_CHAR[s.customer] || s.customer]));

/** 맵 라벨 "2. 하늘과 땅": 그 챕터 안에서의 순서 */
export function stageLabel(id) {
  const s = STAGE_BY_ID[id];
  const list = STAGES.filter(x => x.chapter === s.chapter);
  return `${list.indexOf(s) + 1}. ${s.name}`;
}
/** 그 챕터의 손님 번호·역할 목록 (판매 때 구경하는 다른 손님들) */
export function chapterCustomers(chapter) { return STAGES.filter(s => s.chapter === chapter).map(s => s.customer); }

/** 탕후루 시작 때 손님이 하는 주문 멘트 (탕후루 1·2·3번째 순서로 돌아가며) */
export const ORDER_LINES = {
  rabbit: ['깡총! 딸기 듬뿍 탕후루 하나 주세요!', '당근 맛은 없죠? 그럼 제일 달콤한 걸로!', '귀가 길어서 맛도 오래 남아요. 하나 더!'],
  bear: ['곰 손바닥만 한 탕후루 주세요!', '꿀보다 달콤하게 부탁해요~', '겨울잠 자기 전에 딱 하나만 더!'],
  cat: ['야옹~ 반짝반짝 탕후루 주세요!', '생선 맛은 없나요? 그럼 달콤한 걸로!', '수염에 설탕 묻어도 괜찮아요. 하나 더!'],
  dog: ['멍! 꼬리가 흔들리는 탕후루 주세요!', '주인님 몰래 먹을 거예요. 쉿!', '던져 주면 받아먹을게요. 하나 더!'],
  boss: ['사장님이 직접 주문! 제일 맛있는 걸로요.', '손님이 줄을 섰어요. 빨리빨리 부탁해요!', '이번엔 코팅을 반짝반짝 확실하게!'],
  owl: ['잊어버린 글자로 탕후루 하나 주세요!', '복습은 달콤하게, 냠냠!'],
  generic: ['새콤달콤 탕후루 하나 주세요!', '제일 반짝이는 걸로 부탁해요!', '맛있다고 소문 듣고 왔어요. 하나 더!'],   // 챕터 2~5 손님 (번호)
};

/** 판매 장면에서 다른 손님들이 남기는 한마디 */
export const CHAT_LINES = {
  rabbit: ['와, 맛있겠다! 깡총!', '다음은 내 차례!', '딸기 많이 넣어 주세요~'],
  bear: ['꿀처럼 달콤해 보여요', '한 입만… 안 될까요?', '곰도 줄 섰어요!'],
  cat: ['반짝반짝 예쁘다냥', '다음은 내 차례야옹', '설탕 냄새가 솔솔~'],
  dog: ['멍! 꼬리가 멈추지 않아요', '초코 코팅 최고! 멍!', '저도 하나 주세요!'],
  boss: ['역시 우리 가게 최고!', '손님이 또 늘었네요', '코팅이 아주 반짝이는군요'],
  owl: ['글자도 달콤하게 냠냠', '복습 잘했어요, 최고!'],
  generic: ['와, 맛있겠다!', '다음은 내 차례!', '반짝반짝 예쁘다', '저도 하나 주세요~', '설탕 냄새가 솔솔~'],
};

/** 스플래시 팁 */
export const TIPS = ['과일 위 한자를 잘 보고 고르세요!', '틀려도 괜찮아요. 다시 골라보면 돼요!', '탕후루 5개를 팔면 별을 받아요', '손님이 벽에 스티커를 붙이고 가요', '스테이지를 깨면 새 과일이 열려요'];

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
  durian: '두리안', mangosteen: '망고스틴', mango: '망고', sweetpotato: '군고구마', eyeball: '눈알 사탕', cookie: '강아지 쿠키', crystal: '보석 사탕', jackfruit: '잭프루트', lemon: '레몬', rambutan: '람부탄',   // 챕터 4~5 (2026-10-09)
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
  '2-1': { type: 'fruit', id: 'cherry' }, '2-2': { type: 'fruit', id: 'dragonfruit' }, '2-3': { type: 'fruit', id: 'banana' }, '2-4': { type: 'fruit', id: 'mushroom' }, '2-5': { type: 'fruit', id: 'avocado' },
  '3-1': { type: 'fruit', id: 'melon' }, '3-2': { type: 'fruit', id: 'passionfruit' }, '3-3': { type: 'fruit', id: 'gummybear' }, '3-4': { type: 'fruit', id: 'peach' }, '3-5': { type: 'fruit', id: 'watermelon' },
  '4-1': { type: 'fruit', id: 'durian' }, '4-2': { type: 'fruit', id: 'mangosteen' }, '4-3': { type: 'fruit', id: 'mango' }, '4-4': { type: 'fruit', id: 'sweetpotato' }, '4-5': { type: 'fruit', id: 'eyeball' },
  '5-1': { type: 'fruit', id: 'cookie' }, '5-2': { type: 'fruit', id: 'crystal' }, '5-3': { type: 'fruit', id: 'jackfruit' }, '5-4': { type: 'fruit', id: 'lemon' }, '5-5': { type: 'fruit', id: 'rambutan' },
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
