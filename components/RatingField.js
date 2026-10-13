import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

// ===== 야구장 위 선수 평점 (WhoScored 스타일) =====
// 수비 위치(pos)에 맞춰 선수를 그라운드 위에 놓고, 원 안에 평점을 보여준다.
// 지명타자와 구원 투수는 아래 "벤치" 줄에 표시한다.

const COLORS = {
    grassDark: "#2F5B2B",
    grassLight: "#356531",
    infieldGrass: "#3B6E36",
    dirt: "rgba(150, 108, 70, 0.75)",
    line: "rgba(255,255,255,0.45)",
    text: "#FFFFFF",
    subText: "#C4C4C4",
    gold: "#F5C542",
    benchBg: "#1F2E1D",
};

// 경기 기록 배지 (원 위에 작게)
function badgesOf(p) {
    const s = p.stat || {};
    const list = [];
    if (p.type === "batter") {
        if (s.hr) list.push({ text: s.hr > 1 ? `${s.hr}HR` : "HR", color: "#E8826B" });
        if (s.gwrbi) list.push({ text: "결승", color: "#3BA98B" });
        if (s.e) list.push({ text: "실책", color: "#B54848" });
    } else {
        const map = {
            W: { text: "승", color: "#3BA98B" },
            L: { text: "패", color: "#6B6B7B" },
            S: { text: "세", color: "#4F7FD9" },
            H: { text: "홀", color: "#8A6BD9" },
            BS: { text: "블론", color: "#B54848" },
        };
        if (map[s.decision]) list.push(map[s.decision]);
    }
    return list;
}

// 수비 위치 → 그라운드 좌표 (홈플레이트 기준, d = 베이스 간 거리, s = 외야 펜스 거리)
const POSITIONS = {
    포수: (g) => ({ x: g.cx, y: g.hy }),
    투수: (g) => ({ x: g.cx, y: g.hy - 0.67 * g.d }),
    "1루수": (g) => ({ x: g.cx + 0.82 * g.d, y: g.hy - 0.85 * g.d }),
    "2루수": (g) => ({ x: g.cx + 0.46 * g.d, y: g.hy - 1.47 * g.d }),
    "3루수": (g) => ({ x: g.cx - 0.82 * g.d, y: g.hy - 0.85 * g.d }),
    유격수: (g) => ({ x: g.cx - 0.46 * g.d, y: g.hy - 1.47 * g.d }),
    좌익수: (g) => ({ x: g.cx - 0.37 * g.s, y: g.hy - 0.64 * g.s }),
    중견수: (g) => ({ x: g.cx, y: g.hy - 0.8 * g.s }),
    우익수: (g) => ({ x: g.cx + 0.37 * g.s, y: g.hy - 0.64 * g.s }),
};

export const playerKey = (p) => `${p.team}-${p.name}`;

/**
 * @param players  한 팀 선수 목록 (rateGame().players 중 해당 팀)
 * @param color    팀 원 색
 * @param mom      MOM (같은 선수면 별 표시)
 * @param selectedKey / onSelect  누른 선수
 */
