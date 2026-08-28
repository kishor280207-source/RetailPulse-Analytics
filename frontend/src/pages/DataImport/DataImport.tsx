import { useState, useRef, useEffect } from "react";
import {
    previewImport,
    validateImport,
    processImport,
    getImportHistory,
    getImportErrors,
} from "../../api/importApi";
import type {
    PreviewResult,
    ValidationResult,
    ImportResult,
    ImportHistoryItem,
} from "../../api/importApi";

const extractErrorMessage = (err: any): string => {
    const detail = err?.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
    }

    return "Something went wrong. Please try again.";
};
type ImportType = "Products" | "Customers" | "Sales";
type Stage = "idle" | "previewing" | "validating" | "processing" | "done";

const STATUS_COLORS: Record<string, string> = {
    Pending: "#6b7280",
    Processing: "#2563eb",
    Completed: "#16a34a",
    "Completed with Errors": "#f97316",
    Failed: "#dc2626",
};

const downloadFailedRecordsCSV = (
    filename: string,
    errors: { row_number: number; error_reason: string; row_data: Record<string, any> }[]
) => {
    if (errors.length === 0) return;

    const dataColumns = Object.keys(errors[0].row_data || {});
    const headers = ["Row Number", "Error Reason", ...dataColumns];

    const rows = errors.map((e) => [
        String(e.row_number),
        e.error_reason,
        ...dataColumns.map((col) => String(e.row_data[col] ?? "")),
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_failed_records.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const DataImport = () => {
    const [importType, setImportType] = useState<ImportType>("Products");
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState("");

    const [stage, setStage] = useState<Stage>("idle");
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState("");

    const [history, setHistory] = useState<ImportHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadHistory = async () => {
        setHistoryLoading(true);
        setHistoryError("");
        try {
            const response = await getImportHistory();
            setHistory(response.data);
        } catch (err: any) {
           setError(extractErrorMessage(err));
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        setFileError("");
        setPreview(null);
        setValidation(null);
        setResult(null);

        if (!selected) return;

        if (!selected.name.toLowerCase().endsWith(".csv")) {
            setFileError("Only .csv files are supported.");
            setFile(null);
            return;
        }

        if (selected.size > 5 * 1024 * 1024) {
            setFileError("File is too large. Maximum size is 5MB.");
            setFile(null);
            return;
        }

        setFile(selected);
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFileError("");
        setPreview(null);
        setValidation(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePreview = async () => {
        if (!file) return;
        setStage("previewing");
        setError("");
        try {
            const response = await previewImport(file, importType);
            setPreview(response.data);
        } catch (err: any) {
            setError(extractErrorMessage(err));
        } finally {
            setStage("idle");
        }
    };

    const handleValidate = async () => {
        if (!file) return;
        setStage("validating");
        setError("");
        try {
            const response = await validateImport(file, importType);
            setValidation(response.data);
        } catch (err: any) {
            setError(extractErrorMessage(err));
        } finally {
            setStage("idle");
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setStage("processing");
        setError("");
        try {
            const response = await processImport(file, importType);
            setResult(response.data);
            setStage("done");
            loadHistory(); // refresh history to show the new import
        } catch (err: any) {
            setError(extractErrorMessage(err));
            setStage("idle");
        }
    };

    const handleDownloadFailed = async (item: ImportHistoryItem) => {
        setDownloadingId(item.id);
        try {
            const response = await getImportErrors(item.id);
            downloadFailedRecordsCSV(item.filename.replace(".csv", ""), response.data);
        } catch (err) {
            console.error("Failed to download failed records:", err);
        } finally {
            setDownloadingId(null);
        }
    };

    const selectStyle: React.CSSProperties = {
        padding: "8px 12px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        fontSize: "14px",
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

    const disabledButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        background: "#93c5fd",
        borderColor: "#93c5fd",
        cursor: "not-allowed",
    };

    const sectionStyle: React.CSSProperties = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto" }}>
            <h1>Data Import</h1>
                        {stage !== "idle" && (
                <div style={{ marginBottom: "16px", padding: "10px 16px", background: "#eff6ff", borderRadius: "6px", fontSize: "14px" }}>
                    <strong>Status:</strong>{" "}
                    {stage === "previewing" && "Uploading & reading file..."}
                    {stage === "validating" && "Validating records..."}
                    {stage === "processing" && "Processing import..."}
                    {stage === "done" && "Import completed."}
                </div>
            )}
            

            {error && (
                <div style={{ color: "red", background: "#ffeaea", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>
                    {error}
                </div>
            )}

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>1. Select Import Type</h3>
                <select
                    value={importType}
                    onChange={(e) => {
                        setImportType(e.target.value as ImportType);
                        handleRemoveFile();
                    }}
                    style={selectStyle}
                >
                    <option value="Products">Products</option>
                    <option value="Customers">Customers</option>
                    <option value="Sales">Sales Transactions</option>
                </select>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>2. Upload CSV File</h3>

                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} />

                {fileError && <p style={{ color: "red", marginTop: "8px" }}>{fileError}</p>}

                {file && (
                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <button onClick={handleRemoveFile} style={{ ...selectStyle, cursor: "pointer" }}>
                            Remove
                        </button>
                    </div>
                )}

                {file && (
                    <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                        <button
                            onClick={handlePreview}
                            disabled={stage === "previewing"}
                            style={stage === "previewing" ? disabledButtonStyle : buttonStyle}
                        >
                            {stage === "previewing" ? "Loading preview..." : "Preview Data"}
                        </button>

                        {preview && preview.missing_columns.length === 0 && (
                            <button
                                onClick={handleValidate}
                                disabled={stage === "validating"}
                                style={stage === "validating" ? disabledButtonStyle : buttonStyle}
                            >
                                {stage === "validating" ? "Validating..." : "Validate File"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {preview && (
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0 }}>3. CSV Preview</h3>

                    <p>Total Records: <strong>{preview.total_records}</strong></p>
                    <p>Detected Columns: {preview.columns.join(", ")}</p>

                    {preview.missing_columns.length > 0 && (
                        <div style={{ color: "#dc2626", background: "#fef2f2", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
                            Missing required columns: {preview.missing_columns.join(", ")}. Import cannot proceed until these are present.
                        </div>
                    )}

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                            <thead>
                                <tr>
                                    {preview.columns.map((col) => (
                                        <th key={col} style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.preview_rows.map((row, i) => (
                                    <tr key={i}>
                                        {preview.columns.map((col) => (
                                            <td key={col} style={{ padding: "6px", borderBottom: "1px solid #eee", fontSize: "13px" }}>
                                                {String(row[col])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {validation && (
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0 }}>4. Validation Result</h3>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                        <div>Total Records: <strong>{validation.total_records}</strong></div>
                        <div style={{ color: "#16a34a" }}>Valid: <strong>{validation.valid_records}</strong></div>
                        <div style={{ color: "#dc2626" }}>Invalid: <strong>{validation.invalid_records}</strong></div>
                        <div style={{ color: "#f97316" }}>Duplicates: <strong>{validation.duplicate_records}</strong></div>
                    </div>

                    {(validation.invalid_records > 0 || validation.duplicate_records > 0) && (
                        <div style={{ overflowX: "auto", marginBottom: "16px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Row</th>
                                        <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Status</th>
                                        <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validation.rows.filter((r) => r.status !== "valid").map((r) => (
                                        <tr key={r.row_number}>
                                            <td style={{ padding: "6px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{r.row_number}</td>
                                            <td style={{ padding: "6px", borderBottom: "1px solid #eee", fontSize: "13px" }}>
                                                <span style={{
                                                    background: r.status === "duplicate" ? "#f97316" : "#dc2626",
                                                    color: "#fff",
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                    fontSize: "11px",
                                                }}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: "6px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{r.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {validation.valid_records > 0 && (
                        <button onClick={handleImport} disabled={stage === "processing"} style={stage === "processing" ? disabledButtonStyle : buttonStyle}>
                            {stage === "processing" ? "Importing..." : `Import ${validation.valid_records} Valid Records`}
                        </button>
                    )}
                </div>
            )}

            {result && (
                <div style={{
                    ...sectionStyle,
                    background: result.status === "Completed" ? "#f0fdf4" : result.status === "Failed" ? "#fef2f2" : "#fff7ed",
                }}>
                    <h3 style={{ marginTop: 0 }}>Import {result.status}</h3>
                    <p>Total Records: <strong>{result.total_records}</strong></p>
                    <p>Successfully Added: <strong>{result.successful_records}</strong></p>
                    <p>Duplicates: <strong>{result.duplicate_records}</strong></p>
                    <p>Failed: <strong>{result.failed_records}</strong></p>
                </div>
            )}

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Import History</h3>

                {historyError && <p style={{ color: "red" }}>{historyError}</p>}

                {historyLoading ? (
                    <p>Loading import history...</p>
                ) : history.length === 0 ? (
                    <p>No imports yet. Once you run an import, it'll appear here.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>ID</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Type</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Filename</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Upload Date</th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Total</th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Success</th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Failed</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Status</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{item.id}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{item.import_type}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{item.filename}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                            {new Date(item.upload_date).toLocaleString()}
                                        </td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{item.total_records}</td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{item.successful_records}</td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{item.failed_records}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                            <span style={{
                                                background: STATUS_COLORS[item.status] || "#999",
                                                color: "#fff",
                                                padding: "3px 10px",
                                                borderRadius: "12px",
                                                fontSize: "12px",
                                            }}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                            {item.failed_records > 0 && (
                                                <button
                                                    onClick={() => handleDownloadFailed(item)}
                                                    disabled={downloadingId === item.id}
                                                    style={{ ...selectStyle, cursor: "pointer", fontSize: "12px" }}
                                                >
                                                    {downloadingId === item.id ? "..." : "Download Failed"}
                                                </button>
                                            )}
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

export default DataImport;
