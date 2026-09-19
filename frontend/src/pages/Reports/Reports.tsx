import { useState, useEffect } from "react";
import { generateReport, getReportHistory } from "../../api/reportApi";
import type { ReportResult, ReportHistoryItem } from "../../api/reportApi";
import { exportReportCSV, exportReportPDF } from "../../utils/reportExport";
import { getProducts } from "../../api/productApi";
import { getCustomers } from "../../api/customerApi";

const REPORT_TYPES = [
    { value: "Sales", label: "Sales Report" },
    { value: "Inventory", label: "Inventory Report" },
    { value: "Customer", label: "Customer Report" },
    { value: "ProductPerformance", label: "Product Performance Report" },
    { value: "StockMovement", label: "Stock Movement Report" },
];

// which filters apply to which report type
const APPLICABLE_FILTERS: Record<string, string[]> = {
    Sales: ["start_date", "end_date", "product_id", "category_id", "customer_id", "status"],
    Inventory: ["category_id", "brand", "stock_status"],
    Customer: ["start_date", "end_date", "customer_id"],
    ProductPerformance: ["start_date", "end_date", "category_id", "brand"],
    StockMovement: ["start_date", "end_date", "product_id"],
};

const Reports = () => {
    const [reportType, setReportType] = useState("Sales");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [productId, setProductId] = useState<number | "">("");
    const [categoryId, setCategoryId] = useState<number | "">("");
    const [customerId, setCustomerId] = useState<number | "">("");
    const [status, setStatus] = useState("");
    const [brand, setBrand] = useState("");
    const [stockStatus, setStockStatus] = useState("");

    const [products, setProducts] = useState<{ id: number; name: string; category_id: number; category_name?: string; brand?: string }[]>([]);
    const [customers, setCustomers] = useState<{ id: number; full_name: string }[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string }[]>([]);

    const [result, setResult] = useState<ReportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const [history, setHistory] = useState<ReportHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [productsRes, customersRes] = await Promise.all([getProducts(), getCustomers()]);
                setProducts(productsRes.data || []);
                setCustomers(customersRes.data || []);

                const map = new Map<number, string>();
                (productsRes.data || []).forEach((p: any) => {
                    if (p.category_id && !map.has(p.category_id)) {
                        map.set(p.category_id, p.category_name || `Category ${p.category_id}`);
                    }
                });
                setCategoryOptions(Array.from(map.entries()).map(([id, name]) => ({ id, name })));
            } catch (err) {
                console.error("Failed to load filter options:", err);
            }
        };
        loadOptions();
    }, []);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await getReportHistory(1, 10);
            setHistory(response.data.records);
        } catch (err) {
            console.error("Failed to load report history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const buildFilters = () => {
        const filters: Record<string, any> = {};
        const applicable = APPLICABLE_FILTERS[reportType] || [];

        if (applicable.includes("start_date") && startDate) filters.start_date = startDate;
        if (applicable.includes("end_date") && endDate) filters.end_date = endDate;
        if (applicable.includes("product_id") && productId) filters.product_id = productId;
        if (applicable.includes("category_id") && categoryId) filters.category_id = categoryId;
        if (applicable.includes("customer_id") && customerId) filters.customer_id = customerId;
        if (applicable.includes("status") && status) filters.status = status;
        if (applicable.includes("brand") && brand) filters.brand = brand;
        if (applicable.includes("stock_status") && stockStatus) filters.stock_status = stockStatus;

        return filters;
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError("");
        setResult(null);
        setPage(1);
        setSortKey(null);

        try {
            const filters = buildFilters();
            const response = await generateReport(reportType, filters);
            setResult(response.data);
            loadHistory();
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    const filterLabel = () => {
        if (!result) return "";
        const entries = Object.entries(result.filters_applied);
        if (entries.length === 0) return "No filters applied (all data)";
        return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    const sortedData = (() => {
        if (!result) return [];
        if (!sortKey) return result.data;

        return [...result.data].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA === valB) return 0;
            const comparison = valA > valB ? 1 : -1;
            return sortOrder === "asc" ? comparison : -comparison;
        });
    })();

    const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
    const pagedData = sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const columns = result && result.data.length > 0 ? Object.keys(result.data[0]) : [];

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

    const applicable = APPLICABLE_FILTERS[reportType] || [];

    return (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <h1>Reports</h1>

            {error && (
                <div style={{ color: "red", background: "#ffeaea", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>
                    {error}
                </div>
            )}

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>1. Select Report Type</h3>
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={selectStyle}>
                    {REPORT_TYPES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0, marginBottom: "12px" }}>2. Filters</h3>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {applicable.includes("start_date") && (
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                            From: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={selectStyle} />
                        </label>
                    )}

                    {applicable.includes("end_date") && (
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                            To: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={selectStyle} />
                        </label>
                    )}

                    {applicable.includes("product_id") && (
                        <select value={productId} onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")} style={selectStyle}>
                            <option value="">All Products</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    )}

                    {applicable.includes("category_id") && (
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")} style={selectStyle}>
                            <option value="">All Categories</option>
                            {categoryOptions.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {applicable.includes("customer_id") && (
                        <select value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")} style={selectStyle}>
                            <option value="">All Customers</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>{c.full_name}</option>
                            ))}
                        </select>
                    )}

                    {applicable.includes("status") && (
                        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
                            <option value="">All Statuses</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    )}

                    {applicable.includes("brand") && (
                        <input
                            type="text"
                            placeholder="Brand"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            style={selectStyle}
                        />
                    )}

                    {applicable.includes("stock_status") && (
                        <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} style={selectStyle}>
                            <option value="">All Stock Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Out Of Stock">Out Of Stock</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    )}
                </div>

                <button onClick={handleGenerate} disabled={loading} style={{ ...buttonStyle, marginTop: "16px" }}>
                    {loading ? "Generating..." : "Generate Report"}
                </button>
            </div>

            {result && (
                <div style={sectionStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                        <div>
                            <h3 style={{ margin: "0 0 4px" }}>{reportType} Report Results</h3>
                            <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
                                Filters applied: {filterLabel()}
                            </p>
                            <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
                                Generated: {new Date(result.generated_at).toLocaleString()} | {result.record_count} records
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => exportReportCSV(reportType, result.data, filterLabel())} style={selectStyle}>
                                Export CSV
                            </button>
                            <button onClick={() => exportReportPDF(reportType, result.data, filterLabel())} style={selectStyle}>
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {result.data.length === 0 ? (
                        <p>No records found for the selected filters.</p>
                    ) : (
                        <>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                                    <thead>
                                        <tr>
                                            {columns.map((col) => (
                                                <th
                                                    key={col}
                                                    onClick={() => handleSort(col)}
                                                    style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", cursor: "pointer", fontSize: "13px", userSelect: "none" }}
                                                >
                                                    {col.replace(/_/g, " ")}
                                                    {sortKey === col && (sortOrder === "asc" ? " ▲" : " ▼")}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedData.map((row, i) => (
                                            <tr key={i}>
                                                {columns.map((col) => (
                                                    <td key={col} style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>
                                                        {String(row[col] ?? "-")}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "16px", alignItems: "center" }}>
                                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={selectStyle}>Previous</button>
                                    <span style={{ fontSize: "13px" }}>Page {page} of {totalPages}</span>
                                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={selectStyle}>Next</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Report History</h3>

                {historyLoading ? (
                    <p>Loading history...</p>
                ) : history.length === 0 ? (
                    <p>No reports generated yet.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Report Type</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Generated By</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Date/Time</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Format</th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Records</th>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: "13px" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h) => (
                                    <tr key={h.id}>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{h.report_type}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{h.generated_by_name || "-"}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{new Date(h.generated_at).toLocaleString()}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{h.format}</td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px" }}>{h.record_count}</td>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                            <span style={{
                                                background: h.status === "Completed" ? "#16a34a" : "#dc2626",
                                                color: "#fff",
                                                padding: "2px 10px",
                                                borderRadius: "10px",
                                                fontSize: "12px",
                                            }}>
                                                {h.status}
                                            </span>
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

export default Reports;
