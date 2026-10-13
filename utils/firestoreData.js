// ===== Firestore 경기 데이터 읽기 =====
// 백엔드(upload_firestore.py)가 올린 rankings / h2h / schedules / games 문서를 읽는다.
// 같은 문서는 앱이 켜져 있는 동안 한 번만 불러오도록 메모리에 저장해 둔다.

import { useCallback, useEffect, useState } from "react";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { db } from "../firebase";

const cache = new Map(); // "rankings/kbo" → 데이터 (없는 문서는 null)

export async function fetchDoc(collection, id, { force = false } = {}) {
    const key = `${collection}/${id}`;
    if (!force && cache.has(key)) return cache.get(key);
    const snap = await getDoc(doc(db, collection, id));
    const data = snap.exists() ? snap.data() : null;
    cache.set(key, data);
    return data;
}

/**
 * 문서 하나를 읽는 훅
 * 사용: const { data, loading, error, reload } = useFirestoreDoc("rankings", "kbo");
 * id 가 비어 있으면 아무것도 읽지 않는다.
 */
export function useFirestoreDoc(collection, id) {
    const key = id ? `${collection}/${id}` : null;
    const [state, setState] = useState(() => ({
        data: key && cache.has(key) ? cache.get(key) : null,
        loading: !!key && !cache.has(key),
        error: null,
    }));

    const load = useCallback(
        async (force = false) => {
            if (!key) {
                setState({ data: null, loading: false, error: null });
                return;
            }
            if (!force && cache.has(key)) {
                setState({ data: cache.get(key), loading: false, error: null });
                return;
            }
            setState((s) => ({ ...s, loading: true, error: null }));
            try {
                const data = await fetchDoc(collection, id, { force });
                setState({ data, loading: false, error: null });
            } catch (e) {
                console.warn(`[firestore] ${key} 읽기 실패`, e);
                setState({ data: null, loading: false, error: e });
            }
        },
        [collection, id, key]
    );

    useEffect(() => {
        load();
    }, [load]);

    return { ...state, reload: () => load(true) };
}

// "2026-10-14T03:12:00+00:00" → "10월 14일"
export function formatUpdated(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ===== 일정: 한 달치 schedules 문서 읽기 =====

const monthCache = new Map(); // "2026-06" → { "2026-06-02": [경기…], … }

export async function fetchMonthSchedules(year, month) {
    const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
    if (monthCache.has(ym)) return monthCache.get(ym);
    // 문서 ID 와 date 필드가 "YYYY-MM-DD" 라서 문자열 범위로 한 달을 고를 수 있음
    const q = query(
        collection(db, "schedules"),
        where("date", ">=", `${ym}-01`),
        where("date", "<=", `${ym}-31`)
    );
    const snap = await getDocs(q);
    const byDate = {};
    snap.forEach((d) => {
        const data = d.data();
        byDate[data.date] = data.games || [];
    });
    monthCache.set(ym, byDate);
    return byDate;
}

/**
 * 한 달 일정 훅. enabled 가 false 면(퓨처스 등) 읽지 않음.
 * 사용: const { data, loading, error, reload } = useMonthSchedules(2026, 5);  // month 는 0~11
 */
export function useMonthSchedules(year, month, enabled = true) {
    const [state, setState] = useState({ data: {}, loading: enabled, error: null });

    const load = useCallback(
        async (force = false) => {
            if (!enabled) {
                setState({ data: {}, loading: false, error: null });
                return;
            }
            const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
            if (force) monthCache.delete(ym);
            setState((s) => ({ ...s, loading: true, error: null }));
            try {
                const data = await fetchMonthSchedules(year, month);
                setState({ data, loading: false, error: null });
            } catch (e) {
                console.warn(`[firestore] schedules ${ym} 읽기 실패`, e);
                setState({ data: {}, loading: false, error: e });
            }
        },
        [year, month, enabled]
    );

    useEffect(() => {
        load();
    }, [load]);

    return { ...state, reload: () => load(true) };
}

/** 데이터가 있는 가장 최근 경기 날짜 ("2026-06-30") — 일정 화면을 처음 열 때 그 달로 이동 */
export async function fetchLatestScheduleDate() {
    const q = query(collection(db, "schedules"), orderBy("date", "desc"), limit(1));
    const snap = await getDocs(q);
    let latest = null;
    snap.forEach((d) => {
        latest = d.data().date;
    });
    return latest;
}
