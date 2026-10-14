import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KboTitle from "../components/KboTitle";
import TeamLogo from "../components/TeamLogo";
import LeagueToggle from "../components/LeagueToggle";
import { useLeague } from "../context/LeagueContext";
import { FUTURES_TEAMS } from "../data/futuresMock";
import { useTeamData, useSeasonSchedules, findMatchups, formatUpdated } from "../utils/firestoreData";
import { analyzeMatch, getH2H, winRate } from "../utils/powerAnalysis";

const SEASON = 2026;

// ===== 디자인 색상 (RankingScreen과 동일) =====
const COLORS = {
    bg: "#181829",
    card: "#222232",
    chip: "#2C2C3E",
    text: "#FFFFFF",
    subText: "#C4C4C4",
    divider: "#2C2C3E",
    accent: "#E8826B",
    rowDirect: "#1E2A4A",
};

const KBO_TEAMS = ["LG", "두산", "SSG", "롯데", "삼성", "KIA", "NC", "한화", "키움", "KT"];

// 퓨처스는 아직 실제 데이터가 없어서 고정값
const FUTURES_ROWS = [
    { label: "상대전적", left: "12승", right: "8승" },
    { label: "최근 10경기", left: "6승4패", right: "4승6패" },
    { label: "승률", left: "0.610", right: "0.390" },
];

const record = ({ w, l, d }) => `${w}승 ${l}패${d ? ` ${d}무` : ""}`;
const pct = (v) => v.toFixed(3).replace(/^0/, "");
// 숫자가 큰 쪽(또는 작은 쪽)을 강조: "left" | "right" | null
const better = (a, b, lowerIsBetter = false) => {
    if (a === b) return null;
    return (a > b) !== lowerIsBetter ? "left" : "right";
};

/** KBO 실제 데이터로 비교 표 만들기 */
function buildRows(team1, team2, teamStats, h2h) {
    const a = teamStats[team1];
    const b = teamStats[team2];
    if (!a || !b) return [];
    const vs = getH2H(h2h || {}, team1, team2);
    const vsRev = { w: vs.l, l: vs.w, d: vs.d || 0 };
    return [
        { label: "상대전적", left: record(vs), right: record(vsRev), better: better(vs.w, vs.l) },
        { label: "순위", left: `${a.rank}위`, right: `${b.rank}위`, better: better(a.rank, b.rank, true) },
        {
            label: "시즌 승률",
            left: pct(winRate(a.season)),
            right: pct(winRate(b.season)),
            better: better(winRate(a.season), winRate(b.season)),
        },
        {
            label: "최근 10경기",
            left: record(a.recent10),
            right: record(b.recent10),
            better: better(winRate(a.recent10), winRate(b.recent10)),
        },
        {
            label: "홈 승률",
            left: pct(winRate(a.home)),
            right: pct(winRate(b.home)),
            better: better(winRate(a.home), winRate(b.home)),
        },
        {
            label: "원정 승률",
            left: pct(winRate(a.away)),
            right: pct(winRate(b.away)),
            better: better(winRate(a.away), winRate(b.away)),
        },
        { label: "ELO", left: String(a.elo), right: String(b.elo), better: better(a.elo, b.elo) },
    ];
}

// "2026-06-04" → "2026.06.04"
const dotDate = (iso) => iso.replace(/-/g, ".");

