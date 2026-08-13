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
        status: "",
        start_date: "",
        end_date: "",
        sort_by: "",
        sort_order: "desc"
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
                <option value="">Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
            </select>

            <select
                name="status"
                value={filters.status}
                onChange={handleChange}
            >
                <option value="">Payment Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
                <option value="Cancelled">Cancelled</option>
            </select>

            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                From:
                <input
                    type="date"
                    name="start_date"
                    value={filters.start_date}
                    onChange={handleChange}
                />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                To:
                <input
                    type="date"
                    name="end_date"
                    value={filters.end_date}
                    onChange={handleChange}
                />
            </label>

            <select
                name="sort_by"
                value={filters.sort_by}
                onChange={handleChange}
            >
                <option value="">Sort By</option>
                <option value="date">Date</option>
                <option value="total_amount">Total Amount</option>
                <option value="customer_name">Customer Name</option>
            </select>

            <select
                name="sort_order"
                value={filters.sort_order}
                onChange={handleChange}
            >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
            </select>

            <button onClick={() => onSearch(filters)}>
                Search
            </button>
        </div>
    );
};

export default SearchFilter;