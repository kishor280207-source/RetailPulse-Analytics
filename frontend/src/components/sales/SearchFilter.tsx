import { useState } from "react";

interface Props {
    onSearch: (filters: any) => void;
}

const SearchFilter = ({ onSearch }: Props) => {

    const [filters, setFilters] = useState({
        invoice_number: "",
        customer_name: "",
        product_name: "",
        payment_method: "",
        sales_channel: ""
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {

        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });

    };

    return (

        <div
            style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "20px",
                marginBottom: "20px"
            }}
        >

            <input
                type="text"
                name="invoice_number"
                placeholder="Invoice Number"
                value={filters.invoice_number}
                onChange={handleChange}
            />

            <input
                type="text"
                name="customer_name"
                placeholder="Customer Name"
                value={filters.customer_name}
                onChange={handleChange}
            />

            <input
                type="text"
                name="product_name"
                placeholder="Product Name"
                value={filters.product_name}
                onChange={handleChange}
            />

            <select
                name="payment_method"
                value={filters.payment_method}
                onChange={handleChange}
            >
                <option value="">Payment</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
            </select>

            <select
                name="sales_channel"
                value={filters.sales_channel}
                onChange={handleChange}
            >
                <option value="">Sales Channel</option>
                <option value="Retail Store">Retail Store</option>
                <option value="Online Store">Online Store</option>
                <option value="Marketplace">Marketplace</option>
            </select>

            <button
                onClick={() => onSearch(filters)}
            >
                Search
            </button>

        </div>

    );

};

export default SearchFilter;