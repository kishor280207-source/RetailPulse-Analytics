import api from "./axios";

export interface ComponentHealth {
    component: string;
    status: "Healthy" | "Degraded" | "Unavailable";
    response_time_ms: number | null;
    message?: string | null;
    checked_at: string;
}

export interface SystemHealthOverview {
    overall_status: "Healthy" | "Degraded" | "Unavailable";
    components: ComponentHealth[];
    api_availability_pct: number;
    avg_api_response_time_ms: number;
    failed_api_requests_15min: number;
    jobs: { active: number; pending: number; failed_recent: number };
    recent_errors: {
        id: number;
        category: string;
        component: string;
        severity: string;
        message: string;
        occurrence_count: number;
        last_seen_at: string;
    }[];
    last_health_check_at: string | null;
}

export interface ApiPerformanceRecord {
    id: number;
    endpoint: string;
    method: string;
    status_code: number;
    response_time_ms: number;
    error_detail: string | null;
    created_at: string;
}

export interface PaginatedResult<T> {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    records: T[];
}

export interface BackgroundJobRecord {
    id: number;
    job_type: string;
    triggered_by: number | null;
    status: "Pending" | "Running" | "Completed" | "Failed" | "Cancelled";
    started_at: string | null;
    completed_at: string | null;
    duration_seconds: number | null;
    retry_count: number;
    failure_reason: string | null;
    created_at: string;
}

export interface JobDetail extends BackgroundJobRecord {
    max_retries: number;
    related_resource_type: string | null;
    related_resource_id: number | null;
    result_summary: Record<string, any> | null;
}

export interface SystemErrorRecord {
    id: number;
    error_category: string;
    component: string;
    endpoint_or_job: string | null;
    severity: "Low" | "Medium" | "High" | "Critical";
    occurrence_count: number;
    first_seen_at: string;
    last_seen_at: string;
    status: "Open" | "Investigating" | "Resolved";
    message: string;
}

export interface IncidentRecord {
    id: number;
    title: string;
    status: "Open" | "Investigating" | "Resolved";
    severity: string;
    opened_at: string;
    resolved_at: string | null;
}

export interface IncidentTimelineEntry {
    id: number;
    user_id: number | null;
    event_type: "StatusChange" | "Note";
    from_status: string | null;
    to_status: string | null;
    note: string | null;
    created_at: string;
}

export interface IncidentDetail extends IncidentRecord {
    resolution_summary: string | null;
    timeline: IncidentTimelineEntry[];
}

export const getSystemHealthOverview = () =>
    api.get<SystemHealthOverview>("/monitoring/health/overview");

export const getComponentHealthHistory = (component: string, hours = 24) =>
    api.get(`/monitoring/health/${component}/history`, { params: { hours } });

export const getApiPerformance = (params: {
    endpoint?: string;
    status_code?: number;
    success?: boolean;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}) => api.get<PaginatedResult<ApiPerformanceRecord>>("/monitoring/api-performance", { params });

export const getJobs = (params: {
    job_type?: string;
    status?: string;
    page?: number;
    limit?: number;
}) => api.get<PaginatedResult<BackgroundJobRecord>>("/monitoring/jobs", { params });

export const getJobDetail = (jobId: number) =>
    api.get<JobDetail>(`/monitoring/jobs/${jobId}`);

export const retryJob = (jobId: number) =>
    api.post(`/monitoring/jobs/${jobId}/retry`);

export const cancelJob = (jobId: number) =>
    api.post(`/monitoring/jobs/${jobId}/cancel`);

export const getErrors = (params: {
    severity?: string;
    component?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}) => api.get<PaginatedResult<SystemErrorRecord>>("/monitoring/errors", { params });

export const updateErrorStatus = (
    errorId: number,
    status: string,
    resolution_notes?: string
) => api.put(`/monitoring/errors/${errorId}/status`, { status, resolution_notes });


export const getIncidents = (params: { status?: string; severity?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResult<IncidentRecord>>("/monitoring/incidents", { params });

export const getIncidentDetail = (incidentId: number) =>
    api.get<IncidentDetail>(`/monitoring/incidents/${incidentId}`);

export const openIncident = (data: { title: string; severity?: string; related_error_id?: number }) =>
    api.post("/monitoring/incidents", data);

export const updateIncidentStatus = (
    incidentId: number,
    data: { status: string; note?: string; resolution_summary?: string }
) => api.put(`/monitoring/incidents/${incidentId}/status`, data);

export const addIncidentNote = (incidentId: number, note: string) =>
    api.post(`/monitoring/incidents/${incidentId}/notes`, { note });

export const getThresholds = () => api.get("/monitoring/thresholds");

export const setThreshold = (metric: string, threshold_value: number, window_minutes = 15) =>
    api.put("/monitoring/thresholds", { metric, threshold_value, window_minutes });