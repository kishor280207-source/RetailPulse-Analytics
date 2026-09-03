import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Products from "../pages/Products/Products";
import Categories from "../pages/Categories/Categories";
import Profile from "../pages/Profile/Profile";

import SalesList from "../pages/sales/salesList";
import CreateSale from "../pages/sales/CreateSale";

import InventoryList from "../pages/inventory/InventoryList";
import InventoryMovement from "../pages/inventory/InventoryMovement";

import MainLayout from "../components/layout/MainLayout";

import CustomersPage from "../pages/Customers/CustomersPage";
import AddCustomerPage from "../pages/Customers/AddCustomerPage";
import CustomerEditPage from "../pages/Customers/CustomerEditPage";
import CustomerProfilePage from "../pages/Customers/CustomerProfilePage";
import CustomerAnalyticsPage from "../pages/Customers/CustomerAnalyticsPage";
import CustomerPurchaseHistoryPage from "../pages/Customers/CustomerPurchaseHistoryPage";
import CustomerSegmentsPage from "../pages/Customers/CustomerSegmentsPage";
import SalesDetails from "../pages/sales/SalesDetails";
import ForecastPage from "../pages/Forecast/ForecastPage";
import EditSale from "../pages/sales/EditSale";
import SalesAnalytics from "../pages/Analytics/SalesAnalytics";
import InventoryForecast from "../pages/inventory/InventoryForecast";
import DataImport from "../pages/DataImport/DataImport";
import AuditLogs from "../pages/AuditLogs/AuditLogs";
export default function AppRoutes() {
    return (
        
            <Routes>

                
                <Route path="/" element={<Login />} />

               
                <Route element={<MainLayout />}>

                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/products" element={<Products />} />

                    <Route path="/categories" element={<Categories />} />

                    <Route path="/forecast" element={<ForecastPage />} />

                    <Route path="/profile" element={<Profile />} />

                   
                    <Route path="/sales" element={<SalesList />} />

                    <Route
                        path="/sales/create"
                        element={<CreateSale />}
                    />
                    <Route
                         path="/sales/:id"
                         element={<SalesDetails />}
                    />
                   
                    <Route
                        path="/inventory"
                        element={<InventoryList />}
                    />

                    <Route
                        path="/inventory-movements"
                        element={<InventoryMovement />}
                    />

                    
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

                    <Route
                        path="/customers/purchase-history/:id"
                        element={<CustomerPurchaseHistoryPage />}
                    />

                    <Route
                        path="/customers/segments"
                        element={<CustomerSegmentsPage />}
                    />
                    <Route
                        path="/sales/edit/:id"
                        element={<EditSale />}

                    />
                    <Route path="/inventory/forecast" element={<InventoryForecast />} />
                    <Route path="/analytics/sales" element={<SalesAnalytics />} />
                    <Route path="/data-import" element={<DataImport />} />
                    <Route path="/audit-logs" element={<AuditLogs />} />
                    

                </Route>

            </Routes>
       
    );
}