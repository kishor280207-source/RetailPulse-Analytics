import api from "./axios";

export interface ForecastItem {
    product_id: number;
    product_name: string;
    sku: string;
    category_id: number;
    current_stock: number;
    average_daily_sales: number;
    forecasted_demand: number;
    days_of_stock_remaining: number | null;
    reorder_point: number;
    safety_stock: number;
    recommended_reorder_quantity: number;
    stock_risk: string;
    recommendation: string;
}

export interface ComparisonData {
    current_stock: number;
    recommended_stock: number;
    current_daily_demand: number;
    recommended_daily_demand: number;
    current_reorder_point: number;
    recommended_reorder_point: number;
    current_safety_stock: number;
    recommended_safety_stock: number;
}

export interface ProductRecommendation extends ForecastItem {
    comparison: ComparisonData;
}

export interface ForecastFilters {
    risk?: string;
    category_id?: number;
    product_id?: number;
    reorder_required?: boolean;
    sort_by?: string;
    sort_order?: "asc" | "desc";
}

export const getInventoryForecast = (params?: ForecastFilters) =>
    api.get<ForecastItem[]>("/inventory/forecast", { params });

export const getProductRecommendation = (productId: number) =>
    api.get<ProductRecommendation>(`/inventory/recommendations/${productId}`);

export interface DemandHistoryPoint {
    date: string;
    units_sold: number;
}

export const getProductDemandHistory = (productId: number, days: number = 30) =>
    api.get<DemandHistoryPoint[]>(`/inventory/demand-history/${productId}`, {
        params: { days },
    });