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
