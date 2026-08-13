import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSale, updateSale } from "../../api/salesApi";
import { getCustomers } from "../../api/customerApi";
import { getProducts } from "../../api/productApi";

interface Customer {
    id: number;
    full_name: string;
}

interface Product {
    id: number;
    name: string;
    sku?: string;
    category_id: number;
    category_name?: string;
    unit_price: number;
    stock_quantity: number;
}

const EditSale = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [customerId, setCustomerId] = useState<number | "">("");
    const [productId, setProductId] = useState<number | "">("");

    const [quantity, setQuantity] = useState<number>(1);
    const [discount, setDiscount] = useState<number>(0);
    const [tax, setTax] = useState<number>(0);

    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [notes, setNotes] = useState("");

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [quantityError, setQuantityError] = useState("");

    const selectedProduct = products.find(
        (product) => product.id === Number(productId)
    );

    const unitPrice = selectedProduct?.unit_price ?? 0;
    const subtotal = unitPrice * quantity;
    const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
    const safeTax = Math.max(tax, 0);
    const grandTotal = subtotal - safeDiscount + safeTax;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");

            try {
                const [customerResponse, productResponse, saleResponse] =
                    await Promise.all([
                        getCustomers(),
                        getProducts(),
                        getSale(Number(id)),
                    ]);

                setCustomers(customerResponse.data || []);
                setProducts(productResponse.data || []);

                const sale = saleResponse.data;
                setCustomerId(sale.customer_id);
                setPaymentMethod(sale.payment_method);
                setNotes(sale.notes || "");
                setDiscount(sale.discount);
                setTax(sale.tax);

                if (sale.items && sale.items.length > 0) {
                    setProductId(sale.items[0].product_id);
                    setQuantity(sale.items[0].quantity);
                }
            } catch (err: any) {
                console.error("Failed to load sale data:", err);
                setError(
                    err?.response?.data?.detail ||
                    "Failed to load sale, customers, or products."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleProductChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const value = event.target.value;
        const productIdValue = value ? Number(value) : "";
        setProductId(productIdValue);
        setQuantityError("");
        setError("");
    };

    const handleQuantityChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = Number(event.target.value);
        setQuantity(value);

        if (value <= 0) {
            setQuantityError("Quantity must be greater than 0.");
            return;
        }

        if (selectedProduct && value > selectedProduct.stock_quantity) {
            setQuantityError(
                `Only ${selectedProduct.stock_quantity} items are available.`
            );
            return;
        }

        setQuantityError("");
        setError("");
    };

    const handleDiscountChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = Number(event.target.value);

        if (value < 0) {
            setDiscount(0);
            setError("Discount cannot be negative.");
            return;
        }

        if (value > subtotal) {
            setDiscount(value);
            setError("Discount cannot be greater than subtotal.");
            return;
        }

        setDiscount(value);
        setError("");
    };

    const handleTaxChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = Number(event.target.value);

        if (value < 0) {
            setTax(0);
            setError("Tax cannot be negative.");
            return;
        }

        setTax(value);
        setError("");
    };

    const handleUpdate = async () => {
        setError("");

        if (!customerId) {
            setError("Please select a customer.");
            return;
        }

        if (!productId || !selectedProduct) {
            setError("Please select a product.");
            return;
        }

        if (quantity <= 0) {
            setQuantityError("Quantity must be greater than 0.");
            return;
        }

        if (quantity > selectedProduct.stock_quantity) {
            setQuantityError(
                `Only ${selectedProduct.stock_quantity} items are available.`
            );
            return;
        }

        setQuantityError("");

        if (unitPrice <= 0) {
            setError("Product price must be greater than 0.");
            return;
        }

        if (discount < 0) {
            setError("Discount cannot be negative.");
            return;
        }

        if (discount > subtotal) {
            setError("Discount cannot be greater than subtotal.");
            return;
        }

        if (tax < 0) {
            setError("Tax cannot be negative.");
            return;
        }

        const data = {
            customer_id: Number(customerId),
            payment_method: paymentMethod,
            notes: notes.trim() || null,
            discount: safeDiscount,
            tax: safeTax,
            items: [
                {
                    product_id: Number(productId),
                    category_id: selectedProduct.category_id,
                    quantity,
                    unit_price: unitPrice,
                    discount: 0,
                    tax: 0,
                },
            ],
        };

        try {
            setSaving(true);
            const response = await updateSale(Number(id), data);

            alert(
                `Sale updated successfully${
                    response?.data?.invoice_number
                        ? ` - ${response.data.invoice_number}`
                        : ""
                }`
            );

            navigate("/sales");
        } catch (err: any) {
            console.error("UPDATE SALE ERROR:", err);

            if (err.response) {
                const detail = err.response.data?.detail;
                if (Array.isArray(detail)) {
                    setError(detail.map((x: any) => x.msg).join(", "));
                } else {
                    setError(detail || "Sale update failed.");
                }
            } else {
                setError("Cannot connect to backend.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "30px" }}>
                <h1>Edit Sale</h1>
                <p>Loading sale data...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
            <h1>Edit Sale</h1>

            {error && (
                <div
                    style={{
                        color: "red",
                        background: "#ffeaea",
                        padding: "12px",
                        marginBottom: "20px",
                        borderRadius: "5px",
                    }}
                >
                    {error}
                </div>
            )}

            <div style={{ marginBottom: "20px" }}>
                <label><strong>Customer</strong></label>
                <br />
                <select
                    value={customerId}
                    onChange={(e) =>
                        setCustomerId(e.target.value ? Number(e.target.value) : "")
                    }
                    disabled={saving}
                    style={{ width: "100%", padding: "10px", marginTop: "5px" }}
                >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                            {customer.full_name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
                <label><strong>Product</strong></label>
                <br />
                <select
                    value={productId}
                    onChange={handleProductChange}
                    disabled={saving}
                    style={{ width: "100%", padding: "10px", marginTop: "5px" }}
                >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedProduct && (
                <div
                    style={{
                        padding: "15px",
                        marginBottom: "20px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        background: "#f8f8f8",
                    }}
                >
                    <h3>Product Information</h3>
                    <p><strong>Product Name:</strong> {selectedProduct.name}</p>
                    <p><strong>SKU:</strong> {selectedProduct.sku || "-"}</p>
                    <p><strong>Category:</strong> {selectedProduct.category_name || "-"}</p>
                    <p><strong>Unit Price:</strong> ₹{unitPrice.toFixed(2)}</p>
                    <p><strong>Available Stock:</strong> {selectedProduct.stock_quantity}</p>
                </div>
            )}

            <div style={{ marginBottom: "20px" }}>
                <label><strong>Quantity</strong></label>
                <br />
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    disabled={saving || !selectedProduct}
                    style={{ padding: "10px", marginTop: "5px", width: "200px" }}
                />
                {quantityError && (
                    <p style={{ color: "red", marginTop: "5px" }}>{quantityError}</p>
                )}
            </div>

            <div style={{ marginBottom: "20px" }}>
                <label><strong>Discount</strong></label>
                <br />
                <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={handleDiscountChange}
                    disabled={saving}
                    style={{ padding: "10px", marginTop: "5px", width: "200px" }}
                />
            </div>

            <div style={{ marginBottom: "20px" }}>
                <label><strong>Tax</strong></label>
                <br />
                <input
                    type="number"
                    min="0"
                    value={tax}
                    onChange={handleTaxChange}
                    disabled={saving}
                    style={{ padding: "10px", marginTop: "5px", width: "200px" }}
                />
            </div>

            <div style={{ marginBottom: "20px" }}>
                <label><strong>Payment Method</strong></label>
                <br />
                <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={saving}
                    style={{ padding: "10px", marginTop: "5px", width: "250px" }}
                >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
                <label><strong>Notes</strong></label>
                <br />
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={saving}
                    rows={4}
                    style={{ width: "100%", padding: "10px", marginTop: "5px" }}
                />
            </div>

            <div
                style={{
                    marginTop: "30px",
                    padding: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    background: "#fafafa",
                }}
            >
                <h2>Billing Summary</h2>
                <p>Subtotal: ₹ {subtotal.toFixed(2)}</p>
                <p>Discount: ₹ {safeDiscount.toFixed(2)}</p>
                <p>Tax: ₹ {safeTax.toFixed(2)}</p>
                <hr />
                <h2>Grand Total: ₹ {grandTotal.toFixed(2)}</h2>
            </div>

            <div style={{ marginTop: "25px" }}>
                <button
                    onClick={handleUpdate}
                    disabled={saving || !!quantityError || !customerId || !productId}
                    style={{ padding: "10px 20px", cursor: saving ? "not-allowed" : "pointer" }}
                >
                    {saving ? "Updating..." : "Update Sale"}
                </button>

                <button
                    onClick={() => navigate("/sales")}
                    disabled={saving}
                    style={{ marginLeft: "10px", padding: "10px 20px" }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default EditSale;