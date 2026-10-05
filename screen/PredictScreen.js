import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ScrollView,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import KboTitle from "../components/KboTitle";
import TeamLogo from "../components/TeamLogo";
import WeatherSheet from "../components/WeatherSheet";
import PowerAnalysisModal from "../components/PowerAnalysisModal";
import { analyzeMatch } from "../utils/powerAnalysis";
import { weatherIcon, rainLevel } from "../utils/weather";
import { STADIUMS, TEAM_STATS, H2H, WEATHER } from "../data/predictMock";

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

const dateList = ["4/13", "4/14", "4/15", "4/16"];
const getDayOfWeek = (dateStr) => {
    const [month, day] = dateStr.split("/");
    const date = new Date(2026, month - 1, day);

    const week = ["일", "월", "화", "수", "목", "금", "토"];
    return week[date.getDay()];
};

const gameData = {
    "4/13": [
        { id: "1", home: "KIA", away: "LG", time: "19:00", aiComment: "KIA의 최근 타선 흐름이 좋습니다." },
        { id: "2", home: "두산", away: "롯데", time: "18:30", aiComment: "롯데의 원정 경기 승률이 높습니다." },
    ],
    "4/14": [
        { id: "3", home: "SSG", away: "NC", time: "18:30", aiComment: "최근 SSG 불펜의 안정감이 좋습니다." },
        { id: "2", home: "두산", away: "롯데", time: "18:30", aiComment: "롯데의 원정 경기 승률이 높습니다." },
    ],
    "4/15": [
        { id: "3", home: "SSG", away: "NC", time: "18:30", aiComment: "최근 SSG 불펜의 안정감이 좋습니다." },
        { id: "4", home: "한화", away: "KT", time: "18:30", aiComment: "한화의 홈 경기 흐름이 좋습니다." },
    ],
    "4/16": [
        { id: "4", home: "한화", away: "KT", time: "18:30", aiComment: "한화의 홈 경기 흐름이 좋습니다." },
        { id: "5", home: "삼성", away: "키움", time: "17:00", aiComment: "삼성의 최근 득점력이 상승세입니다." },
    ],
};

// 팀 원 + 이름 + 홈/원정 표시
function TeamBadge({ team, side }) {
    return (
        <View style={styles.badge}>
            <View style={styles.badgeCircle}>
                <TeamLogo team={team} size={44} />
            </View>
            <Text style={styles.badgeName}>{team}</Text>
            <Text style={styles.badgeSide}>{side}</Text>
        </View>
    );
}

