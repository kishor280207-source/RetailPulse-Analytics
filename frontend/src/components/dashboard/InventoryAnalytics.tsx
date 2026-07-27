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

export default function InventoryAnalytics() {

    const inventory = [

        {
            category: "Electronics",
            value: 250000,
            lowStock: 5
        },

        {
            category: "Groceries",
            value: 180000,
            lowStock: 3
        },

        {
            category: "Accessories",
            value: 90000,
            lowStock: 2
        }

    ];

    return (

        <Paper sx={{ p: 3, mt: 4 }}>

            <Typography variant="h6" mb={2}>
                Inventory Analytics
            </Typography>

            <TableContainer>

                <Table>

                    <TableHead>

                        <TableRow>

                            <TableCell><b>Category</b></TableCell>

                            <TableCell><b>Inventory Value</b></TableCell>

                            <TableCell><b>Low Stock Items</b></TableCell>

                        </TableRow>

                    </TableHead>

                    <TableBody>

                        {inventory.map((item) => (

                            <TableRow key={item.category}>

                                <TableCell>{item.category}</TableCell>

                                <TableCell>₹ {item.value}</TableCell>

                                <TableCell>{item.lowStock}</TableCell>

                            </TableRow>

                        ))}

                    </TableBody>

                </Table>

            </TableContainer>

        </Paper>

    );

}