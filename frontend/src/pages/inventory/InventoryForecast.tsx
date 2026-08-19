import { useEffect, useState, useMemo } from "react";
import {
    getInventoryForecast,
    getProductRecommendation,
    getProductDemandHistory,
} from "../../api/inventoryForecastApi";
import type {
    ForecastItem,
    ProductRecommendation,
    DemandHistoryPoint,
} from "../../api/inventoryForecastApi";
import { getProducts } from "../../api/productApi";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

interface ProductOption {
    id: number;
    category_id: number;
    category_name?: string;
}

const RISK_COLORS: Record<string, string> = {
    "Out of Stock": "#dc2626",
    "Stockout Risk": "#f97316",
    "Low Stock": "#eab308",
    "Healthy": "#16a34a",
    "Overstock": "#2563eb",
    "No Sales Data": "#6b7280",
};

const RISK_OPTIONS = [
    "Out of Stock",
    "Stockout Risk",
    "Low Stock",
    "Healthy",
    "Overstock",
    "No Sales Data",
];

const SORT_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "Default" },
    { value: "current_stock", label: "Current Stock" },
    { value: "forecasted_demand", label: "Forecasted Demand" },
    { value: "days_remaining", label: "Days Remaining" },
    { value: "recommended_quantity", label: "Recommended Quantity" },
    { value: "risk", label: "Risk Level" },
];

const PAGE_SIZE = 10;

