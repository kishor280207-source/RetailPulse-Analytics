import api from "./axios";

export interface DashboardSummary {
    total_records_checked: number;
    valid_records: number;
    warnings: number;
    errors: number;
    unresolved_issues: number;
    last_reconciliation: string | null;
}

export interface IssueRecord {
    id: number;
    issue_type: string;
    severity: string;
    affected_module: string;
    affected_record_id: string;
    description: string;
    status: string;
    detected_at: string;
    resolved_by_name: string | null;
    resolved_at: string | null;
    resolution_note: string | null;
}

export interface IssueDetail extends IssueRecord {
    details: Record<string, any>;
    previous_status: string | null;
}

export interface IssueListResponse {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    records: IssueRecord[];
}

export interface ReconciliationRunRecord {
    id: number;
    triggered_by_name: string | null;
    status: string;
    records_checked: number;
    issues_detected: number;
    issues_resolved: number;
    failed_checks: number;
    started_at: string;
    completed_at: string | null;
}

export interface ReconciliationHistoryResponse {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    records: ReconciliationRunRecord[];
}

export interface IssueFilters {
    page?: number;
    limit?: number;
    search?: string;
    issue_type?: string;
    severity?: string;
    module?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

export const getDashboardSummary = () =>
    api.get<DashboardSummary>("/data-quality/summary");

export const triggerReconciliation = () =>
    api.post<ReconciliationRunRecord>("/data-quality/run");

export const getReconciliationHistory = (page: number = 1, limit: number = 20) =>
    api.get<ReconciliationHistoryResponse>("/data-quality/history", { params: { page, limit } });

export const getIssues = (params?: IssueFilters) =>
    api.get<IssueListResponse>("/data-quality/issues", { params });

export const getIssueDetail = (id: number) =>
    api.get<IssueDetail>(`/data-quality/issues/${id}`);

export const updateIssueStatus = (id: number, status: string, resolutionNote?: string) =>
    api.patch(`/data-quality/issues/${id}/status`, { status, resolution_note: resolutionNote });