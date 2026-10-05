import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KboTitle from "../components/KboTitle";
import TeamLogo from "../components/TeamLogo";
import LeagueToggle from "../components/LeagueToggle";
import { useLeague } from "../context/LeagueContext";
import { FUTURES_TEAMS } from "../data/futuresMock";

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

const getResult = (score1, score2) => {
    if (score1 > score2) return "team1";
    if (score1 < score2) return "team2";
    return "draw";
};

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

    const data = [
        { label: "상대전적", left: "12승", right: "8승" },
        { label: "최근 10경기", left: "6승4패", right: "4승6패" },
        { label: "승률", left: "0.610", right: "0.390" },
        { label: "타율", left: "0.289", right: "0.271" },
        { label: "ERA", left: "3.45", right: "4.10" },
    ];

    const team1Score = 5;
    const team2Score = 3;
    const result = getResult(team1Score, team2Score);
    const winner = result === "team1" ? team1 : result === "team2" ? team2 : null;

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

                        {/* 최근 맞대결 */}
                        <View style={styles.recentBox}>
                            <Text style={styles.recentTitle}>최근 맞대결</Text>
                            <View style={styles.recentRow}>
                                <Text style={styles.recentDate}>2026.05.12</Text>
                                <Text style={styles.recentScore}>
                                    {team1}{" "}
                                    <Text style={result === "team1" && styles.winScore}>
                                        {team1Score}
                                    </Text>
                                    {"  -  "}
                                    <Text style={result === "team2" && styles.winScore}>
                                        {team2Score}
                                    </Text>{" "}
                                    {team2}
                                </Text>
                                <Text style={styles.recentResult}>
                                    {winner ? `${winner} 승` : "무승부"}
                                </Text>
                            </View>
                        </View>

                        {/* 비교 표 */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headCell, styles.side]}>{team1}</Text>
                            <Text style={[styles.headCell, styles.label]}>항목</Text>
                            <Text style={[styles.headCell, styles.side]}>{team2}</Text>
                        </View>

                        {data.map((d, i) => (
                            <View key={i} style={[styles.row, i === 0 && styles.rowHighlight]}>
                                <Text style={[styles.cell, styles.side]}>{d.left}</Text>
                                <Text style={[styles.labelText, styles.label]}>{d.label}</Text>
                                <Text style={[styles.cell, styles.side]}>{d.right}</Text>
                            </View>
                        ))}
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
    side: { width: 80 },
    label: { flex: 1 },
});
