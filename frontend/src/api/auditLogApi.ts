import api from "./axios";

export interface AuditLogRecord {
    id: number;
    user_id: number | null;
    user_name: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    description: string | null;
    status: string;
    ip_address: string | null;
    created_at: string;
}

export interface AuditLogDetail extends AuditLogRecord {
    before_values: Record<string, any> | null;
    after_values: Record<string, any> | null;
    user_agent: string | null;
}

export interface AuditLogListResponse {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    records: AuditLogRecord[];
}

export interface AuditLogFilters {
    page?: number;
    limit?: number;
    search?: string;
    user_id?: number;
    action?: string;
    resource_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    sort_order?: "asc" | "desc";
}

export const getAuditLogs = (params?: AuditLogFilters) =>
    api.get<AuditLogListResponse>("/audit-logs/", { params });

export const getAuditLogDetail = (id: number) =>
    api.get<AuditLogDetail>(`/audit-logs/${id}`);

export const clearAuditLogs = (beforeDate?: string) =>
    api.delete("/audit-logs/clear", { params: beforeDate ? { before_date: beforeDate } : {} });