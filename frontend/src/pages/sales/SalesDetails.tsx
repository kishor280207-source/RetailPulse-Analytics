import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSaleDetails } from "../../api/salesApi";

const SalesDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadSale = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getSaleDetails(Number(id));

                setSale(response.data);
            } catch (err: any) {
                console.error("Failed to load sale:", err);

                setError(
                    err?.response?.data?.detail ||
                    "Failed to load sale details."
                );
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadSale();
        }
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: "30px" }}>
                <h2>Loading invoice...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "30px" }}>
                <h2>Sales Details</h2>

                <p style={{ color: "red" }}>
                    {error}
                </p>

                <button onClick={() => navigate("/sales")}>
                    Back to Sales
                </button>
            </div>
        );
    }

    if (!sale) {
        return (
            <div style={{ padding: "30px" }}>
                <h2>No invoice found.</h2>
            </div>
        );
    }

    return (
        <div style={{ padding: "30px" }}>

            <button
                onClick={() => navigate("/sales")}
                style={{ marginBottom: "20px" }}
            >
                ← Back to Sales
            </button>

            <h1>Sales Details</h1>

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    marginBottom: "20px"
                }}
            >
                <h2>Invoice Information</h2>

                <p>
                    <strong>Invoice Number:</strong>{" "}
                    {sale.invoice_number}
                </p>

                <p>
                    <strong>Sale Date:</strong>{" "}
                    {new Date(
                        sale.sale_date
                    ).toLocaleString()}
                </p>

                <p>
                    <strong>Customer:</strong>{" "}
                    {sale.customer_name}
                </p>

                <p>
                    <strong>Payment Method:</strong>{" "}
                    {sale.payment_method}
                </p>

                <p>
                    <strong>Status:</strong>{" "}
                    {sale.status}
                </p>
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    marginBottom: "20px"
                }}
            >
                <h2>Purchased Products</h2>

                {sale.items?.length ? (
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Line Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sale.items.map(
                                (item: any, index: number) => (
                                    <tr key={item.id || index}>
                                        <td>
                                            {item.product_name ||
                                                "Product"}
                                        </td>

                                        <td>
                                            {item.sku || "-"}
                                        </td>

                                        <td>
                                            {item.quantity}
                                        </td>

                                        <td>
                                            ₹{" "}
                                            {Number(
                                                item.unit_price
                                            ).toFixed(2)}
                                        </td>

                                        <td>
                                            ₹{" "}
                                            {Number(
                                                item.total
                                            ).toFixed(2)}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                ) : (
                    <p>No products found.</p>
                )}
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    maxWidth: "400px",
                    marginLeft: "auto"
                }}
            >
                <h2>Pricing Summary</h2>

                <p>
                    Subtotal: ₹{" "}
                    {Number(sale.subtotal).toFixed(2)}
                </p>

                <p>
                    Discount: ₹{" "}
                    {Number(sale.discount).toFixed(2)}
                </p>

                <p>
                    Tax: ₹{" "}
                    {Number(sale.tax).toFixed(2)}
                </p>

                <hr />

                <h3>
                    Grand Total: ₹{" "}
                    {Number(
                        sale.total_amount
                    ).toFixed(2)}
                </h3>
            </div>

        </div>
    );
};

export default SalesDetails;