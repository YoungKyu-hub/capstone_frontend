import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KboTitle from "../components/KboTitle";
import TeamLogo from "../components/TeamLogo";
import { rateGame } from "../utils/playerRating";
import { GAME_RESULTS } from "../data/gameResultMock";
import RatingField, { playerKey } from "../components/RatingField";

// ===== 디자인 색상 (다른 화면과 동일) =====
const COLORS = {
    bg: "#181829",
    card: "#222232",
    chip: "#2C2C3E",
    text: "#FFFFFF",
    subText: "#C4C4C4",
    dim: "#8A8A9A",
    divider: "#2C2C3E",
    accent: "#E8826B",
    momBg: "#3A2A2C",
    home: "#E8826B", // 홈팀 원 색 (주황)
    away: "#4F7FD9", // 원정팀 원 색 (파랑)
};

// 평점 색: 8.0 이상 주황 / 6.0~7.9 흰색 / 6.0 미만 회색
const ratingColor = (r) => (r >= 8 ? COLORS.accent : r >= 6 ? COLORS.text : COLORS.dim);

/**
 * 경기 평점 화면
 * route.params: { date, gameId, home, away }
 */
export default function GameRatingScreen({ navigation, route }) {
    const { date, gameId, home, away } = route.params;
    const result = GAME_RESULTS[`${date}-${gameId}`];

    const rated = useMemo(
        () => (result ? rateGame({ home, away, ...result }) : null),
        [result, home, away]
    );

    // 처음에는 MOM 팀 탭을 보여줌
    const [tab, setTab] = useState(rated?.mom?.team || home);
    // 그라운드에서 누른 선수 (처음엔 MOM)
    const [selected, setSelected] = useState(rated?.mom || null);

    const header = (
        <View style={styles.topBar}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <KboTitle />
            <View style={{ width: 24 }} />
        </View>
    );

    if (!rated) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.content}>
                    {header}
                    <Text style={styles.empty}>경기 기록이 아직 없습니다.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { players, mom } = rated;
    const { score } = result;
    const teamPlayers = players.filter((p) => p.team === tab);
    const batters = teamPlayers.filter((p) => p.type === "batter");
    const pitchers = teamPlayers.filter((p) => p.type === "pitcher");
    const teamColor = tab === home ? COLORS.home : COLORS.away;

    // 팀 탭 바꾸기: 그 팀 MOM 또는 최고 평점 선수를 선택
    const changeTab = (team) => {
        setTab(team);
        const best = players.find((p) => p.team === team); // players 는 평점 높은 순
        setSelected(mom && mom.team === team ? mom : best);
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {header}

                <Text style={styles.screenTitle}>경기 평점</Text>

                {/* 경기 요약 */}
                <View style={styles.scoreRow}>
                    <TeamLogo team={home} size={24} />
                    <Text style={styles.scoreTeam}>{home}</Text>
                    <Text style={[styles.scoreNum, score.home < score.away && styles.scoreLose]}>
                        {score.home}
                    </Text>
                    <Text style={styles.scoreColon}>:</Text>
                    <Text style={[styles.scoreNum, score.away < score.home && styles.scoreLose]}>
                        {score.away}
                    </Text>
                    <Text style={styles.scoreTeam}>{away}</Text>
                    <TeamLogo team={away} size={24} />
                </View>
                <Text style={styles.scoreSub}>{date} · 경기 종료</Text>

                {/* MOM 카드 */}
                {mom && (
                    <View style={styles.momCard}>
                        {mom.fromLosingTeam && (
                            <View style={styles.losingBadge}>
                                <Text style={styles.losingBadgeText}>패배 속 빛난 활약</Text>
                            </View>
                        )}
                        <Text style={styles.momLabel}>🏆 MAN OF THE MATCH</Text>
                        <View style={styles.momLogo}>
                            <TeamLogo team={mom.team} size={52} />
                        </View>
                        <Text style={styles.momName}>{mom.name}</Text>
                        <Text style={styles.momSub}>
                            {mom.team} · {mom.pos}
                        </Text>
                        <View style={styles.momRating}>
                            <Text style={styles.momRatingText}>{mom.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.momLine}>{mom.line}</Text>
                    </View>
                )}

                {/* 팀 탭 */}
                <View style={styles.tabWrap}>
                    {[home, away].map((team) => {
                        const active = tab === team;
                        return (
                            <TouchableOpacity
                                key={team}
                                style={[
                                    styles.tab,
                                    active && {
                                        backgroundColor: team === home ? COLORS.home : COLORS.away,
                                    },
                                ]}
                                activeOpacity={0.8}
                                onPress={() => changeTab(team)}
                            >
                                <TeamLogo team={team} size={18} style={{ marginRight: 6 }} />
                                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                    {team}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 그라운드 위 선수 평점 */}
                <View style={{ marginTop: 16 }}>
                    <RatingField
                        players={teamPlayers}
                        color={teamColor}
                        mom={mom}
                        selectedKey={selected ? playerKey(selected) : null}
                        onSelect={setSelected}
                    />
                </View>

                {/* 누른 선수 기록 */}
                {selected && selected.team === tab && (
                    <View style={styles.detail}>
                        <View style={[styles.detailCircle, { backgroundColor: teamColor }]}>
                            <Text style={styles.detailRating}>{selected.rating.toFixed(1)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailName}>
                                {selected.name}
                                {mom && playerKey(mom) === playerKey(selected) ? "  🏆 MOM" : ""}
                            </Text>
                            <Text style={styles.detailSub}>
                                {selected.team} ·{" "}
                                {selected.type === "pitcher"
                                    ? selected.role === "starter"
                                        ? "선발 투수"
                                        : "구원 투수"
                                    : `${selected.order}번 타자 · ${selected.pos}`}
                            </Text>
                            <Text style={styles.detailLine}>{selected.line}</Text>
                        </View>
                    </View>
                )}
                <Text style={styles.hint}>선수를 누르면 기록을 볼 수 있어요</Text>

                {/* 상세 기록 표 */}
                <Text style={styles.tableTitle}>상세 기록</Text>
                <PlayerSection title="타자" players={batters} mom={mom} />
                <PlayerSection title="투수" players={pitchers} mom={mom} />

                {/* 평점 안내 */}
                <View style={styles.legend}>
                    <LegendItem color={COLORS.accent} text="8.0 이상" />
                    <LegendItem color={COLORS.text} text="6.0~7.9" />
                    <LegendItem color={COLORS.dim} text="6.0 미만" />
                </View>
                <Text style={styles.note}>
                    세부 기록 가중치 기반 평점 (1.0~10.0, 기본 6.0)
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

// 타자 / 투수 목록 (평점 높은 순)
function PlayerSection({ title, players, mom }) {
    if (players.length === 0) return null;
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.table}>
                {players.map((p, i) => {
                    const isMom = mom && mom.name === p.name && mom.team === p.team;
                    return (
                        <View
                            key={`${p.name}-${i}`}
                            style={[styles.row, i > 0 && styles.rowBorder, isMom && styles.rowMom]}
                        >
                            <View style={styles.nameCol}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {p.name}
                                    </Text>
                                    {isMom && <Text style={styles.momTag}>🏆</Text>}
                                </View>
                                <Text style={styles.pos}>{p.pos}</Text>
                            </View>
                            <Text style={styles.line} numberOfLines={2}>
                                {p.line}
                            </Text>
                            <Text style={[styles.rating, { color: ratingColor(p.rating) }]}>
                                {p.rating.toFixed(1)}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function LegendItem({ color, text }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    empty: { color: COLORS.subText, textAlign: "center", marginTop: 60 },

    // 상단 바
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
    },
    backArrow: { color: COLORS.text, fontSize: 34, lineHeight: 36, width: 24 },
    screenTitle: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 16,
    },

    // 경기 요약
    scoreRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
    },
    scoreTeam: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginHorizontal: 6 },
    scoreNum: { color: COLORS.text, fontSize: 24, fontWeight: "800", marginHorizontal: 4 },
    scoreLose: { color: COLORS.subText },
    scoreColon: { color: COLORS.subText, fontSize: 20, fontWeight: "700" },
    scoreSub: { color: COLORS.subText, fontSize: 12, textAlign: "center", marginTop: 4 },

    // MOM 카드
    momCard: {
        backgroundColor: COLORS.momBg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.accent,
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 16,
        marginTop: 20,
    },
    losingBadge: {
        backgroundColor: COLORS.accent,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 10,
    },
    losingBadgeText: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
    momLabel: { color: COLORS.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
    momLogo: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: COLORS.chip,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
    },
    momName: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginTop: 10 },
    momSub: { color: COLORS.subText, fontSize: 13, marginTop: 2 },
    momRating: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.accent,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },
    momRatingText: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
    momLine: { color: COLORS.text, fontSize: 13, marginTop: 10 },

    // 팀 탭
    tabWrap: {
        flexDirection: "row",
        backgroundColor: COLORS.chip,
        borderRadius: 22,
        padding: 4,
        marginTop: 24,
    },
    tab: {
        flex: 1,
        height: 36,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    tabActive: { backgroundColor: COLORS.accent },
    tabText: { color: COLORS.subText, fontSize: 14, fontWeight: "700" },
    tabTextActive: { color: COLORS.text },

    // 누른 선수 기록
    detail: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
    },
    detailCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    detailRating: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
    detailName: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
    detailSub: { color: COLORS.subText, fontSize: 12, marginTop: 2 },
    detailLine: { color: COLORS.text, fontSize: 13, marginTop: 6 },
    hint: { color: COLORS.dim, fontSize: 11, textAlign: "center", marginTop: 8 },
    tableTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginTop: 24 },

    // 선수 목록
    section: { marginTop: 20 },
    sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginBottom: 8 },
    table: { backgroundColor: COLORS.card, borderRadius: 12, overflow: "hidden" },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.divider },
    rowMom: { backgroundColor: COLORS.momBg },
    nameCol: { width: 80 },
    nameRow: { flexDirection: "row", alignItems: "center" },
    name: { color: COLORS.text, fontSize: 14, fontWeight: "700", flexShrink: 1 },
    momTag: { fontSize: 12, marginLeft: 4 },
    pos: { color: COLORS.subText, fontSize: 11, marginTop: 2 },
    line: { flex: 1, color: COLORS.subText, fontSize: 12, marginHorizontal: 8 },
    rating: { fontSize: 18, fontWeight: "800", width: 44, textAlign: "right" },

    // 안내
    legend: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
    legendItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    legendText: { color: COLORS.subText, fontSize: 11 },
    note: { color: COLORS.dim, fontSize: 11, textAlign: "center", marginTop: 6 },
});
