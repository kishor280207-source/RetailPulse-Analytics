import { useState } from "react";
import { createSale } from "../../api/salesApi";

const SalesForm = () => {

    const [form, setForm] = useState({
        customer_name: "",
        sales_channel: "",
        payment_method: "",
        items: [
            {
                product_id: 0,
                category_id: 0,
                quantity: 1,
                unit_price: 0,
                discount: 0,
                tax: 0
            }
        ]
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleItemChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: string
    ) => {

        const items = [...form.items];

        items[0] = {
            ...items[0],
            [field]: Number(e.target.value)
        };

        setForm({
            ...form,
            items
        });

    };

    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        try {

            await createSale(form);

            alert("Sale Created Successfully");

        } catch (error) {

            console.error(error);

            alert("Failed to create sale");

        }

    };

    return (

        <form onSubmit={handleSubmit}>

            <h2>Add Sale</h2>

            <input
                type="text"
                name="customer_name"
                placeholder="Customer Name"
                value={form.customer_name}
                onChange={handleChange}
            />

            <br /><br />

            <select
                name="sales_channel"
                value={form.sales_channel}
                onChange={handleChange}
            >
                <option value="">Sales Channel</option>
                <option value="Retail Store">Retail Store</option>
                <option value="Online Store">Online Store</option>
                <option value="Marketplace">Marketplace</option>
            </select>

            <br /><br />

            <select
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
            >
                <option value="">Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
            </select>

            <br /><br />

            <input
                type="number"
                placeholder="Product ID"
                onChange={(e) =>
                    handleItemChange(e, "product_id")
                }
            />

            <br /><br />

            <input
                type="number"
                placeholder="Category ID"
                onChange={(e) =>
                    handleItemChange(e, "category_id")
                }
            />

            <br /><br />

            <input
                type="number"
                placeholder="Quantity"
                onChange={(e) =>
                    handleItemChange(e, "quantity")
                }
            />

            <br /><br />

            <input
                type="number"
                placeholder="Unit Price"
                onChange={(e) =>
                    handleItemChange(e, "unit_price")
                }
            />

            <br /><br />

            <input
                type="number"
                placeholder="Discount"
                onChange={(e) =>
                    handleItemChange(e, "discount")
                }
            />

            <br /><br />

            <input
                type="number"
                placeholder="Tax"
                onChange={(e) =>
                    handleItemChange(e, "tax")
                }
            />

            <br /><br />

            <button type="submit">
                Save Sale
            </button>

        </form>

    );

};

export default SalesForm;