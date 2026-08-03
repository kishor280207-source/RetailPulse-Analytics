import api from "./axios";

export const getDashboardSummary = (params?: any) => {
    return api.get("/dashboard/summary", {params});
};
export const getRevenueTrend = () => {
    return api.get("/dashboard/revenue-trend");
};
export const getInventoryCategory = () => {
    return api.get("/dashboard/inventory-category");
};
export const getTopCategories = () => {
    return api.get("/dashboard/top-categories");
};
export const getPaymentMethodSales = () => {
    return api.get("/dashboard/payment-method");
};
export const getSalesChannel = () => {
    return api.get("/dashboard/sales-channel");
};
export const getStockStatus = () => {
    return api.get("/dashboard/stock-status");
};
export const getInventoryValue = () => {
    return api.get("/dashboard/inventory-value");
};