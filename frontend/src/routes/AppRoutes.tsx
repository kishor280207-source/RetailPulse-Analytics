import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Products from "../pages/Products/Products";
import Categories from "../pages/Categories/Categories";
import Profile from "../pages/Profile/Profile";

import SalesList from "../pages/sales/SalesList";
import AddSale from "../pages/sales/AddSale";

import InventoryList from "../pages/inventory/InventoryList";
import InventoryMovement from "../pages/inventory/InventoryMovement";

import MainLayout from "../layouts/MainLayout";

export default function AppRoutes() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Login Page */}
        <Route path="/" element={<Login />} />

        {/* Protected Pages */}
        <Route element={<MainLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/sales"
            element={<SalesList />}
          />

          <Route
            path="/sales/add"
            element={<AddSale />}
          />

          <Route
            path="/inventory"
            element={<InventoryList />}
          />

          <Route
            path="/inventory-movements"
            element={<InventoryMovement />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}