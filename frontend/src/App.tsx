import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddSale from "./pages/sales/AddSale";
import SalesList from "./pages/sales/salesList";
function App() {
  <BrowserRouter>
    <Routes>
        <Route path="/sales" element={<SalesList />} />
        <Route path="/sales/add" element={<AddSale />} />
    </Routes>
</BrowserRouter>
  return <AppRoutes />;
}

export default App;