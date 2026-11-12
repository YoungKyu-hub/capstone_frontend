import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

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
    // 지난 시즌 순위표의 옛 팀 이름 (같은 구단)
    넥센: require("../assets/teams/kiwoom.png"), // ~2018 넥센 히어로즈 → 키움
    SK: require("../assets/teams/ssg.png"), // ~2020 SK 와이번스 → SSG
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

// 로고가 없는 특별 팀: 회색 원 + 글자 (퓨처스 교류전 상대·올스타전)
const TEXT_BADGES = {
    소프트뱅크: "SB",
    북부: "북부",
    남부: "남부",
};

/**
 * 팀 로고
 * @param team 팀 이름 (예: "LG", "두산")
 * @param size 로고 크기 (기본 20)
 * @param style 추가 스타일 (여백 등)
 */
export default function TeamLogo({ team, size = 20, style }) {
    const source = LOGOS[team];

    const badgeText = TEXT_BADGES[team];
    if (!source && badgeText) {
        return (
            <View
                style={[
                    styles.textBadge,
                    { width: size, height: size, borderRadius: size / 2 },
                    style,
                ]}
            >
                <Text
                    style={[styles.textBadgeText, { fontSize: size * (badgeText.length > 2 ? 0.26 : 0.34) }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                >
                    {badgeText}
                </Text>
            </View>
        );
    }

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
    textBadge: {
        backgroundColor: "#5A5A6E",
        alignItems: "center",
        justifyContent: "center",
    },
    textBadgeText: { color: "#FFFFFF", fontWeight: "700" },
});
