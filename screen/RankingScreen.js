import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KboTitle from "../components/KboTitle";
import TeamLogo from "../components/TeamLogo";
import LeagueToggle from "../components/LeagueToggle";
import { useLeague } from "../context/LeagueContext";
import { FUTURES_RANKING, FUTURES_DIVISIONS } from "../data/futuresMock";

// ===== 디자인 색상 (피그마 Standings Detail 기준) =====
const COLORS = {
    bg: "#181829",
    logoCircle: "#222232",
    text: "#FFFFFF",
    subText: "#C4C4C4",
    divider: "#2C2C3E",
    pill: "#E8826B",
    rowDirect: "#1E2A4A", // 1~3위: 준플레이오프 직행 이상
    rowWildcard: "#3A1E1E", // 4~5위: 와일드카드
};

// ===== 2026 시즌 데이터 =====
const rankingData = [
    { id: 1, team: "LG", game: 31, win: 20, lose: 10, draw: 1, streak: "3승", last10: "7승3패", home: "10-5", away: "10-5" },
    { id: 2, team: "두산", game: 30, win: 17, lose: 12, draw: 1, streak: "1패", last10: "5승5패", home: "9-6", away: "9-6" },
    { id: 3, team: "SSG", game: 30, win: 22, lose: 8, draw: 0, streak: "2승", last10: "6승4패", home: "8-7", away: "9-6" },
    { id: 4, team: "롯데", game: 30, win: 8, lose: 21, draw: 1, streak: "1승", last10: "5승5패", home: "7-8", away: "8-7" },
    { id: 5, team: "삼성", game: 31, win: 14, lose: 16, draw: 1, streak: "2패", last10: "4승6패", home: "7-9", away: "7-7" },
    { id: 6, team: "KIA", game: 31, win: 10, lose: 20, draw: 1, streak: "1패", last10: "4승6패", home: "8-9", away: "7-7" },
];

// ===== 시즌별 데이터 =====
const seasonData = {
    2026: rankingData,
    2025: [
        { id: 1, team: "한화", game: 144, win: 80, lose: 60, draw: 4, streak: "2승", last10: "7승3패", home: "40-30", away: "40-30" },
    ],
    2024: [
        { id: 1, team: "기아", game: 144, win: 85, lose: 55, draw: 4, streak: "1승", last10: "8승2패", home: "42-28", away: "43-27" },
    ],
};

const getWinRate = (win, lose) => (win + lose === 0 ? 0 : win / (win + lose));

// 전체 성적 기준으로 순위 계산
const buildStandings = (data) => {
    const sorted = [...data].sort(
        (a, b) => getWinRate(b.win, b.lose) - getWinRate(a.win, a.lose)
    );
    if (sorted.length === 0) return [];

    const top = sorted[0];
    return sorted.map((item, index) => ({
        ...item,
        rank: index + 1,
        winRate: getWinRate(item.win, item.lose).toFixed(3),
        // 게임차 = ((1위 승 - 팀 승) + (팀 패 - 1위 패)) / 2
        gb:
            index === 0
                ? "-"
                : ((top.win - item.win + (item.lose - top.lose)) / 2).toFixed(1),
    }));
};