const InventoryForecast = () => {
    const [forecast, setForecast] = useState<ForecastItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string }[]>([]);

    const [riskFilter, setRiskFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<number | "">("");
    const [reorderOnly, setReorderOnly] = useState(false);
    const [sortBy, setSortBy] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [page, setPage] = useState(1);

    const [appliedFilters, setAppliedFilters] = useState({
        risk: undefined as string | undefined,
        category_id: undefined as number | undefined,
        reorder_required: undefined as boolean | undefined,
        sort_by: undefined as string | undefined,
        sort_order: "asc" as "asc" | "desc",
    });

    
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [recommendation, setRecommendation] = useState<ProductRecommendation | null>(null);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState("");

    const [demandHistory, setDemandHistory] = useState<DemandHistoryPoint[]>([]);
    const [chartLoading, setChartLoading] = useState(false);
    const [chartError, setChartError] = useState("");

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await getProducts();
                const products: ProductOption[] = response.data || [];
                const map = new Map<number, string>();
                products.forEach((p) => {
                    if (p.category_id && !map.has(p.category_id)) {
                        map.set(p.category_id, p.category_name || `Category ${p.category_id}`);
                    }
                });
                setCategoryOptions(Array.from(map.entries()).map(([id, name]) => ({ id, name })));
            } catch (err) {
                console.error("Failed to load categories:", err);
            }
        };

        loadCategories();
    }, []);

    
    useEffect(() => {
        const timeout = setTimeout(() => {
            setAppliedFilters({
                risk: riskFilter || undefined,
                category_id: categoryFilter || undefined,
                reorder_required: reorderOnly || undefined,
                sort_by: sortBy || undefined,
                sort_order: sortOrder,
            });
            setPage(1); 
        }, 350);

        return () => clearTimeout(timeout);
    }, [riskFilter, categoryFilter, reorderOnly, sortBy, sortOrder]);

    useEffect(() => {
        const loadForecast = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await getInventoryForecast(appliedFilters);
                setForecast(response.data);
            } catch (err: any) {
                console.error("Failed to load forecast:", err);
                setError(
                    err?.response?.data?.detail ||
                    "Failed to load inventory forecast."
                );
            } finally {
                setLoading(false);
            }
        };

        loadForecast();
    }, [appliedFilters]);

   
    useEffect(() => {
        if (selectedProductId === null) {
            setRecommendation(null);
            setDemandHistory([]);
            return;
        }

        const loadRecommendation = async () => {
            setRecommendationLoading(true);
            setRecommendationError("");

            try {
                const response = await getProductRecommendation(selectedProductId);
                setRecommendation(response.data);
            } catch (err: any) {
                console.error("Failed to load recommendation:", err);
                setRecommendationError(
                    err?.response?.data?.detail ||
                    "Failed to load recommendation details."
                );
            } finally {
                setRecommendationLoading(false);
            }
        };

        const loadChart = async () => {
            setChartLoading(true);
            setChartError("");

            try {
                const response = await getProductDemandHistory(selectedProductId, 30);
                setDemandHistory(response.data);
            } catch (err: any) {
                console.error("Failed to load demand history:", err);
                setChartError(
                    err?.response?.data?.detail ||
                    "Failed to load demand history."
                );
            } finally {
                setChartLoading(false);
            }
        };

        loadRecommendation();
        loadChart();
    }, [selectedProductId]);

    const summary = {
        reorderRequired: forecast.filter((f) => f.recommended_reorder_quantity > 0).length,
        stockoutRisk: forecast.filter((f) => f.stock_risk === "Stockout Risk" || f.stock_risk === "Out of Stock").length,
        overstocked: forecast.filter((f) => f.stock_risk === "Overstock").length,
        healthy: forecast.filter((f) => f.stock_risk === "Healthy").length,
    };

    
    const totalPages = Math.max(1, Math.ceil(forecast.length / PAGE_SIZE));
    const pagedForecast = useMemo(
        () => forecast.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [forecast, page]
    );

    const formattedChartData = useMemo(() => {
        return demandHistory.map((point) => ({
            date: new Date(point.date).toLocaleDateString(),
            "Historical Demand": point.units_sold,
        }));
    }, [demandHistory]);

    const cardStyle: React.CSSProperties = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        minWidth: 0,
    };

    const sectionStyle: React.CSSProperties = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
    };

    const selectStyle: React.CSSProperties = {
        padding: "6px 10px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        fontSize: "13px",
    };

    const comparisonRow = (
        label: string,
        current: number,
        recommended: number,
        actionNeeded: boolean
    ) => (
        <tr>
            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{label}</td>
            <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{current}</td>
            <td
                style={{
                    textAlign: "right",
                    padding: "8px",
                    borderBottom: "1px solid #eee",
                    fontWeight: actionNeeded ? "bold" : "normal",
                    color: actionNeeded ? "#dc2626" : "inherit",
                }}
            >
                {recommended}
            </td>
        </tr>
    );

    return (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <h1>Inventory Forecast</h1>

            {error && (
                <div style={{ color: "red", background: "#ffeaea", padding: "12px", marginBottom: "20px", borderRadius: "5px" }}>
                    {error}
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px" }}>Products Requiring Reorder</h4>
                    <h2 style={{ margin: 0 }}>{loading ? "..." : summary.reorderRequired}</h2>
                </div>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px" }}>At Stockout Risk</h4>
                    <h2 style={{ margin: 0 }}>{loading ? "..." : summary.stockoutRisk}</h2>
                </div>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px" }}>Overstocked</h4>
                    <h2 style={{ margin: 0 }}>{loading ? "..." : summary.overstocked}</h2>
                </div>
                <div style={cardStyle}>
                    <h4 style={{ margin: "0 0 8px" }}>Healthy</h4>
                    <h2 style={{ margin: 0 }}>{loading ? "..." : summary.healthy}</h2>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Filters</h3>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={selectStyle}>
                        <option value="">All Risk Levels</option>
                        {RISK_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : "")}
                        style={selectStyle}
                    >
                        <option value="">All Categories</option>
                        {categoryOptions.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                        <input
                            type="checkbox"
                            checked={reorderOnly}
                            onChange={(e) => setReorderOnly(e.target.checked)}
                        />
                        Reorder Required Only
                    </label>

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
                        {SORT_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>Sort: {s.label}</option>
                        ))}
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                        style={selectStyle}
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ marginTop: 0 }}>Forecast Table</h3>
                <p style={{ fontSize: "13px", color: "#666", marginTop: "-8px" }}>
                    Click a row to see the recommendation comparison and demand chart below.
                </p>

                {loading ? (
                    <p>Loading forecast...</p>
                ) : forecast.length === 0 ? (
                    <p>No products match the selected filters.</p>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Product</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>SKU</th>
                                        <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Current Stock</th>
                                        <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Avg Daily Sales</th>
                                        <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Forecasted Demand</th>
                                        <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Days Remaining</th>
                                        <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Reorder Point</th>
                                        <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Recommended Qty</th>
                                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Risk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedForecast.map((item) => (
                                        <tr
                                            key={item.product_id}
                                            onClick={() => setSelectedProductId(item.product_id)}
                                            style={{
                                                cursor: "pointer",
                                                background: selectedProductId === item.product_id ? "#eff6ff" : "transparent",
                                            }}
                                        >
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{item.product_name}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{item.sku}</td>
                                            <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{item.current_stock}</td>
                                            <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{item.average_daily_sales}</td>
                                            <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{item.forecasted_demand}</td>
                                            <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>
                                                {item.days_of_stock_remaining ?? "N/A"}
                                            </td>
                                            <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{item.reorder_point}</td>
                                            <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>{item.recommended_reorder_quantity}</td>
                                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                                <span
                                                    style={{
                                                        background: RISK_COLORS[item.stock_risk] || "#999",
                                                        color: "#fff",
                                                        padding: "3px 10px",
                                                        borderRadius: "12px",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    {item.stock_risk}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "16px", alignItems: "center" }}>
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={selectStyle}
                                >
                                    Previous
                                </button>
                                <span style={{ fontSize: "13px" }}>Page {page} of {totalPages}</span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={selectStyle}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedProductId !== null && (
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0 }}>
                        Recommendation Comparison{recommendation ? `: ${recommendation.product_name}` : ""}
                    </h3>

                    {recommendationError && <p style={{ color: "red" }}>{recommendationError}</p>}

                    {recommendationLoading ? (
                        <p>Loading recommendation...</p>
                    ) : recommendation ? (
                        <>
                            <div style={{ overflowX: "auto", marginBottom: "16px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: "500px" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Metric</th>
                                            <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Current</th>
                                            <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>Recommended</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparisonRow(
                                            "Stock",
                                            recommendation.comparison.current_stock,
                                            recommendation.comparison.recommended_stock,
                                            recommendation.comparison.current_stock < recommendation.comparison.recommended_stock
                                        )}
                                        {comparisonRow(
                                            "Daily Demand",
                                            recommendation.comparison.current_daily_demand,
                                            recommendation.comparison.recommended_daily_demand,
                                            false
                                        )}
                                        {comparisonRow(
                                            "Reorder Point",
                                            recommendation.comparison.current_reorder_point,
                                            recommendation.comparison.recommended_reorder_point,
                                            false
                                        )}
                                        {comparisonRow(
                                            "Safety Stock",
                                            recommendation.comparison.current_safety_stock,
                                            recommendation.comparison.recommended_safety_stock,
                                            false
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: "6px",
                                    background: recommendation.recommended_reorder_quantity > 0 ? "#fff7ed" : "#f0fdf4",
                                    border: `1px solid ${recommendation.recommended_reorder_quantity > 0 ? "#fdba74" : "#86efac"}`,
                                }}
                            >
                                <strong>{recommendation.stock_risk}:</strong> {recommendation.recommendation}
                                {recommendation.recommended_reorder_quantity > 0 && (
                                    <> Recommended reorder quantity: <strong>{recommendation.recommended_reorder_quantity}</strong> units.</>
                                )}
                            </div>
                        </>
                    ) : null}

                    <h4 style={{ marginTop: "24px", marginBottom: "8px" }}>Demand Forecast (Last 30 Days)</h4>

                    {chartError && <p style={{ color: "red" }}>{chartError}</p>}

                    {chartLoading ? (
                        <p>Loading chart...</p>
                    ) : formattedChartData.length === 0 ? (
                        <p>No historical sales data available for this product.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={formattedChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="Historical Demand"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                />
                                {recommendation && (
                                    <ReferenceLine
                                        y={recommendation.average_daily_sales}
                                        stroke="#dc2626"
                                        strokeDasharray="4 4"
                                        label={{ value: "Forecasted Avg", position: "right", fontSize: 11 }}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventoryForecast;
