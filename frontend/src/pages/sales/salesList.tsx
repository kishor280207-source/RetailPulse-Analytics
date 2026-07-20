import { useEffect, useState } from "react";
import { getSales } from "../../api/salesApi";
import type { Sale } from "../../types/sales";
import DashboardCards from "../../components/sales/DashboardCards";
import { getDashboardSummary } from "../../api/salesApi";
import type { DashboardSummary } from "../../types/sales";
import SalesTable from "../../components/sales/SalesTable";
import SearchFilter from "../../components/sales/SearchFilter";

const SalesList = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [summary, setSummary] = useState<DashboardSummary>({
        total_sales: 0,
        total_revenue: 0,
        total_orders: 0,
        average_order_value: 0
    });
    const [loading, setLoading] = useState(true);
    const handleSearch = (filters: any) => {
    loadSales(filters);
};
    
    const loadSales = async (filters = {}) => {
    try {
        const response = await getSales(filters);
        setSales(response.data);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
};

    const loadSummary = async () => {
    try {
        const response = await getDashboardSummary();
        setSummary(response.data);
    } catch (error) {
        console.error(error);
    }
};

    useEffect(() => {
    loadSales();
    loadSummary();
}, []);

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>Sales Management</h1>
            <DashboardCards summary={summary} />
            <button>Add Sale</button>
            <SearchFilter onSearch={handleSearch} />

            <SalesTable sales={sales} />
        </div>
    );
};


export default SalesList;

