import api from "./axios";

export interface ReportFilters {
    start_date?: string;
    end_date?: string;
    product_id?: number;
    category_id?: number;
    customer_id?: number;
    status?: string;
    brand?: string;
    stock_status?: string;
    export_format?: string;
}

export interface ReportResult {
    report_id: number;
    report_type: string;
    filters_applied: Record<string, any>;
    generated_at: string;
    record_count: number;
    data: Record<string, any>[];
}

export interface ReportHistoryItem {
    id: number;
    report_type: string;
    generated_by_name: string;
    generated_at: string;
    filters_applied: Record<string, any>;
    format: string;
    status: string;
    record_count: number;
}

export interface ReportHistoryResponse {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    records: ReportHistoryItem[];
}

export interface ScheduleData {
    report_type: string;
    filters: Record<string, any>;
    frequency: "Daily" | "Weekly" | "Monthly";
    execution_time: string;
    recipients: string[];
    export_format: "CSV" | "PDF";
    is_active?: boolean;
}

export interface ScheduleRecord extends ScheduleData {
    id: number;
    last_run_at: string | null;
    last_run_status: string | null;
    next_run_at: string | null;
    is_active: boolean;
}

export const generateReport = (reportType: string, filters: ReportFilters) =>
    api.get<ReportResult>("/reports/generate", {
        params: { report_type: reportType, ...filters },
    });

export const getReportHistory = (page: number = 1, limit: number = 20) =>
    api.get<ReportHistoryResponse>("/reports/history", { params: { page, limit } });

export const getSchedules = () =>
    api.get<ScheduleRecord[]>("/reports/schedules");

export const createSchedule = (data: ScheduleData) =>
    api.post<ScheduleRecord>("/reports/schedules", data);

export const updateSchedule = (id: number, data: Partial<ScheduleData>) =>
    api.put<ScheduleRecord>(`/reports/schedules/${id}`, data);

export const deleteSchedule = (id: number) =>
    api.delete(`/reports/schedules/${id}`);

export const runScheduleNow = (id: number) =>
    api.post<ScheduleRecord>(`/reports/schedules/${id}/run`);
