import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KboTitle from "../components/KboTitle";
import TeamLogo from "../components/TeamLogo";
import LeagueToggle from "../components/LeagueToggle";
import { useLeague } from "../context/LeagueContext";
import { useFirestoreDoc, formatUpdated } from "../utils/firestoreData";

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

// 한글 → 데이터 키 매핑
const mainMap = {
    타자: "batter",
    투수: "pitcher",
    팀: "team",
};


// ===== Firestore 기록실 표 (백엔드가 KBO 기록실 팀별 표를 합쳐 올린 것) =====
//   KBO 리그:  rankings/kboBatters · kboPitchers · kbo(순위, 팀 경기 수)
//   퓨처스리그: rankings/futuresBatters · futuresPitchers · futures
// 규정(비율 기록 — 타율·OPS·ERA·WHIP 에만 적용): 1군 타석 = 팀 경기 × 3.1, 이닝 × 1.0 / 퓨처스 × 2.7, × 0.8
const LEAGUE_RECORD = {
    kbo: { batters: "kboBatters", pitchers: "kboPitchers", rank: "kbo", paPerGame: 3.1, ipPerGame: 1.0 },
    futures: { batters: "futuresBatters", pitchers: "futuresPitchers", rank: "futures", paPerGame: 2.7, ipPerGame: 0.8 },
};
const TOP_N = 30;

const rate3 = (v) => (v == null || isNaN(v) ? "-" : v.toFixed(3).replace(/^0/, ""));
const fixed2 = (v) => (v == null || isNaN(v) ? "-" : v.toFixed(2));
const int = (v) => String(v ?? 0);

// 서브 탭 → { 값 계산, 표시, 정렬(낮을수록 좋으면 asc), 규정 필요 여부 }
const RECORD_STATS = {
    batter: {
        타율: { get: (r) => r.avg, fmt: rate3, qualified: true },
        홈런: { get: (r) => r.hr, fmt: int },
        타점: { get: (r) => r.rbi, fmt: int },
        안타: { get: (r) => r.h, fmt: int },
        도루: { get: (r) => r.sb, fmt: int },
        OPS: { get: (r) => r.ops ?? (r.obp ?? 0) + (r.slg ?? 0), fmt: rate3, qualified: true },
    },
    pitcher: {
        평균자책: { get: (r) => r.era, fmt: fixed2, asc: true, qualified: true },
        승리: { get: (r) => r.w, fmt: int },
        세이브: { get: (r) => r.sv, fmt: int },
        홀드: { get: (r) => r.hld, fmt: int },
        탈삼진: { get: (r) => r.so, fmt: int },
        WHIP: {
            get: (r) => (r.outs ? ((r.h ?? 0) + (r.bb ?? 0)) / (r.outs / 3) : null),
            fmt: fixed2,
            asc: true,
            qualified: true,
        },
    },
    team: {
        승률: { get: (r) => r.win / Math.max(1, r.win + r.lose), fmt: rate3 },
        승리: { get: (r) => r.win, fmt: int },
    },
};

const playerName = (r) => (r.sameName ? `${r.name}(${r.sameName})` : r.name);

function buildList(mainKey, subTab, docs, rule) {
    const stat = RECORD_STATS[mainKey]?.[subTab];
    if (!stat) return [];
    const teamGames = {};
    (docs.rank?.rows || []).forEach((t) => (teamGames[t.team] = t.game));

    let rows;
    if (mainKey === "team") {
        rows = (docs.rank?.rows || []).map((t) => ({ ...t, name: t.team }));
    } else {
        rows = (mainKey === "batter" ? docs.batters?.rows : docs.pitchers?.rows) || [];
        if (stat.qualified) {
            rows = rows.filter((r) => {
                const g = teamGames[r.team] || 0;
                return mainKey === "batter"
                    ? (r.pa ?? 0) >= g * rule.paPerGame
                    : (r.outs ?? 0) >= g * rule.ipPerGame * 3;
            });
        }
    }
    return rows
        .map((r) => ({ r, v: stat.get(r) }))
        .filter(({ v }) => v != null && !isNaN(v))
        .sort((a, b) => (stat.asc ? a.v - b.v : b.v - a.v))
        .slice(0, TOP_N)
        .map(({ r, v }) => ({
            name: mainKey === "team" ? r.team : playerName(r),
            team: r.team,
            value: stat.fmt(v),
        }));
}

