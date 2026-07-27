import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000"
});

API.interceptors.request.use((config) => {

    const token = localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const getInventory = () =>
    API.get("/inventory");

export const getDashboardSummary = () =>
    API.get("/inventory/dashboard/summary");

export const addInventory = (data: any) =>
    API.post("/inventory", data);

export const updateInventory = (
    id: number,
    data: any
) =>
    API.put(`/inventory/${id}`, data);

export const addStock = (
    id: number,
    data: any
) =>
    API.put(`/inventory/${id}/add-stock`, data);

export const removeStock = (
    id: number,
    data: any
) =>
    API.put(`/inventory/${id}/remove-stock`, data);

export const searchInventory = (params: any) =>
    API.get("/inventory/search", {
        params
    });

export const getInventoryMovements = () =>
    API.get("/inventory-movements");

export const getInventoryCharts = () =>
    API.get("/inventory/dashboard/charts");