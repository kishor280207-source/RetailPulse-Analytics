import { useEffect, useState } from "react";
import { getAuditLogs, getAuditLogDetail, clearAuditLogs } from "../../api/auditLogApi";
import type { AuditLogRecord, AuditLogDetail, AuditLogFilters } from "../../api/auditLogApi";
import { exportAuditLogsCSV, exportAuditLogsPDF } from "../../utils/auditLogExport.ts";

const ACTION_OPTIONS = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "IMPORT",
    "EXPORT",
    "STOCK_ADJUSTMENT",
    "CLEAR_LOGS",
];

const RESOURCE_OPTIONS = ["Product", "Sale", "Customer", "User", "AuditLog"];

const STATUS_COLORS: Record<string, string> = {
    Success: "#16a34a",
    Failure: "#dc2626",
};

const AuditLogs = () => {
    const [records, setRecords] = useState<AuditLogRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [resourceFilter, setResourceFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);

    const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({
        page: 1,
        limit: 25,
        sort_order: "desc",
    });

    // ---- detail panel state ----
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [detail, setDetail] = useState<AuditLogDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    // ---- clear logs state ----
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearConfirmText, setClearConfirmText] = useState("");
    const [clearing, setClearing] = useState(false);
    const [clearMessage, setClearMessage] = useState("");

    useEffect(() => {
        const timeout = setTimeout(() => {
            setAppliedFilters({
                page,
                limit: 25,
                search: search || undefined,
                action: actionFilter || undefined,
                resource_type: resourceFilter || undefined,
                status: statusFilter || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                sort_order: sortOrder,
            });
        }, 350);

        return () => clearTimeout(timeout);
    }, [search, actionFilter, resourceFilter, statusFilter, startDate, endDate, sortOrder, page]);

    const loadLogs = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getAuditLogs(appliedFilters);
            setRecords(response.data.records);
            setTotal(response.data.total);
            setTotalPages(response.data.total_pages);
        } catch (err: any) {
            console.error("Failed to load audit logs:", err);
            setError(err?.response?.data?.detail || "Failed to load audit logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [appliedFilters]);

    useEffect(() => {
        setPage(1);
    }, [search, actionFilter, resourceFilter, statusFilter, startDate, endDate, sortOrder]);

    useEffect(() => {
        if (selectedId === null) {
            setDetail(null);
            return;
        }

        const loadDetail = async () => {
            setDetailLoading(true);
            setDetailError("");

            try {
                const response = await getAuditLogDetail(selectedId);
                setDetail(response.data);
            } catch (err: any) {
                setDetailError(err?.response?.data?.detail || "Failed to load log details.");
            } finally {
                setDetailLoading(false);
            }
        };

        loadDetail();
    }, [selectedId]);

    const filterLabel = () => {
        const parts: string[] = [];
        if (search) parts.push(`Search: ${search}`);
        if (actionFilter) parts.push(`Action: ${actionFilter}`);
        if (resourceFilter) parts.push(`Resource: ${resourceFilter}`);
        if (statusFilter) parts.push(`Status: ${statusFilter}`);
        if (startDate) parts.push(`From: ${startDate}`);
        if (endDate) parts.push(`To: ${endDate}`);
        return parts.length > 0 ? parts.join(", ") : "All records";
    };

    const handleExportCSV = () => exportAuditLogsCSV(records, filterLabel());
    const handleExportPDF = () => exportAuditLogsPDF(records, filterLabel());

    const handleClearLogs = async () => {
        if (clearConfirmText !== "DELETE") return;

        setClearing(true);
        setClearMessage("");

        try {
            const response = await clearAuditLogs();
            setClearMessage(`Cleared ${response.data.deleted_count} log records.`);
            setShowClearConfirm(false);
            setClearConfirmText("");
            setSelectedId(null);
            loadLogs();
        } catch (err: any) {
            setClearMessage(err?.response?.data?.detail || "Failed to clear logs.");
        } finally {
            setClearing(false);
        }
    };

    const selectStyle: React.CSSProperties = {
        padding: "6px 10px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        fontSize: "13px",
    };

    const buttonStyle: React.CSSProperties = {
        padding: "6px 14px",
        borderRadius: "5px",
        border: "1px solid #2563eb",
        background: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontSize: "13px",
    };

    const dangerButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        background: "#dc2626",
        borderColor: "#dc2626",
    };

    const sectionStyle: React.CSSProperties = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                <h1 style={{ margin: 0 }}>Audit Logs</h1>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleExportCSV} style={selectStyle}>Export CSV</button>
                    <button onClick={handleExportPDF} style={selectStyle}>Export PDF</button>
                    <button onClick={() => setShowClearConfirm(true)} style={dangerButtonStyle}>Clear Logs</button>
                </div>
            </div>

            {error && (
                <div style={{ color: "red", background: "#ffeaea", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>
                    {error}
                </div>
            )}

            {clearMessage && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>
                    {clearMessage}
                </div>
            )}

            {showClearConfirm && (
                <div style={{ ...sectionStyle, background: "#fef2f2", borderColor: "#fca5a5" }}>
                    <h3 style={{ marginTop: 0, color: "#dc2626" }}>⚠ Clear All Audit Logs</h3>
                    <p>
                        This will <strong>permanently delete all audit log records</strong> for your company.
                        This action cannot be undone. The clearing action itself will be logged.
                    </p>
                    <p>Type <strong>DELETE</strong> below to confirm:</p>
                    <input
                        type="text"
                        value={clearConfirmText}
                        onChange={(e) => setClearConfirmText(e.target.value)}
                        style={{ ...selectStyle, marginBottom: "12px", display: "block" }}
                        placeholder="Type DELETE to confirm"
                    />
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            onClick={handleClearLogs}
                            disabled={clearConfirmText !== "DELETE" || clearing}
                            style={{
                                ...dangerButtonStyle,
                                opacity: clearConfirmText !== "DELETE" || clearing ? 0.5 : 1,
                                cursor: clearConfirmText !== "DELETE" || clearing ? "not-allowed" : "pointer",
                            }}
                        >
                            {clearing ? "Clearing..." : "Confirm Clear"}
                        </button>
                        <button
                            onClick={() => {
                                setShowClearConfirm(false);
                                setClearConfirmText("");
                            }}
                            style={selectStyle}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Filters</h3>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <input
                        type="text"
                        placeholder="Search user, action, resource, description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ ...selectStyle, minWidth: "260px" }}
                    />

                    <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Actions</option>
                        {ACTION_OPTIONS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>

                    <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Resources</option>
                        {RESOURCE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Statuses</option>
                        <option value="Success">Success</option>
                        <option value="Failure">Failure</option>
                    </select>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                        From:
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={selectStyle} />
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                        To:
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={selectStyle} />
                    </label>

                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")} style={selectStyle}>
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                    </select>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Activity ({total} records)</h3>
                <p style={{ fontSize: "13px", color: "#666", marginTop: "-8px" }}>
                    Click a row to see full details, including before/after values.
                </p>

                {loading ? (
                    <p>Loading audit logs...</p>
                ) : records.length === 0 ? (
                    <p>No activity found for the selected filters.</p>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>User</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Action</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Resource</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Resource ID</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Description</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>IP Address</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Timestamp</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r) => (
                                        <tr
                                            key={r.id}
                                            onClick={() => setSelectedId(r.id)}
                                            style={{
                                                cursor: "pointer",
                                                background: selectedId === r.id ? "#eff6ff" : "transparent",
                                            }}
                                        >
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{r.user_name || "-"}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{r.action}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{r.resource_type || "-"}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{r.resource_id || "-"}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{r.description || "-"}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{r.ip_address || "-"}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                                {new Date(r.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                                <span style={{
                                                    background: STATUS_COLORS[r.status] || "#999",
                                                    color: "#fff",
                                                    padding: "3px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "12px",
                                                }}>
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "16px", alignItems: "center" }}>
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={selectStyle}>
                                    Previous
                                </button>
                                <span style={{ fontSize: "13px" }}>Page {page} of {totalPages}</span>
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={selectStyle}>
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedId !== null && (
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0 }}>Log Details</h3>

                    {detailError && <p style={{ color: "red" }}>{detailError}</p>}

                    {detailLoading ? (
                        <p>Loading details...</p>
                    ) : detail ? (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                                <div><strong>User:</strong> {detail.user_name || "-"}</div>
                                <div><strong>Action:</strong> {detail.action}</div>
                                <div><strong>Resource:</strong> {detail.resource_type || "-"}</div>
                                <div><strong>Resource ID:</strong> {detail.resource_id || "-"}</div>
                                <div><strong>Status:</strong> {detail.status}</div>
                                <div><strong>IP Address:</strong> {detail.ip_address || "-"}</div>
                                <div><strong>Timestamp:</strong> {new Date(detail.created_at).toLocaleString()}</div>
                                <div style={{ gridColumn: "1 / -1" }}><strong>Browser/User Agent:</strong> {detail.user_agent || "-"}</div>
                                <div style={{ gridColumn: "1 / -1" }}><strong>Description:</strong> {detail.description || "-"}</div>
                            </div>

                            {(detail.before_values || detail.after_values) && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "12px" }}>
                                        <h4 style={{ marginTop: 0, color: "#dc2626" }}>Before</h4>
                                        {detail.before_values ? (
                                            <pre style={{ margin: 0, fontSize: "12px", whiteSpace: "pre-wrap" }}>
                                                {JSON.stringify(detail.before_values, null, 2)}
                                            </pre>
                                        ) : (
                                            <p style={{ fontSize: "13px", margin: 0 }}>No before-values recorded.</p>
                                        )}
                                    </div>

                                    <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", padding: "12px" }}>
                                        <h4 style={{ marginTop: 0, color: "#16a34a" }}>After</h4>
                                        {detail.after_values ? (
                                            <pre style={{ margin: 0, fontSize: "12px", whiteSpace: "pre-wrap" }}>
                                                {JSON.stringify(detail.after_values, null, 2)}
                                            </pre>
                                        ) : (
                                            <p style={{ fontSize: "13px", margin: 0 }}>No after-values recorded.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