function RankingScreen({ navigation }) {
    const [season, setSeason] = useState(2026);
    const [showSeasonList, setShowSeasonList] = useState(false);
    const { isFutures } = useLeague();
    const [division, setDivision] = useState("north"); // 퓨처스: 북부 / 남부

    const standings = useMemo(() => {
        if (isFutures) {
            return buildStandings(FUTURES_RANKING[season]?.[division] || []);
        }
        return buildStandings(seasonData[season] || []);
    }, [season, isFutures, division]);

    const renderItem = ({ item }) => {
        let rowStyle = null;
        // 퓨처스리그는 포스트시즌 구분이 없어서 색 표시 안 함
        if (isFutures) rowStyle = null;
        else if (item.rank <= 3) rowStyle = { backgroundColor: COLORS.rowDirect };
        else if (item.rank <= 5) rowStyle = { backgroundColor: COLORS.rowWildcard };

        return (
            <View style={[styles.row, rowStyle]}>
                <Text style={[styles.cell, styles.colRank]}>{item.rank}</Text>
                <View style={styles.colTeam}>
                    <TeamLogo team={item.team} size={24} style={styles.teamDot} />
                    <Text style={styles.teamName} numberOfLines={1}>
                        {item.team}
                    </Text>
                </View>
                <Text style={[styles.cell, styles.colNum]}>{item.game}</Text>
                <Text style={[styles.cell, styles.colNum]}>{item.win}</Text>
                <Text style={[styles.cell, styles.colNum]}>{item.lose}</Text>
                <Text style={[styles.cell, styles.colNum]}>{item.draw}</Text>
                <Text style={[styles.cell, styles.colRate]}>{item.winRate}</Text>
                <Text style={[styles.cell, styles.colGb]}>{item.gb}</Text>
            </View>
        );
    };

    const ListHeader = (
        <View>
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

            {/* 리그 로고 + 이름 */}
            <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>⚾</Text>
            </View>
            <Text style={styles.leagueName}>{isFutures ? "퓨처스리그" : "KBO 리그"}</Text>

            {/* 시즌 선택 */}
            <View style={styles.seasonRow}>
                <TouchableOpacity onPress={() => season > 2010 && setSeason(season - 1)}>
                    <Text style={styles.seasonArrow}>◀</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowSeasonList(!showSeasonList)}>
                    <Text style={styles.seasonText}>{season} 시즌 ▾</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => season < 2026 && setSeason(season + 1)}>
                    <Text style={styles.seasonArrow}>▶</Text>
                </TouchableOpacity>
            </View>

            {showSeasonList && (
                <View style={styles.dropdown}>
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                        {[...Array(17)].map((_, index) => {
                            const year = 2026 - index;
                            return (
                                <TouchableOpacity
                                    key={year}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setSeason(year);
                                        setShowSeasonList(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownText,
                                            year === season && { color: COLORS.pill },
                                        ]}
                                    >
                                        {year} 시즌
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* 리그 선택 */}
            <LeagueToggle style={styles.toggle} />

            {/* 퓨처스리그: 북부 / 남부 선택 */}
            {isFutures && (
                <View style={styles.divisionRow}>
                    {Object.entries(FUTURES_DIVISIONS).map(([key, div]) => {
                        const active = division === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[styles.divisionChip, active && styles.divisionChipActive]}
                                onPress={() => setDivision(key)}
                            >
                                <Text style={[styles.divisionText, active && { color: COLORS.pill }]}>
                                    {div.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* 표 헤더 */}
            <View style={styles.tableHeader}>
                <Text style={[styles.headCell, styles.colRank]}>#</Text>
                <Text style={[styles.headCell, styles.colTeam, { textAlign: "left" }]}>팀</Text>
                <Text style={[styles.headCell, styles.colNum]}>경기</Text>
                <Text style={[styles.headCell, styles.colNum]}>승</Text>
                <Text style={[styles.headCell, styles.colNum]}>패</Text>
                <Text style={[styles.headCell, styles.colNum]}>무</Text>
                <Text style={[styles.headCell, styles.colRate]}>승률</Text>
                <Text style={[styles.headCell, styles.colGb]}>차</Text>
            </View>
        </View>
    );

    const ListFooter = isFutures ? (
        <View style={styles.legend}>
            <Text style={styles.legendText}>
                퓨처스리그는 북부 · 남부리그별로 순위를 매겨요
            </Text>
        </View>
    ) : (
        <View style={styles.legend}>
            <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: COLORS.rowDirect }]} />
                <Text style={styles.legendText}>1~3위 준PO 이상 직행</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: COLORS.rowWildcard }]} />
                <Text style={styles.legendText}>4~5위 와일드카드</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <FlatList
                data={standings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                ListEmptyComponent={
                    <Text style={styles.empty}>해당 시즌 데이터가 없습니다.</Text>
                }
                contentContainerStyle={styles.content}
            />
        </SafeAreaView>
    );
}

export default RankingScreen;

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

    // 로고
    logoCircle: {
        alignSelf: "center",
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.logoCircle,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
    },
    logoEmoji: { fontSize: 44 },
    leagueName: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 16,
    },

    // 시즌 선택
    seasonRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    seasonArrow: { color: COLORS.subText, fontSize: 14, marginHorizontal: 16 },
    seasonText: { color: COLORS.subText, fontSize: 14 },
    dropdown: {
        backgroundColor: COLORS.logoCircle,
        borderRadius: 12,
        marginTop: 10,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: COLORS.divider,
    },
    dropdownText: { color: COLORS.text },

    // 리그 선택
    toggle: { marginTop: 20 },
    divisionRow: { flexDirection: "row", marginTop: 12 },
    divisionChip: {
        height: 32,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.divider,
        justifyContent: "center",
        marginRight: 8,
    },
    divisionChipActive: { borderColor: COLORS.pill },
    divisionText: { color: COLORS.subText, fontSize: 13, fontWeight: "700" },

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
    cell: { color: COLORS.text, fontSize: 13, textAlign: "center" },

    colRank: { width: 20, textAlign: "left" },
    colTeam: { flex: 1, flexDirection: "row", alignItems: "center" },
    colNum: { width: 28 },
    colRate: { width: 44 },
    colGb: { width: 32 },

    teamDot: { marginRight: 8 },
    teamName: { color: COLORS.text, fontSize: 14, flexShrink: 1 },

    // 범례
    legend: { marginTop: 12 },
    legendItem: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    legendBox: { width: 12, height: 12, borderRadius: 3, marginRight: 8 },
    legendText: { color: COLORS.subText, fontSize: 12 },

    empty: { color: COLORS.subText, textAlign: "center", marginTop: 20 },
});
