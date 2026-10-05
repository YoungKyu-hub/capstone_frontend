import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LEAGUES, useLeague } from "../context/LeagueContext";

const COLORS = {
    chip: "#2C2C3E",
    text: "#FFFFFF",
    subText: "#C4C4C4",
    accent: "#E8826B",
};

/**
 * KBO 리그 / 퓨처스리그 세그먼트 토글
 * 고른 값은 LeagueContext 에 저장돼서 모든 화면이 같이 쓴다.
 * @param onChange 리그가 바뀔 때 화면에서 추가로 할 일 (선택)
 */
export default function LeagueToggle({ style, onChange }) {
    const { league, setLeague } = useLeague();

    return (
        <View style={[styles.wrap, style]}>
            {Object.values(LEAGUES).map((item) => {
                const active = league === item.key;
                return (
                    <TouchableOpacity
                        key={item.key}
                        style={[styles.segment, active && styles.segmentActive]}
                        activeOpacity={0.8}
                        onPress={() => {
                            if (active) return;
                            setLeague(item.key);
                            onChange?.(item.key);
                        }}
                    >
                        <Text style={[styles.text, active && styles.textActive]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        backgroundColor: COLORS.chip,
        borderRadius: 22,
        padding: 4,
    },
    segment: {
        flex: 1,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    segmentActive: { backgroundColor: COLORS.accent },
    text: { color: COLORS.subText, fontSize: 14, fontWeight: "700" },
    textActive: { color: COLORS.text },
});
