import { Box, Button } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_products_sold: number;
    average_order_value: number;
    inventory_value: number;
    low_stock_products: number;
    out_of_stock_products: number;
    total_categories: number;
    total_products: number;
  };
}

export default function ExportButtons({ summary }: Props) {
  const exportCSV = () => {
    const csv = `Report,Value
Total Revenue,${summary.total_revenue}
Total Orders,${summary.total_orders}
Total Products Sold,${summary.total_products_sold}
Average Order Value,${summary.average_order_value}
Inventory Value,${summary.inventory_value}
Low Stock Products,${summary.low_stock_products}
Out of Stock Products,${summary.out_of_stock_products}
Total Categories,${summary.total_categories}
Total Products,${summary.total_products}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "RetailPulse_Dashboard.csv";
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("RetailPulse Analytics - Dashboard Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Report", "Value"]],
      body: [
        ["Total Revenue", `₹ ${summary.total_revenue}`],
        ["Total Orders", `${summary.total_orders}`],
        ["Total Products Sold", `${summary.total_products_sold}`],
        ["Average Order Value", `₹ ${summary.average_order_value}`],
        ["Inventory Value", `₹ ${summary.inventory_value}`],
        ["Low Stock Products", `${summary.low_stock_products}`],
        ["Out of Stock Products", `${summary.out_of_stock_products}`],
        ["Total Categories", `${summary.total_categories}`],
        ["Total Products", `${summary.total_products}`],
      ],
    });

    doc.save("RetailPulse_Dashboard.pdf");
  };

  return (
    <Box display="flex" gap={2} mt={3} mb={3}>
      <Button variant="contained" color="success" onClick={exportCSV}>
        Export CSV
      </Button>

      <Button variant="contained" color="error" onClick={exportPDF}>
        Export PDF
      </Button>
    </Box>
  );
}