import type { DashboardSummary } from "../../types/sales";

interface Props {
    summary: DashboardSummary;
}

const DashboardCards = ({ summary }: Props) => {
    return (
        <div
            style={{
                display: "flex",
                gap: "20px",
                marginBottom: "20px",
                flexWrap: "wrap"
            }}
        >
            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    borderRadius: "8px",
                    minWidth: "180px"
                }}
            >
                <h4>Total Sales</h4>
                <h2>{summary.total_sales}</h2>
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    borderRadius: "8px",
                    minWidth: "180px"
                }}
            >
                <h4>Total Revenue</h4>
                <h2>₹ {summary.total_revenue}</h2>
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    borderRadius: "8px",
                    minWidth: "180px"
                }}
            >
                <h4>Total Orders</h4>
                <h2>{summary.total_orders}</h2>
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "20px",
                    borderRadius: "8px",
                    minWidth: "180px"
                }}
            >
                <h4>Average Order Value</h4>
                <h2>₹ {summary.average_order_value}</h2>
            </div>
        </div>
    );
};

export default DashboardCards;