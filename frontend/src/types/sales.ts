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
  customer_id: number;
  customer_name: string;
  sale_date?: string;
  payment_method: string;
  notes?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total_amount?: number;
  status?: string;
  created_by?: number;
  items?: SaleItem[];
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