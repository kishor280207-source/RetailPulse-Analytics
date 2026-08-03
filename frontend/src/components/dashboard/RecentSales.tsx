import {
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";

const sales = [
  {
    invoice: "INV001",
    customer: "Rahul Kumar",
    amount: "₹5,200",
    status: "Paid",
  },
  {
    invoice: "INV002",
    customer: "Arun Kumar",
    amount: "₹2,100",
    status: "Pending",
  },
  {
    invoice: "INV003",
    customer: "Suresh",
    amount: "₹8,700",
    status: "Paid",
  },
];

export default function RecentSales() {
  return (
    <Card
       sx={{
        borderRadius: 4,
        height: 420,
        }}
    >
      <CardContent>

        <Typography variant="h6" mb={2}>
          Recent Sales
        </Typography>

        <Table size="small">

          <TableHead>

            <TableRow>
              <TableCell><b>Invoice</b></TableCell>
              <TableCell><b>Customer</b></TableCell>
              <TableCell><b>Amount</b></TableCell>
              <TableCell><b>Status</b></TableCell>
            </TableRow>

          </TableHead>

          <TableBody>

            {sales.map((sale) => (
              <TableRow key={sale.invoice}>
                <TableCell>{sale.invoice}</TableCell>
                <TableCell>{sale.customer}</TableCell>
                <TableCell>{sale.amount}</TableCell>

                <TableCell>
                  <Chip
                    label={sale.status}
                    color={
                      sale.status === "Paid"
                        ? "success"
                        : "warning"
                    }
                    size="small"
                  />
                </TableCell>

              </TableRow>
            ))}

          </TableBody>

        </Table>

      </CardContent>
    </Card>
  );
}