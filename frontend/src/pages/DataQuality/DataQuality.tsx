import { useEffect, useState } from "react";
import {
    getDashboardSummary,
    triggerReconciliation,
    getReconciliationHistory,
    getIssues,
    getIssueDetail,
    updateIssueStatus,
} from "../../api/dataQualityApi";
import type {
    DashboardSummary,
    IssueRecord,
    IssueDetail,
    ReconciliationRunRecord,
} from "../../api/dataQualityApi";

const SEVERITY_COLORS: Record<string, string> = {
    Low: "#6b7280",
    Medium: "#eab308",
    High: "#f97316",
    Critical: "#dc2626",
};

const STATUS_COLORS: Record<string, string> = {
    Open: "#dc2626",
    Investigating: "#f97316",
    Resolved: "#16a34a",
    Ignored: "#6b7280",
};

const RUN_STATUS_COLORS: Record<string, string> = {
    Running: "#2563eb",
    Completed: "#16a34a",
    "Completed with Issues": "#f97316",
    Failed: "#dc2626",
};

const DataQuality = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState("");

    const [running, setRunning] = useState(false);
    const [runMessage, setRunMessage] = useState("");

    const [issues, setIssues] = useState<IssueRecord[]>([]);
    const [issuesTotal, setIssuesTotal] = useState(0);
    const [issuesTotalPages, setIssuesTotalPages] = useState(1);
    const [issuesLoading, setIssuesLoading] = useState(true);
    const [issuesError, setIssuesError] = useState("");
    const [page, setPage] = useState(1);

    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [moduleFilter, setModuleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
    const [detail, setDetail] = useState<IssueDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [resolutionNote, setResolutionNote] = useState("");
    const [updating, setUpdating] = useState(false);

    const [history, setHistory] = useState<ReconciliationRunRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");
    
    const loadSummary = async () => {
        setSummaryLoading(true);
        setSummaryError("");
        try {
            const response = await getDashboardSummary();
            setSummary(response.data);
        } catch (err: any) {
            setSummaryError(err?.response?.data?.detail || "Failed to load summary.");
        } finally {
            setSummaryLoading(false);
        }
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await getReconciliationHistory(1, 10);
            setHistory(response.data.records);
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const loadIssues = async () => {
        setIssuesLoading(true);
        setIssuesError("");
        try {
            const response = await getIssues({
                page,
                limit: 25,
                search: search || undefined,
                severity: severityFilter || undefined,
                module: moduleFilter || undefined,
                status: statusFilter || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            });
            setIssues(response.data.records);
            setIssuesTotal(response.data.total);
            setIssuesTotalPages(response.data.total_pages);
        } catch (err: any) {
            setIssuesError(err?.response?.data?.detail || "Failed to load issues.");
        } finally {
            setIssuesLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
        loadHistory();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadIssues();
        }, 350);
        return () => clearTimeout(timeout);
    }, [page, search,typeFilter, severityFilter, moduleFilter, statusFilter, startDate, endDate]);

    useEffect(() => {
        setPage(1);
    }, [search,typeFilter, severityFilter, moduleFilter, statusFilter, startDate, endDate]);

    const handleRunReconciliation = async () => {
        setRunning(true);
        setRunMessage("");
        try {
            const response = await triggerReconciliation();
            setRunMessage(`Reconciliation ${response.data.status}: ${response.data.records_checked} records checked, ${response.data.issues_detected} new issues detected.`);
            loadSummary();
            loadHistory();
            loadIssues();
        } catch (err: any) {
            setRunMessage(err?.response?.data?.detail || "Reconciliation failed.");
        } finally {
            setRunning(false);
        }
    };

    const handleSelectIssue = async (id: number) => {
        setSelectedIssueId(id);
        setDetailLoading(true);
        setResolutionNote("");
        try {
            const response = await getIssueDetail(id);
            setDetail(response.data);
            setNewStatus(response.data.status);
        } catch (err) {
            console.error("Failed to load issue detail:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedIssueId || !detail) return;
        setUpdating(true);
        try {
            await updateIssueStatus(selectedIssueId, newStatus, resolutionNote || undefined);
            const response = await getIssueDetail(selectedIssueId);
            setDetail(response.data);
            loadIssues();
            loadSummary();
        } catch (err) {
            console.error("Failed to update status:", err);
        } finally {
            setUpdating(false);
        }
    };

    const selectStyle: React.CSSProperties = {
        padding: "6px 10px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        fontSize: "13px",
    };

    const buttonStyle: React.CSSProperties = {
        padding: "8px 16px",
        borderRadius: "5px",
        border: "1px solid #2563eb",
        background: "#2563eb",
        color: "#fff",
        cursor: "pointer",
        fontSize: "14px",
    };

    const sectionStyle: React.CSSProperties = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
    };

    const cardStyle: React.CSSProperties = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        minWidth: 0,
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                <h1 style={{ margin: 0 }}>Data Quality & Reconciliation</h1>
                <button onClick={handleRunReconciliation} disabled={running} style={buttonStyle}>
                    {running ? "Running Reconciliation..." : "Run Reconciliation Now"}
                </button>
            </div>

            {runMessage && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px", marginBottom: "20px", borderRadius: "5px", fontSize: "13px" }}>
                    {runMessage}
                </div>
            )}

            {summaryError && (
                <div style={{ color: "red", background: "#ffeaea", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>
                    {summaryError}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px" }}>Records Checked</h4>
                    <h2 style={{ margin: 0 }}>{summaryLoading ? "..." : summary?.total_records_checked ?? 0}</h2>
                </div>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px" }}>Valid Records</h4>
                    <h2 style={{ margin: 0 }}>{summaryLoading ? "..." : summary?.valid_records ?? 0}</h2>
                </div>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px", color: "#eab308" }}>Warnings</h4>
                    <h2 style={{ margin: 0 }}>{summaryLoading ? "..." : summary?.warnings ?? 0}</h2>
                </div>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px", color: "#dc2626" }}>Errors</h4>
                    <h2 style={{ margin: 0 }}>{summaryLoading ? "..." : summary?.errors ?? 0}</h2>
                </div>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px" }}>Unresolved Issues</h4>
                    <h2 style={{ margin: 0 }}>{summaryLoading ? "..." : summary?.unresolved_issues ?? 0}</h2>
                </div>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px" }}>Last Reconciliation</h4>
                    <h2 style={{ margin: 0, fontSize: "16px" }}>
                        {summaryLoading ? "..." : summary?.last_reconciliation ? new Date(summary.last_reconciliation).toLocaleString() : "Never"}
                    </h2>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Filters</h3>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <input
                        type="text"
                        placeholder="Search issues..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ ...selectStyle, minWidth: "220px" }}
                    />
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Types</option>
                        <option value="SaleExceedsStock">Sale Exceeds Stock</option>
                        <option value="InventoryMovementMismatch">Inventory Movement Mismatch</option>
                        <option value="InvalidProductReference">Invalid Product Reference</option>
                        <option value="InactiveProductReference">Inactive Product Reference</option>
                        <option value="InvalidCustomerReference">Invalid Customer Reference</option>
                        <option value="DuplicateSKU">Duplicate SKU</option>
                        <option value="MissingMandatoryInfo">Missing Mandatory Info</option>
                        <option value="ReportTotalMismatch">Report Total Mismatch</option>
                    </select>

                    
                    <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Severities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>

                    <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Modules</option>
                        <option value="Sales">Sales</option>
                        <option value="Inventory">Inventory</option>
                        <option value="Products">Products</option>
                        <option value="Customers">Customers</option>
                        <option value="Reports">Reports</option>
                    </select>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Ignored">Ignored</option>
                    </select>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                        From: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={selectStyle} />
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                        To: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={selectStyle} />
                    </label>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Issues ({issuesTotal})</h3>
                <p style={{ fontSize: "13px", color: "#666", marginTop: "-8px" }}>Click an issue to view details and update status.</p>

                {issuesError && <p style={{ color: "red" }}>{issuesError}</p>}

                {issuesLoading ? (
                    <p>Loading issues...</p>
                ) : issues.length === 0 ? (
                    <p>No issues found for the selected filters.</p>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Type</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Severity</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Module</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Record</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Description</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Detected</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.map((issue) => (
                                        <tr
                                            key={issue.id}
                                            onClick={() => handleSelectIssue(issue.id)}
                                            style={{ cursor: "pointer", background: selectedIssueId === issue.id ? "#eff6ff" : "transparent" }}
                                        >
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{issue.issue_type}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                                <span style={{ background: SEVERITY_COLORS[issue.severity] || "#999", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                                                    {issue.severity}
                                                </span>
                                            </td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{issue.affected_module}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{issue.affected_record_id || "-"}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{issue.description}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{new Date(issue.detected_at).toLocaleString()}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                                <span style={{ background: STATUS_COLORS[issue.status] || "#999", color: "#fff", padding: "2px 10px", borderRadius: "10px", fontSize: "11px" }}>
                                                    {issue.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {issuesTotalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "16px", alignItems: "center" }}>
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={selectStyle}>Previous</button>
                                <span style={{ fontSize: "13px" }}>Page {page} of {issuesTotalPages}</span>
                                <button onClick={() => setPage((p) => Math.min(issuesTotalPages, p + 1))} disabled={page === issuesTotalPages} style={selectStyle}>Next</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedIssueId !== null && (
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0 }}>Issue Details</h3>

                    {detailLoading ? (
                        <p>Loading details...</p>
                    ) : detail ? (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                                <div><strong>Type:</strong> {detail.issue_type}</div>
                                <div><strong>Severity:</strong> {detail.severity}</div>
                                <div><strong>Module:</strong> {detail.affected_module}</div>
                                <div><strong>Record ID:</strong> {detail.affected_record_id || "-"}</div>
                                <div><strong>Detected:</strong> {new Date(detail.detected_at).toLocaleString()}</div>
                                <div><strong>Current Status:</strong> {detail.status}</div>
                            </div>

                            <p style={{ marginBottom: "16px" }}>{detail.description}</p>

                            {detail.details && Object.keys(detail.details).length > 0 && (
                                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px", marginBottom: "16px" }}>
                                    <strong style={{ fontSize: "13px" }}>Related Data:</strong>
                                    <pre style={{ margin: "8px 0 0", fontSize: "12px", whiteSpace: "pre-wrap" }}>
                                        {JSON.stringify(detail.details, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {detail.resolved_by_name && (
                                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
                                    Resolved by {detail.resolved_by_name} on {detail.resolved_at ? new Date(detail.resolved_at).toLocaleString() : "-"}
                                    {detail.resolution_note && <div style={{ marginTop: "6px" }}>Note: {detail.resolution_note}</div>}
                                </div>
                            )}

                            <h4 style={{ marginBottom: "8px" }}>Update Status</h4>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
                                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={selectStyle}>
                                    <option value="Open">Open</option>
                                    <option value="Investigating">Investigating</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Ignored">Ignored</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Resolution note (optional)"
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                    style={{ ...selectStyle, minWidth: "220px" }}
                                />

                                <button onClick={handleUpdateStatus} disabled={updating} style={buttonStyle}>
                                    {updating ? "Updating..." : "Update Status"}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Reconciliation History</h3>

                {historyLoading ? (
                    <p>Loading history...</p>
                ) : history.length === 0 ? (
                    <p>No reconciliation runs yet. Click "Run Reconciliation Now" above.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Run ID</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Started</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Completed</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Triggered By</th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Checked</th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Detected</th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Failed Checks</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((run) => (
                                    <tr key={run.id}>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>#{run.id}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{new Date(run.started_at).toLocaleString()}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{run.completed_at ? new Date(run.completed_at).toLocaleString() : "-"}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{run.triggered_by_name || "-"}</td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{run.records_checked}</td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{run.issues_detected}</td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{run.failed_checks}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                            <span style={{ background: RUN_STATUS_COLORS[run.status] || "#999", color: "#fff", padding: "2px 10px", borderRadius: "10px", fontSize: "11px" }}>
                                                {run.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataQuality;
