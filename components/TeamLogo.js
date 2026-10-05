import React from "react";
import { View, Image, StyleSheet } from "react-native";

// 팀 이름 → 로고 이미지
const LOGOS = {
    LG: require("../assets/teams/lg.png"),
    두산: require("../assets/teams/doosan.png"),
    SSG: require("../assets/teams/ssg.png"),
    롯데: require("../assets/teams/lotte.png"),
    삼성: require("../assets/teams/samsung.png"),
    KIA: require("../assets/teams/kia.png"),
    기아: require("../assets/teams/kia.png"),
    한화: require("../assets/teams/hanwha.png"),
    KT: require("../assets/teams/kt.png"),
    NC: require("../assets/teams/nc.png"),
    키움: require("../assets/teams/kiwoom.png"),
    고양: require("../assets/teams/kiwoom.png"), // 키움 퓨처스팀(고양 히어로즈)
};

// 로고가 없는 팀일 때 대신 보여줄 팀 색
const FALLBACK_COLORS = {
    LG: "#C30037",
    두산: "#131230",
    SSG: "#CE0E2D",
    롯데: "#041E42",
    삼성: "#074CA1",
    KIA: "#EA0029",
    한화: "#FF6600",
    KT: "#000000",
    NC: "#315288",
    키움: "#570514",
    상무: "#2E5E3A", // 퓨처스리그 전용 팀 (로고 이미지 없으면 색 원)
    울산: "#1B3B6F",
};

/**
 * 팀 로고
 * @param team 팀 이름 (예: "LG", "두산")
 * @param size 로고 크기 (기본 20)
 * @param style 추가 스타일 (여백 등)
 */
export default function TeamLogo({ team, size = 20, style }) {
    const source = LOGOS[team];

    if (!source) {
        return (
            <View
                style={[
                    {
                        width: size * 0.6,
                        height: size * 0.6,
                        borderRadius: size * 0.3,
                        backgroundColor: FALLBACK_COLORS[team] || "#888",
                        margin: size * 0.2,
                    },
                    style,
                ]}
            />
        );
    }

    return (
        <Image
            source={source}
            style={[styles.logo, { width: size, height: size }, style]}
            resizeMode="contain"
        />
    );
}

const styles = StyleSheet.create({
    logo: {},
});
