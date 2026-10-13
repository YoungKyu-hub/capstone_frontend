// ===== 퓨처스리그(2군) 임시 데이터 =====
// 백엔드(크롤링 → Firestore) 연결 전까지 쓰는 값.
// 2026 리그 구성은 실제 기준 (북부 6팀 / 남부 6팀).
// 순위표 1~2위 성적은 2026 시즌 최종 실제 기록, 나머지 팀 성적은 임시값.

export const FUTURES_DIVISIONS = {
    north: { label: "북부리그", teams: ["상무", "한화", "LG", "SSG", "두산", "고양"] },
    south: { label: "남부리그", teams: ["울산", "롯데", "NC", "KT", "KIA", "삼성"] },
};

// 퓨처스리그 전체 팀 (상대전적 비교 등에 사용)
export const FUTURES_TEAMS = [
    ...FUTURES_DIVISIONS.north.teams,
    ...FUTURES_DIVISIONS.south.teams,
];

// 순위표 (RankingScreen 과 같은 형식)
export const FUTURES_RANKING = {
    2026: {
        north: [
            { id: "n1", team: "상무", game: 96, win: 62, lose: 34, draw: 0 },
            { id: "n2", team: "한화", game: 101, win: 55, lose: 46, draw: 0 },
            { id: "n3", team: "LG", game: 98, win: 50, lose: 46, draw: 2 }, // 임시값
            { id: "n4", team: "SSG", game: 97, win: 46, lose: 49, draw: 2 }, // 임시값
            { id: "n5", team: "두산", game: 98, win: 43, lose: 53, draw: 2 }, // 임시값
            { id: "n6", team: "고양", game: 96, win: 35, lose: 59, draw: 2 }, // 임시값
        ],
        south: [
            { id: "s1", team: "울산", game: 96, win: 58, lose: 37, draw: 1 },
            { id: "s2", team: "롯데", game: 94, win: 54, lose: 39, draw: 1 },
            { id: "s3", team: "NC", game: 95, win: 48, lose: 45, draw: 2 }, // 임시값
            { id: "s4", team: "KT", game: 96, win: 45, lose: 49, draw: 2 }, // 임시값
            { id: "s5", team: "KIA", game: 95, win: 42, lose: 51, draw: 2 }, // 임시값
            { id: "s6", team: "삼성", game: 96, win: 40, lose: 54, draw: 2 }, // 임시값
        ],
    },
};

// 퓨처스 팀 → 2군 홈구장 (※ 임시값, 2026 시즌 실제 구장 확인 필요)
export const FUTURES_STADIUMS = {
    상무: "문경 상무야구장",
    한화: "서산 한화이글스 2군 구장",
    LG: "이천 LG챔피언스파크",
    SSG: "강화 SSG퓨처스필드",
    두산: "이천 베어스파크",
    고양: "고양 국가대표 야구훈련장",
    울산: "울산 문수야구장",
    롯데: "김해 상동야구장",
    NC: "마산야구장",
    KT: "익산 야구장",
    KIA: "함평 기아챌린저스필드",
    삼성: "경산 볼파크",
};

// 승부예측 화면용 퓨처스 경기 (날짜 형식은 PredictScreen 과 같음, id 는 KBO 경기와 겹치지 않게 "f")
export const FUTURES_PREDICT_GAMES = {
    "4/13": [
        { id: "f1", home: "상무", away: "두산", time: "13:00" },
        { id: "f2", home: "울산", away: "NC", time: "13:00" },
    ],
    "4/14": [
        { id: "f3", home: "한화", away: "LG", time: "13:00" },
        { id: "f4", home: "KIA", away: "롯데", time: "13:00" },
    ],
    "4/15": [
        { id: "f5", home: "SSG", away: "고양", time: "13:00" },
        { id: "f6", home: "삼성", away: "KT", time: "13:00" },
    ],
    "4/16": [
        { id: "f7", home: "상무", away: "한화", time: "13:00" },
        { id: "f8", home: "울산", away: "KIA", time: "13:00" },
    ],
};

// 일정 화면용 퓨처스 경기 (날짜 형식은 ScheduleScreen 과 같음)
export const FUTURES_SCHEDULE = {
    "2026-06-03": [
        { home: "LG", away: "두산", time: "13:00" },
        { home: "상무", away: "SSG", time: "13:00" },
        { home: "울산", away: "롯데", time: "13:00" },
    ],
    "2026-06-05": [
        { home: "한화", away: "고양", time: "13:00" },
        { home: "KT", away: "NC", time: "13:00" },
    ],
    "2026-06-10": [
        { home: "KIA", away: "삼성", time: "13:00" },
    ],
};
