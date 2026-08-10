import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSale } from "../../api/salesApi";

const CreateSale = () => {
    const navigate = useNavigate();

    const [customerId, setCustomerId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    const [productId, setProductId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [unitPrice, setUnitPrice] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            const saleData = {
                customer_id: Number(customerId),

                payment_method: paymentMethod,

                notes: "Created from Sales UI",

                discount: 0,

                tax: 0,

                items: [
                    {
                        product_id: Number(productId),
                        category_id: Number(categoryId),
                        quantity: Number(quantity),
                        unit_price: Number(unitPrice),
                        discount: 0,
                        tax: 0
                    }
                ]
            };

            const response = await createSale(saleData);

            console.log("Sale created:", response.data);

            alert("Sale created successfully!");

            navigate("/sales");

        } catch (error: any) {
            console.error(error);

            alert(
                error?.response?.data?.detail ||
                "Failed to create sale"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px" }}>

            <h1>Create Sale</h1>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Customer ID</label>

                    <br />

                    <input
                        type="number"
                        value={customerId}
                        onChange={(e) =>
                            setCustomerId(e.target.value)
                        }
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Payment Method</label>

                    <br />

                    <select
                        value={paymentMethod}
                        onChange={(e) =>
                            setPaymentMethod(e.target.value)
                        }
                    >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                    </select>
                </div>

                <br />

                <div>
                    <label>Product ID</label>

                    <br />

                    <input
                        type="number"
                        value={productId}
                        onChange={(e) =>
                            setProductId(e.target.value)
                        }
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Category ID</label>

                    <br />

                    <input
                        type="number"
                        value={categoryId}
                        onChange={(e) =>
                            setCategoryId(e.target.value)
                        }
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Quantity</label>

                    <br />

                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) =>
                            setQuantity(e.target.value)
                        }
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Unit Price</label>

                    <br />

                    <input
                        type="number"
                        min="0"
                        value={unitPrice}
                        onChange={(e) =>
                            setUnitPrice(e.target.value)
                        }
                        required
                    />
                </div>

                <br />

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Creating..." : "Create Sale"}
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/sales")}
                    style={{ marginLeft: "10px" }}
                >
                    Cancel
                </button>

            </form>

        </div>
    );
};

export default CreateSale;