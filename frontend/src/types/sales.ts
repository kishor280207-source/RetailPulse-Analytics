export interface SaleItem {
    product_id: number;
    category_id: number;
    quantity: number;
    unit_price: number;
    discount: number;
    tax: number;
    total?: number;
}

export interface Sale {
    id?: number;
    invoice_number?: string;
    customer_name: string;
    sale_date?: string;
    sales_channel: string;
    payment_method: string;
    total_amount?: number;
    items: SaleItem[];
}

export interface DashboardSummary {
    total_sales: number;
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    status: string;
    created_at: string;
}