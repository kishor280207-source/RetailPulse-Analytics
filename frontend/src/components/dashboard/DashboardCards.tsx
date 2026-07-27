import {
    Box,
    Paper,
    Typography
} from "@mui/material";

interface Props {
    revenue: number;
    totalSales: number;
    products: number;
    lowStock: number;
}

export default function DashboardCards({
    revenue,
    totalSales,
    products,
    lowStock
}: Props) {

    return (

        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
                gap: 3
            }}
        >

            <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                    Total Revenue
                </Typography>

                <Typography variant="h5">
                    ₹ {revenue}
                </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                    Total Orders
                </Typography>

                <Typography variant="h5">
                    {totalSales}
                </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                    Total Products
                </Typography>

                <Typography variant="h5">
                    {products}
                </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                    Low Stock
                </Typography>

                <Typography variant="h5">
                    {lowStock}
                </Typography>
            </Paper>

        </Box>

    );

}