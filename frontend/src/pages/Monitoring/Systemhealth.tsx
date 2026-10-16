import React, { useEffect, useState, useCallback } from "react";
import { getSystemHealthOverview, type SystemHealthOverview } from "../../api/monitoringApi";

const POLL_INTERVAL_MS = 30000; 
const statusColor = (status: string) => {
    switch (status) {
        case "Healthy":
            return { bg: "#f0fdf4", border: "#16a34a", text: "#15803d" };
        case "Degraded":
            return { bg: "#fffbeb", border: "#d97706", text: "#b45309" };
        case "Unavailable":
            return { bg: "#fef2f2", border: "#dc2626", text: "#b91c1c" };
        default:
            return { bg: "#f8fafc", border: "#94a3b8", text: "#475569" };
    }
};

const severityColor = (severity: string) => {
    switch (severity) {
        case "Critical":
            return "#dc2626";
        case "High":
            return "#ea580c";
        case "Medium":
            return "#d97706";
        default:
            return "#64748b";
    }
};

const kpiCardStyle: React.CSSProperties = {
    flex: "1 1 200px",
    padding: "16px 20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
};

export default function SystemHealth() {
    const [data, setData] = useState<SystemHealthOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    const load = useCallback(async (showSpinner = false) => {
        if (showSpinner) setLoading(true);
        try {
            const res = await getSystemHealthOverview();
            setData(res.data);
            setError(null);
            setLastRefreshed(new Date());
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Failed to load system health");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(true);
        const interval = setInterval(() => load(false), POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [load]);

    if (loading && !data) {
        return <div style={{ padding: "24px" }}>Loading system health…</div>;
    }

    if (error && !data) {
        return (
            <div style={{ padding: "24px", color: "#b91c1c" }}>
                {error}
                <button onClick={() => load(true)} style={{ marginLeft: "12px" }}>
                    Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    const overall = statusColor(data.overall_status);

    return (
        <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>System Health</h1>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {lastRefreshed && `Last refreshed ${lastRefreshed.toLocaleTimeString()}`}
                    {" · auto-refreshes every 30s"}
                </div>
            </div>

        
            <div
                style={{
                    padding: "16px 20px",
                    borderRadius: "8px",
                    border: `1px solid ${overall.border}`,
                    background: overall.bg,
                    color: overall.text,
                    fontWeight: 600,
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span>Overall Status: {data.overall_status}</span>
                <span style={{ fontWeight: 400, fontSize: "13px" }}>
                    Last health check: {data.last_health_check_at ? new Date(data.last_health_check_at).toLocaleString() : "—"}
                </span>
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
                <div style={kpiCardStyle}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>API Availability</div>
                    <div style={{ fontSize: "24px", fontWeight: 700 }}>{data.api_availability_pct}%</div>
                </div>
                <div style={kpiCardStyle}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Avg Response Time (15m)</div>
                    <div style={{ fontSize: "24px", fontWeight: 700 }}>{data.avg_api_response_time_ms} ms</div>
                </div>
                <div style={kpiCardStyle}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Failed Requests (15m)</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: data.failed_api_requests_15min > 0 ? "#dc2626" : undefined }}>
                        {data.failed_api_requests_15min}
                    </div>
                </div>
                <div style={kpiCardStyle}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Active Jobs</div>
                    <div style={{ fontSize: "24px", fontWeight: 700 }}>{data.jobs.active}</div>
                </div>
                <div style={kpiCardStyle}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Pending Jobs</div>
                    <div style={{ fontSize: "24px", fontWeight: 700 }}>{data.jobs.pending}</div>
                </div>
                <div style={kpiCardStyle}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Failed Jobs (recent)</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: data.jobs.failed_recent > 0 ? "#dc2626" : undefined }}>
                        {data.jobs.failed_recent}
                    </div>
                </div>
            </div>

           
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Component Status</h2>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
                {data.components.map((c) => {
                    const colors = statusColor(c.status);
                    return (
                        <div
                            key={c.component}
                            style={{
                                flex: "1 1 180px",
                                padding: "14px 16px",
                                borderRadius: "8px",
                                border: `1px solid ${colors.border}`,
                                background: colors.bg,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
                                    {c.component.replace(/_/g, " ")}
                                </span>
                                <span style={{ color: colors.text, fontWeight: 600, fontSize: "13px" }}>{c.status}</span>
                            </div>
                            {c.response_time_ms !== null && (
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                    {c.response_time_ms} ms
                                </div>
                            )}
                            {c.message && (
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{c.message}</div>
                            )}
                        </div>
                    );
                })}
            </div>

            
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Recent System Errors</h2>
            {data.recent_errors.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: "14px" }}>No open errors right now.</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                            <th style={{ padding: "8px" }}>Severity</th>
                            <th style={{ padding: "8px" }}>Category</th>
                            <th style={{ padding: "8px" }}>Component</th>
                            <th style={{ padding: "8px" }}>Message</th>
                            <th style={{ padding: "8px" }}>Occurrences</th>
                            <th style={{ padding: "8px" }}>Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.recent_errors.map((e) => (
                            <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                                <td style={{ padding: "8px", color: severityColor(e.severity), fontWeight: 600 }}>
                                    {e.severity}
                                </td>
                                <td style={{ padding: "8px" }}>{e.category}</td>
                                <td style={{ padding: "8px" }}>{e.component}</td>
                                <td style={{ padding: "8px" }}>{e.message}</td>
                                <td style={{ padding: "8px" }}>{e.occurrence_count}</td>
                                <td style={{ padding: "8px" }}>{new Date(e.last_seen_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
