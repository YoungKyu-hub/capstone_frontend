import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KboTitle from "../components/KboTitle";
import LeagueToggle from "../components/LeagueToggle";
import { useLeague } from "../context/LeagueContext";

// ===== 디자인 색상 (RankingScreen과 동일) =====
const COLORS = {
    bg: "#181829",
    card: "#222232",
    iconCircle: "#2C2C3E",
    text: "#FFFFFF",
    subText: "#C4C4C4",
    accent: "#E8826B",
};

const MENUS = [
    {
        key: "Ranking",
        icon: "🏆",
        title: "팀 순위",
        desc: "시즌별 팀 순위 확인",
        futuresDesc: "북부 · 남부리그 순위 확인",
    },
    {
        key: "HeadToHead",
        icon: "⚔️",
        title: "상대전적 비교",
        desc: "두 팀 전력 비교 분석",
        futuresDesc: "2군 두 팀 전력 비교",
    },
    {
        key: "SeasonRecord",
        icon: "📈",
        title: "시즌 기록",
        desc: "타자 / 투수 / 팀 기록",
        futuresDesc: "유망주 타자 / 투수 기록",
    },
];

export default function RecordScreen({ navigation }) {
    const { isFutures } = useLeague();

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* 상단 바 */}
                <View style={styles.topBar}>
                    <KboTitle />
                </View>

                {/* 아이콘 + 제목 */}
                <View style={styles.logoCircle}>
                    <Text style={styles.logoEmoji}>📊</Text>
                </View>
                <Text style={styles.screenTitle}>기록실</Text>
                <Text style={styles.screenSub}>순위 · 상대전적 · 시즌 기록</Text>

                {/* 리그 선택: KBO 리그 / 퓨처스리그 */}
                <LeagueToggle style={styles.toggle} />

                {/* 메뉴 카드 */}
                <View style={styles.menuList}>
                    {MENUS.map((menu) => (
                        <TouchableOpacity
                            key={menu.key}
                            style={styles.card}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(menu.key)}
                        >
                            <View style={styles.iconCircle}>
                                <Text style={styles.icon}>{menu.icon}</Text>
                            </View>
                            <View style={styles.cardText}>
                                <Text style={styles.cardTitle}>{menu.title}</Text>
                                <Text style={styles.cardDesc}>
                                    {isFutures ? menu.futuresDesc : menu.desc}
                                </Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    content: { paddingHorizontal: 20, paddingBottom: 40 },

    // 상단 바
    topBar: {
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },

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
    screenSub: {
        color: COLORS.subText,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
    },

    toggle: { marginTop: 24 },

    // 메뉴 카드
    menuList: { marginTop: 20 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.iconCircle,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    icon: { fontSize: 22 },
    cardText: { flex: 1 },
    cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
    cardDesc: { color: COLORS.subText, fontSize: 13, marginTop: 4 },
    chevron: { color: COLORS.accent, fontSize: 28, lineHeight: 30 },
});
