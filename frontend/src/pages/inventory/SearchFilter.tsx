import { useState } from "react";

interface Props {
    onSearch: (filters: any) => void;
}

const SearchFilter = ({ onSearch }: Props) => {

    const [productName, setProductName] = useState("");
    const [stockStatus, setStockStatus] = useState("");

    const handleSearch = () => {

        onSearch({
            product_name: productName,
            stock_status: stockStatus
        });

    };

    return (

        <div
            style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px"
            }}
        >

            <input
                type="text"
                placeholder="Product Name"
                value={productName}
                onChange={(e) =>
                    setProductName(e.target.value)
                }
            />

            <select
                value={stockStatus}
                onChange={(e) =>
                    setStockStatus(e.target.value)
                }
            >
                <option value="">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
            </select>

            <button onClick={handleSearch}>
                Search
            </button>

        </div>

    );

};

export default SearchFilter;