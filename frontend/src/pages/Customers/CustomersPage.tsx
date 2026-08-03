import { useEffect, useState } from "react";
import { getCustomers, deleteCustomer } from "../../api/customerApi";
import type { Customer } from "../../types/customer";
import CustomerDashboardCards from "../../components/customers/CustomerDashboardCards";
import { getCustomerAnalytics } from "../../api/customerApi";
import { useNavigate } from "react-router-dom";
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
  Button,
  Stack,
  TextField
} from "@mui/material";

export default function CustomersPage() {

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [analytics, setAnalytics] = useState<any>({});
  const navigate = useNavigate();

  const loadCustomers = async () => {
  try {
    const response = await getCustomers();
    setCustomers(response.data);

    const analyticsResponse = await getCustomerAnalytics();
    setAnalytics(analyticsResponse.data);

  } catch (error) {
    console.log(error);
  }
};

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDelete = async (id: number) => {

    if (!confirm("Delete this customer?")) return;

    await deleteCustomer(id);

    loadCustomers();
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.includes(search)
  );

  return (
    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Customer Management
      </Typography>
      <CustomerDashboardCards analytics={analytics} />

      <Stack
  direction="row"
  justifyContent="space-between"
  alignItems="center"
  spacing={2}
  mb={3}
>

  <TextField
    label="Search Customer"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    sx={{ width: 350 }}
  />

  <Stack direction="row" spacing={2}>

    <Button
      variant="contained"
      onClick={() => navigate("/customers/add")}
    >
      Add Customer
    </Button>

    <Button
      variant="contained"
      color="secondary"
      onClick={() => navigate("/customers/analytics")}
    >
      Customer Analytics
    </Button>

  </Stack>

</Stack>

      <Paper>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Phone</b></TableCell>
              <TableCell><b>Type</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell align="center"><b>Actions</b></TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {filteredCustomers.map((customer) => (

              <TableRow key={customer.id}>

                <TableCell>{customer.customer_id}</TableCell>

                <TableCell>{customer.full_name}</TableCell>

                <TableCell>{customer.email}</TableCell>

                <TableCell>{customer.phone}</TableCell>

                <TableCell>{customer.customer_type}</TableCell>

                <TableCell>

                  <Chip
                    label={customer.status}
                    color={
                      customer.status === "Active"
                        ? "success"
                        : "error"
                    }
                  />

                </TableCell>

                <TableCell align="center">

                  <Stack
                    direction="row"
                    spacing={1}
                  >

                    <Button
                     variant="contained"
                      size="small"
                       onClick={() => navigate(`/customers/profile/${customer.id}`)}>
                        View
                        </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/customers/edit/${customer.id}`)}>
                     Edit
                  </Button>

                    <Button
                      color="error"
                      variant="contained"
                      size="small"
                      onClick={() => handleDelete(customer.id)}
                    >
                      Delete
                    </Button>

                  </Stack>

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

    </Box>
  );
}