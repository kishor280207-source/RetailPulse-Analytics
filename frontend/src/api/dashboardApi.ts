import api from "./axios";

export const getDashboardSummary = () => {
    return api.get("/dashboard/summary");
};
export const getRevenueTrend = () => {
    return api.get("/dashboard/revenue-trend");
};
export const getInventoryCategory = () => {
    return api.get("/dashboard/inventory-category");
};