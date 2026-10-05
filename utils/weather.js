// ===== 경기장 날씨 계산 =====
// 기상청 단기예보 값(TMP 기온, POP 강수확률, PCP 강수량, SKY 하늘, PTY 강수형태,
// WSD 풍속, VEC 풍향)을 받아 바텀시트에 보여줄 정보로 바꾼다.

// 하늘 상태 → Ionicons 아이콘 이름
// SKY: 1 맑음, 3 구름많음, 4 흐림 / PTY: 0 없음, 1 비, 2 비/눈, 3 눈, 4 소나기
export function weatherIcon({ sky, pty }) {
    if (pty === 1 || pty === 2 || pty === 4) return "rainy";
    if (pty === 3) return "snow";
    if (sky === 1) return "sunny";
    if (sky === 3) return "partly-sunny";
    return "cloudy";
}

// 우천 취소 가능성: 경기 시간대 중 가장 높은 강수확률 기준
export const RAIN_LEVEL = {
    low: { label: "낮음", color: "#4CAF7A" },
    mid: { label: "보통", color: "#E8C26B" },
    high: { label: "높음", color: "#E8826B" },
};

export function rainLevel(hourly) {
    const maxPop = Math.max(...hourly.map((h) => h.pop));
    const totalPcp = hourly.reduce((sum, h) => sum + (h.pcp || 0), 0);
    if (maxPop >= 60 || totalPcp >= 5) return "high";
    if (maxPop >= 30) return "mid";
    return "low";
}

// 풍향을 구장 기준으로 바꾸기
// vec: 기상청 풍향(바람이 "불어오는" 방향, 0 = 북풍)
// cfBearing: 홈플레이트에서 중견수 쪽을 바라본 방위각
// 반환 angle: 0 = 외야로 부는 바람, 180 = 홈 쪽으로 부는 바람 (화살표 회전에 사용)
export function windToField(vec, wsd, cfBearing) {
    const blowingTo = (vec + 180) % 360; // 바람이 "불어가는" 방향
    let angle = (blowingTo - cfBearing + 360) % 360;
    const diff = angle > 180 ? 360 - angle : angle; // 0~180

    let label;
    let effect; // "hitter" | "pitcher" | null
    if (wsd < 1.5) {
        label = "바람 약함";
        effect = null;
    } else if (diff <= 45) {
        label = "외야로 부는 바람 · 홈런에 유리";
        effect = "hitter";
    } else if (diff >= 135) {
        label = "홈 쪽으로 부는 바람 · 투수에 유리";
        effect = "pitcher";
    } else {
        label = "옆바람 · 영향 적음";
        effect = null;
    }
    return { angle, label, effect };
}

// 16방위 이름
export function windDirName(vec) {
    const names = ["북", "북북동", "북동", "동북동", "동", "동남동", "남동", "남남동",
        "남", "남남서", "남서", "서남서", "서", "서북서", "북서", "북북서"];
    return names[Math.round(vec / 22.5) % 16] + "풍";
}

// 바텀시트 맨 아래 한 줄 요약
export function weatherSummary(hourly, wind) {
    const level = rainLevel(hourly);
    if (level === "high") return "경기 중 비 예보가 있어 우천 취소나 중단 가능성이 있어요";
    if (wind.effect === "hitter") return "외야로 부는 바람이 있어 타격전이 예상돼요";
    if (wind.effect === "pitcher") return "홈 쪽으로 부는 바람이 있어 투수전이 예상돼요";
    if (level === "mid") return "비 소식이 조금 있지만 경기 진행에는 큰 문제 없을 것 같아요";
    return "날씨가 경기에 큰 영향을 주지 않을 것 같아요";
}
