import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ScrollView,
    StatusBar,
    ActivityIndicator,
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
import MomStrip from "../components/MomStrip";
import { rateGame } from "../utils/playerRating";
import {
    useFirestoreDoc,
    useMonthSchedules,
    fetchLatestScheduleDate,
} from "../utils/firestoreData";
import LeagueToggle from "../components/LeagueToggle";
import { useLeague } from "../context/LeagueContext";
import { FUTURES_PREDICT_GAMES, FUTURES_STADIUMS } from "../data/futuresMock";

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
    result: "#3BA98B", // 경기 결과 표시 색 (내 선택 주황과 구분)
};

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 퓨처스(임시 데이터) 날짜: "4/13"
const FUTURES_DATES = Object.keys(FUTURES_PREDICT_GAMES);
const futuresLabel = (dateStr) => {
    const [month, day] = dateStr.split("/").map(Number);
    return `${dateStr} (${WEEK[new Date(2026, month - 1, day).getDay()]})`;
};

// KBO(Firestore) 날짜: "2026-06-04" → "6/4 (목)"
const kboLabel = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return `${m}/${d} (${WEEK[new Date(y, m - 1, d).getDay()]})`;
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

// ===== 경기 종료 카드: 점수 + 내 선택/실제 결과 + MOM =====
function FinishedCard({ item, score, mom, momLoading, picked, options, onOpenRatings }) {

    // 실제 결과: 홈팀 이름 / 원정팀 이름 / "draw"
    const outcome =
        score.home > score.away ? item.home : score.away > score.home ? item.away : "draw";
    const hit = picked === outcome;

    let status = { text: "예측 안 함", style: styles.statusNone };
    if (picked) {
        status = hit
            ? { text: "✓ 예측 적중", style: styles.statusHit }
            : { text: "✗ 예측 실패", style: styles.statusMiss };
    }

    return (
        <View style={styles.card}>
            {/* 상단: 경기 종료 + 적중 여부 */}
            <View style={styles.topRow}>
                <View style={styles.finalChip}>
                    <Text style={styles.finalChipText}>경기 종료</Text>
                </View>
                <View style={[styles.statusBadge, status.style]}>
                    <Text style={styles.statusText}>{status.text}</Text>
                </View>
            </View>

            {/* 팀 + 점수 */}
            <View style={styles.vsRow}>
                <TeamBadge team={item.home} side="홈" />
                <View style={styles.scoreBox}>
                    <Text style={[styles.scoreNum, score.home < score.away && styles.scoreLose]}>
                        {score.home}
                    </Text>
                    <Text style={styles.scoreColon}>:</Text>
                    <Text style={[styles.scoreNum, score.away < score.home && styles.scoreLose]}>
                        {score.away}
                    </Text>
                </View>
                <TeamBadge team={item.away} side="원정" />
            </View>

            {/* 승/무/패: 내 선택(주황) / 실제 결과(초록) */}
            <View style={styles.buttonContainer}>
                {options.map((opt) => {
                    const isPicked = picked === opt.value;
                    const isResult = outcome === opt.value;
                    return (
                        <View
                            key={opt.value}
                            style={[
                                styles.predictButton,
                                isPicked && styles.selected,
                                isResult && styles.resultButton,
                                isPicked && isResult && styles.hitButton,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.buttonText,
                                    !isPicked && !isResult && styles.buttonTextDim,
                                ]}
                            >
                                {isPicked && isResult ? "✓ " : ""}
                                {opt.label}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* 색 안내 */}
            <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
                <Text style={styles.legendText}>내 선택</Text>
                <View style={[styles.legendDot, { backgroundColor: COLORS.result, marginLeft: 12 }]} />
                <Text style={styles.legendText}>경기 결과</Text>
            </View>

            {/* MOM (경기 기록이 있는 경기만) */}
            {momLoading ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 12 }} />
            ) : (
                <MomStrip mom={mom} />
            )}

            {/* 전체 평점 화면으로 */}
            {onOpenRatings ? (
                <TouchableOpacity style={styles.ratingsLink} onPress={onOpenRatings} hitSlop={8}>
                    <Text style={styles.ratingsLinkText}>전체 평점 보기 ›</Text>
                </TouchableOpacity>
            ) : (
                !momLoading && <Text style={styles.noBoxText}>경기 기록이 아직 없어요</Text>
            )}
        </View>
    );
}

// Firestore 경기 종료 카드: games/<gameId> 에서 박스스코어를 읽어 MOM 계산
function FirestoreFinishedCard({ item, picked, options, navigation }) {
    const { data: game, loading } = useFirestoreDoc("games", item.hasBox ? item.gameId : null);
    const mom = useMemo(
        () =>
            game?.box
                ? rateGame({ home: item.home, away: item.away, score: game.score, box: game.box }).mom
                : null,
        [game, item.home, item.away]
    );

    return (
        <FinishedCard
            item={item}
            score={item.score}
            mom={mom}
            momLoading={loading}
            picked={picked}
            options={options}
            onOpenRatings={
                item.hasBox
                    ? () => navigation.navigate("GameRating", { source: "firestore", gameId: item.gameId })
                    : null
            }
        />
    );
}

