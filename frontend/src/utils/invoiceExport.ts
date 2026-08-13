import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportInvoicePDF = (sale: any) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("RetailPulse Analytics", 20, 20);

    doc.setFontSize(14);
    doc.text("Sales Invoice", 20, 30);

    doc.setFontSize(11);

    doc.text(
        `Invoice Number: ${sale.invoice_number}`,
        20,
        45
    );

    doc.text(
        `Customer: ${sale.customer_name}`,
        20,
        53
    );

    doc.text(
        `Sale Date: ${
            sale.sale_date
                ? new Date(sale.sale_date).toLocaleDateString()
                : "-"
        }`,
        20,
        61
    );

    doc.text(
        `Payment Method: ${sale.payment_method}`,
        20,
        69
    );

    doc.text(
        `Status: ${sale.status}`,
        20,
        77
    );

    autoTable(doc, {
        startY: 90,
        head: [
            [
                "Product",
                "SKU",
                "Quantity",
                "Unit Price",
                "Line Total"
            ]
        ],
        body: (sale.items || []).map((item: any) => [
            item.product_name || "Product",
            item.sku || "-",
            item.quantity,
            `₹ ${Number(item.unit_price).toFixed(2)}`,
            `₹ ${Number(item.total).toFixed(2)}`
        ])
    });

    const finalY =
        (doc as any).lastAutoTable?.finalY || 100;

    doc.text(
        `Subtotal: ₹ ${Number(sale.subtotal).toFixed(2)}`,
        140,
        finalY + 15
    );

    doc.text(
        `Discount: ₹ ${Number(sale.discount).toFixed(2)}`,
        140,
        finalY + 23
    );

    doc.text(
        `Tax: ₹ ${Number(sale.tax).toFixed(2)}`,
        140,
        finalY + 31
    );

    doc.setFontSize(13);

    doc.text(
        `Grand Total: ₹ ${Number(
            sale.total_amount
        ).toFixed(2)}`,
        140,
        finalY + 42
    );

    doc.save(
        `${sale.invoice_number || "invoice"}.pdf`
    );
};


export const exportInvoiceCSV = (sale: any) => {
    const rows = [
        [
            "Invoice Number",
            "Customer",
            "Sale Date",
            "Payment Method",
            "Status",
            "Product",
            "SKU",
            "Quantity",
            "Unit Price",
            "Line Total"
        ]
    ];

    (sale.items || []).forEach((item: any) => {
        rows.push([
            sale.invoice_number || "",
            sale.customer_name || "",
            sale.sale_date
                ? new Date(
                      sale.sale_date
                  ).toLocaleDateString()
                : "",
            sale.payment_method || "",
            sale.status || "",
            item.product_name || "",
            item.sku || "",
            String(item.quantity ?? ""),
            String(item.unit_price ?? ""),
            String(item.total ?? "")
        ]);
    });

    const csv = rows
        .map((row) =>
            row
                .map((value) =>
                    `"${String(value).replace(/"/g, '""')}"`
                )
                .join(",")
        )
        .join("\n");

    const blob = new Blob(
        [csv],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `${sale.invoice_number || "invoice"}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};