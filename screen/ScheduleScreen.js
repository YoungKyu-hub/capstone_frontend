import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import KboTitle from "../components/KboTitle";
import TeamLogo from "../components/TeamLogo";
import LeagueToggle from "../components/LeagueToggle";
import { useLeague } from "../context/LeagueContext";
import { FUTURES_SCHEDULE, FUTURES_TEAMS, FUTURES_STADIUMS } from "../data/futuresMock";
import { useMonthSchedules, fetchLatestScheduleDate } from "../utils/firestoreData";

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
    sunday: "#FF7A7A",
    saturday: "#7AA8FF",
};

// KBO 경기 일정은 Firestore schedules 컬렉션에서 한 달씩 읽어 온다 (퓨처스는 아직 임시 데이터)

const KBO_TEAMS = ["ALL", "LG", "두산", "SSG", "롯데", "삼성", "KIA", "NC", "한화", "키움", "KT"];
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];

    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }

    return days;
};

// 날짜 포맷
const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

function TeamName({ team }) {
    return (
        <View style={styles.teamWrap}>
            <TeamLogo team={team} size={22} style={styles.teamDot} />
            <Text style={styles.teamText}>{team}</Text>
        </View>
    );
}

export default function ScheduleScreen() {
    const navigation = useNavigation();
    const today = new Date();
    const todayKey = formatDate(today);

    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterTeam, setFilterTeam] = useState("ALL");

    // 리그 선택 (기록실·승부예측과 같은 값을 공유)
    const { league, isFutures } = useLeague();
    const teams = isFutures ? ["ALL", ...FUTURES_TEAMS] : KBO_TEAMS;
    const {
        data: monthGames,
        loading,
        error,
        reload,
    } = useMonthSchedules(year, month, !isFutures);
    const schedule = isFutures ? FUTURES_SCHEDULE : monthGames;

    // 처음 열 때: 이번 달에 데이터가 없으면 데이터가 있는 가장 최근 달로 이동
    const jumped = useRef(false);
    useEffect(() => {
        if (isFutures || jumped.current) return;
        jumped.current = true;
        fetchLatestScheduleDate()
            .then((latest) => {
                if (!latest) return;
                const [y, m] = latest.split("-").map(Number);
                const latestKey = y * 12 + (m - 1);
                const nowKey = today.getFullYear() * 12 + today.getMonth();
                if (latestKey < nowKey) {
                    setYear(y);
                    setMonth(m - 1);
                }
            })
            .catch((e) => console.warn("[firestore] 최근 일정 날짜 읽기 실패", e));
    }, [isFutures]);

    // 리그가 바뀌면 팀 필터와 열린 팝업 초기화
    useEffect(() => {
        setFilterTeam("ALL");
        setModalVisible(false);
    }, [league]);

    const days = getDaysInMonth(year, month);
    // 1일이 무슨 요일인지에 맞춰 앞쪽을 빈 칸으로 채움
    const leadingBlanks = days[0].getDay();
    const cells = [...Array(leadingBlanks).fill(null), ...days];

    // 월 이동
    const prevMonth = () => {
        if (month === 0) {
            setYear(year - 1);
            setMonth(11);
        } else {
            setMonth(month - 1);
        }
    };

    const nextMonth = () => {
        if (month === 11) {
            setYear(year + 1);
            setMonth(0);
        } else {
            setMonth(month + 1);
        }
    };

    // 날짜별 경기 필터
    const getGamesByDate = (key) => {
        const games = (schedule[key] || []).map((g) => ({
            ...g,
            stadium: g.stadium || (isFutures ? FUTURES_STADIUMS[g.home] : ""),
        }));
        if (filterTeam === "ALL") return games;
        return games.filter((g) => g.home === filterTeam || g.away === filterTeam);
    };

    const selectedKey = selectedDate ? formatDate(selectedDate) : null;
    const selectedGames = selectedKey ? getGamesByDate(selectedKey) : [];

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* 상단 바 */}
                <View style={styles.topBar}>
                    <KboTitle />
                </View>

                {/* 아이콘 + 제목 */}
                <View style={styles.logoCircle}>
                    <Text style={styles.logoEmoji}>📅</Text>
                </View>
                <Text style={styles.screenTitle}>경기 일정</Text>

                {/* 리그 선택 */}
                <LeagueToggle style={{ marginTop: 20 }} />

                {/* 월 이동 */}
                <View style={styles.monthBar}>
                    <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.monthBtn}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthText}>
                        {year}년 {month + 1}월
                    </Text>
                    <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.monthBtn}>▶</Text>
                    </TouchableOpacity>
                </View>

                {!isFutures && loading && (
                    <ActivityIndicator color={COLORS.accent} style={{ marginTop: 10 }} />
                )}
                {!isFutures && error && (
                    <TouchableOpacity onPress={reload}>
                        <Text style={styles.errorText}>일정을 불러오지 못했어요. 눌러서 다시 시도</Text>
                    </TouchableOpacity>
                )}

                {/* 팀 필터 */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                >
                    {teams.map((t) => {
                        const active = filterTeam === t;
                        return (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setFilterTeam(t)}
                                style={[styles.filterBtn, active && styles.filterActive]}
                            >
                                {t !== "ALL" && (
                                    <TeamLogo team={t} size={22} style={styles.teamDot} />
                                )}
                                <Text style={styles.filterBtnText}>
                                    {t === "ALL" ? "전체" : t}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* 캘린더 */}
                <View style={styles.calendarCard}>
                    {/* 요일 헤더 */}
                    <View style={styles.weekRow}>
                        {WEEK.map((w, i) => (
                            <Text
                                key={w}
                                style={[
                                    styles.weekText,
                                    i === 0 && { color: COLORS.sunday },
                                    i === 6 && { color: COLORS.saturday },
                                ]}
                            >
                                {w}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.calendar}>
                        {cells.map((date, index) => {
                            if (!date) {
                                return <View key={`blank-${index}`} style={styles.dayBox} />;
                            }

                            const key = formatDate(date);
                            const gameCount = getGamesByDate(key).length;
                            const hasGame = gameCount > 0;
                            const isToday = key === todayKey;
                            const dow = date.getDay();

                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={styles.dayBox}
                                    activeOpacity={hasGame ? 0.7 : 1}
                                    onPress={() => {
                                        if (!hasGame) return;
                                        setSelectedDate(date);
                                        setModalVisible(true);
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.dayCircle,
                                            hasGame && styles.dayCircleGame,
                                            isToday && styles.dayCircleToday,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                dow === 0 && { color: COLORS.sunday },
                                                dow === 6 && { color: COLORS.saturday },
                                                isToday && { color: COLORS.text, fontWeight: "700" },
                                            ]}
                                        >
                                            {date.getDate()}
                                        </Text>
                                    </View>
                                    <View style={[styles.dot, hasGame && styles.dotActive]} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* 범례 */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, styles.dotActive, { marginTop: 0, marginRight: 6 }]} />
                        <Text style={styles.legendText}>경기 있는 날 (눌러서 확인)</Text>
                    </View>
                    {!isFutures && <Text style={styles.sourceText}>자료 출처: KBO</Text>}
                </View>
            </ScrollView>

            {/* 팝업 */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBg}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>{selectedKey}</Text>

                        {selectedGames.length === 0 ? (
                            <Text style={styles.empty}>경기 없음</Text>
                        ) : (
                            <ScrollView style={{ maxHeight: 360 }}>
                                {selectedGames.map((item, i) => (
                                    <View key={i} style={styles.gameBox}>
                                        <View style={styles.gameInfoRow}>
                                            <Text style={styles.gameInfo}>🕒 {item.time}</Text>
                                            <Text
                                                style={[styles.gameInfo, styles.stadiumInfo]}
                                                numberOfLines={1}
                                            >
                                                🏟 {item.stadium}
                                            </Text>
                                        </View>

                                        <View style={styles.matchRow}>
                                            <View style={styles.matchSide}>
                                                <TeamName team={item.home} />
                                                <Text style={styles.sideLabel}>홈</Text>
                                            </View>
                                            {item.status === "final" && item.score ? (
                                                <Text style={styles.scoreText}>
                                                    {item.score.home} : {item.score.away}
                                                </Text>
                                            ) : item.status === "canceled" ? (
                                                <Text style={styles.canceledText}>
                                                    {item.note || "취소"}
                                                </Text>
                                            ) : (
                                                <Text style={styles.vsText}>VS</Text>
                                            )}
                                            <View style={styles.matchSide}>
                                                <TeamName team={item.away} />
                                                <Text style={styles.sideLabel}>원정</Text>
                                            </View>
                                        </View>

                                        {/* 박스스코어가 있는 경기만 기록·평점 화면으로 */}
                                        {item.hasBox && (
                                            <TouchableOpacity
                                                style={styles.detailBtn}
                                                onPress={() => {
                                                    setModalVisible(false);
                                                    navigation.navigate("GameRating", {
                                                        source: "firestore",
                                                        gameId: item.gameId,
                                                    });
                                                }}
                                            >
                                                <Text style={styles.detailText}>
                                                    경기 기록·평점 보기 ›
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.closeBtn}
                        >
                            <Text style={styles.closeText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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

    // 월 이동
    monthBar: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    monthBtn: { color: COLORS.subText, fontSize: 14, marginHorizontal: 16 },
    monthText: { color: COLORS.subText, fontSize: 14 },

    // 팀 필터
    filterScroll: { marginTop: 24, flexGrow: 0 },
    filterBtn: {
        flexDirection: "row",
        alignItems: "center",
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: COLORS.chip,
        marginRight: 8,
    },
    filterActive: { backgroundColor: COLORS.accent },
    filterBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },

    // 캘린더
    calendarCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 6,
        marginTop: 20,
    },
    weekRow: {
        flexDirection: "row",
        paddingBottom: 10,
        marginBottom: 6,
        borderBottomWidth: 1,
        borderColor: COLORS.divider,
    },
    weekText: {
        width: "14.2857%",
        textAlign: "center",
        color: COLORS.subText,
        fontSize: 12,
    },
    calendar: { flexDirection: "row", flexWrap: "wrap" },
    dayBox: {
        width: "14.2857%",
        height: 52,
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircleGame: { backgroundColor: COLORS.rowDirect },
    dayCircleToday: { backgroundColor: COLORS.accent },
    dayText: { color: COLORS.text, fontSize: 14 },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginTop: 3,
        backgroundColor: "transparent",
    },
    dotActive: { backgroundColor: COLORS.accent },

    // 범례
    legend: { marginTop: 12 },
    legendItem: { flexDirection: "row", alignItems: "center" },
    legendText: { color: COLORS.subText, fontSize: 12 },

    // 팀 표시
    teamWrap: { flexDirection: "row", alignItems: "center" },
    teamDot: { marginRight: 6 },
    teamText: { color: COLORS.text, fontSize: 17, fontWeight: "700" },

    // 팝업
    modalBg: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBox: {
        width: "88%",
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.divider,
        padding: 22,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 16,
    },
    empty: { color: COLORS.subText, textAlign: "center" },
    gameBox: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    gameInfoRow: { flexDirection: "row", justifyContent: "space-between" },
    gameInfo: { color: COLORS.subText, fontSize: 13 },
    stadiumInfo: { flexShrink: 1, marginLeft: 12, textAlign: "right" },
    matchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        marginTop: 14,
    },
    matchSide: { alignItems: "center", width: 90 },
    sideLabel: { color: COLORS.subText, fontSize: 11, marginTop: 4 },
    scoreText: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
    canceledText: { color: COLORS.sunday, fontSize: 14, fontWeight: "700" },
    errorText: { color: COLORS.sunday, fontSize: 13, textAlign: "center", marginTop: 10 },
    sourceText: { color: COLORS.subText, fontSize: 11, marginTop: 8 },
    vsText: { color: COLORS.accent, fontSize: 16, fontWeight: "700" },
    detailBtn: { alignSelf: "flex-end", marginTop: 10 },
    detailText: { color: COLORS.accent, fontSize: 13, fontWeight: "700" },
    closeBtn: {
        marginTop: 6,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    closeText: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
});
