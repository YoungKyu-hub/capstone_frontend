import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KboTitle from "../components/KboTitle";
import TeamLogo from "../components/TeamLogo";
import LeagueToggle from "../components/LeagueToggle";
import { useLeague } from "../context/LeagueContext";

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

// 내부 데이터 (영어 key 유지)
const data = {
    batter: {
        avg: [
            { name: "김도영", team: "KIA", value: ".347" },
            { name: "홍창기", team: "LG", value: ".338" },
        ],
        hr: [
            { name: "김도영", team: "KIA", value: "35" },
            { name: "노시환", team: "한화", value: "31" },
        ],
    },
    pitcher: {
        era: [
            { name: "네일", team: "KIA", value: "2.11" },
            { name: "원태인", team: "삼성", value: "2.43" },
        ],
    },
    team: {
        winrate: [
            { name: "KIA", value: ".650" },
            { name: "LG", value: ".620" },
        ],
    },
};

// 한글 → 데이터 키 매핑
const mainMap = {
    타자: "batter",
    투수: "pitcher",
    팀: "team",
};

const subMap = {
    batter: { 타율: "avg", 홈런: "hr" },
    pitcher: { 평균자책: "era" },
    team: { 승률: "winrate" },
};

export default function SeasonRecordScreen({ navigation }) {
    const [mainTab, setMainTab] = useState("타자");
    const [subTab, setSubTab] = useState("타율");

    const mainKey = mainMap[mainTab];
    const subKey = subMap[mainKey]?.[subTab];
    const { isFutures } = useLeague();
    // 퓨처스리그 선수 기록은 크롤링(백엔드) 연결 후 채울 예정
    const current = isFutures ? [] : data[mainKey]?.[subKey] || [];
    const isTeam = mainKey === "team";

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
                                    setSubTab(Object.keys(subMap[mainMap[t]])[0]);
                                }}
                            >
                                <Text style={styles.pillText}>{t}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 서브 탭: 타율 / 홈런 ... */}
                <View style={styles.subRow}>
                    {Object.keys(subMap[mainKey]).map((t) => {
                        const active = subTab === t;
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
                    <Text style={[styles.headCell, styles.colValue]}>{subTab}</Text>
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

                {current.length === 0 && (
                    <Text style={styles.empty}>
                        {isFutures
                            ? "퓨처스리그 기록은 데이터 연결 후 보여 드려요."
                            : "기록 데이터가 없습니다."}
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
