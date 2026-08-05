import { Stack, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import { exportForecastCSV } from "../../api/forecastApi";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ForecastActions() {

  const handleExport = async () => {
    const response = await exportForecastCSV();

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = "forecast.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text("Demand Forecast Report", 14, 20);

    autoTable(doc, {
      head: [[
        "Product",
        "Category",
        "Forecast Period",
        "Predicted Demand",
        "Confidence"
      ]],
      body: [
        ["Laptop", "Electronics", "30 Days", "250", "95%"],
        ["Mouse", "Accessories", "30 Days", "180", "90%"],
        ["Keyboard", "Accessories", "30 Days", "160", "88%"],
        ["Monitor", "Electronics", "30 Days", "120", "92%"],
      ],
    });

    doc.save("forecast-report.pdf");
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="flex-end"
      sx={{ mb: 3 }}
    >
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleExport}
      >
        Export CSV
      </Button>

      <Button
        variant="contained"
        color="error"
        startIcon={<PictureAsPdfIcon />}
        onClick={handlePDF}
      >
        Export PDF
      </Button>
    </Stack>
  );
}