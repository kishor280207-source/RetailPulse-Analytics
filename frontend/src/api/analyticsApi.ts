import api from "./axios";

export interface SalesSummary {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    total_items_sold: number;
    total_discount: number;
    total_tax: number;
}

export interface TrendPoint {
    period: string;
    revenue: number;
    orders: number;
}

export interface TopProduct {
    product_id: number;
    product_name: string;
    units_sold: number;
    revenue: number;
}

export interface TopCustomer {
    customer_id: number;
    customer_name: string;
    order_count: number;
    total_spend: number;
    average_order_value: number;
}

export interface PaymentMethodBreakdown {
    payment_method: string;
    transaction_count: number;
    revenue: number;
}

export interface AnalyticsFilters {
    start_date?: string;
    end_date?: string;
    product_id?: number;
    category_id?: number;
    customer_id?: number;
    payment_method?: string;
}

export const getSalesSummary = (params?: AnalyticsFilters) =>
    api.get<SalesSummary>("/sales/analytics/summary", { params });

export const getSalesTrend = (
    period: "daily" | "weekly" | "monthly",
    params?: AnalyticsFilters
) =>
    api.get<TrendPoint[]>("/sales/analytics/trend", {
        params: { period, ...params },
    });

export const getTopProducts = (
    sortBy: "revenue" | "quantity",
    params?: AnalyticsFilters
) =>
    api.get<TopProduct[]>("/sales/analytics/products", {
        params: { sort_by: sortBy, ...params },
    });

export const getTopCustomers = (params?: AnalyticsFilters) =>
    api.get<TopCustomer[]>("/sales/analytics/customers", { params });

export const getPaymentMethodBreakdown = (params?: AnalyticsFilters) =>
    api.get<PaymentMethodBreakdown[]>("/sales/analytics/payment-methods", {
        params,
    });
