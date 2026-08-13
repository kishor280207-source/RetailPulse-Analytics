import { useEffect, useState } from "react";
import { getSalesSummary, getSalesTrend } from "../../api/analyticsApi";
import type { SalesSummary, TrendPoint } from "../../api/analyticsApi";
import { getTopProducts } from "../../api/analyticsApi";
import type { TopProduct } from "../../api/analyticsApi";
import { getTopCustomers } from "../../api/analyticsApi";
import type { TopCustomer } from "../../api/analyticsApi";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { getPaymentMethodBreakdown } from "../../api/analyticsApi";
import type { PaymentMethodBreakdown } from "../../api/analyticsApi";

const SalesAnalytics = () => {
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState("");

    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [trendLoading, setTrendLoading] = useState(true);
    const [trendError, setTrendError] = useState("");
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError, setProductsError] = useState("");
    const [productSort, setProductSort] = useState<"revenue" | "quantity">("revenue");

    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
    const [customersLoading, setCustomersLoading] = useState(true);
    const [customersError, setCustomersError] = useState("");
    const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([]);
    const [paymentLoading, setPaymentLoading] = useState(true);
    const [paymentError, setPaymentError] = useState("");

    useEffect(() => {
        const loadSummary = async () => {
            setSummaryLoading(true);
            setSummaryError("");

            try {
                const response = await getSalesSummary();
                setSummary(response.data);
            } catch (err: any) {
                console.error("Failed to load summary:", err);
                setSummaryError(
                    err?.response?.data?.detail ||
                    "Failed to load analytics summary."
                );
            } finally {
                setSummaryLoading(false);
            }
        };

        loadSummary();
    }, []);

    useEffect(() => {
        const loadTrend = async () => {
            setTrendLoading(true);
            setTrendError("");

            try {
                const response = await getSalesTrend(period);
                setTrend(response.data);
            } catch (err: any) {
                console.error("Failed to load trend:", err);
                setTrendError(
                    err?.response?.data?.detail ||
                    "Failed to load sales trend."
                );
            } finally {
                setTrendLoading(false);
            }
        };

        loadTrend();
    }, [period]);

    useEffect(() => {
        const loadProducts = async () => {
            setProductsLoading(true);
            setProductsError("");

            try {
                const response = await getTopProducts(productSort);
                setTopProducts(response.data);
            } catch (err: any) {
                console.error("Failed to load top products:", err);
                setProductsError(
                    err?.response?.data?.detail ||
                    "Failed to load top products."
                );
            } finally {
                setProductsLoading(false);
            }
        };

        loadProducts();
    }, [productSort]);

    useEffect(() => {
        const loadCustomers = async () => {
            setCustomersLoading(true);
            setCustomersError("");

            try {
                const response = await getTopCustomers();
                setTopCustomers(response.data);
            } catch (err: any) {
                console.error("Failed to load top customers:", err);
                setCustomersError(
                    err?.response?.data?.detail ||
                    "Failed to load top customers."
                );
            } finally {
                setCustomersLoading(false);
            }
        };

        loadCustomers();
    }, []);

    useEffect(() => {
        const loadPaymentBreakdown = async () => {
            setPaymentLoading(true);
            setPaymentError("");

            try {
                const response = await getPaymentMethodBreakdown();
                setPaymentBreakdown(response.data);
            } catch (err: any) {
                console.error("Failed to load payment breakdown:", err);
                setPaymentError(
                    err?.response?.data?.detail ||
                    "Failed to load payment method analysis."
                );
            } finally {
                setPaymentLoading(false);
            }
        };

        loadPaymentBreakdown();
    }, []);

    const cardStyle: React.CSSProperties = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        minWidth: "180px",
        flex: "1 1 180px",
    };

    const formattedTrend = trend.map((point) => ({
        ...point,
        label: new Date(point.period).toLocaleDateString(),
    }));

    const PAYMENT_COLORS = ["#2563eb", "#16a34a", "#f97316", "#a855f7", "#dc2626"];

    return (
        <div style={{ padding: "20px" }}>
            <h1>Sales Analytics</h1>

            {summaryError && (
                <div
                    style={{
                        color: "red",
                        background: "#ffeaea",
                        padding: "12px",
                        marginBottom: "20px",
                        borderRadius: "5px",
                    }}
                >
                    {summaryError}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "30px",
                }}
            >
                <div style={cardStyle}>
                    <h4>Total Revenue</h4>
                    <h2>
                        {summaryLoading
                            ? "Loading..."
                            : `₹ ${summary?.total_revenue.toLocaleString() ?? 0}`}
                    </h2>
                </div>

                <div style={cardStyle}>
                    <h4>Total Orders</h4>
                    <h2>{summaryLoading ? "Loading..." : summary?.total_orders ?? 0}</h2>
                </div>

                <div style={cardStyle}>
                    <h4>Average Order Value</h4>
                    <h2>
                        {summaryLoading
                            ? "Loading..."
                            : `₹ ${summary?.average_order_value.toFixed(2) ?? 0}`}
                    </h2>
                </div>

                <div style={cardStyle}>
                    <h4>Total Items Sold</h4>
                    <h2>{summaryLoading ? "Loading..." : summary?.total_items_sold ?? 0}</h2>
                </div>

                <div style={cardStyle}>
                    <h4>Total Discount</h4>
                    <h2>
                        {summaryLoading
                            ? "Loading..."
                            : `₹ ${summary?.total_discount.toLocaleString() ?? 0}`}
                    </h2>
                </div>

                <div style={cardStyle}>
                    <h4>Total Tax</h4>
                    <h2>
                        {summaryLoading
                            ? "Loading..."
                            : `₹ ${summary?.total_tax.toLocaleString() ?? 0}`}
                    </h2>
                </div>
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "30px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                    }}
                >
                    <h3 style={{ margin: 0 }}>Sales Overview</h3>

                    <div style={{ display: "flex", gap: "8px" }}>
                        {(["daily", "weekly", "monthly"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "5px",
                                    border: "1px solid #ccc",
                                    background: period === p ? "#2563eb" : "#fff",
                                    color: period === p ? "#fff" : "#000",
                                    cursor: "pointer",
                                }}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {trendError && <p style={{ color: "red" }}>{trendError}</p>}

                {trendLoading ? (
                    <p>Loading chart...</p>
                ) : formattedTrend.length === 0 ? (
                    <p>No sales data available for the selected period.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formattedTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#2563eb"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "30px",
                }}
            >
                <h3 style={{ marginTop: 0 }}>Sales vs Orders</h3>

                {trendLoading ? (
                    <p>Loading chart...</p>
                ) : formattedTrend.length === 0 ? (
                    <p>No sales data available for the selected period.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formattedTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis yAxisId="left" orientation="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Bar
                                yAxisId="left"
                                dataKey="revenue"
                                fill="#2563eb"
                                name="Revenue (₹)"
                            />
                            <Bar
                                yAxisId="right"
                                dataKey="orders"
                                fill="#16a34a"
                                name="Orders"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "30px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                    }}
                >
                    <h3 style={{ margin: 0 }}>Top Performing Products</h3>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => setProductSort("revenue")}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                background: productSort === "revenue" ? "#2563eb" : "#fff",
                                color: productSort === "revenue" ? "#fff" : "#000",
                                cursor: "pointer",
                            }}
                        >
                            Sort by Revenue
                        </button>

                        <button
                            onClick={() => setProductSort("quantity")}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                background: productSort === "quantity" ? "#2563eb" : "#fff",
                                color: productSort === "quantity" ? "#fff" : "#000",
                                cursor: "pointer",
                            }}
                        >
                            Sort by Quantity
                        </button>
                    </div>
                </div>

                {productsError && <p style={{ color: "red" }}>{productsError}</p>}

                {productsLoading ? (
                    <p>Loading products...</p>
                ) : topProducts.length === 0 ? (
                    <p>No product sales data available for the selected period.</p>
                ) : (
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                    Product Name
                                </th>
                                <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                    Units Sold
                                </th>
                                <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                    Revenue
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((product) => (
                                <tr key={product.product_id}>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                        {product.product_name}
                                    </td>
                                    <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        {product.units_sold}
                                    </td>
                                    <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        ₹ {product.revenue.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "30px",
                }}
            >
                <h3 style={{ marginTop: 0 }}>Customer Revenue Analysis</h3>

                {customersError && <p style={{ color: "red" }}>{customersError}</p>}

                {customersLoading ? (
                    <p>Loading customers...</p>
                ) : topCustomers.length === 0 ? (
                    <p>No customer sales data available for the selected period.</p>
                ) : (
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                    Customer Name
                                </th>
                                <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                    Number of Orders
                                </th>
                                <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                    Total Spend
                                </th>
                                <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                    Average Order Value
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {topCustomers.map((customer) => (
                                <tr key={customer.customer_id}>
                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                        {customer.customer_name}
                                    </td>
                                    <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        {customer.order_count}
                                    </td>
                                    <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        ₹ {customer.total_spend.toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>
                                        ₹ {customer.average_order_value.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "30px",
                }}
            >
                <h3 style={{ marginTop: 0 }}>Payment Method Analysis</h3>

                {paymentError && <p style={{ color: "red" }}>{paymentError}</p>}

                {paymentLoading ? (
                    <p>Loading payment methods...</p>
                ) : paymentBreakdown.length === 0 ? (
                    <p>No payment data available for the selected period.</p>
                ) : (
                    <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "center" }}>
                        <ResponsiveContainer width={320} height={300}>
                            <PieChart>
                                <Pie
                                    data={paymentBreakdown}
                                    dataKey="revenue"
                                    nameKey="payment_method"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                >
                                    {paymentBreakdown.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `₹ ${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>

                        <table style={{ borderCollapse: "collapse", flex: "1 1 250px" }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                        Payment Method
                                    </th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                        Transactions
                                    </th>
                                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #ddd" }}>
                                        Revenue
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentBreakdown.map((row) => (
                                    <tr key={row.payment_method}>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                            {row.payment_method}
                                        </td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>
                                            {row.transaction_count}
                                        </td>
                                        <td style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #eee" }}>
                                            ₹ {row.revenue.toLocaleString()}
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

export default SalesAnalytics;