// 취소된 경기 카드
function CanceledCard({ item }) {
    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.finalChip}>
                    <Text style={styles.finalChipText}>경기 취소</Text>
                </View>
                {!!item.stadium && <Text style={styles.stadiumText}>{item.stadium}</Text>}
            </View>
            <View style={[styles.vsRow, { marginBottom: 4 }]}>
                <TeamBadge team={item.home} side="홈" />
                <Text style={[styles.vsText, { color: COLORS.subText }]}>VS</Text>
                <TeamBadge team={item.away} side="원정" />
            </View>
            <Text style={styles.canceledNote}>{item.note || "취소"}</Text>
        </View>
    );
}

export default function PredictScreen({ navigation }) {
    const { isFutures } = useLeague();
    // 내 예측 (키: KBO 는 gameId, 퓨처스는 "날짜-id") — 나중에 Firestore 사용자 기록에 저장
    const [selectedPredict, setSelectedPredict] = useState({});

    // ===== KBO: Firestore 일정 =====
    // 처음엔 이번 달, 데이터가 있는 가장 최근 날짜를 찾으면 그 달·그 날짜로 이동
    const now = new Date();
    const [kboMonth, setKboMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
    const [kboDate, setKboDate] = useState(null);
    const {
        data: monthGames,
        loading: kboLoading,
        error: kboError,
        reload: kboReload,
    } = useMonthSchedules(kboMonth.year, kboMonth.month, !isFutures);

    const latestChecked = useRef(false);
    useEffect(() => {
        if (isFutures || latestChecked.current) return;
        latestChecked.current = true;
        fetchLatestScheduleDate()
            .then((latest) => {
                if (!latest) return;
                const [y, m] = latest.split("-").map(Number);
                // 오늘 날짜에 경기 데이터가 없으면 최근 데이터 날짜로
                const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                if (latest < todayIso) {
                    setKboMonth({ year: y, month: m - 1 });
                    setKboDate(latest);
                }
            })
            .catch((e) => console.warn("[firestore] 최근 일정 날짜 읽기 실패", e));
    }, [isFutures]);

    const kboDates = useMemo(() => Object.keys(monthGames).sort(), [monthGames]);
    // 고른 날짜가 이 달에 없으면 이 달의 마지막 경기 날짜
    const activeKboDate = kboDates.includes(kboDate) ? kboDate : kboDates[kboDates.length - 1];

    // ===== 퓨처스: 임시 데이터 =====
    const [futuresDate, setFuturesDate] = useState(FUTURES_DATES[0]);

    const selectedDate = isFutures ? futuresDate : activeKboDate;
    const setSelectedDate = isFutures ? setFuturesDate : setKboDate;
    const dates = isFutures ? FUTURES_DATES : kboDates;
    const dateLabel = (d) => (d ? (isFutures ? futuresLabel(d) : kboLabel(d)) : "");
    const games = isFutures
        ? FUTURES_PREDICT_GAMES[futuresDate] || []
        : (activeKboDate && monthGames[activeKboDate]) || [];

    // 날짜 칩: 최근 날짜(오른쪽 끝)가 보이도록
    const dateScroll = useRef(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [weatherVisible, setWeatherVisible] = useState(false);
    const [weatherMatch, setWeatherMatch] = useState(null);

    const renderGameCard = ({ item }) => {
        // KBO 는 gameId, 퓨처스는 날짜 + 경기 id 로 예측 저장
        const predictKey = item.gameId || `${selectedDate}-${item.id}`;
        const picked = selectedPredict[predictKey];
        const stadium = STADIUMS[item.home];
        const hourly = WEATHER[predictKey]; // 기상청 연동 전이라 실제 경기엔 아직 없음

        const options = [
            { value: item.home, label: `${item.home} 승` },
            { value: "draw", label: "무승부" },
            { value: item.away, label: `${item.away} 승` },
        ];

        // 경기 종료 → 결과 카드 (점수 + MOM)
        if (item.status === "final" && item.score) {
            return (
                <FirestoreFinishedCard
                    item={item}
                    picked={picked}
                    options={options}
                    navigation={navigation}
                />
            );
        }
        // 취소
        if (item.status === "canceled") return <CanceledCard item={item} />;

        // 퓨처스리그 경기 카드: 날씨·전력분석 데이터가 아직 없어서 예측만
        if (isFutures) {
            return (
                <View style={styles.card}>
                    <View style={styles.topRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.timeText}>🕒 {item.time}</Text>
                            <Text style={styles.stadiumText} numberOfLines={1}>
                                {FUTURES_STADIUMS[item.home] || ""}
                            </Text>
                        </View>
                        <View style={styles.futuresChip}>
                            <Text style={styles.futuresChipText}>퓨처스</Text>
                        </View>
                    </View>

                    <View style={styles.vsRow}>
                        <TeamBadge team={item.home} side="홈" />
                        <Text style={styles.vsText}>VS</Text>
                        <TeamBadge team={item.away} side="원정" />
                    </View>

                    <View style={[styles.buttonContainer, { marginBottom: 0 }]}>
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
                </View>
            );
        }

        return (
            <View style={styles.card}>
                {/* 상단: 시간·구장 + 날씨 칩 + 전력분석 */}
                <View style={styles.topRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.timeText}>🕒 {item.time}</Text>
                        {(item.stadium || stadium) && (
                            <Text style={styles.stadiumText} numberOfLines={1}>
                                {item.stadium || stadium.name}
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

                {/* AI 코멘트 (아직 실제 경기엔 없음) */}
                {!!item.aiComment && (
                    <View style={styles.aiBox}>
                        <Text style={styles.aiTitle}>AI 참고 멘트</Text>
                        <Text style={styles.aiComment}>{item.aiComment}</Text>
                    </View>
                )}
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

            {/* 리그 선택: KBO 리그 / 퓨처스리그 */}
            <LeagueToggle style={{ marginTop: 20 }} />

            {/* 날짜 선택 */}
            <ScrollView
                ref={dateScroll}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateContainer}
                onContentSizeChange={() => {
                    if (!isFutures && selectedDate === dates[dates.length - 1]) {
                        dateScroll.current?.scrollToEnd({ animated: false });
                    }
                }}
            >
                {dates.map((date) => {
                    const active = selectedDate === date;
                    return (
                        <TouchableOpacity
                            key={date}
                            style={[styles.dateButton, active && styles.selectedDate]}
                            onPress={() => setSelectedDate(date)}
                        >
                            <Text style={styles.dateText}>
                                {dateLabel(date)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* 자료 출처 (KBO 실제 데이터) */}
            {!isFutures && kboDates.length > 0 && (
                <Text style={styles.sourceNote}>자료 출처: KBO</Text>
            )}
        </View>
    );

    // 목록이 비었을 때: 불러오는 중 / 오류 / 경기 없음
    let emptyView = <Text style={styles.empty}>예정된 경기가 없습니다.</Text>;
    if (!isFutures && kboLoading) {
        emptyView = <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />;
    } else if (!isFutures && kboError) {
        emptyView = (
            <TouchableOpacity onPress={kboReload} style={{ marginTop: 40 }}>
                <Text style={styles.empty}>경기 정보를 불러오지 못했어요. 눌러서 다시 시도</Text>
            </TouchableOpacity>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="light-content" />

            <FlatList
                data={games}
                keyExtractor={(item) => item.gameId || `${selectedDate}-${item.id}`}
                renderItem={renderGameCard}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={emptyView}
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
                dateLabel={dateLabel(selectedDate)}
                stadium={weatherMatch && STADIUMS[weatherMatch.home]}
                hourly={
                    weatherMatch && WEATHER[weatherMatch.gameId || `${selectedDate}-${weatherMatch.id}`]
                }
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
    futuresChip: {
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: COLORS.accent,
        justifyContent: "center",
    },
    futuresChipText: { color: COLORS.accent, fontSize: 12, fontWeight: "700" },

    // 경기 종료 카드
    resultButton: { backgroundColor: COLORS.result },
    hitButton: { borderWidth: 2, borderColor: COLORS.accent }, // 적중: 결과 색 + 주황 테두리
    buttonTextDim: { color: COLORS.subText },
    finalChip: {
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 13,
        backgroundColor: COLORS.chip,
        justifyContent: "center",
    },
    finalChipText: { color: COLORS.subText, fontSize: 12, fontWeight: "700" },
    statusBadge: {
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 13,
        justifyContent: "center",
    },
    statusHit: { backgroundColor: COLORS.result },
    statusMiss: { backgroundColor: "#5A2E2E" },
    statusNone: { backgroundColor: COLORS.chip },
    statusText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
    scoreBox: { flexDirection: "row", alignItems: "center" },
    scoreNum: { color: COLORS.text, fontSize: 34, fontWeight: "800", width: 44, textAlign: "center" },
    scoreLose: { color: COLORS.subText },
    scoreColon: { color: COLORS.subText, fontSize: 26, fontWeight: "700", marginHorizontal: 2 },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: -6,
        marginBottom: 12,
    },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    legendText: { color: COLORS.subText, fontSize: 11 },
    ratingsLink: { alignSelf: "flex-end", marginTop: 10 },
    ratingsLinkText: { color: COLORS.accent, fontSize: 13, fontWeight: "700" },
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
    sourceNote: { color: COLORS.subText, fontSize: 11, textAlign: "right", marginTop: 4 },
    noBoxText: { color: COLORS.subText, fontSize: 12, textAlign: "right", marginTop: 10 },
    canceledNote: { color: COLORS.subText, fontSize: 13, textAlign: "center", marginTop: 8 },

});
