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

export const getSales = (params?: any) =>
    API.get("/sales", {
        params
    });

export const getSaleById = (id: number) =>
    API.get(`/sales/${id}`);

export const createSale = (data: any) =>
    API.post("/sales", data);

export const updateSale = (
    id: number,
    data: any
) =>
    API.put(`/sales/${id}`, data);

export const deleteSale = (id: number) =>
    API.delete(`/sales/${id}`);

export const getDashboardSummary = () =>
    API.get("/sales/dashboard/summary");

export const getNotifications = () =>
    API.get("/notifications");
