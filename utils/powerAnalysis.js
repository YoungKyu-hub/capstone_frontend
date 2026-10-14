// ===== 전력 분석 알고리즘 =====
// 가중치 기반 분석 + ELO Rating 을 합쳐 전력 점수와 예상 승률을 계산한다.
// 지금은 data/predictMock.js 의 임시 데이터로 계산하고,
// 백엔드(크롤링 → Firestore)가 생기면 같은 모양의 데이터만 넣어 주면 된다.

// 가중치 (합계 1.0) — 발표 자료의 4개 항목
export const WEIGHTS = {
    recent: 0.3, // 최근 10경기 성적
    season: 0.3, // 시즌 승률
    h2h: 0.2, // 상대전적
    venue: 0.2, // 홈/원정 성적 (홈팀은 홈 성적, 원정팀은 원정 성적)
};

// 두 알고리즘을 섞는 비율
const BLEND = { weighted: 0.5, elo: 0.5 };

// 홈 어드밴티지 (ELO 점수로 더해 줌)
const HOME_ADVANTAGE = 20;

// 승/패 → 승률 (무승부 제외, 경기가 없으면 0.5)
export const winRate = ({ w, l }) => (w + l === 0 ? 0.5 : w / (w + l));

// ELO 예상 승률: A가 B를 이길 확률
export const eloExpected = (ratingA, ratingB) =>
    1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

// 경기 결과로 ELO 갱신 (백엔드 importer/elo.py 가 같은 식으로 계산해서 rankings/elo 에 올림)
// result: 1 = A 승, 0.5 = 무승부, 0 = A 패
export const updateElo = (ratingA, ratingB, result, k = 20) => {
    const expA = eloExpected(ratingA, ratingB);
    const change = k * (result - expA);
    return [Math.round(ratingA + change), Math.round(ratingB - change)];
};

// 상대전적 찾기
//  - Firestore h2h/kbo 의 table 모양: { LG: { KIA: {w, l, d} } }
//  - 임시 데이터 모양: "LG-KIA" 또는 "KIA-LG" 어느 쪽으로 저장돼 있어도 찾음
export const getH2H = (h2hTable, teamA, teamB) => {
    const nested = h2hTable?.[teamA]?.[teamB];
    if (nested && typeof nested === "object") return nested;
    if (h2hTable[`${teamA}-${teamB}`]) return h2hTable[`${teamA}-${teamB}`];
    const rev = h2hTable[`${teamB}-${teamA}`];
    if (rev) return { w: rev.l, l: rev.w };
    return { w: 0, l: 0 };
};

/**
 * 한 경기의 전력 분석
 * @returns { home, away, homeWinProb, awayWinProb, rows }
 */
export function analyzeMatch(homeTeam, awayTeam, teamStats, h2hTable) {
    const hs = teamStats[homeTeam];
    const as = teamStats[awayTeam];
    if (!hs || !as) return null;

    const homeH2H = getH2H(h2hTable, homeTeam, awayTeam);
    const awayH2H = { w: homeH2H.l, l: homeH2H.w };

    // 항목별 0~1 값
    const homeVals = {
        recent: winRate(hs.recent10),
        season: winRate(hs.season),
        h2h: winRate(homeH2H),
        venue: winRate(hs.home),
    };
    const awayVals = {
        recent: winRate(as.recent10),
        season: winRate(as.season),
        h2h: winRate(awayH2H),
        venue: winRate(as.away),
    };

    // 1) 가중치 기반 전력 점수 (0~100)
    const score = (vals) =>
        Object.keys(WEIGHTS).reduce((sum, key) => sum + WEIGHTS[key] * vals[key], 0) * 100;
    const homeScore = score(homeVals);
    const awayScore = score(awayVals);
    const weightedProb = homeScore / (homeScore + awayScore);

    // 2) ELO 예상 승률 (홈팀에 홈 어드밴티지)
    const eloProb = eloExpected(hs.elo + HOME_ADVANTAGE, as.elo);

    // 3) 두 결과 합치기
    const homeWinProb = BLEND.weighted * weightedProb + BLEND.elo * eloProb;

    const record = ({ w, l, d }) => `${w}승 ${l}패${d ? ` ${d}무` : ""}`;
    const pct = (v) => v.toFixed(3).replace(/^0/, "");

    // 팝업 비교표에 쓸 줄들
    const rows = [
        {
            label: "최근 10경기",
            weight: WEIGHTS.recent,
            home: record(hs.recent10),
            away: record(as.recent10),
            better: compare(homeVals.recent, awayVals.recent),
        },
        {
            label: "시즌 승률",
            weight: WEIGHTS.season,
            home: pct(homeVals.season),
            away: pct(awayVals.season),
            better: compare(homeVals.season, awayVals.season),
        },
        {
            label: "상대전적",
            weight: WEIGHTS.h2h,
            home: record(homeH2H),
            away: record(awayH2H),
            better: compare(homeVals.h2h, awayVals.h2h),
        },
        {
            label: "홈/원정 성적",
            weight: WEIGHTS.venue,
            home: `홈 ${pct(homeVals.venue)}`,
            away: `원정 ${pct(awayVals.venue)}`,
            better: compare(homeVals.venue, awayVals.venue),
        },
        {
            label: "ELO",
            weight: null,
            home: String(hs.elo),
            away: String(as.elo),
            better: compare(hs.elo, as.elo),
        },
    ];

    return {
        home: { team: homeTeam, score: Math.round(homeScore) },
        away: { team: awayTeam, score: Math.round(awayScore) },
        homeWinProb: Math.round(homeWinProb * 100),
        awayWinProb: 100 - Math.round(homeWinProb * 100),
        rows,
    };
}

// 어느 쪽이 더 좋은지: "home" | "away" | null(같음)
function compare(a, b) {
    if (a > b) return "home";
    if (b > a) return "away";
    return null;
}

// ===== Firestore 데이터 → analyzeMatch 에 넣을 팀 기록 =====
// "45-2-24" (홈/방문: 승-무-패) → { w, l, d }
const parseWDL = (text) => {
    const [w, d, l] = String(text || "0-0-0").split("-").map(Number);
    return { w: w || 0, l: l || 0, d: d || 0 };
};
// "9승1무0패" → { w, l, d }
const parseRecent = (text) => {
    const m = String(text || "").match(/(\d+)승(\d+)무(\d+)패/);
    return m ? { w: +m[1], d: +m[2], l: +m[3] } : { w: 0, l: 0, d: 0 };
};

/**
 * rankings/kbo 의 rows + rankings/elo 의 teams → { 팀: { elo, rank, season, recent10, home, away } }
 * ELO 가 아직 없으면 1500 으로 둔다.
 */
export function buildTeamStats(rankRows = [], eloTeams = {}) {
    const stats = {};
    rankRows.forEach((r) => {
        stats[r.team] = {
            rank: r.rank,
            elo: eloTeams[r.team]?.elo ?? 1500,
            season: { w: r.win, l: r.lose, d: r.draw },
            recent10: parseRecent(r.last10),
            home: parseWDL(r.home),
            away: parseWDL(r.away),
            streak: r.streak,
        };
    });
    return stats;
}
