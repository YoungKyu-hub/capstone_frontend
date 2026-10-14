// ===== 구장 정보 (일정 표의 구장 이름 → 정식 이름·돔 여부·방향) =====
// cfBearing: 홈플레이트에서 중견수 쪽 방위각(도) — data/predictMock.js 에서 옮긴 임시값, 실제 구장 방향 확인 필요
// station: 날씨 관측소 (백엔드 importer/weather.py 와 같게)
import { STADIUMS } from "../data/predictMock";

export const STADIUM_INFO = {
    잠실: { name: "잠실야구장", dome: false, cfBearing: 0, station: "서울" },
    고척: { name: "고척스카이돔", dome: true, cfBearing: 0, station: "서울" },
    문학: { name: "인천SSG랜더스필드", dome: false, cfBearing: 20, station: "인천" },
    수원: { name: "수원 KT위즈파크", dome: false, cfBearing: 45, station: "수원" },
    대전: { name: "대전 한화생명 볼파크", dome: false, cfBearing: 350, station: "대전" },
    대구: { name: "대구 삼성라이온즈파크", dome: false, cfBearing: 15, station: "대구" },
    광주: { name: "광주-기아 챔피언스 필드", dome: false, cfBearing: 30, station: "광주" },
    사직: { name: "사직야구장", dome: false, cfBearing: 340, station: "부산" },
    창원: { name: "창원NC파크", dome: false, cfBearing: 10, station: "창원" },
};

/** 경기(item: { stadium, home }) → 구장 정보. 일정에 구장 이름이 없으면 홈팀 기준 임시값 */
export function stadiumOf(item) {
    if (!item) return null;
    return STADIUM_INFO[item.stadium] || STADIUMS[item.home] || null;
}
