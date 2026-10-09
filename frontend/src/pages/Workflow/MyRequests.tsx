import { useEffect, useState } from "react";
import { getMyRequests, cancelRequest } from "../../api/workflowApi";
import type { WorkflowRequestRecord } from "../../api/workflowApi";

const STATUS_COLORS: Record<string, string> = {
    Draft: "#6b7280", Submitted: "#2563eb", "Pending Approval": "#f97316",
    Approved: "#16a34a", Rejected: "#dc2626", Cancelled: "#6b7280",
};

const MyRequests = () => {
    const [records, setRecords] = useState<WorkflowRequestRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const response = await getMyRequests({ page: 1, limit: 50 });
            setRecords(response.data.records);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCancel = async (id: number) => {
        if (!window.confirm("Cancel this request?")) return;
        await cancelRequest(id);
        load();
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            <h1>My Requests</h1>
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px" }}>
                {loading ? <p>Loading...</p> : records.length === 0 ? <p>You haven't submitted any requests yet.</p> : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>ID</th>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Type</th>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Reason</th>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Submitted</th>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Status</th>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>#{r.id}</td>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{r.request_type}</td>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{r.reason}</td>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{new Date(r.created_at).toLocaleString()}</td>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                        <span style={{ background: STATUS_COLORS[r.status] || "#999", color: "#fff", padding: "2px 10px", borderRadius: "10px", fontSize: "11px" }}>{r.status}</span>
                                    </td>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                        {r.status === "Pending Approval" && (
                                            <button onClick={() => handleCancel(r.id)} style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "5px", border: "1px solid #ccc" }}>Cancel</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MyRequests;