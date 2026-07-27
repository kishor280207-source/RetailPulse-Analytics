import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";

export default function TopProducts() {

    const products = [
        {
            name: "Laptop",
            quantity: 120,
            revenue: 720000
        },
        {
            name: "Mouse",
            quantity: 350,
            revenue: 175000
        },
        {
            name: "Keyboard",
            quantity: 210,
            revenue: 126000
        },
        {
            name: "Monitor",
            quantity: 95,
            revenue: 285000
        },
        {
            name: "Printer",
            quantity: 60,
            revenue: 180000
        }
    ];

    return (

        <Paper sx={{ p: 3, mt: 4 }}>

            <Typography variant="h6" mb={2}>
                Top Selling Products
            </Typography>

            <TableContainer>

                <Table>

                    <TableHead>

                        <TableRow>

                            <TableCell><b>Product</b></TableCell>

                            <TableCell><b>Quantity Sold</b></TableCell>

                            <TableCell><b>Revenue</b></TableCell>

                        </TableRow>

                    </TableHead>

                    <TableBody>

                        {products.map((item) => (

                            <TableRow key={item.name}>

                                <TableCell>{item.name}</TableCell>

                                <TableCell>{item.quantity}</TableCell>

                                <TableCell>₹ {item.revenue}</TableCell>

                            </TableRow>

                        ))}

                    </TableBody>

                </Table>

            </TableContainer>

        </Paper>

    );

}