// 카드 안 날씨 칩: 아이콘 + 기온 + 강수확률 (누르면 날씨 바텀시트)
function WeatherChip({ stadium, hourly, onPress }) {
    // 돔구장은 날씨 영향 없음 → 누를 수 없게
    if (stadium?.dome) {
        return (
            <View style={styles.weatherChip}>
                <Ionicons name="home-outline" size={13} color={COLORS.subText} />
                <Text style={styles.weatherChipText}>돔구장</Text>
            </View>
        );
    }
    if (!hourly || hourly.length === 0) return null;

    const start = hourly[0];
    const rainy = rainLevel(hourly) === "high";

    return (
        <TouchableOpacity
            style={[styles.weatherChip, rainy && styles.weatherChipRain]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons
                name={rainy ? "umbrella" : weatherIcon(start)}
                size={13}
                color={rainy ? COLORS.accent : "#FFD36B"}
            />
            <Text style={styles.weatherChipText}>
                {start.tmp}° · {Math.max(...hourly.map((h) => h.pop))}%
            </Text>
        </TouchableOpacity>
    );
}

export default function PredictScreen() {
    const [selectedDate, setSelectedDate] = useState("4/13");
    const [selectedPredict, setSelectedPredict] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [weatherVisible, setWeatherVisible] = useState(false);
    const [weatherMatch, setWeatherMatch] = useState(null);

    const renderGameCard = ({ item }) => {
        // 날짜 + 경기 id로 예측 저장 (다른 날짜의 같은 id와 섞이지 않게)
        const predictKey = `${selectedDate}-${item.id}`;
        const picked = selectedPredict[predictKey];
        const stadium = STADIUMS[item.home];
        const hourly = WEATHER[predictKey];

        const options = [
            { value: item.home, label: `${item.home} 승` },
            { value: "draw", label: "무승부" },
            { value: item.away, label: `${item.away} 승` },
        ];

        return (
            <View style={styles.card}>
                {/* 상단: 시간·구장 + 날씨 칩 + 전력분석 */}
                <View style={styles.topRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.timeText}>🕒 {item.time}</Text>
                        {stadium && (
                            <Text style={styles.stadiumText} numberOfLines={1}>
                                {stadium.name}
                            </Text>
                        )}
                    </View>

                    <WeatherChip
                        stadium={stadium}
                        hourly={hourly}
                        onPress={() => {
                            setWeatherMatch(item);
                            setWeatherVisible(true);
                        }}
                    />

                    <TouchableOpacity
                        style={styles.analysisButton}
                        onPress={() => {
                            setSelectedMatch(item);
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.analysisButtonText}>전력분석</Text>
                    </TouchableOpacity>
                </View>

                {/* 팀 vs 팀 */}
                <View style={styles.vsRow}>
                    <TeamBadge team={item.home} side="홈" />
                    <Text style={styles.vsText}>VS</Text>
                    <TeamBadge team={item.away} side="원정" />
                </View>

                {/* 예측 버튼 */}
                <View style={styles.buttonContainer}>
                    {options.map((opt) => {
                        const active = picked === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.predictButton, active && styles.selected]}
                                activeOpacity={0.8}
                                onPress={() =>
                                    setSelectedPredict({
                                        ...selectedPredict,
                                        [predictKey]: opt.value,
                                    })
                                }
                            >
                                <Text style={styles.buttonText}>{opt.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* AI 코멘트 */}
                <View style={styles.aiBox}>
                    <Text style={styles.aiTitle}>AI 참고 멘트</Text>
                    <Text style={styles.aiComment}>{item.aiComment}</Text>
                </View>
            </View>
        );
    };

    const ListHeader = (
        <View>
            {/* 상단 바 */}
            <View style={styles.topBar}>
                <KboTitle />
            </View>

            {/* 아이콘 + 제목 */}
            <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>⚾</Text>
            </View>
            <Text style={styles.screenTitle}>승부예측</Text>

            {/* 날짜 선택 */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateContainer}
            >
                {dateList.map((date) => {
                    const active = selectedDate === date;
                    return (
                        <TouchableOpacity
                            key={date}
                            style={[styles.dateButton, active && styles.selectedDate]}
                            onPress={() => setSelectedDate(date)}
                        >
                            <Text style={styles.dateText}>
                                {date} ({getDayOfWeek(date)})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="light-content" />

            <FlatList
                data={gameData[selectedDate] || []}
                keyExtractor={(item) => `${selectedDate}-${item.id}`}
                renderItem={renderGameCard}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    <Text style={styles.empty}>예정된 경기가 없습니다.</Text>
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            />

            {/* 전력 분석 팝업 */}
            <PowerAnalysisModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                analysis={
                    selectedMatch &&
                    analyzeMatch(selectedMatch.home, selectedMatch.away, TEAM_STATS, H2H)
                }
                aiComment={selectedMatch?.aiComment}
            />

            {/* 경기장 날씨 바텀시트 */}
            <WeatherSheet
                visible={weatherVisible}
                onClose={() => setWeatherVisible(false)}
                match={weatherMatch}
                dateLabel={`${selectedDate} (${getDayOfWeek(selectedDate)})`}
                stadium={weatherMatch && STADIUMS[weatherMatch.home]}
                hourly={weatherMatch && WEATHER[`${selectedDate}-${weatherMatch.id}`]}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    content: { paddingHorizontal: 20, paddingBottom: 30 },

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

    // 날짜 선택
    dateContainer: { paddingTop: 24, paddingBottom: 8 },
    dateButton: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: COLORS.chip,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    selectedDate: { backgroundColor: COLORS.accent },
    dateText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },

    // 경기 카드
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 18,
        marginTop: 16,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    timeText: { color: COLORS.subText, fontSize: 13 },
    stadiumText: { color: COLORS.subText, fontSize: 11, marginTop: 3 },

    // 날씨 칩
    weatherChip: {
        flexDirection: "row",
        alignItems: "center",
        height: 28,
        paddingHorizontal: 10,
        borderRadius: 14,
        backgroundColor: COLORS.chip,
        borderWidth: 1,
        borderColor: COLORS.chip,
        marginRight: 6,
    },
    weatherChipRain: { borderColor: COLORS.accent },
    weatherChipText: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginLeft: 4 },
    analysisButton: {
        height: 28,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.accent,
        justifyContent: "center",
    },
    analysisButtonText: { color: COLORS.accent, fontSize: 12, fontWeight: "700" },

    // 팀 vs 팀
    vsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        marginTop: 16,
        marginBottom: 20,
    },
    badge: { alignItems: "center", width: 90 },
    badgeCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.chip,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeName: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginTop: 8 },
    badgeSide: { color: COLORS.subText, fontSize: 11, marginTop: 2 },
    vsText: { color: COLORS.accent, fontSize: 18, fontWeight: "700" },

    // 예측 버튼
    buttonContainer: { flexDirection: "row", marginHorizontal: -4, marginBottom: 16 },
    predictButton: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.chip,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 4,
    },
    selected: { backgroundColor: COLORS.accent },
    buttonText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },

    // AI 코멘트
    aiBox: {
        backgroundColor: COLORS.rowDirect,
        borderRadius: 12,
        padding: 14,
    },
    aiTitle: { color: COLORS.accent, fontSize: 13, fontWeight: "700", marginBottom: 6 },
    aiComment: { color: COLORS.text, fontSize: 13, lineHeight: 20 },

    empty: { color: COLORS.subText, textAlign: "center", marginTop: 40 },

});
