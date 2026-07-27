import type { InventoryDashboard } from "../../types/inventory";

interface Props {
    summary: InventoryDashboard;
}

const DashboardCards = ({ summary }: Props) => {

    return (

        <div
            style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                marginBottom: "20px"
            }}
        >

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    minWidth: "200px"
                }}
            >
                <h4>Total Products</h4>
                <h2>{summary.total_products}</h2>
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    minWidth: "200px"
                }}
            >
                <h4>Total Inventory</h4>
                <h2>{summary.total_inventory_quantity}</h2>
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    minWidth: "200px"
                }}
            >
                <h4>Low Stock</h4>
                <h2>{summary.low_stock_products}</h2>
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    minWidth: "200px"
                }}
            >
                <h4>Out Of Stock</h4>
                <h2>{summary.out_of_stock_products}</h2>
            </div>

        </div>

    );
};

export default DashboardCards;