export default function SeasonRecordScreen({ navigation }) {
    const [mainTab, setMainTab] = useState("타자");
    const [subTab, setSubTab] = useState("타율");

    const mainKey = mainMap[mainTab];
    const { isFutures } = useLeague();
    const rule = LEAGUE_RECORD[isFutures ? "futures" : "kbo"];

    const batters = useFirestoreDoc("rankings", rule.batters);
    const pitchers = useFirestoreDoc("rankings", rule.pitchers);
    const rank = useFirestoreDoc("rankings", rule.rank);
    const loading = batters.loading || pitchers.loading || rank.loading;
    const loadError = batters.error || pitchers.error || rank.error;

    const subTabs = Object.keys(RECORD_STATS[mainKey]);
    const activeSub = subTabs.includes(subTab) ? subTab : subTabs[0];

    const current = useMemo(
        () =>
            buildList(
                mainKey,
                activeSub,
                { batters: batters.data, pitchers: pitchers.data, rank: rank.data },
                rule
            ),
        [mainKey, activeSub, batters.data, pitchers.data, rank.data, rule]
    );
    const isTeam = mainKey === "team";
    const qualifiedNote = RECORD_STATS[mainKey]?.[activeSub]?.qualified
        ? mainKey === "batter"
            ? `규정타석(팀 경기 × ${rule.paPerGame}) 이상`
            : `규정이닝(팀 경기 × ${rule.ipPerGame}) 이상`
        : null;

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
                    <Text style={styles.logoEmoji}>📈</Text>
                </View>
                <Text style={styles.screenTitle}>시즌 기록</Text>

                {/* 리그 선택 */}
                <LeagueToggle style={{ marginTop: 20 }} />

                {/* 메인 탭: 타자 / 투수 / 팀 */}
                <View style={styles.pillRow}>
                    {Object.keys(mainMap).map((t) => {
                        const active = mainTab === t;
                        return (
                            <TouchableOpacity
                                key={t}
                                style={[styles.pill, active && styles.pillActive]}
                                onPress={() => {
                                    setMainTab(t);
                                    // 첫 서브탭 자동 설정
                                    setSubTab(Object.keys(RECORD_STATS[mainMap[t]])[0]);
                                }}
                            >
                                <Text style={styles.pillText}>{t}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 서브 탭: 타율 / 홈런 ... */}
                <View style={styles.subRow}>
                    {subTabs.map((t) => {
                        const active = activeSub === t;
                        return (
                            <TouchableOpacity
                                key={t}
                                style={[styles.subChip, active && styles.subChipActive]}
                                onPress={() => setSubTab(t)}
                            >
                                <Text
                                    style={[
                                        styles.subChipText,
                                        active && { color: COLORS.accent },
                                    ]}
                                >
                                    {t}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 표 헤더 */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.headCell, styles.colRank]}>#</Text>
                    <Text style={[styles.headCell, styles.colName, { textAlign: "left" }]}>
                        {isTeam ? "팀" : "선수"}
                    </Text>
                    {!isTeam && (
                        <Text style={[styles.headCell, styles.colTeam]}>팀</Text>
                    )}
                    <Text style={[styles.headCell, styles.colValue]}>{activeSub}</Text>
                </View>

                {/* 데이터 */}
                {current.map((item, i) => {
                    const teamName = isTeam ? item.name : item.team;
                    return (
                        <View
                            key={`${item.name}-${i}`}
                            style={[styles.row, i < 3 && styles.rowHighlight]}
                        >
                            <Text style={[styles.cell, styles.colRank]}>{i + 1}</Text>
                            <View style={styles.colName}>
                                {isTeam && (
                                    <TeamLogo team={teamName} size={22} style={styles.teamDot} />
                                )}
                                <Text style={styles.nameText} numberOfLines={1}>
                                    {item.name}
                                </Text>
                            </View>
                            {!isTeam && (
                                <View style={[styles.colTeam, styles.teamCell]}>
                                    <TeamLogo team={teamName} size={22} style={styles.teamDot} />
                                    <Text style={styles.teamText}>{teamName}</Text>
                                </View>
                            )}
                            <Text style={[styles.valueText, styles.colValue]}>{item.value}</Text>
                        </View>
                    );
                })}

                {loading && current.length === 0 && (
                    <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
                )}
                {!loading && current.length === 0 && (
                    <Text style={styles.empty}>
                        {loadError ? "기록을 불러오지 못했어요." : "기록 데이터가 없습니다."}
                    </Text>
                )}

                {/* 기준·출처 */}
                {current.length > 0 && (
                    <Text style={styles.empty}>
                        {qualifiedNote ? `${qualifiedNote} · ` : ""}자료 출처: KBO
                        {batters.data?.updatedAt ? ` · ${formatUpdated(batters.data.updatedAt)} 업데이트` : ""}
                    </Text>
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

    // 메인 탭
    pillRow: { flexDirection: "row", marginTop: 24 },
    pill: {
        paddingHorizontal: 22,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        marginRight: 10,
    },
    pillActive: { backgroundColor: COLORS.accent },
    pillText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },

    // 서브 탭
    subRow: { flexDirection: "row", marginTop: 14 },
    subChip: {
        paddingHorizontal: 14,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.chip,
        justifyContent: "center",
        marginRight: 8,
    },
    subChipActive: { borderColor: COLORS.accent },
    subChipText: { color: COLORS.subText, fontSize: 13, fontWeight: "600" },

    // 표
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
    },
    rowHighlight: { backgroundColor: COLORS.rowDirect },
    cell: { color: COLORS.text, fontSize: 13, textAlign: "center" },

    colRank: { width: 24, textAlign: "left" },
    colName: { flex: 1, flexDirection: "row", alignItems: "center" },
    colTeam: { width: 72 },
    colValue: { width: 64, textAlign: "right" },

    teamCell: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
    teamDot: { marginRight: 6 },
    nameText: { color: COLORS.text, fontSize: 14, flexShrink: 1 },
    teamText: { color: COLORS.subText, fontSize: 13 },
    valueText: { color: COLORS.accent, fontSize: 15, fontWeight: "700" },

    empty: { color: COLORS.subText, textAlign: "center", marginTop: 20 },
});
