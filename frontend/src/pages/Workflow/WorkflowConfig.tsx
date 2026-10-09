import { useEffect, useState } from "react";
import { getWorkflowConfigs, updateWorkflowConfig } from "../../api/workflowApi";
import type { WorkflowConfigItem } from "../../api/workflowApi";

const WorkflowConfigPage = () => {
    const [configs, setConfigs] = useState<WorkflowConfigItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const response = await getWorkflowConfigs();
        setConfigs(response.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleUpdate = async (id: number, field: keyof WorkflowConfigItem, value: any) => {
        await updateWorkflowConfig(id, { [field]: value });
        load();
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto" }}>
            <h1>Workflow Configuration</h1>
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px" }}>
                {loading ? <p>Loading...</p> : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Request Type</th>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Approver Role</th>
                                <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Approval Required</th>
                                <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Self-Approval Allowed</th>
                                <th style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{c.request_type}</td>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>
                                        <select value={c.approver_role} onChange={(e) => handleUpdate(c.id, "approver_role", e.target.value)} style={{ fontSize: "12px" }}>
                                            <option value="Admin">Admin</option>
                                            <option value="User">User</option>
                                        </select>
                                    </td>
                                    <td style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        <input type="checkbox" checked={c.approval_required} onChange={(e) => handleUpdate(c.id, "approval_required", e.target.checked)} />
                                    </td>
                                    <td style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        <input type="checkbox" checked={c.self_approval_allowed} onChange={(e) => handleUpdate(c.id, "self_approval_allowed", e.target.checked)} />
                                    </td>
                                    <td style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        <input type="checkbox" checked={c.is_active} onChange={(e) => handleUpdate(c.id, "is_active", e.target.checked)} />
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

export default WorkflowConfigPage;