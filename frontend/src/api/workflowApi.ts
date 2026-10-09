import api from "./axios";

export interface WorkflowRequestRecord {
    id: number;
    request_type: string;
    requested_by: number;
    requested_by_name: string;
    related_record_type: string | null;
    related_record_id: string | null;
    reason: string;
    priority: string;
    status: string;
    approver_role: string;
    approved_by_name: string | null;
    decided_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface WorkflowRequestDetail extends WorkflowRequestRecord {
    current_values: Record<string, any>;
    requested_values: Record<string, any>;
}

export interface HistoryEntry {
    action: string;
    performed_by_name: string | null;
    comment: string | null;
    timestamp: string;
}

export interface ListResponse {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    records: WorkflowRequestRecord[];
}

export interface WorkflowConfigItem {
    id: number;
    request_type: string;
    approver_role: string;
    approval_required: boolean;
    self_approval_allowed: boolean;
    is_active: boolean;
}

export const getQueue = (params?: any) => api.get<ListResponse>("/workflow/requests/queue", { params });
export const getMyRequests = (params?: any) => api.get<ListResponse>("/workflow/requests/my", { params });
export const getPendingCount = () => api.get<{ pending_count: number }>("/workflow/pending-count");
export const getRequestDetail = (id: number) => api.get<WorkflowRequestDetail>(`/workflow/requests/${id}`);
export const getRequestHistory = (id: number) => api.get<HistoryEntry[]>(`/workflow/requests/${id}/history`);

export const createRequest = (data: { request_type: string; related_record_id: number; requested_values: Record<string, any>; reason: string; priority?: string }) =>
    api.post("/workflow/requests", data);

export const createImportApprovalRequest = (file: File, importType: string, reason: string, priority: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_type", importType);
    formData.append("reason", reason);
    formData.append("priority", priority);
    return api.post("/workflow/requests/import-approval", formData);
};

export const approveRequest = (id: number, comment?: string) => api.post(`/workflow/requests/${id}/approve`, { comment });
export const rejectRequest = (id: number, rejection_reason: string) => api.post(`/workflow/requests/${id}/reject`, { rejection_reason });
export const cancelRequest = (id: number) => api.post(`/workflow/requests/${id}/cancel`);

export const getWorkflowConfigs = () => api.get<WorkflowConfigItem[]>("/workflow/config");
export const updateWorkflowConfig = (id: number, data: Partial<WorkflowConfigItem>) => api.put(`/workflow/config/${id}`, data);