// ===== 경기장 날씨 계산 =====
// 한 시간 모양: { time, tmp 기온, pop 강수확률, pcp 강수량, sky 하늘, pty 강수형태, wsd 풍속, vec 풍향 }
//  - 예보(기상청 단기예보): pop 있음
//  - 관측(기상청 ASOS 시간자료, 지난 경기): pop 없음(null) → 실제 강수량(pcp)으로 판단
//    백엔드 weather.py 가 만들어 schedules 의 경기마다 weather: { source:"asos", station, totalPcp, hourly } 로 저장

// 하늘 상태 → Ionicons 아이콘 이름
// SKY: 1 맑음, 3 구름많음, 4 흐림 / PTY: 0 없음, 1 비, 2 비/눈, 3 눈, 4 소나기
export function weatherIcon({ sky, pty }) {
    if (pty === 1 || pty === 2 || pty === 4) return "rainy";
    if (pty === 3) return "snow";
    if (sky === 1) return "sunny";
    if (sky === 3) return "partly-sunny";
    return "cloudy";
}

// 관측값인지 (강수확률이 하나도 없으면 관측)
export const isObserved = (hourly) => hourly.every((h) => h.pop == null);

export const totalPcp = (hourly) =>
    Math.round(hourly.reduce((sum, h) => sum + (h.pcp || 0), 0) * 10) / 10;

// 비 단계: 예보는 강수확률, 관측은 실제 강수량 기준
export const RAIN_LEVEL = {
    low: { label: "낮음", color: "#4CAF7A" },
    mid: { label: "보통", color: "#E8C26B" },
    high: { label: "높음", color: "#E8826B" },
};

export function rainLevel(hourly) {
    const total = totalPcp(hourly);
    if (isObserved(hourly)) {
        const maxPcp = Math.max(...hourly.map((h) => h.pcp || 0));
        if (total >= 5 || maxPcp >= 2) return "high";
        if (total > 0) return "mid";
        return "low";
    }
    const maxPop = Math.max(...hourly.map((h) => h.pop || 0));
    if (maxPop >= 60 || total >= 5) return "high";
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
// extra: { canceled, beforePcp(0시~경기 전 강수량), station } — 관측 자료일 때만 사용
export function weatherSummary(hourly, wind, extra = {}) {
    const level = rainLevel(hourly);
    if (isObserved(hourly)) {
        // 지난 경기: 실제로 어땠는지 (과거형)
        const total = totalPcp(hourly);
        const before = extra.beforePcp || 0;
        if (extra.canceled) {
            if (before > 0 && total > 0) return `경기 전 ${before}mm, 경기 시간에도 ${total}mm 비가 내렸어요`;
            if (before > 0) return `경기 시간엔 그쳤지만, 경기 전에 비가 ${before}mm 내렸어요`;
            if (total > 0) return `경기 시간에 비가 ${total}mm 내렸어요`;
            return `${extra.station || ""} 관측소에는 비 기록이 없어요. 구장 주변 비나 그라운드 사정으로 취소됐을 수 있어요`;
        }
        if (level === "high") return `경기 시간에 비가 ${total}mm 내렸어요`;
        if (level === "mid") return `경기 중 약한 비(${total}mm)가 있었어요`;
        if (wind.effect === "hitter") return "외야로 부는 바람이 있던 경기였어요";
        if (wind.effect === "pitcher") return "홈 쪽으로 부는 바람이 있던 경기였어요";
        return "비 없이 경기하기 좋은 날씨였어요";
    }
    if (level === "high") return "경기 중 비 예보가 있어 우천 취소나 중단 가능성이 있어요";
    if (wind.effect === "hitter") return "외야로 부는 바람이 있어 타격전이 예상돼요";
    if (wind.effect === "pitcher") return "홈 쪽으로 부는 바람이 있어 투수전이 예상돼요";
    if (level === "mid") return "비 소식이 조금 있지만 경기 진행에는 큰 문제 없을 것 같아요";
    return "날씨가 경기에 큰 영향을 주지 않을 것 같아요";
}
