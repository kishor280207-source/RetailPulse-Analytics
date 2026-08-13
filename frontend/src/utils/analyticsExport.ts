import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
    SalesSummary,
    TopProduct,
    TopCustomer,
    PaymentMethodBreakdown,
} from "../api/analyticsApi";

interface AnalyticsExportData {
    summary: SalesSummary | null;
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    paymentBreakdown: PaymentMethodBreakdown[];
    filterLabel: string;
}

export const exportAnalyticsCSV = (data: AnalyticsExportData) => {
    const rows: string[][] = [];

    rows.push(["Sales Analytics Report"]);
    rows.push(["Filter", data.filterLabel]);
    rows.push([]);

    rows.push(["KPI Summary"]);
    rows.push(["Metric", "Value"]);
    rows.push(["Total Revenue", String(data.summary?.total_revenue ?? 0)]);
    rows.push(["Total Orders", String(data.summary?.total_orders ?? 0)]);
    rows.push(["Average Order Value", String(data.summary?.average_order_value ?? 0)]);
    rows.push(["Total Items Sold", String(data.summary?.total_items_sold ?? 0)]);
    rows.push(["Total Discount", String(data.summary?.total_discount ?? 0)]);
    rows.push(["Total Tax", String(data.summary?.total_tax ?? 0)]);
    rows.push([]);

    rows.push(["Top Products"]);
    rows.push(["Product Name", "Units Sold", "Revenue"]);
    data.topProducts.forEach((p) => {
        rows.push([p.product_name, String(p.units_sold), String(p.revenue)]);
    });
    rows.push([]);

    rows.push(["Top Customers"]);
    rows.push(["Customer Name", "Orders", "Total Spend", "Average Order Value"]);
    data.topCustomers.forEach((c) => {
        rows.push([
            c.customer_name,
            String(c.order_count),
            String(c.total_spend),
            String(c.average_order_value),
        ]);
    });
    rows.push([]);

    rows.push(["Payment Method Breakdown"]);
    rows.push(["Payment Method", "Transactions", "Revenue"]);
    data.paymentBreakdown.forEach((p) => {
        rows.push([p.payment_method, String(p.transaction_count), String(p.revenue)]);
    });

    const csv = rows
        .map((row) =>
            row
                .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales_analytics.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportAnalyticsPDF = (data: AnalyticsExportData) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("RetailPulse Analytics", 20, 20);

    doc.setFontSize(14);
    doc.text("Sales Analytics Report", 20, 30);

    doc.setFontSize(10);
    doc.text(`Filter: ${data.filterLabel}`, 20, 38);

    doc.setFontSize(11);
    doc.text(`Total Revenue: Rs. ${data.summary?.total_revenue ?? 0}`, 20, 50);
    doc.text(`Total Orders: ${data.summary?.total_orders ?? 0}`, 20, 58);
    doc.text(
        `Average Order Value: Rs. ${(data.summary?.average_order_value ?? 0).toFixed(2)}`,
        20,
        66
    );
    doc.text(`Total Items Sold: ${data.summary?.total_items_sold ?? 0}`, 20, 74);
    doc.text(`Total Discount: Rs. ${data.summary?.total_discount ?? 0}`, 20, 82);
    doc.text(`Total Tax: Rs. ${data.summary?.total_tax ?? 0}`, 20, 90);

    let currentY = 100;

    if (data.topProducts.length > 0) {
        doc.setFontSize(13);
        doc.text("Top Products", 20, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [["Product", "Units Sold", "Revenue"]],
            body: data.topProducts.map((p) => [
                p.product_name,
                String(p.units_sold),
                `Rs. ${p.revenue.toFixed(2)}`,
            ]),
        });

        currentY = (doc as any).lastAutoTable?.finalY + 15 || currentY + 60;
    }

    if (data.topCustomers.length > 0) {
        doc.setFontSize(13);
        doc.text("Top Customers", 20, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [["Customer", "Orders", "Total Spend", "Avg Order Value"]],
            body: data.topCustomers.map((c) => [
                c.customer_name,
                String(c.order_count),
                `Rs. ${c.total_spend.toFixed(2)}`,
                `Rs. ${c.average_order_value.toFixed(2)}`,
            ]),
        });

        currentY = (doc as any).lastAutoTable?.finalY + 15 || currentY + 60;
    }

    if (data.paymentBreakdown.length > 0) {
        doc.setFontSize(13);
        doc.text("Payment Method Breakdown", 20, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [["Payment Method", "Transactions", "Revenue"]],
            body: data.paymentBreakdown.map((p) => [
                p.payment_method,
                String(p.transaction_count),
                `Rs. ${p.revenue.toFixed(2)}`,
            ]),
        });
    }

    doc.save("sales_analytics.pdf");
};
