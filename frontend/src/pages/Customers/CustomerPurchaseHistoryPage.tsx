import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

import { getCustomerPurchaseHistory } from "../../api/customerApi";

export default function CustomerPurchaseHistoryPage() {
  const { id } = useParams();

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getCustomerPurchaseHistory(Number(id));
    setOrders(res.data);
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Purchase History
      </Typography>

      <Paper>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell>Invoice</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {orders.map((order: any) => (

              <TableRow key={order.id}>

                <TableCell>{order.invoice_number}</TableCell>

                <TableCell>{order.sale_date}</TableCell>

                <TableCell>₹{order.total_amount}</TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

    </Box>
  );
}