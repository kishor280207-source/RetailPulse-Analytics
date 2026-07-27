import { useEffect, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";

import DashboardCards from "../../components/dashboard/DashboardCards";
import DashboardCharts from "../../components/dashboard/DashboardCharts";
import NotificationPanel from "../../components/dashboard/NotificationPanel";
import RecentSales from "../../components/dashboard/RecentSales";
import { getDashboardSummary,getRevenueTrend } from "../../api/dashboardApi";
import type { DashboardSummary } from "../../types/dashboard";
import Filters from "../../components/dashboard/Filters";
import TopProducts from "../../components/dashboard/TopProducts";
import InventoryAnalytics from "../../components/dashboard/InventoryAnalytics";
import ExportButtons from "../../components/dashboard/ExportButtons";
import InventoryChart from "../../components/dashboard/InventoryChart";
import { getInventoryCategory } from "../../api/dashboardApi";
import RevenueChart from "../../components/dashboard/RevenueChart";
export default function Dashboard() {

    const [summary, setSummary] =
        useState<DashboardSummary>({
            total_revenue: 0,
            total_orders: 0,
            total_products_sold: 0,
            average_order_value: 0,
            inventory_value: 0,
            low_stock_products: 0,
            out_of_stock_products: 0,
            total_categories: 0,
            total_products: 0
        });
        const [inventoryData, setInventoryData] = useState<any[]>([]);
        const [revenueData, setRevenueData] = useState<any[]>([]);
        

    useEffect(() => {

        loadDashboard();

    }, []);

    const loadDashboard = async () => {

        try {

            const response =
                await getDashboardSummary();

            setSummary(response.data);

            const revenueResponse = await getRevenueTrend();
            setRevenueData(revenueResponse.data);

            const inventoryResponse = await getInventoryCategory();
            setInventoryData(inventoryResponse.data);

        } catch (error) {

            console.error(error);

        }

    };

    return (
        

        <Box p={4}>

            <Typography
                variant="h4"
                mb={3}
            >
                Retail Analytics Dashboard
            </Typography>

           <DashboardCards
               totalSales={summary.total_orders}
               revenue={summary.total_revenue}
               products={summary.total_products}
               lowStock={summary.low_stock_products}
            />
            <RecentSales />
            <NotificationPanel />
            <TopProducts />
            <InventoryAnalytics />
            <ExportButtons />
            <RevenueChart data={revenueData} />
            <InventoryChart data={inventoryData} />


        </Box>

    );

}