// 팀 선택 칩 목록
function TeamPicker({ label, teams, selected, onSelect }) {
    return (
        <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>{label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {teams.map((t) => {
                    const active = selected === t;
                    return (
                        <TouchableOpacity
                            key={t}
                            onPress={() => onSelect(t)}
                            style={[styles.chip, active && styles.chipActive]}
                        >
                            <TeamLogo team={t} size={20} style={styles.teamDot} />
                            <Text style={styles.chipText}>{t}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// 큰 팀 엠블럼 자리 (팀 색 원 + 팀 이름)
function TeamBadge({ team }) {
    return (
        <View style={styles.badge}>
            <View style={styles.badgeCircle}>
                <TeamLogo team={team} size={52} />
            </View>
            <Text style={styles.badgeName}>{team}</Text>
        </View>
    );
}

export default function HeadToHeadScreen({ navigation }) {
    const [team1, setTeam1] = useState("LG");
    const [team2, setTeam2] = useState("두산");
    const [show, setShow] = useState(false);
    const { league, isFutures } = useLeague();
    const teams = isFutures ? FUTURES_TEAMS : KBO_TEAMS;

    // 리그가 바뀌면 그 리그 팀으로 다시 선택
    useEffect(() => {
        setTeam1(teams[0]);
        setTeam2(teams[1]);
        setShow(false);
    }, [league]);

    // KBO: Firestore 순위표 + ELO + 팀간 승패표, 최근 맞대결은 시즌 일정에서
    const { teamStats, h2h, elo, updatedAt, loading, error, reload } = useTeamData(!isFutures);
    const season = useSeasonSchedules(SEASON, !isFutures && show);

    const rows = useMemo(() => {
        if (isFutures) return FUTURES_ROWS;
        return teamStats ? buildRows(team1, team2, teamStats, h2h) : [];
    }, [isFutures, team1, team2, teamStats, h2h]);

    // 두 팀만 비교했을 때 예상 승률 (team1 을 홈으로 보지 않도록 홈 어드밴티지 없이 양쪽 평균)
    const winProb = useMemo(() => {
        if (isFutures || !teamStats) return null;
        const asHome = analyzeMatch(team1, team2, teamStats, h2h || {});
        const asAway = analyzeMatch(team2, team1, teamStats, h2h || {});
        if (!asHome || !asAway) return null;
        return Math.round((asHome.homeWinProb + asAway.awayWinProb) / 2);
    }, [isFutures, team1, team2, teamStats, h2h]);

    const matchups = useMemo(
        () => (isFutures ? [] : findMatchups(season.data, team1, team2).slice(0, 3)),
        [isFutures, season.data, team1, team2]
    );

    const sameTeam = team1 === team2;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* 상단 바 */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={() => navigation?.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <KboTitle />
                    <View style={{ width: 24 }} />
                </View>

                {/* 아이콘 + 제목 */}
                <View style={styles.logoCircle}>
                    <Text style={styles.logoEmoji}>⚔️</Text>
                </View>
                <Text style={styles.screenTitle}>상대전적 비교</Text>

                {/* 팀 선택 */}
                {/* 리그 선택 */}
                <LeagueToggle style={{ marginTop: 20 }} />

                <TeamPicker label="팀 1" teams={teams} selected={team1} onSelect={setTeam1} />
                <TeamPicker label="팀 2" teams={teams} selected={team2} onSelect={setTeam2} />

                <TouchableOpacity
                    style={[styles.compareBtn, sameTeam && styles.compareBtnDisabled]}
                    onPress={() => setShow(true)}
                    disabled={sameTeam}
                    activeOpacity={0.8}
                >
                    <Text style={styles.compareText}>
                        {sameTeam ? "서로 다른 팀을 선택하세요" : "비교하기"}
                    </Text>
                </TouchableOpacity>

                {show && !sameTeam && (
                    <View>
                        {/* 팀 vs 팀 */}
                        <View style={styles.vsRow}>
                            <TeamBadge team={team1} />
                            <Text style={styles.vsText}>VS</Text>
                            <TeamBadge team={team2} />
                        </View>

                        {/* 예상 승률 (전력분석과 같은 계산) */}
                        {winProb !== null && (
                            <View style={styles.probBox}>
                                <View style={styles.probLabels}>
                                    <Text style={styles.probText}>{team1} {winProb}%</Text>
                                    <Text style={styles.probTitle}>예상 승률</Text>
                                    <Text style={styles.probText}>{100 - winProb}% {team2}</Text>
                                </View>
                                <View style={styles.probBar}>
                                    <View style={[styles.probLeft, { flex: winProb }]} />
                                    <View style={[styles.probRight, { flex: 100 - winProb }]} />
                                </View>
                            </View>
                        )}

                        {/* 최근 맞대결 (KBO) */}
                        {!isFutures && (
                            <View style={styles.recentBox}>
                                <Text style={styles.recentTitle}>최근 맞대결</Text>
                                {season.loading ? (
                                    <ActivityIndicator color={COLORS.accent} />
                                ) : matchups.length === 0 ? (
                                    <Text style={styles.recentDate}>이번 시즌 맞대결 기록이 없어요</Text>
                                ) : (
                                    matchups.map((g) => {
                                        const s1 = g.home === team1 ? g.score.home : g.score.away;
                                        const s2 = g.home === team1 ? g.score.away : g.score.home;
                                        const winner = s1 > s2 ? team1 : s2 > s1 ? team2 : null;
                                        const row = (
                                            <View style={styles.recentRow}>
                                                <Text style={styles.recentDate}>{dotDate(g.date)}</Text>
                                                <Text style={styles.recentScore}>
                                                    {team1}{" "}
                                                    <Text style={s1 > s2 && styles.winScore}>{s1}</Text>
                                                    {"  -  "}
                                                    <Text style={s2 > s1 && styles.winScore}>{s2}</Text>{" "}
                                                    {team2}
                                                </Text>
                                                <Text style={styles.recentResult}>
                                                    {winner ? `${winner} 승` : "무승부"}
                                                    {g.hasBox ? " ›" : ""}
                                                </Text>
                                            </View>
                                        );
                                        return g.hasBox ? (
                                            <TouchableOpacity
                                                key={g.gameId || g.date}
                                                style={styles.recentItem}
                                                activeOpacity={0.7}
                                                onPress={() =>
                                                    navigation.navigate("GameRating", {
                                                        source: "firestore",
                                                        gameId: g.gameId,
                                                    })
                                                }
                                            >
                                                {row}
                                            </TouchableOpacity>
                                        ) : (
                                            <View key={g.gameId || g.date} style={styles.recentItem}>
                                                {row}
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        )}

                        {/* 비교 표 */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headCell, styles.side]}>{team1}</Text>
                            <Text style={[styles.headCell, styles.label]}>항목</Text>
                            <Text style={[styles.headCell, styles.side]}>{team2}</Text>
                        </View>

                        {!isFutures && loading && (
                            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 12 }} />
                        )}
                        {!isFutures && !loading && error && (
                            <TouchableOpacity onPress={reload}>
                                <Text style={styles.note}>
                                    기록을 불러오지 못했어요. 눌러서 다시 시도
                                </Text>
                            </TouchableOpacity>
                        )}

                        {rows.map((d, i) => (
                            <View key={d.label} style={[styles.row, i === 0 && styles.rowHighlight]}>
                                <Text
                                    style={[styles.cell, styles.side, d.better === "left" && styles.cellBetter]}
                                >
                                    {d.left}
                                </Text>
                                <Text style={[styles.labelText, styles.label]}>{d.label}</Text>
                                <Text
                                    style={[styles.cell, styles.side, d.better === "right" && styles.cellBetter]}
                                >
                                    {d.right}
                                </Text>
                            </View>
                        ))}

                        {/* 자료 출처 */}
                        {!isFutures && rows.length > 0 && (
                            <Text style={styles.note}>
                                자료 출처: KBO{updatedAt ? ` · ${formatUpdated(updatedAt)} 업데이트` : ""}
                                {elo?.to ? `\nELO: ${elo.from.slice(5).replace("-", "/")} ~ ${elo.to.slice(5).replace("-", "/")} ${elo.games}경기로 계산` : ""}
                            </Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    content: { paddingHorizontal: 20, paddingBottom: 40 },

    // 상단 바
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
    },
    backArrow: { color: COLORS.text, fontSize: 34, lineHeight: 36, width: 24 },

    // 아이콘 + 제목
    logoCircle: {
        alignSelf: "center",
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.card,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
    },
    logoEmoji: { fontSize: 40 },
    screenTitle: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 16,
    },

    // 팀 선택
    pickerBlock: { marginTop: 24 },
    pickerLabel: { color: COLORS.subText, fontSize: 13, marginBottom: 10 },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: COLORS.chip,
        marginRight: 8,
    },
    chipActive: { backgroundColor: COLORS.accent },
    chipText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
    teamDot: { marginRight: 6 },

    compareBtn: {
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.accent,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 28,
    },
    compareBtnDisabled: { backgroundColor: COLORS.chip },
    compareText: { color: COLORS.text, fontSize: 15, fontWeight: "700" },

    // 팀 vs 팀
    vsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        marginTop: 32,
    },
    badge: { alignItems: "center", width: 100 },
    badgeCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.card,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeName: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginTop: 10 },
    vsText: { color: COLORS.accent, fontSize: 20, fontWeight: "700" },

    // 최근 맞대결
    recentBox: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
    },
    recentTitle: { color: COLORS.subText, fontSize: 13, marginBottom: 10 },
    recentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    recentDate: { color: COLORS.subText, fontSize: 12 },
    recentScore: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
    winScore: { color: COLORS.accent },
    recentResult: { color: COLORS.accent, fontSize: 13, fontWeight: "700" },

    // 비교 표
    tableHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 12,
        marginTop: 20,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderColor: COLORS.divider,
    },
    headCell: { color: COLORS.subText, fontSize: 12, textAlign: "center" },
    row: {
        flexDirection: "row",
        alignItems: "center",
        height: 46,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: COLORS.card,
    },
    rowHighlight: { backgroundColor: COLORS.rowDirect },
    cell: { color: COLORS.text, fontSize: 14, textAlign: "center" },
    labelText: { color: COLORS.subText, fontSize: 13, textAlign: "center" },
    side: { width: 96 },
    label: { flex: 1 },
    cellBetter: { color: COLORS.accent, fontWeight: "800" },
    note: { color: COLORS.subText, fontSize: 11, textAlign: "center", marginTop: 12, lineHeight: 16 },

    // 최근 맞대결 한 줄
    recentItem: { paddingVertical: 6 },

    // 예상 승률
    probBox: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 24 },
    probLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    probTitle: { color: COLORS.subText, fontSize: 12 },
    probText: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
    probBar: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden" },
    probLeft: { backgroundColor: COLORS.accent },
    probRight: { backgroundColor: "#4F7FD9" },
});
