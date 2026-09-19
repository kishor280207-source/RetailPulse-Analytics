import { useEffect, useState } from "react";
import {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    runScheduleNow,
} from "../../api/reportApi";
import type { ScheduleRecord } from "../../api/reportApi";

const REPORT_TYPES = [
    { value: "Sales", label: "Sales Report" },
    { value: "Inventory", label: "Inventory Report" },
    { value: "Customer", label: "Customer Report" },
    { value: "ProductPerformance", label: "Product Performance Report" },
    { value: "StockMovement", label: "Stock Movement Report" },
];

const ScheduledReports = () => {
    const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [reportType, setReportType] = useState("Sales");
    const [frequency, setFrequency] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
    const [executionTime, setExecutionTime] = useState("09:00");
    const [recipients, setRecipients] = useState("");
    const [exportFormat, setExportFormat] = useState<"CSV" | "PDF">("CSV");
    const [saving, setSaving] = useState(false);

    const [runningId, setRunningId] = useState<number | null>(null);
    const [runMessage, setRunMessage] = useState("");

    const loadSchedules = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getSchedules();
            setSchedules(response.data);
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to load schedules.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, []);

    const resetForm = () => {
        setReportType("Sales");
        setFrequency("Daily");
        setExecutionTime("09:00");
        setRecipients("");
        setExportFormat("CSV");
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (schedule: ScheduleRecord) => {
        setReportType(schedule.report_type);
        setFrequency(schedule.frequency as "Daily" | "Weekly" | "Monthly");
        setExecutionTime(schedule.execution_time);
        setRecipients(schedule.recipients.join(", "));
        setExportFormat(schedule.export_format as "CSV" | "PDF");
        setEditingId(schedule.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        const recipientList = recipients
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r.length > 0);

        if (recipientList.length === 0) {
            setError("At least one recipient email is required.");
            return;
        }

        setSaving(true);
        setError("");

        const data = {
            report_type: reportType,
            filters: {},
            frequency,
            execution_time: executionTime,
            recipients: recipientList,
            export_format: exportFormat,
        };

        try {
            if (editingId) {
                await updateSchedule(editingId, data);
            } else {
                await createSchedule(data);
            }
            resetForm();
            loadSchedules();
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to save schedule.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (schedule: ScheduleRecord) => {
        try {
            await updateSchedule(schedule.id, { is_active: !schedule.is_active });
            loadSchedules();
        } catch (err) {
            console.error("Failed to toggle schedule:", err);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm("Delete this scheduled report? This cannot be undone.");
        if (!confirmed) return;

        try {
            await deleteSchedule(id);
            loadSchedules();
        } catch (err) {
            console.error("Failed to delete schedule:", err);
        }
    };

    const handleRunNow = async (id: number) => {
        setRunningId(id);
        setRunMessage("");
        try {
            const response = await runScheduleNow(id);
            setRunMessage(`Report run: ${response.data.last_run_status}`);
            loadSchedules();
        } catch (err: any) {
            setRunMessage(err?.response?.data?.detail || "Failed to run report.");
        } finally {
            setRunningId(null);
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

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                <h1 style={{ margin: 0 }}>Scheduled Reports</h1>
                <button onClick={() => { resetForm(); setShowForm(true); }} style={buttonStyle}>
                    + New Schedule
                </button>
            </div>

            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", fontSize: "13px" }}>
                <strong>Note:</strong> Schedules are stored with their calculated next-run time, but this project has no background job runner to trigger them automatically at that time. Use "Run Now" to manually generate a scheduled report, or connect an external scheduler (cron/Task Scheduler) to trigger runs automatically.
            </div>

            {error && (
                <div style={{ color: "red", background: "#ffeaea", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>
                    {error}
                </div>
            )}

            {runMessage && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>
                    {runMessage}
                </div>
            )}

            {showForm && (
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Schedule" : "New Schedule"}</h3>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
                            Report Type
                            <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={selectStyle}>
                                {REPORT_TYPES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
                            Frequency
                            <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} style={selectStyle}>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
                            Execution Time
                            <input type="time" value={executionTime} onChange={(e) => setExecutionTime(e.target.value)} style={selectStyle} />
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
                            Export Format
                            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} style={selectStyle}>
                                <option value="CSV">CSV</option>
                                <option value="PDF">PDF</option>
                            </select>
                        </label>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", marginBottom: "16px" }}>
                        Recipients (comma-separated emails)
                        <input
                            type="text"
                            placeholder="admin@company.com, manager@company.com"
                            value={recipients}
                            onChange={(e) => setRecipients(e.target.value)}
                            style={{ ...selectStyle, width: "100%" }}
                        />
                    </label>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={handleSave} disabled={saving} style={buttonStyle}>
                            {saving ? "Saving..." : editingId ? "Update Schedule" : "Create Schedule"}
                        </button>
                        <button onClick={resetForm} style={selectStyle}>Cancel</button>
                    </div>
                </div>
            )}

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Existing Schedules</h3>

                {loading ? (
                    <p>Loading schedules...</p>
                ) : schedules.length === 0 ? (
                    <p>No scheduled reports yet. Click "+ New Schedule" to create one.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Report Type</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Frequency</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Time</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Format</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Recipients</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Last Run</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Status</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{s.report_type}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{s.frequency}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{s.execution_time}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{s.export_format}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{s.recipients.join(", ")}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>
                                            {s.last_run_at ? new Date(s.last_run_at).toLocaleString() : "Never"}
                                        </td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                            <span style={{
                                                background: s.is_active ? "#16a34a" : "#6b7280",
                                                color: "#fff",
                                                padding: "2px 10px",
                                                borderRadius: "10px",
                                                fontSize: "12px",
                                            }}>
                                                {s.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                <button onClick={() => handleRunNow(s.id)} disabled={runningId === s.id} style={{ ...selectStyle, fontSize: "12px" }}>
                                                    {runningId === s.id ? "..." : "Run Now"}
                                                </button>
                                                <button onClick={() => handleEdit(s)} style={{ ...selectStyle, fontSize: "12px" }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => handleToggleActive(s)} style={{ ...selectStyle, fontSize: "12px" }}>
                                                    {s.is_active ? "Disable" : "Enable"}
                                                </button>
                                                <button onClick={() => handleDelete(s.id)} style={{ ...selectStyle, fontSize: "12px", color: "#dc2626" }}>
                                                    Delete
                                                </button>
                                            </div>
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

export default ScheduledReports;
