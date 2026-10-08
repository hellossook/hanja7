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
  generic: ['새콤달콤 탕후루 하나 주세요!', '제일 반짝이는 걸로 부탁해요!', '맛있다고 소문 듣고 왔어요. 하나 더!'],   // 대사가 없는 손님용
  // 챕터 1~5 손님 (수채화 번호) — 2026-10-09
  '20': ['보라 토끼 왔어요! 포도 맛 있나요?', '귀가 보라색이면 포도도 잘 먹어요~', '종합 시험 전에 하나 더 먹을래요!'],
  '01': ['멜빵에 묻으면 안 돼요! 조심조심 하나 주세요', '엄마 아빠 거까지 세 개요!', '우리 가족 다 같이 먹을래요!'],
  '02': ['보라색 과일 많이 넣어 주세요!', '이름이 뭐예요? 저는 탕후루 좋아하는 아이예요', '제 이름 걸고 하나 더!'],
  '03': ['빨간 원피스엔 딸기가 잘 어울려요!', '손으로 들고 발로 콩콩 뛰며 먹을래요', '입이 작으니까 작은 알로요!'],
  '04': ['모자 벗고 인사할게요. 하나 주세요!', '집에 가져가서 엄마한테 효도할래요', '목숨처럼 소중히 먹을게요!'],
  '06': ['바구니에 담아 갈 거예요. 두 개요!', '가족 다 먹게 큰 걸로요!', '바구니가 꽉 차면 좋겠다~'],
  '08': ['백 개도 먹을 수 있을 것 같아요!', '천 번 생각해도 탕후루가 최고예요', '셈은 어려워도 탕후루는 쉬워요~'],
  '10': ['안경 닦고 자세히 볼게요. 위, 아래, 왼쪽, 오른쪽!', '오른손엔 탕후루, 왼손엔 책!', '어느 방향으로 먹어도 맛있어요!'],
  '11': ['앞에서 보면 예쁘고 뒤에서 봐도 예뻐요', '사이사이 과일이 꽉 찼으면 좋겠어요', '평평한 자리에 앉아서 먹을래요'],
  '12': ['정오에 먹는 탕후루가 제일 맛있어요!', '매일 오면 안 돼요? 하나 더!', '바르게 꽂아 주세요, 똑바로!'],
  '13': ['멍멍! 시간 맞춰 왔어요!', '꼬리가 시계처럼 흔들려요!', '정직한 맛으로 하나 더 멍!'],
  '24': ['야옹~ 글자처럼 예쁜 탕후루 주세요', '말보다 탕후루가 좋아요 야옹', '묻고 답하기 전에 한 입!'],
  'n01': ['학교 끝나고 왔어요! 하나 주세요', '일기에 쓸 거예요. 맛있다고!', '노래 부르면서 먹을래요~'],
  'n02': ['경찰관입니다! 탕후루 검사요!', '출입은 질서 있게~ 다음 손님은 저예요', '움직이는 과일은 없죠? 하나 더!'],
  'n03': ['불 끄고 왔어요. 시원한 탕후루 주세요!', '일하고 쉬는 시간엔 탕후루죠', '씩씩하게 서서 먹을게요!'],
  'n04': ['카피바라는 느긋하게 하나 주세요~', '천천히… 천천히… 하나 더…', '온천 들어가기 전에 먹을래요'],
  'n05': ['우주에서 왔어요! 지구 탕후루 주세요', '달에서도 먹을 수 있게 하나 더!', '별처럼 반짝이는 걸로요!'],
  'n06': ['호박 머리에 과일 머리, 친구예요!', '시장에서 제일 맛있는 집이래요', '주황색 과일 많이요!'],
  'n07': ['쿼카는 항상 웃어요. 탕후루 주세요!', '농장에서 일하고 왔어요, 하나!', '깃발처럼 높이 들고 먹을래요'],
  'n08': ['도토리 대신 탕후루요!', '볼에 넣어 갈 거예요. 두 개요!', '세상에서 제일 달콤한 걸로!'],
  'n09': ['어머, 예쁘기도 해라. 하나 주세요', '우리 아이들 거까지 세 개요', '7급 다 끝나면 또 올게요!'],
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
  '20': ['보라색이 제일 예뻐요', '다음은 내 차례! 깡총', '포도 맛 남았나요?'],
  '01': ['멜빵 고리에 걸어 갈래요', '우리 가족도 좋아할 거예요', '와, 반짝반짝!'],
  '02': ['내 이름 불러 주세요, 다음 손님!', '보라색 과일 남겨 줘요', '맛있겠다!'],
  '03': ['원피스에 안 묻게 조심!', '발 동동, 빨리 내 차례!', '딸기 많이 넣어 주세요'],
  '04': ['모자 안에 숨겨 갈까?', '엄마 거도 사야지', '다음은 저예요!'],
  '06': ['바구니 비었어요, 채워 주세요', '가족 수만큼 사 갈래요', '달콤한 냄새~'],
  '08': ['백 개 주문할까?', '천 개는 너무 많겠지?', '셈은 끝났어요, 내 차례!'],
  '10': ['안경 너머로 봐도 맛있어 보여요', '왼쪽 거 주세요, 아니 오른쪽!', '위에 있는 과일이 제일 커요'],
  '11': ['앞 사람 빨리 먹어요~', '사이에 끼어도 될까요?', '뒤에서 기다릴게요'],
  '12': ['시계 봤어요? 간식 시간이에요', '매일 와도 안 질려요', '똑바로 줄 서 있을게요'],
  '13': ['멍! 꼬리가 멈추지 않아요', '시간이 늦어요, 빨리 멍!', '저도 하나 주세요 멍!'],
  '24': ['야옹, 다음은 나야옹', '말만 해도 침이 고여요', '하얀 털에 묻으면 안 돼요'],
  'n01': ['숙제 끝나고 먹을래요', '일기에 쓸 맛이에요', '노래가 절로 나와요~'],
  'n02': ['줄 똑바로 서세요! 저도요', '출입 질서! 다음은 저예요', '검사해 볼게요, 한 입만'],
  'n03': ['불처럼 빨간 딸기 주세요', '쉬는 시간엔 이게 최고죠', '씩씩하게 기다릴게요'],
  'n04': ['느긋하게 기다릴게요~', '천천히 주셔도 돼요…', '온천보다 달콤해 보여요'],
  'n05': ['우주에도 이런 건 없어요', '별보다 반짝여요', '달까지 가져가고 싶다'],
  'n06': ['호박도 꽂아 줄 수 있나요?', '시장 구경하다 왔어요', '주황색 거 남겨 줘요'],
  'n07': ['웃음이 멈추지 않아요', '농장 친구들도 데려올게요', '깃발처럼 흔들 거예요'],
  'n08': ['도토리보다 맛있겠다', '볼에 넣어 두고 싶어요', '세상에서 제일 달콤해'],
  'n09': ['어머, 줄이 기네요', '우리 아이들이 좋아하겠어요', '참 예쁘게도 만드네요'],
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
