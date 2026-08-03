import api from "./axios";

export const getCustomers = () =>
  api.get("/customer/");

export const getCustomer = (id: number) =>
  api.get(`/customer/${id}`);

export const createCustomer = (data: any) =>
  api.post("/customer/", data);

export const updateCustomer = (id: number, data: any) =>
  api.put(`/customer/${id}`, data);

export const deleteCustomer = (id: number) =>
  api.delete(`/customer/${id}`);

export const getCustomerProfile = (id: number) =>
  api.get(`/customer/profile/${id}`);

export const getCustomerAnalytics = () =>
  api.get("/customer/analytics/dashboard");

export const getCustomerSegments = () =>
  api.get("/customer/segments");

export const searchCustomers = (
  search?: string,
  customer_type?: string,
  status?: string
) =>
  api.get("/customer/search/", {
    params: {
      search,
      customer_type,
      status,
    },
  });