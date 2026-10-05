// ===== 경기 결과 임시 데이터 =====
// 백엔드가 경기 종료 후 크롤링한 박스스코어를 Firestore에 저장하면 같은 모양으로 읽어 오면 된다.
// 선수 이름은 임시값(실제 선수 아님).

// 키: "날짜-경기id"  → 이 키가 있으면 "경기 종료"로 표시
// 타자: ab 타수, h 안타(전체), d 2루타, t 3루타, hr 홈런, rbi 타점, r 득점,
//       bb 볼넷+사구, so 삼진, gidp 병살타, sb 도루, cs 도루실패, e 실책, gwrbi 결승타
// 투수: outs 잡은 아웃 수(1이닝 = 3), er 자책점, r 실점, so 탈삼진, bb 볼넷+사구, hr 피홈런,
//       decision "W" 승 / "L" 패 / "S" 세이브 / "H" 홀드 / "BS" 블론세이브
export const GAME_RESULTS = {
    "4/13-1": {
        score: { home: 5, away: 3 }, // KIA 5 : 3 LG
        box: {
            home: {
                batters: [
                    { name: "김선수", pos: "유격수", ab: 4, h: 3, d: 1, hr: 1, rbi: 3, r: 1, so: 0, gwrbi: true },
                    { name: "이선수", pos: "중견수", ab: 4, h: 1, r: 1, so: 1, sb: 1 },
                    { name: "박선수", pos: "1루수", ab: 4, h: 0, so: 2 },
                    { name: "정선수", pos: "포수", ab: 3, h: 1, bb: 1, rbi: 1, r: 1 },
                ],
                pitchers: [
                    { name: "최선수", outs: 21, er: 2, r: 3, so: 7, bb: 2, hr: 1, decision: "W" },
                    { name: "한선수", outs: 6, er: 0, r: 0, so: 2, bb: 0, hr: 0, decision: "S" },
                ],
            },
            away: {
                batters: [
                    { name: "강선수", pos: "2루수", ab: 4, h: 2, rbi: 1, r: 1, so: 1 },
                    { name: "조선수", pos: "좌익수", ab: 3, h: 1, hr: 1, bb: 1, rbi: 2, r: 1 },
                    { name: "윤선수", pos: "포수", ab: 4, h: 0, so: 1, gidp: 1 },
                    { name: "서선수", pos: "3루수", ab: 4, h: 1, e: 1 },
                ],
                pitchers: [
                    { name: "장선수", outs: 17, er: 4, r: 5, so: 4, bb: 3, hr: 1, decision: "L" },
                    { name: "임선수", outs: 7, er: 0, r: 0, so: 2, bb: 1, hr: 0 },
                ],
            },
        },
    },

    // 패배 팀에서 MOM이 나오는 예시
    "4/13-2": {
        score: { home: 2, away: 4 }, // 두산 2 : 4 롯데
        box: {
            home: {
                batters: [
                    { name: "오선수", pos: "우익수", ab: 4, h: 2, hr: 2, rbi: 2, r: 2 },
                    { name: "신선수", pos: "유격수", ab: 4, h: 1, so: 1 },
                    { name: "권선수", pos: "1루수", ab: 3, h: 0, bb: 1, so: 2 },
                ],
                pitchers: [
                    { name: "황선수", outs: 18, er: 3, r: 4, so: 5, bb: 3, hr: 1, decision: "L" },
                    { name: "안선수", outs: 9, er: 0, r: 0, so: 3, bb: 1, hr: 0 },
                ],
            },
            away: {
                batters: [
                    { name: "송선수", pos: "2루수", ab: 4, h: 2, d: 1, rbi: 2, r: 1, gwrbi: true },
                    { name: "유선수", pos: "중견수", ab: 4, h: 1, r: 1, sb: 1 },
                    { name: "홍선수", pos: "지명타자", ab: 4, h: 1, rbi: 1, so: 2 },
                ],
                pitchers: [
                    { name: "전선수", outs: 18, er: 2, r: 2, so: 5, bb: 2, hr: 2, decision: "W" },
                    { name: "문선수", outs: 3, er: 0, r: 0, so: 1, bb: 0, hr: 0, decision: "H" },
                    { name: "배선수", outs: 6, er: 0, r: 0, so: 2, bb: 1, hr: 0, decision: "S" },
                ],
            },
        },
    },
};

// 내가 해 둔 예측 (나중에 Firestore 사용자 예측 기록에서 읽어 오기)
// 값: 홈팀 이름 / 원정팀 이름 / "draw"
export const MY_PREDICTIONS = {
    "4/13-1": "KIA", // 적중 예시
    "4/13-2": "두산", // 실패 예시
};
