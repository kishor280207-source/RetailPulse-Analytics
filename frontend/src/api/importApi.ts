import api from "./axios";

export interface PreviewResult {
    columns: string[];
    missing_columns: string[];
    total_records: number;
    preview_rows: Record<string, any>[];
}

export interface ValidationRow {
    row_number: number;
    status: "valid" | "invalid" | "duplicate";
    reason: string | null;
    data: Record<string, any>;
}

export interface ValidationResult {
    total_records: number;
    valid_records: number;
    invalid_records: number;
    duplicate_records: number;
    rows: ValidationRow[];
}

export interface ImportResult {
    import_id: number;
    total_records: number;
    successful_records: number;
    failed_records: number;
    duplicate_records: number;
    status: string;
}

export interface ImportHistoryItem {
    id: number;
    import_type: string;
    filename: string;
    uploaded_by: number;
    upload_date: string;
    total_records: number;
    successful_records: number;
    failed_records: number;
    duplicate_records: number;
    status: string;
}

export interface ImportErrorItem {
    row_number: number;
    error_reason: string;
    row_data: Record<string, any>;
}

export const previewImport = (file: File, importType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_type", importType);
    return api.post<PreviewResult>("/import/preview", formData);
};

export const validateImport = (file: File, importType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_type", importType);
    return api.post<ValidationResult>("/import/validate", formData);
};

export const processImport = (file: File, importType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("import_type", importType);
    return api.post<ImportResult>("/import/process", formData);
};

export const getImportHistory = () =>
    api.get<ImportHistoryItem[]>("/import/history");

export const getImportErrors = (importId: number) =>
    api.get<ImportErrorItem[]>(`/import/${importId}/errors`);