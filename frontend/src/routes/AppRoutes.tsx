import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Products from "../pages/Products/Products";
import Categories from "../pages/Categories/Categories";
import Profile from "../pages/Profile/Profile";

import SalesList from "../pages/sales/salesList";
import AddSale from "../pages/sales/AddSale";

import InventoryList from "../pages/inventory/InventoryList";
import InventoryMovement from "../pages/inventory/InventoryMovement";

import MainLayout from "../components/layout/MainLayout";

// Customer Module
import CustomersPage from "../pages/Customers/CustomersPage";
import AddCustomerPage from "../pages/Customers/AddCustomerPage";
import CustomerEditPage from "../pages/Customers/CustomerEditPage";
import CustomerProfilePage from "../pages/Customers/CustomerProfilePage";
import CustomerAnalyticsPage from "../pages/Customers/CustomerAnalyticsPage";
import ForecastPage from "../pages/Forecast/ForecastPage";

export default function AppRoutes() {
    return (
        <BrowserRouter>

            <Routes>

                {/* Login */}
                <Route
                    path="/"
                    element={<Login />}
                />

                {/* Protected Pages */}
                <Route element={<MainLayout />}>

                    {/* Dashboard */}
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    {/* Products */}
                    <Route
                        path="/products"
                        element={<Products />}
                    />

                    {/* Categories */}
                    <Route
                        path="/categories"
                        element={<Categories />}
                    />
                    <Route
                        path="/forecast"
                         element={<ForecastPage />}
                    />
                    {/* Profile */}
                    <Route
                        path="/profile"
                        element={<Profile />}
                    />

                    {/* Sales */}
                    <Route
                        path="/sales"
                        element={<SalesList />}
                    />

                    <Route
                        path="/sales/add"
                        element={<AddSale />}
                    />

                    {/* Inventory */}
                    <Route
                        path="/inventory"
                        element={<InventoryList />}
                    />

                    <Route
                        path="/inventory-movements"
                        element={<InventoryMovement />}
                    />

                    {/* Customer Management */}
                    <Route
                        path="/customers"
                        element={<CustomersPage />}
                    />

                    <Route
                        path="/customers/add"
                        element={<AddCustomerPage />}
                    />

                    <Route
                        path="/customers/edit/:id"
                        element={<CustomerEditPage />}
                    />

                    <Route
                        path="/customers/profile/:id"
                        element={<CustomerProfilePage />}
                    />

                    <Route
                        path="/customers/analytics"
                        element={<CustomerAnalyticsPage />}
                    />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}