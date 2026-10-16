import React, { useEffect, useState, useCallback } from "react";
import { getApiPerformance,type ApiPerformanceRecord } from "../../api/monitoringApi";

const PAGE_SIZE = 25;

export default function ApiPerformanceMonitor() {
    const [records, setRecords] = useState<ApiPerformanceRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [endpoint, setEndpoint] = useState("");
    const [statusCode, setStatusCode] = useState("");
    const [success, setSuccess] = useState<"" | "true" | "false">("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getApiPerformance({
                endpoint: endpoint || undefined,
                status_code: statusCode ? Number(statusCode) : undefined,
                success: success === "" ? undefined : success === "true",
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                page,
                limit: PAGE_SIZE,
            });
            setRecords(res.data.records);
            setTotal(res.data.total);
            setError(null);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Failed to load API performance data");
        } finally {
            setLoading(false);
        }
    }, [endpoint, statusCode, success, startDate, endDate, page]);

   
    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
        
    }, [endpoint, statusCode, success, startDate, endDate, page]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div style={{ padding: "24px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "20px" }}>API Performance</h1>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                <input
                    placeholder="Filter by endpoint…"
                    value={endpoint}
                    onChange={(e) => { setPage(1); setEndpoint(e.target.value); }}
                    style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px", minWidth: "200px" }}
                />
                <input
                    placeholder="Status code (e.g. 500)"
                    value={statusCode}
                    onChange={(e) => { setPage(1); setStatusCode(e.target.value); }}
                    style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px", width: "160px" }}
                />
                <select
                    value={success}
                    onChange={(e) => { setPage(1); setSuccess(e.target.value as any); }}
                    style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px" }}
                >
                    <option value="">All</option>
                    <option value="true">Success only</option>
                    <option value="false">Failures only</option>
                </select>
                <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => { setPage(1); setStartDate(e.target.value); }}
                    style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px" }}
                />
                <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => { setPage(1); setEndDate(e.target.value); }}
                    style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px" }}
                />
            </div>

            {error && <div style={{ color: "#b91c1c", marginBottom: "12px" }}>{error}</div>}

            {loading ? (
                <div>Loading…</div>
            ) : records.length === 0 ? (
                <div style={{ color: "#64748b" }}>No requests match these filters.</div>
            ) : (
                <>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                                <th style={{ padding: "8px" }}>Endpoint</th>
                                <th style={{ padding: "8px" }}>Method</th>
                                <th style={{ padding: "8px" }}>Status</th>
                                <th style={{ padding: "8px" }}>Response Time</th>
                                <th style={{ padding: "8px" }}>Timestamp</th>
                                <th style={{ padding: "8px" }}>Error Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => (
                                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                                    <td style={{ padding: "8px", fontFamily: "monospace" }}>{r.endpoint}</td>
                                    <td style={{ padding: "8px" }}>{r.method}</td>
                                    <td style={{ padding: "8px", color: r.status_code >= 400 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                                        {r.status_code}
                                    </td>
                                    <td style={{ padding: "8px" }}>{r.response_time_ms} ms</td>
                                    <td style={{ padding: "8px" }}>{new Date(r.created_at).toLocaleString()}</td>
                                    <td style={{ padding: "8px", color: "#64748b" }}>{r.error_detail || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>
                            {total} total requests
                        </span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                Previous
                            </button>
                            <span style={{ fontSize: "13px" }}>
                                Page {page} of {totalPages}
                            </span>
                            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
