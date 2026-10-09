import { useEffect, useState } from "react";
import {
    getQueue, getRequestDetail, getRequestHistory,
    approveRequest, rejectRequest,
} from "../../api/workflowApi";
import type { WorkflowRequestRecord, WorkflowRequestDetail, HistoryEntry } from "../../api/workflowApi";

const REQUEST_TYPES = ["StockAdjustment", "ProductDeactivation", "ProductPriceChange", "CustomerInfoChange", "InventoryImportApproval"];

const ApprovalQueue = () => {
    const [records, setRecords] = useState<WorkflowRequestRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [detail, setDetail] = useState<WorkflowRequestDetail | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [comment, setComment] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    const loadQueue = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getQueue({ page, limit: 25, search: search || undefined, request_type: typeFilter || undefined });
            setRecords(response.data.records);
            setTotal(response.data.total);
            setTotalPages(response.data.total_pages);
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to load approval queue.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(loadQueue, 350);
        return () => clearTimeout(t);
    }, [page, search, typeFilter]);

    useEffect(() => { setPage(1); }, [search, typeFilter]);

    const openDetail = async (id: number) => {
        setSelectedId(id);
        setActionError("");
        setComment("");
        setRejectReason("");
        try {
            const [d, h] = await Promise.all([getRequestDetail(id), getRequestHistory(id)]);
            setDetail(d.data);
            setHistory(h.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleApprove = async () => {
        if (!selectedId) return;
        setActionLoading(true);
        setActionError("");
        try {
            await approveRequest(selectedId, comment || undefined);
            setSelectedId(null);
            loadQueue();
        } catch (err: any) {
            setActionError(err?.response?.data?.detail || "Approval failed.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedId || !rejectReason.trim()) {
            setActionError("A rejection reason is required.");
            return;
        }
        setActionLoading(true);
        setActionError("");
        try {
            await rejectRequest(selectedId, rejectReason);
            setSelectedId(null);
            loadQueue();
        } catch (err: any) {
            setActionError(err?.response?.data?.detail || "Rejection failed.");
        } finally {
            setActionLoading(false);
        }
    };

    const selectStyle: React.CSSProperties = { padding: "6px 10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "13px" };
    const sectionStyle: React.CSSProperties = { border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "20px" };
    const buttonStyle: React.CSSProperties = { padding: "8px 16px", borderRadius: "5px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: "14px" };

    const renderDiff = (current: Record<string, any>, requested: Record<string, any>) => {
        const keys = Array.from(new Set([...Object.keys(current || {}), ...Object.keys(requested || {})]));
        return keys.map((key) => {
            const curVal = current?.[key];
            const reqVal = requested?.[key];
            const isNumeric = typeof curVal === "number" && typeof reqVal === "number";
            const diff = isNumeric ? reqVal - curVal : null;
            return (
                <tr key={key}>
                    <td style={{ padding: "6px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{key.replace(/_/g, " ")}</td>
                    <td style={{ padding: "6px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{String(curVal ?? "-")}</td>
                    <td style={{ padding: "6px", borderBottom: "1px solid #eee", fontSize: "13px", fontWeight: "bold" }}>{String(reqVal ?? "-")}</td>
                    <td style={{ padding: "6px", borderBottom: "1px solid #eee", fontSize: "13px", color: diff && diff > 0 ? "#16a34a" : diff && diff < 0 ? "#dc2626" : "#666" }}>
                        {diff !== null ? (diff > 0 ? `+${diff}` : diff) : "-"}
                    </td>
                </tr>
            );
        });
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <h1>Approval Queue</h1>

            {error && <div style={{ color: "red", background: "#ffeaea", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>{error}</div>}

            <div style={sectionStyle}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...selectStyle, minWidth: "220px" }} />
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Types</option>
                        {REQUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Pending Requests ({total})</h3>
                {loading ? <p>Loading...</p> : records.length === 0 ? <p>No pending requests. Queue is clear.</p> : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>ID</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Type</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Requested By</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Date</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Priority</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Related Record</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r) => (
                                        <tr key={r.id} onClick={() => openDetail(r.id)} style={{ cursor: "pointer", background: selectedId === r.id ? "#eff6ff" : "transparent" }}>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>#{r.id}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{r.request_type}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{r.requested_by_name}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{new Date(r.created_at).toLocaleString()}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{r.priority}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{r.related_record_type} #{r.related_record_id || "-"}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>
                                                <button style={selectStyle}>Review</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "16px" }}>
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={selectStyle}>Previous</button>
                                <span style={{ fontSize: "13px" }}>Page {page} of {totalPages}</span>
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={selectStyle}>Next</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedId !== null && detail && (
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0 }}>Request #{detail.id} — {detail.request_type}</h3>
                    <p><strong>Requested by:</strong> {detail.requested_by_name} | <strong>Reason:</strong> {detail.reason}</p>

                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Field</th>
                                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Current</th>
                                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Requested</th>
                                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Difference</th>
                            </tr>
                        </thead>
                        <tbody>{renderDiff(detail.current_values, detail.requested_values)}</tbody>
                    </table>

                    <h4>Timeline</h4>
                    <ul style={{ fontSize: "13px" }}>
                        {history.map((h, i) => (
                            <li key={i}>{new Date(h.timestamp).toLocaleString()} — {h.action} by {h.performed_by_name || "System"}{h.comment ? `: ${h.comment}` : ""}</li>
                        ))}
                    </ul>

                    {actionError && <p style={{ color: "red" }}>{actionError}</p>}

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
                        <input type="text" placeholder="Approval comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} style={{ ...selectStyle, minWidth: "220px" }} />
                        <button onClick={handleApprove} disabled={actionLoading} style={buttonStyle}>Approve</button>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                        <input type="text" placeholder="Rejection reason (required)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ ...selectStyle, minWidth: "220px" }} />
                        <button onClick={handleReject} disabled={actionLoading} style={{ ...buttonStyle, background: "#dc2626", borderColor: "#dc2626" }}>Reject</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalQueue;