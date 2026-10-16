import React, { useEffect, useState, useCallback } from "react";
import {
    getErrors,
    updateErrorStatus,
    getIncidents,
    getIncidentDetail,
    openIncident,
    updateIncidentStatus,
    addIncidentNote,
    type SystemErrorRecord,
    type IncidentRecord,
    type IncidentDetail,
} from "../../api/monitoringApi";

type Tab = "errors" | "incidents";

const severityColor = (severity: string) => {
    switch (severity) {
        case "Critical": return "#dc2626";
        case "High": return "#ea580c";
        case "Medium": return "#d97706";
        default: return "#64748b";
    }
};

const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
        Open: { bg: "#fef2f2", text: "#b91c1c" },
        Investigating: { bg: "#fffbeb", text: "#b45309" },
        Resolved: { bg: "#f0fdf4", text: "#15803d" },
    };
    const c = map[status] || map.Open;
    return (
        <span style={{ background: c.bg, color: c.text, padding: "2px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>
            {status}
        </span>
    );
};

export default function SystemErrorsIncidents() {
    const [tab, setTab] = useState<Tab>("errors");

    
    const [errors, setErrors] = useState<SystemErrorRecord[]>([]);
    const [errorsLoading, setErrorsLoading] = useState(true);
    const [severityFilter, setSeverityFilter] = useState("");
    const [componentFilter, setComponentFilter] = useState("");
    const [errorStatusFilter, setErrorStatusFilter] = useState("");

    
    const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
    const [incidentsLoading, setIncidentsLoading] = useState(true);
    const [incidentStatusFilter, setIncidentStatusFilter] = useState("");
    const [selectedIncident, setSelectedIncident] = useState<IncidentDetail | null>(null);
    const [noteText, setNoteText] = useState("");
    const [resolutionText, setResolutionText] = useState("");

    const loadErrors = useCallback(async () => {
        setErrorsLoading(true);
        try {
            const res = await getErrors({
                severity: severityFilter || undefined,
                component: componentFilter || undefined,
                status: errorStatusFilter || undefined,
                page: 1,
                limit: 50,
            });
            setErrors(res.data.records);
        } finally {
            setErrorsLoading(false);
        }
    }, [severityFilter, componentFilter, errorStatusFilter]);

    const loadIncidents = useCallback(async () => {
        setIncidentsLoading(true);
        try {
            const res = await getIncidents({ status: incidentStatusFilter || undefined, page: 1, limit: 50 });
            setIncidents(res.data.records);
        } finally {
            setIncidentsLoading(false);
        }
    }, [incidentStatusFilter]);

    useEffect(() => { if (tab === "errors") loadErrors(); }, [tab, loadErrors]);
    useEffect(() => { if (tab === "incidents") loadIncidents(); }, [tab, loadIncidents]);

    const handleErrorStatusChange = async (errorId: number, status: string) => {
        const notes = status === "Resolved" ? prompt("Resolution notes (optional):") || undefined : undefined;
        try {
            await updateErrorStatus(errorId, status, notes);
            await loadErrors();
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Failed to update error status");
        }
    };

    const handlePromoteToIncident = async (err: SystemErrorRecord) => {
        const title = prompt("Incident title:", `${err.component}: ${err.message}`);
        if (!title) return;
        try {
            await openIncident({ title, severity: err.severity, related_error_id: err.id });
            alert("Incident opened.");
            setTab("incidents");
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Failed to open incident");
        }
    };

    const openIncidentDetail = async (id: number) => {
        const res = await getIncidentDetail(id);
        setSelectedIncident(res.data);
        setNoteText("");
        setResolutionText("");
    };

    const handleIncidentStatusChange = async (status: string) => {
        if (!selectedIncident) return;
        try {
            await updateIncidentStatus(selectedIncident.id, {
                status,
                note: noteText || undefined,
                resolution_summary: status === "Resolved" ? resolutionText || undefined : undefined,
            });
            await openIncidentDetail(selectedIncident.id);
            await loadIncidents();
            setNoteText("");
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Failed to update incident");
        }
    };

    const handleAddNote = async () => {
        if (!selectedIncident || !noteText) return;
        await addIncidentNote(selectedIncident.id, noteText);
        setNoteText("");
        await openIncidentDetail(selectedIncident.id);
    };

    return (
        <div style={{ padding: "24px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>System Errors & Incidents</h1>

            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
                {(["errors", "incidents"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
                            borderBottom: tab === t ? "2px solid #2563eb" : "2px solid transparent",
                            color: tab === t ? "#2563eb" : "#64748b", fontWeight: 600, fontSize: "14px",
                        }}
                    >
                        {t === "errors" ? "System Errors" : "Incidents"}
                    </button>
                ))}
            </div>

            {tab === "errors" && (
                <>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px" }}>
                            <option value="">All severities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <input
                            placeholder="Filter by component…"
                            value={componentFilter}
                            onChange={(e) => setComponentFilter(e.target.value)}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px", minWidth: "180px" }}
                        />
                        <select value={errorStatusFilter} onChange={(e) => setErrorStatusFilter(e.target.value)}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px" }}>
                            <option value="">All statuses</option>
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>

                    {errorsLoading ? (
                        <div>Loading…</div>
                    ) : errors.length === 0 ? (
                        <div style={{ color: "#64748b" }}>No errors match these filters.</div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                                    <th style={{ padding: "8px" }}>Severity</th>
                                    <th style={{ padding: "8px" }}>Component</th>
                                    <th style={{ padding: "8px" }}>Message</th>
                                    <th style={{ padding: "8px" }}>Occurrences</th>
                                    <th style={{ padding: "8px" }}>Last Seen</th>
                                    <th style={{ padding: "8px" }}>Status</th>
                                    <th style={{ padding: "8px" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {errors.map((e) => (
                                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                                        <td style={{ padding: "8px", color: severityColor(e.severity), fontWeight: 600 }}>{e.severity}</td>
                                        <td style={{ padding: "8px" }}>{e.component}</td>
                                        <td style={{ padding: "8px" }}>{e.message}</td>
                                        <td style={{ padding: "8px" }}>{e.occurrence_count}</td>
                                        <td style={{ padding: "8px" }}>{new Date(e.last_seen_at).toLocaleString()}</td>
                                        <td style={{ padding: "8px" }}>{statusBadge(e.status)}</td>
                                        <td style={{ padding: "8px", display: "flex", gap: "6px" }}>
                                            {e.status !== "Investigating" && e.status !== "Resolved" && (
                                                <button onClick={() => handleErrorStatusChange(e.id, "Investigating")}
                                                    style={{ fontSize: "12px", padding: "4px 8px", border: "1px solid #d97706", color: "#d97706", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>
                                                    Investigate
                                                </button>
                                            )}
                                            {e.status !== "Resolved" && (
                                                <button onClick={() => handleErrorStatusChange(e.id, "Resolved")}
                                                    style={{ fontSize: "12px", padding: "4px 8px", border: "1px solid #16a34a", color: "#16a34a", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>
                                                    Resolve
                                                </button>
                                            )}
                                            <button onClick={() => handlePromoteToIncident(e)}
                                                style={{ fontSize: "12px", padding: "4px 8px", border: "1px solid #2563eb", color: "#2563eb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>
                                                Open Incident
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {tab === "incidents" && (
                <>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                        <select value={incidentStatusFilter} onChange={(e) => setIncidentStatusFilter(e.target.value)}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "5px" }}>
                            <option value="">All statuses</option>
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>

                    {incidentsLoading ? (
                        <div>Loading…</div>
                    ) : incidents.length === 0 ? (
                        <div style={{ color: "#64748b" }}>No incidents yet.</div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                                    <th style={{ padding: "8px" }}>Title</th>
                                    <th style={{ padding: "8px" }}>Severity</th>
                                    <th style={{ padding: "8px" }}>Status</th>
                                    <th style={{ padding: "8px" }}>Opened</th>
                                    <th style={{ padding: "8px" }}>Resolved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map((i) => (
                                    <tr key={i.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px", cursor: "pointer" }}
                                        onClick={() => openIncidentDetail(i.id)}>
                                        <td style={{ padding: "8px", color: "#2563eb" }}>{i.title}</td>
                                        <td style={{ padding: "8px", color: severityColor(i.severity), fontWeight: 600 }}>{i.severity}</td>
                                        <td style={{ padding: "8px" }}>{statusBadge(i.status)}</td>
                                        <td style={{ padding: "8px" }}>{new Date(i.opened_at).toLocaleString()}</td>
                                        <td style={{ padding: "8px" }}>{i.resolved_at ? new Date(i.resolved_at).toLocaleString() : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {selectedIncident && (
                <div
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
                    onClick={() => setSelectedIncident(null)}
                >
                    <div
                        style={{ background: "#fff", borderRadius: "8px", padding: "24px", width: "560px", maxHeight: "85vh", overflowY: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>{selectedIncident.title}</h2>
                            <button onClick={() => setSelectedIncident(null)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ marginBottom: "12px" }}>
                            {statusBadge(selectedIncident.status)}{" "}
                            <span style={{ color: severityColor(selectedIncident.severity), fontWeight: 600, fontSize: "13px" }}>
                                {selectedIncident.severity}
                            </span>
                        </div>

                        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Timeline</h3>
                        <div style={{ marginBottom: "16px", maxHeight: "200px", overflowY: "auto" }}>
                            {selectedIncident.timeline.map((t) => (
                                <div key={t.id} style={{ fontSize: "13px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                                    <span style={{ color: "#64748b" }}>{new Date(t.created_at).toLocaleString()}</span>{" — "}
                                    {t.event_type === "StatusChange"
                                        ? `Status changed ${t.from_status ? `from ${t.from_status} ` : ""}to ${t.to_status}`
                                        : t.note}
                                </div>
                            ))}
                        </div>

                        {selectedIncident.status !== "Resolved" && (
                            <>
                                <textarea
                                    placeholder="Add a note…"
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    style={{ width: "100%", minHeight: "60px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "5px", marginBottom: "8px" }}
                                />
                                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                    <button onClick={handleAddNote} disabled={!noteText}
                                        style={{ padding: "6px 12px", borderRadius: "5px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>
                                        Add Note
                                    </button>
                                    {selectedIncident.status === "Open" && (
                                        <button onClick={() => handleIncidentStatusChange("Investigating")}
                                            style={{ padding: "6px 12px", borderRadius: "5px", border: "1px solid #d97706", color: "#d97706", background: "#fff", cursor: "pointer" }}>
                                            Mark Investigating
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    placeholder="Resolution summary (required to resolve)…"
                                    value={resolutionText}
                                    onChange={(e) => setResolutionText(e.target.value)}
                                    style={{ width: "100%", minHeight: "60px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "5px", marginBottom: "8px" }}
                                />
                                <button
                                    onClick={() => handleIncidentStatusChange("Resolved")}
                                    disabled={!resolutionText}
                                    style={{ padding: "8px 16px", borderRadius: "5px", border: "1px solid #16a34a", background: "#16a34a", color: "#fff", cursor: "pointer" }}
                                >
                                    Mark Resolved
                                </button>
                            </>
                        )}
                        {selectedIncident.status === "Resolved" && selectedIncident.resolution_summary && (
                            <div style={{ fontSize: "13px", background: "#f0fdf4", padding: "10px", borderRadius: "5px" }}>
                                <strong>Resolution:</strong> {selectedIncident.resolution_summary}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
