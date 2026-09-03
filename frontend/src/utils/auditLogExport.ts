import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AuditLogRecord } from "../api/auditLogApi";

export const exportAuditLogsCSV = (records: AuditLogRecord[], filterLabel: string) => {
    const rows: string[][] = [];

    rows.push(["Audit Logs Export"]);
    rows.push(["Filter", filterLabel]);
    rows.push([]);
    rows.push(["User", "Action", "Resource", "Resource ID", "Description", "IP Address", "Timestamp", "Status"]);

    records.forEach((r) => {
        rows.push([
            r.user_name || "-",
            r.action,
            r.resource_type || "-",
            r.resource_id || "-",
            r.description || "-",
            r.ip_address || "-",
            new Date(r.created_at).toLocaleString(),
            r.status,
        ]);
    });

    const csv = rows
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit_logs.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportAuditLogsPDF = (records: AuditLogRecord[], filterLabel: string) => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text("RetailPulse Analytics", 14, 15);

    doc.setFontSize(12);
    doc.text("Audit Logs Export", 14, 23);

    doc.setFontSize(9);
    doc.text(`Filter: ${filterLabel}`, 14, 29);

    autoTable(doc, {
        startY: 35,
        head: [["User", "Action", "Resource", "Res. ID", "Description", "IP", "Timestamp", "Status"]],
        body: records.map((r) => [
            r.user_name || "-",
            r.action,
            r.resource_type || "-",
            r.resource_id || "-",
            r.description || "-",
            r.ip_address || "-",
            new Date(r.created_at).toLocaleString(),
            r.status,
        ]),
        styles: { fontSize: 7 },
    });

    doc.save("audit_logs.pdf");
};
