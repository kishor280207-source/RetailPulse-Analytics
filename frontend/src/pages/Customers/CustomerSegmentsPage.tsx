import { useEffect, useState } from "react";
import { getCustomerSegments } from "../../api/customerApi";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";

export default function CustomerSegmentsPage() {

  const [segments, setSegments] = useState<any[]>([]);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      const response = await getCustomerSegments();
      setSegments(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box p={4}>

      <Typography variant="h4" mb={3}>
        Customer Segments
      </Typography>

      <Paper>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell><b>Customer</b></TableCell>
              <TableCell><b>Segment</b></TableCell>
              <TableCell><b>Total Orders</b></TableCell>
              <TableCell><b>Total Spend</b></TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {segments.map((item: any) => (

              <TableRow key={item.customer_id}>

                <TableCell>{item.customer_name}</TableCell>

                <TableCell>

                  <Chip
                    label={item.segment}
                    color="primary"
                  />

                </TableCell>

                <TableCell>{item.total_orders}</TableCell>

                <TableCell>₹{item.total_spend}</TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

    </Box>
  );
}