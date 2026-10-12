// 상점에서 젤리로 사는 사장님 코스튬 (가격: 2026-10-12 기준 180~750) (그림: assets/chars/costume/<id>.png, 원본 assets/ui/_src/costumes/). 'default' 는 원래 옷
export const COSTUMES = [
  { id: 'default', name: '노란 멜빵', price: 0 },
  { id: 'c01', name: '파란 세일러복', price: 180 },
  { id: 'c02', name: '빨간 모자 숙녀', price: 240 },
  { id: 'c03', name: '보라 왕관 드레스', price: 300 },
  { id: 'c04', name: '리본 베레모', price: 360 },
  { id: 'c05', name: '무지개 무대 옷', price: 420 },
  { id: 'c06', name: '청록 넥타이 교복', price: 480 },
  { id: 'c07', name: '노란 재킷', price: 540 },
  { id: 'c08', name: '땡땡이 리본 스웨터', price: 600 },
  { id: 'c09', name: '검정 리본 멜빵', price: 660 },
  { id: 'c10', name: '분홍 체크 원피스', price: 750 },
];
export const COSTUME_BY_ID = Object.fromEntries(COSTUMES.map(c => [c.id, c]));
