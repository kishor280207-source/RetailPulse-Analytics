import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from "@mui/material";

export default function RecentSales() {

    const sales = [
        {
            invoice: "INV001",
            customer: "Rahul",
            amount: 1200
        },
        {
            invoice: "INV002",
            customer: "Kumar",
            amount: 3500
        },
        {
            invoice: "INV003",
            customer: "Priya",
            amount: 2700
        }
    ];

    return (

        <Paper sx={{ p: 3, mt: 4 }}>

            <Typography variant="h6" mb={2}>
                Recent Sales
            </Typography>

            <Table>

                <TableHead>

                    <TableRow>

                        <TableCell>Invoice</TableCell>

                        <TableCell>Customer</TableCell>

                        <TableCell>Amount</TableCell>

                    </TableRow>

                </TableHead>

                <TableBody>

                    {sales.map((sale) => (

                        <TableRow key={sale.invoice}>

                            <TableCell>{sale.invoice}</TableCell>

                            <TableCell>{sale.customer}</TableCell>

                            <TableCell>₹ {sale.amount}</TableCell>

                        </TableRow>

                    ))}

                </TableBody>

            </Table>

        </Paper>

    );

}