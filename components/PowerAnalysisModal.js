import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import TeamLogo from "./TeamLogo";

const COLORS = {
    bg: "#181829",
    card: "#222232",
    chip: "#2C2C3E",
    text: "#FFFFFF",
    subText: "#C4C4C4",
    accent: "#E8826B",
    navy: "#1E2A4A",
    awayBar: "#4A6FA5",
};

/**
 * 전력 분석 팝업
 * 가중치 기반 분석 + ELO Rating 결과(utils/powerAnalysis.js)를 보여준다.
 * @param analysis analyzeMatch() 결과
 * @param aiComment AI 분석 의견 (나중에 OpenAI 결과로 교체)
 */
export default function PowerAnalysisModal({ visible, onClose, analysis, aiComment }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.title}>전력 분석</Text>

                        {analysis ? <Content analysis={analysis} aiComment={aiComment} /> : (
                            <Text style={styles.empty}>분석할 데이터가 없습니다.</Text>
                        )}

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>닫기</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function Content({ analysis, aiComment }) {
    const { home, away, homeWinProb, awayWinProb, rows } = analysis;
    const homeFavored = homeWinProb >= awayWinProb;

    return (
        <>
            {/* 팀 + 예상 승률 */}
            <View style={styles.vsRow}>
                <TeamSide team={home.team} side="홈" prob={homeWinProb} strong={homeFavored} />
                <Text style={styles.vsText}>VS</Text>
                <TeamSide team={away.team} side="원정" prob={awayWinProb} strong={!homeFavored} />
            </View>

            {/* 예상 승률 막대 */}
            <View style={styles.probBar}>
                <View style={{ flex: homeWinProb, backgroundColor: COLORS.accent }} />
                <View style={{ flex: awayWinProb, backgroundColor: COLORS.awayBar }} />
            </View>
            <Text style={styles.caption}>예상 승률 · 가중치 분석 50% + ELO 50%</Text>

            {/* 전력 점수 */}
            <View style={styles.scoreBox}>
                <Text style={[styles.scoreNum, home.score >= away.score && styles.better]}>{home.score}</Text>
                <View style={{ alignItems: "center" }}>
                    <Text style={styles.scoreLabel}>전력 점수</Text>
                    <Text style={styles.scoreSub}>100점 만점</Text>
                </View>
                <Text style={[styles.scoreNum, away.score > home.score && styles.better]}>{away.score}</Text>
            </View>

            {/* 항목별 비교 */}
            <View style={styles.table}>
                {rows.map((row, i) => (
                    <View key={row.label} style={[styles.row, i > 0 && styles.rowBorder]}>
                        <Text style={[styles.cell, row.better === "home" && styles.better]}>{row.home}</Text>
                        <View style={styles.rowLabelBox}>
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <Text style={styles.rowWeight}>
                                {row.weight != null ? `가중치 ${Math.round(row.weight * 100)}%` : "레이팅"}
                            </Text>
                        </View>
                        <Text style={[styles.cell, row.better === "away" && styles.better]}>{row.away}</Text>
                    </View>
                ))}
            </View>

            {/* AI 분석 */}
            <View style={styles.aiBox}>
                <Text style={styles.aiTitle}>AI 분석 의견</Text>
                <Text style={styles.aiText}>
                    {aiComment || "AI 분석은 준비 중입니다."}
                </Text>
            </View>
        </>
    );
}

function TeamSide({ team, side, prob, strong }) {
    return (
        <View style={styles.teamSide}>
            <View style={styles.logoCircle}>
                <TeamLogo team={team} size={40} />
            </View>
            <Text style={styles.teamName}>{team}</Text>
            <Text style={styles.teamSideText}>{side}</Text>
            <Text style={[styles.prob, strong && { color: COLORS.accent }]}>{prob}%</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "90%",
        maxHeight: "85%",
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.chip,
        padding: 20,
    },
    title: { color: COLORS.text, fontSize: 20, fontWeight: "700", textAlign: "center" },
    empty: { color: COLORS.subText, textAlign: "center", marginVertical: 30 },

    // 팀 + 승률
    vsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        marginTop: 18,
    },
    teamSide: { alignItems: "center", width: 96 },
    logoCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.chip,
        alignItems: "center",
        justifyContent: "center",
    },
    teamName: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 6 },
    teamSideText: { color: COLORS.subText, fontSize: 11, marginTop: 2 },
    prob: { color: COLORS.text, fontSize: 26, fontWeight: "800", marginTop: 6 },
    vsText: { color: COLORS.accent, fontSize: 18, fontWeight: "700" },

    probBar: {
        flexDirection: "row",
        height: 10,
        borderRadius: 5,
        overflow: "hidden",
        marginTop: 14,
    },
    caption: { color: COLORS.subText, fontSize: 11, textAlign: "center", marginTop: 6 },

    // 전력 점수
    scoreBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.navy,
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 16,
    },
    scoreNum: { color: COLORS.text, fontSize: 24, fontWeight: "800", width: 50, textAlign: "center" },
    scoreLabel: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
    scoreSub: { color: COLORS.subText, fontSize: 11, marginTop: 2 },

    // 비교표
    table: { backgroundColor: COLORS.card, borderRadius: 12, marginTop: 12, paddingHorizontal: 12 },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
    rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.chip },
    cell: { flex: 1, color: COLORS.subText, fontSize: 13, textAlign: "center" },
    rowLabelBox: { width: 96, alignItems: "center" },
    rowLabel: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
    rowWeight: { color: COLORS.subText, fontSize: 10, marginTop: 2 },
    better: { color: COLORS.accent, fontWeight: "700" },

    // AI
    aiBox: { backgroundColor: COLORS.navy, borderRadius: 12, padding: 14, marginTop: 12 },
    aiTitle: { color: COLORS.accent, fontSize: 13, fontWeight: "700", marginBottom: 6 },
    aiText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },

    closeButton: {
        marginTop: 16,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    closeButtonText: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
});
