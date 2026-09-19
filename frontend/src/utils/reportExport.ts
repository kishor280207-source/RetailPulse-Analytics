import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportReportCSV = (
    reportType: string,
    data: Record<string, any>[],
    filtersLabel: string
) => {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const rows: string[][] = [];

    rows.push([`${reportType} Report`]);
    rows.push(["Filters", filtersLabel]);
    rows.push([]);
    rows.push(columns);

    data.forEach((row) => {
        rows.push(columns.map((col) => String(row[col] ?? "")));
    });

    const csv = rows
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType.toLowerCase()}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportReportPDF = (
    reportType: string,
    data: Record<string, any>[],
    filtersLabel: string
) => {
    if (data.length === 0) return;

    const doc = new jsPDF({ orientation: "landscape" });
    const columns = Object.keys(data[0]);

    doc.setFontSize(16);
    doc.text("RetailPulse Analytics", 14, 15);

    doc.setFontSize(12);
    doc.text(`${reportType} Report`, 14, 23);

    doc.setFontSize(9);
    doc.text(`Filters: ${filtersLabel}`, 14, 29);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    autoTable(doc, {
        startY: 40,
        head: [columns],
        body: data.map((row) => columns.map((col) => String(row[col] ?? ""))),
        styles: { fontSize: 7 },
    });

    doc.save(`${reportType.toLowerCase()}_report.pdf`);
};
