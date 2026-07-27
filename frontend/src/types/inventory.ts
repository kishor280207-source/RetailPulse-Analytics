export interface Inventory {

    id?: number;

    product_id: number;

    current_stock: number;

    reserved_stock: number;

    available_stock: number;

    reorder_level: number;

    stock_status: string;
}

export interface InventoryDashboard {

    total_products: number;

    total_inventory_quantity: number;

    low_stock_products: number;

    out_of_stock_products: number;
}

export interface StockAdjustment {

    quantity: number;

    reason: string;

    remarks: string;
}