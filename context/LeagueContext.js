import React, { createContext, useContext, useState } from "react";

// ===== 리그 선택 (KBO 리그 / 퓨처스리그) =====
// 기록실에서 고른 리그가 다른 화면에도 그대로 유지되도록 앱 전체에서 공유한다.

export const LEAGUES = {
    KBO: { key: "KBO", label: "KBO 리그" },
    FUTURES: { key: "FUTURES", label: "퓨처스리그" },
};

const LeagueContext = createContext({
    league: "KBO",
    setLeague: () => {},
});

export function LeagueProvider({ children }) {
    const [league, setLeague] = useState("KBO");
    return (
        <LeagueContext.Provider value={{ league, setLeague }}>
            {children}
        </LeagueContext.Provider>
    );
}

// 사용법: const { league, setLeague, isFutures } = useLeague();
export function useLeague() {
    const { league, setLeague } = useContext(LeagueContext);
    return { league, setLeague, isFutures: league === "FUTURES" };
}
