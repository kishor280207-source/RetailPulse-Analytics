import api from "./axios";

export interface SaleItem {
    id?: number;
    product_id: number;
    category_id: number;
    product_name?: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax: number;
    total: number;
}

export interface Sale {
    id: number;
    invoice_number: string;
    customer_id: number;
    customer_name: string;
    sale_date: string;
    payment_method: string;
    notes?: string | null;
    subtotal: number;
    discount: number;
    tax: number;
    total_amount: number;
    status: string;
    created_by: number;
    items?: SaleItem[];
}

export interface SaleCreate {
    customer_id: number;
    payment_method: string;
    notes?: string | null;
    discount: number;
    tax: number;
    items: {
        product_id: number;
        category_id: number;
        quantity: number;
        unit_price: number;
        discount: number;
        tax: number;
    }[];
}

export const getSales = (params?: any) =>
    api.get<Sale[]>("/sales/", { params });

export const getSale = (id: number) =>
    api.get<Sale>(`/sales/${id}`);

export const getSaleDetails = (id: number) =>
    api.get(`/sales/${id}/details`);

export const createSale = (data: SaleCreate) =>
    api.post<Sale>("/sales/", data);

export const updateSale = (id: number, data: SaleCreate) =>
    api.put<Sale>(`/sales/${id}`, data);

export const deleteSale = (id: number) =>
    api.delete(`/sales/${id}`);

export const getSalesDashboard = () =>
    api.get("/sales/dashboard/summary");