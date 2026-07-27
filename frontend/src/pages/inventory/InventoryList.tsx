import { useEffect, useState } from "react";

import {
    getInventory,
    getDashboardSummary,
    searchInventory,
    addStock,
    removeStock
} from "../../api/inventoryApi";
import type {
    Inventory,
    InventoryDashboard
} from "../../types/inventory";

import DashboardCards from "../../components/inventory/DashboardCards";
import InventoryTable from "../../components/inventory/InventoryTable";
import SearchFilter from "../../components/inventory/SearchFilter";
import StockAdjustmentDialog from "../../components/inventory/StockAdjustmentDialog";
import InventoryCharts from "../../components/inventory/InventoryCharts";
import { getInventoryCharts } from "../../api/inventoryApi";
const InventoryList = () => {

    const [inventory, setInventory] = useState<Inventory[]>([]);

    const [summary, setSummary] =
        useState<InventoryDashboard>({
            total_products: 0,
            total_inventory_quantity: 0,
            low_stock_products: 0,
            out_of_stock_products: 0
        });
        

    const [loading, setLoading] = useState(true);

    const [charts, setCharts] = useState({
           category_chart: [],
           stock_chart: []
});

    const loadData = async () => {

        try {

            const inventoryResponse =
                await getInventory();

            const dashboardResponse =
                await getDashboardSummary();

            const chartsResponse =
                await getInventoryCharts();    

            setInventory(inventoryResponse.data);

            setSummary(dashboardResponse.data);

            setCharts(chartsResponse.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const handleSearch = async (filters: any) => {

    try {

        const response = await searchInventory(filters);

        setInventory(response.data);

    } catch (error) {

        console.error(error);

    }

}; 
    const handleAddStock = async (
    id: number,
    quantity: number,
    reason: string
) => {

    try {

        await addStock(id, {
            quantity,
            reason
        });

        loadData();

    } catch (error) {

        console.error(error);

    }

};
    const handleRemoveStock = async (
    id: number,
    quantity: number,
    reason: string
) => {

    try {

        await removeStock(id, {
            quantity,
            reason
        });

        loadData();

    } catch (error) {

        console.error(error);

    }

};
      
    

    useEffect(() => {
     
        loadData();

    }, []);

    if (loading) {

        return <h2>Loading...</h2>;

    }

    return (

        <div style={{ padding: "20px" }}>

            <h1>Inventory Management</h1>


           <DashboardCards summary={summary} />

           <SearchFilter onSearch={handleSearch}/>

           <InventoryTable inventory={inventory}/> 

           <StockAdjustmentDialog
               inventoryId={1}
               onAddStock={handleAddStock}
               onRemoveStock={handleRemoveStock}
           />

           <InventoryCharts
                  categoryChart={charts.category_chart}
                  stockChart={charts.stock_chart}/>
           
        </div>

    );

};

export default InventoryList;