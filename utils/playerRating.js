// ===== 선수 평점 & MOM 선정 =====
// 득점 가치(Linear Weights) 방식: 기록 하나하나가 팀 득점을 얼마나
// 늘리거나 줄였는지(기여점)를 더하고, 6.0 기준 1.0~10.0 평점으로 바꾼다.

const BASE = 6.0; // 평범한 경기의 기본 점수
const MIN = 1.0;
const MAX = 10.0;

// 타자 가중치 (기여점 × 1.2)
export const BATTER_WEIGHTS = {
    single: 0.5, // 단타
    double: 0.8, // 2루타
    triple: 1.1, // 3루타
    hr: 1.4, // 홈런
    bb: 0.3, // 볼넷·사구
    out: -0.25, // 아웃(타수 - 안타)
    so: -0.05, // 삼진 (아웃에 추가)
    gidp: -0.4, // 병살타
    rbi: 0.15, // 타점
    run: 0.15, // 득점
    gwrbi: 0.3, // 결승타
    sb: 0.2, // 도루
    cs: -0.4, // 도루 실패
    error: -0.4, // 실책
};
const BATTER_SCALE = 1.2;

// 투수 가중치 (기여점 × 1.0)
export const PITCHER_WEIGHTS = {
    out: 0.17, // 아웃 1개(1/3이닝) — 리그 평균 이닝당 약 0.5실점 기준
    er: -1.0, // 자책점
    uer: -0.5, // 비자책 실점
    so: 0.1, // 탈삼진
    bb: -0.3, // 볼넷·사구
    hr: -0.4, // 피홈런
    W: 0.3, // 승
    S: 0.4, // 세이브
    H: 0.2, // 홀드
    BS: -0.5, // 블론세이브
};
const PITCHER_SCALE = 1.0;

// MOM 선정 규칙
const WINNER_BONUS = 0.5; // MOM 점수에만 더함 (평점 자체는 그대로)
const MIN_PA = 3; // 타자 최소 타석
const MIN_OUTS = 9; // 투수 최소 아웃(3이닝)

const clamp = (v) => Math.min(MAX, Math.max(MIN, v));
const round1 = (v) => Math.round(v * 10) / 10;

/**
 * 타자 기여점
 * b: { ab, h, d, t, hr, rbi, r, bb, so, gidp, sb, cs, e, gwrbi }
 *    h = 전체 안타 수, d/t/hr = 그중 2루타/3루타/홈런
 */
export function batterContribution(b) {
    const w = BATTER_WEIGHTS;
    const single = b.h - (b.d || 0) - (b.t || 0) - (b.hr || 0);
    return (
        w.single * single +
        w.double * (b.d || 0) +
        w.triple * (b.t || 0) +
        w.hr * (b.hr || 0) +
        w.bb * (b.bb || 0) +
        w.out * (b.ab - b.h) +
        w.so * (b.so || 0) +
        w.gidp * (b.gidp || 0) +
        w.rbi * (b.rbi || 0) +
        w.run * (b.r || 0) +
        (b.gwrbi ? w.gwrbi : 0) +
        w.sb * (b.sb || 0) +
        w.cs * (b.cs || 0) +
        w.error * (b.e || 0)
    );
}

/**
 * 투수 기여점
 * p: { outs, er, r, so, bb, hr, decision }  decision: "W" | "L" | "S" | "H" | "BS" | null
 */
export function pitcherContribution(p) {
    const w = PITCHER_WEIGHTS;
    const uer = Math.max(0, (p.r || 0) - (p.er || 0));
    return (
        w.out * p.outs +
        w.er * (p.er || 0) +
        w.uer * uer +
        w.so * (p.so || 0) +
        w.bb * (p.bb || 0) +
        w.hr * (p.hr || 0) +
        (w[p.decision] || 0)
    );
}

export const batterRating = (b) => round1(clamp(BASE + BATTER_SCALE * batterContribution(b)));
export const pitcherRating = (p) => round1(clamp(BASE + PITCHER_SCALE * pitcherContribution(p)));

// ===== 기록 한 줄 요약 (MOM 띠에 표시) =====
export function inningsText(outs) {
    const full = Math.floor(outs / 3);
    const rest = outs % 3;
    return rest ? `${full} ${rest}/3이닝` : `${full}이닝`;
}

export function batterLine(b) {
    const parts = [`${b.ab}타수 ${b.h}안타`];
    if (b.hr) parts.push(`${b.hr}홈런`);
    if (b.rbi) parts.push(`${b.rbi}타점`);
    if (b.sb) parts.push(`${b.sb}도루`);
    return parts.join(" ");
}

export function pitcherLine(p) {
    const parts = [inningsText(p.outs), `${p.er}자책`];
    if (p.so) parts.push(`${p.so}탈삼진`);
    const label = { W: "승", S: "세이브", H: "홀드" }[p.decision];
    if (label) parts.push(label);
    return parts.join(" ");
}

/**
 * 경기 전체 평점 계산 + MOM 선정
 * game: { home, away, score: { home, away }, box: { home: { batters, pitchers }, away: {...} } }
 * @returns { players: [...평점 높은 순], mom, winner }
 */
export function rateGame(game) {
    const { home, away, score, box } = game;
    const winner =
        score.home > score.away ? home : score.away > score.home ? away : null; // null = 무승부

    const players = [];
    [
        { side: "home", team: home },
        { side: "away", team: away },
    ].forEach(({ side, team }) => {
        const teamBox = box[side];
        (teamBox.batters || []).forEach((b) => {
            const pa = b.ab + (b.bb || 0);
            players.push({
                name: b.name,
                pos: b.pos,
                team,
                type: "batter",
                contribution: batterContribution(b),
                rating: batterRating(b),
                line: batterLine(b),
                eligible: pa >= MIN_PA,
            });
        });
        (teamBox.pitchers || []).forEach((p) => {
            players.push({
                name: p.name,
                pos: "투수",
                team,
                type: "pitcher",
                contribution: pitcherContribution(p),
                rating: pitcherRating(p),
                line: pitcherLine(p),
                eligible: p.outs >= MIN_OUTS || p.decision === "S" || p.decision === "H",
            });
        });
    });

    // MOM 점수 = 평점 + 승리 팀 가산점
    const momScore = (pl) => pl.rating + (pl.team === winner ? WINNER_BONUS : 0);

    const candidates = players
        .filter((pl) => pl.eligible)
        .sort(
            (a, b) =>
                momScore(b) - momScore(a) ||
                (b.team === winner) - (a.team === winner) || // 동점: 승리 팀 우선
                b.contribution - a.contribution // 그래도 같으면 기여점
        );

    const top = candidates[0] || null;
    const mom = top
        ? { ...top, fromLosingTeam: winner !== null && top.team !== winner }
        : null;

    players.sort((a, b) => b.rating - a.rating);
    return { players, mom, winner };
}
