import React from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    weatherIcon,
    rainLevel,
    RAIN_LEVEL,
    windToField,
    windDirName,
    weatherSummary,
} from "../utils/weather";

const COLORS = {
    bg: "#181829",
    card: "#222232",
    chip: "#2C2C3E",
    text: "#FFFFFF",
    subText: "#C4C4C4",
    accent: "#E8826B",
    field: "#24423A",
    infield: "#3A2E28",
    handle: "#4A4A5C",
};

/**
 * 경기장 날씨 바텀시트
 * @param visible  열림 여부
 * @param onClose  닫기
 * @param match    { home, away, time }
 * @param dateLabel 예: "4/13 (월)"
 * @param stadium  { name, cfBearing }
 * @param hourly   시간대별 날씨 배열 (data/predictMock.js 의 WEATHER 형식)
 */
export default function WeatherSheet({ visible, onClose, match, dateLabel, stadium, hourly }) {
    if (!match || !stadium || !hourly || hourly.length === 0) return null;

    const level = RAIN_LEVEL[rainLevel(hourly)];
    // 바람은 경기 시작 시각 기준
    const start = hourly[0];
    const wind = windToField(start.vec, start.wsd, stadium.cfBearing);
    const summary = weatherSummary(hourly, wind);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* 바깥 누르면 닫기 */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>

                <View style={styles.sheet}>
                    <View style={styles.handle} />

                    {/* ① 헤더 */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.stadiumName}>{stadium.name}</Text>
                            <Text style={styles.subText}>
                                {dateLabel} {match.time} · {match.away} vs {match.home}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={COLORS.subText} />
                        </TouchableOpacity>
                    </View>

                    {/* ② 우천 취소 가능성 */}
                    <View style={styles.rainBox}>
                        <Ionicons name="umbrella" size={18} color={COLORS.text} />
                        <Text style={styles.rainText}>우천 취소 가능성</Text>
                        <View style={[styles.rainBadge, { backgroundColor: level.color }]}>
                            <Text style={styles.rainBadgeText}>{level.label}</Text>
                        </View>
                    </View>

                    {/* ③ 시간대별 날씨 */}
                    <Text style={styles.sectionTitle}>시간대별 날씨</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.timeline}
                    >
                        {hourly.map((hour, i) => (
                            <View
                                key={hour.time}
                                style={[styles.hourCell, i === 0 && styles.hourCellStart]}
                            >
                                <Text style={styles.hourTime}>{i === 0 ? "경기 시작" : hour.time}</Text>
                                <Ionicons
                                    name={weatherIcon(hour)}
                                    size={24}
                                    color={hour.pty > 0 ? "#7FB2FF" : "#FFD36B"}
                                    style={{ marginVertical: 6 }}
                                />
                                <Text style={styles.hourTemp}>{hour.tmp}°</Text>
                                <Text style={styles.hourPop}>
                                    <Ionicons name="water" size={10} color="#7FB2FF" /> {hour.pop}%
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* ④ 바람 */}
                    <Text style={styles.sectionTitle}>바람</Text>
                    <View style={styles.windCard}>
                        <View style={styles.field}>
                            <View style={styles.outfield} />
                            <View style={styles.infield} />
                            <View style={styles.homePlate} />
                            <View style={[styles.arrow, { transform: [{ rotate: `${wind.angle}deg` }] }]}>
                                <Ionicons name="arrow-up" size={34} color={COLORS.accent} />
                            </View>
                        </View>
                        <View style={styles.windInfo}>
                            <Text style={styles.windDir}>{windDirName(start.vec)}</Text>
                            <Text style={styles.windSpeed}>{start.wsd} m/s</Text>
                            <Text style={styles.windLabel}>{wind.label}</Text>
                        </View>
                    </View>

                    {/* ⑤ 한 줄 요약 */}
                    <View style={styles.summaryBox}>
                        <Ionicons name="bulb-outline" size={18} color={COLORS.accent} />
                        <Text style={styles.summaryText}>{summary}</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// 야구장 그림 크기
const FIELD_W = 140;
const FIELD_H = 110;
const HOME_Y = 100; // 홈플레이트 위치
const OF = 90; // 외야 부채꼴 반지름
const IF = 34; // 내야 다이아몬드 한 변
const R2 = Math.SQRT2;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "flex-end" },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    sheet: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 36,
    },
    handle: {
        alignSelf: "center",
        width: 48,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.handle,
        marginBottom: 18,
    },

    // ① 헤더
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    stadiumName: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
    subText: { color: COLORS.subText, fontSize: 13, marginTop: 4 },

    // ② 우천 취소
    rainBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        marginTop: 18,
    },
    rainText: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginLeft: 8, flex: 1 },
    rainBadge: { paddingHorizontal: 12, height: 26, borderRadius: 13, justifyContent: "center" },
    rainBadgeText: { color: "#181829", fontSize: 13, fontWeight: "700" },

    sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginTop: 20, marginBottom: 10 },

    // ③ 시간대별
    timeline: { paddingRight: 4 },
    hourCell: {
        width: 70,
        alignItems: "center",
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        paddingVertical: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "transparent",
    },
    hourCellStart: { borderColor: COLORS.accent },
    hourTime: { color: COLORS.subText, fontSize: 11, fontWeight: "700" },
    hourTemp: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
    hourPop: { color: "#7FB2FF", fontSize: 11, marginTop: 2 },

    // ④ 바람
    windCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        padding: 14,
    },
    field: { width: FIELD_W, height: FIELD_H },
    // 정사각형을 45도 돌리고 한 모서리만 둥글게 → 홈에서 퍼지는 부채꼴
    outfield: {
        position: "absolute",
        width: OF,
        height: OF,
        left: FIELD_W / 2 - OF / 2,
        top: HOME_Y - OF / R2 - OF / 2,
        backgroundColor: COLORS.field,
        borderTopLeftRadius: OF,
        transform: [{ rotate: "45deg" }],
    },
    infield: {
        position: "absolute",
        width: IF,
        height: IF,
        left: FIELD_W / 2 - IF / 2,
        top: HOME_Y - IF / R2 - IF / 2,
        backgroundColor: COLORS.infield,
        transform: [{ rotate: "45deg" }],
    },
    homePlate: {
        position: "absolute",
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.text,
        left: FIELD_W / 2 - 3,
        top: HOME_Y - 3,
    },
    arrow: {
        position: "absolute",
        width: 34,
        height: 34,
        left: FIELD_W / 2 - 17,
        top: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    windInfo: { flex: 1, marginLeft: 14 },
    windDir: { color: COLORS.subText, fontSize: 13 },
    windSpeed: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginTop: 2 },
    windLabel: { color: COLORS.accent, fontSize: 13, fontWeight: "700", marginTop: 6, lineHeight: 18 },

    // ⑤ 요약
    summaryBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1E2A4A",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
    },
    summaryText: { color: COLORS.text, fontSize: 14, marginLeft: 8, flex: 1, lineHeight: 20 },
});
