import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TeamLogo from "./TeamLogo";

const COLORS = {
    text: "#FFFFFF",
    subText: "#C4C4C4",
    accent: "#E8826B",
    stripBg: "#3A2A2C", // 주황이 살짝 섞인 어두운 배경
};

/**
 * 경기 종료 카드 아래 MOM 띠
 * @param mom rateGame() 결과의 mom { name, team, pos, rating, line, fromLosingTeam }
 */
export default function MomStrip({ mom }) {
    if (!mom) return null;

    return (
        <View style={styles.strip}>
            <View style={styles.labelBox}>
                <Text style={styles.trophy}>🏆</Text>
                <Text style={styles.label}>MOM</Text>
            </View>

            <View style={styles.info}>
                {mom.fromLosingTeam && (
                    <View style={styles.losingBadge}>
                        <Text style={styles.losingBadgeText}>패배 속 빛난 활약</Text>
                    </View>
                )}
                <View style={styles.nameRow}>
                    <TeamLogo team={mom.team} size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.name} numberOfLines={1}>
                        {mom.name}
                    </Text>
                    <Text style={styles.pos}>
                        {mom.team} · {mom.pos}
                    </Text>
                </View>
                <Text style={styles.line} numberOfLines={1}>
                    {mom.line}
                </Text>
            </View>

            <View style={styles.ratingCircle}>
                <Text style={styles.rating}>{mom.rating.toFixed(1)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    strip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.stripBg,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    labelBox: { alignItems: "center", marginRight: 12 },
    trophy: { fontSize: 20 },
    label: { color: COLORS.accent, fontSize: 11, fontWeight: "800", marginTop: 2 },
    info: { flex: 1 },
    losingBadge: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.accent,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginBottom: 4,
    },
    losingBadgeText: { color: COLORS.text, fontSize: 10, fontWeight: "700" },
    nameRow: { flexDirection: "row", alignItems: "center" },
    name: { color: COLORS.text, fontSize: 15, fontWeight: "700", flexShrink: 1 },
    pos: { color: COLORS.subText, fontSize: 12, marginLeft: 6 },
    line: { color: COLORS.subText, fontSize: 12, marginTop: 4 },
    ratingCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.accent,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
    },
    rating: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
});
