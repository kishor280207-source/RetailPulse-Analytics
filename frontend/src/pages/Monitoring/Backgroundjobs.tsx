import React, { useEffect, useState, useCallback } from "react";
import {
    getJobs,
    getJobDetail,
    retryJob,
    cancelJob,
    type BackgroundJobRecord,
    type JobDetail,
} from "../../api/monitoringApi";

const PAGE_SIZE = 25;

const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
        Pending: { bg: "#f1f5f9", text: "#475569" },
        Running: { bg: "#eff6ff", text: "#1d4ed8" },
        Completed: { bg: "#f0fdf4", text: "#15803d" },
        Failed: { bg: "#fef2f2", text: "#b91c1c" },
        Cancelled: { bg: "#fafafa", text: "#71717a" },
    };
    const c = map[status] || map.Pending;
    return (
        <span
            style={{
                background: c.bg,
                color: c.text,
                padding: "2px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
            }}
        >
            {status}
        </span>
    );
};

export default function BackgroundJobs() {
    const [records, setRecords] = useState<BackgroundJobRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [jobType, setJobType] = useState("");
    const [status, setStatus] = useState("");

    const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getJobs({
                job_type: jobType || undefined,
                status: status || undefined,
                page,
                limit: PAGE_SIZE,
            });
            setRecords(res.data.records);
            setTotal(res.data.total);
            setError(null);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Failed to load jobs");
        } finally {
            setLoading(false);
        }
    }, [jobType, status, page]);

    useEffect(() => {
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, [load]);

    const openDetail = async (jobId: number) => {
        try {
            const res = await getJobDetail(jobId);
            setSelectedJob(res.data);
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Failed to load job detail");
        }
    };

    const handleRetry = async (jobId: number) => {
        if (!confirm("Retry this job? This will re-run it from where it left off.")) return;
        setActionBusy(true);
        try {
            await retryJob(jobId);
            await load();
            if (selectedJob?.id === jobId) await openDetail(jobId);
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Retry failed");
        } finally {
            setActionBusy(false);
        }
    };

    const handleCancel = async (jobId: number) => {
        if (!confirm("Cancel this job?")) return;
        setActionBusy(true);
        try {
            await cancelJob(jobId);
            await load();
            if (selectedJob?.id === jobId) await openDetail(jobId);
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Cancel failed");
        } finally {
            setActionBusy(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div style={{ padding: "24px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "20px" }}>Background Jobs</h1>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <select value={jobType} onChange={(e) => { setPage(1); setJobType(e.target.value); }}
                    style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px" }}>
                    <option value="">All job types</option>
                    <option value="DataImport">Data Import</option>
                    <option value="ScheduledReport">Scheduled Report</option>
                    <option value="Reconciliation">Reconciliation</option>
                </select>
                <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                    style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px" }}>
                    <option value="">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            {error && <div style={{ color: "#b91c1c", marginBottom: "12px" }}>{error}</div>}

            {loading && records.length === 0 ? (
                <div>Loading…</div>
            ) : records.length === 0 ? (
                <div style={{ color: "#64748b" }}>No jobs match these filters.</div>
            ) : (
                <>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                                <th style={{ padding: "8px" }}>Job ID</th>
                                <th style={{ padding: "8px" }}>Type</th>
                                <th style={{ padding: "8px" }}>Status</th>
                                <th style={{ padding: "8px" }}>Started</th>
                                <th style={{ padding: "8px" }}>Duration</th>
                                <th style={{ padding: "8px" }}>Retries</th>
                                <th style={{ padding: "8px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((j) => (
                                <tr key={j.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                                    <td style={{ padding: "8px" }}>
                                        <button
                                            onClick={() => openDetail(j.id)}
                                            style={{ border: "none", background: "none", color: "#2563eb", cursor: "pointer", padding: 0 }}
                                        >
                                            #{j.id}
                                        </button>
                                    </td>
                                    <td style={{ padding: "8px" }}>{j.job_type}</td>
                                    <td style={{ padding: "8px" }}>{statusBadge(j.status)}</td>
                                    <td style={{ padding: "8px" }}>{j.started_at ? new Date(j.started_at).toLocaleString() : "—"}</td>
                                    <td style={{ padding: "8px" }}>
                                        {j.duration_seconds !== null ? `${j.duration_seconds.toFixed(1)}s` : "—"}
                                    </td>
                                    <td style={{ padding: "8px" }}>{j.retry_count}</td>
                                    <td style={{ padding: "8px", display: "flex", gap: "8px" }}>
                                        {j.status === "Failed" && (
                                            <button disabled={actionBusy} onClick={() => handleRetry(j.id)}
                                                style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #2563eb", color: "#2563eb", background: "#fff", cursor: "pointer" }}>
                                                Retry
                                            </button>
                                        )}
                                        {(j.status === "Pending" || j.status === "Running") && (
                                            <button disabled={actionBusy} onClick={() => handleCancel(j.id)}
                                                style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #dc2626", color: "#dc2626", background: "#fff", cursor: "pointer" }}>
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>{total} total jobs</span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                            <span style={{ fontSize: "13px" }}>Page {page} of {totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                        </div>
                    </div>
                </>
            )}

            {selectedJob && (
                <div
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
                    }}
                    onClick={() => setSelectedJob(null)}
                >
                    <div
                        style={{ background: "#fff", borderRadius: "8px", padding: "24px", width: "520px", maxHeight: "80vh", overflowY: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Job #{selectedJob.id} — {selectedJob.job_type}</h2>
                            <button onClick={() => setSelectedJob(null)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ fontSize: "14px", lineHeight: 1.8 }}>
                            <div><strong>Status:</strong> {statusBadge(selectedJob.status)}</div>
                            <div><strong>Started:</strong> {selectedJob.started_at ? new Date(selectedJob.started_at).toLocaleString() : "—"}</div>
                            <div><strong>Completed:</strong> {selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleString() : "—"}</div>
                            <div><strong>Retries:</strong> {selectedJob.retry_count} / {selectedJob.max_retries}</div>
                            {selectedJob.related_resource_type && (
                                <div><strong>Related:</strong> {selectedJob.related_resource_type} #{selectedJob.related_resource_id}</div>
                            )}
                            {selectedJob.failure_reason && (
                                <div style={{ color: "#b91c1c" }}><strong>Failure reason:</strong> {selectedJob.failure_reason}</div>
                            )}
                            {selectedJob.result_summary && (
                                <div>
                                    <strong>Result:</strong>
                                    <pre style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px", fontSize: "12px", overflowX: "auto" }}>
                                        {JSON.stringify(selectedJob.result_summary, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                            {selectedJob.status === "Failed" && selectedJob.retry_count < selectedJob.max_retries && (
                                <button disabled={actionBusy} onClick={() => handleRetry(selectedJob.id)}
                                    style={{ padding: "8px 16px", borderRadius: "5px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff", cursor: "pointer" }}>
                                    Retry Job
                                </button>
                            )}
                            {(selectedJob.status === "Pending" || selectedJob.status === "Running") && (
                                <button disabled={actionBusy} onClick={() => handleCancel(selectedJob.id)}
                                    style={{ padding: "8px 16px", borderRadius: "5px", border: "1px solid #dc2626", background: "#fff", color: "#dc2626", cursor: "pointer" }}>
                                    Cancel Job
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
