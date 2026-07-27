import { Box, Button } from "@mui/material";

export default function ExportButtons() {

    const exportCSV = () => {

        const csv = `Report,Value
Total Revenue,50000
Total Orders,120
Products Sold,350
Low Stock,8`;

        const blob = new Blob([csv], {
            type: "text/csv"
        });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = "RetailDashboard.csv";

        link.click();

    };

    const exportPDF = () => {

        alert("PDF Export Coming Soon");

    };

    return (

        <Box
            display="flex"
            gap={2}
            mt={3}
            mb={3}
        >

            <Button
                variant="contained"
                color="success"
                onClick={exportCSV}
            >
                Export CSV
            </Button>

            <Button
                variant="contained"
                color="error"
                onClick={exportPDF}
            >
                Export PDF
            </Button>

        </Box>

    );

}