export default function RatingField({ players, color, mom, selectedKey, onSelect }) {
    const [w, setW] = useState(0);

    // 그라운드 크기
    const H = w * 1.1;
    const g = { cx: w / 2, hy: H - 48 };
    g.s = g.hy - 12; // 외야 펜스까지
    g.d = 0.32 * g.s; // 베이스 간 거리

    // 그라운드 위 선수: 수비 위치가 있는 타자 + 선발 투수
    const onField = players.filter(
        (p) =>
            (p.type === "batter" && POSITIONS[p.pos] && p.pos !== "투수") ||
            p.role === "starter"
    );
    // 벤치 줄: 지명타자·대타 등 + 구원 투수
    const bench = players.filter((p) => !onField.includes(p));

    const isMom = (p) => mom && playerKey(mom) === playerKey(p);

    const sq = (size, cy, extra) => ({
        position: "absolute",
        width: size,
        height: size,
        left: g.cx - size / 2,
        top: cy - size / 2,
        transform: [{ rotate: "45deg" }],
        ...extra,
    });
    const diamondCy = g.hy - 0.707 * g.d; // 1·2·3루 다이아몬드 중심
    const base = (x, y) => ({
        position: "absolute",
        width: 9,
        height: 9,
        left: x - 4.5,
        top: y - 4.5,
        backgroundColor: COLORS.text,
        transform: [{ rotate: "45deg" }],
    });

    return (
        <View>
            <View
                style={[styles.field, { height: H || 360 }]}
                onLayout={(e) => setW(e.nativeEvent.layout.width)}
            >
                {w > 0 && (
                    <>
                        {/* 잔디 줄무늬 */}
                        {[...Array(8)].map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: (w / 8) * i,
                                    width: w / 8,
                                    backgroundColor: i % 2 ? COLORS.grassLight : COLORS.grassDark,
                                }}
                            />
                        ))}

                        {/* 외야 부채꼴 (두 직선 = 파울라인, 곡선 = 펜스) */}
                        <View
                            style={sq(g.s, g.hy - g.s / Math.SQRT2, {
                                borderTopLeftRadius: g.s,
                                borderWidth: 1.5,
                                borderColor: COLORS.line,
                            })}
                        />
                        {/* 내야 흙 + 내야 잔디 */}
                        <View style={sq(g.d * 1.3, diamondCy, { backgroundColor: COLORS.dirt })} />
                        <View style={sq(g.d * 0.78, diamondCy, { backgroundColor: COLORS.infieldGrass })} />
                        {/* 마운드 */}
                        <View
                            style={{
                                position: "absolute",
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                                left: g.cx - 8,
                                top: g.hy - 0.67 * g.d - 8,
                                backgroundColor: COLORS.dirt,
                            }}
                        />
                        {/* 베이스 */}
                        <View style={base(g.cx + 0.707 * g.d, g.hy - 0.707 * g.d)} />
                        <View style={base(g.cx, g.hy - 1.414 * g.d)} />
                        <View style={base(g.cx - 0.707 * g.d, g.hy - 0.707 * g.d)} />

                        {/* 선수 */}
                        {onField.map((p) => {
                            const pos = POSITIONS[p.role === "starter" ? "투수" : p.pos](g);
                            return (
                                <View
                                    key={playerKey(p)}
                                    style={[styles.bubbleWrap, { left: pos.x - 42, top: pos.y - 38 }]}
                                >
                                    <PlayerBubble
                                        player={p}
                                        color={color}
                                        mom={isMom(p)}
                                        selected={selectedKey === playerKey(p)}
                                        onPress={() => onSelect(p)}
                                    />
                                </View>
                            );
                        })}
                    </>
                )}
            </View>

            {/* 벤치: 지명타자 + 구원 투수 */}
            {bench.length > 0 && (
                <View style={styles.bench}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.benchContent}
                    >
                        {bench.map((p) => (
                            <View key={playerKey(p)} style={styles.benchItem}>
                                <Text style={styles.benchLabel}>
                                    {p.type === "pitcher" ? "↑ 구원" : p.pos}
                                </Text>
                                <PlayerBubble
                                    player={p}
                                    color={color}
                                    mom={isMom(p)}
                                    selected={selectedKey === playerKey(p)}
                                    onPress={() => onSelect(p)}
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

// 평점 원 + 이름 + 배지
function PlayerBubble({ player, color, mom, selected, onPress }) {
    const badges = badgesOf(player);
    const label = player.type === "batter" ? `${player.order}. ${player.name}` : player.name;

    return (
        <TouchableOpacity style={styles.bubble} activeOpacity={0.8} onPress={onPress}>
            {/* 기록 배지 */}
            <View style={styles.badgeRow}>
                {badges.map((b) => (
                    <View key={b.text} style={[styles.badge, { backgroundColor: b.color }]}>
                        <Text style={styles.badgeText}>{b.text}</Text>
                    </View>
                ))}
            </View>

            <View
                style={[
                    styles.circle,
                    { backgroundColor: color },
                    mom && styles.circleMom,
                    selected && styles.circleSelected,
                ]}
            >
                <Text style={styles.rating}>{player.rating.toFixed(1)}</Text>
                {mom && (
                    <View style={styles.star}>
                        <Text style={styles.starText}>★</Text>
                    </View>
                )}
            </View>

            <Text style={styles.name} numberOfLines={1}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    field: {
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: COLORS.grassDark,
    },
    bubbleWrap: { position: "absolute", width: 84 },
    bubble: { alignItems: "center", width: 84 },
    badgeRow: { flexDirection: "row", height: 14, marginBottom: 2 },
    badge: { borderRadius: 4, paddingHorizontal: 4, marginHorizontal: 1, justifyContent: "center" },
    badgeText: { color: COLORS.text, fontSize: 9, fontWeight: "800" },
    circle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.85)",
    },
    circleMom: { borderColor: COLORS.gold, borderWidth: 3 },
    circleSelected: { transform: [{ scale: 1.12 }] },
    rating: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
    star: {
        position: "absolute",
        top: -8,
        right: -10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    starText: { color: "#3A2A00", fontSize: 12, fontWeight: "900" },
    name: {
        color: COLORS.text,
        fontSize: 11,
        fontWeight: "700",
        marginTop: 3,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // 벤치
    bench: {
        backgroundColor: COLORS.benchBg,
        borderRadius: 12,
        marginTop: 8,
        paddingVertical: 8,
    },
    benchContent: { paddingHorizontal: 8 },
    benchItem: { alignItems: "center", marginRight: 4 },
    benchLabel: { color: "#7FD88A", fontSize: 10, fontWeight: "700", marginBottom: 2 },
});
