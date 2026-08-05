import { useEffect, useState } from "react";
import { getCustomers, deleteCustomer,getCustomerAnalytics,exportCustomersCSV,getCustomerSegments } from "../../api/customerApi";
import type { Customer } from "../../types/customer";
import CustomerDashboardCards from "../../components/customers/CustomerDashboardCards";

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
  TextField,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from "@mui/material";

export default function CustomersPage() {

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [analytics, setAnalytics] = useState<any>({});
  const [segments, setSegments] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handleExport = async () => {

  const response = await exportCustomersCSV();

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");

  link.href = url;

  link.download = "customers.csv";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
};

  const loadCustomers = async () => {
  try {
    setLoading(true);

    const response = await getCustomers();
    setCustomers(response.data);

    const analyticsResponse = await getCustomerAnalytics();
    setAnalytics(analyticsResponse.data);

    const segmentResponse = await getCustomerSegments();
    setSegments(segmentResponse.data);

  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
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

   const filteredCustomers = customers.filter((customer) => {

  const matchesSearch =
    customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.includes(search);

  const matchesStatus =
    statusFilter === "" || customer.status === statusFilter;

  const matchesType =
    typeFilter === "" || customer.customer_type === typeFilter;

  return matchesSearch && matchesStatus && matchesType;

});

 if (loading) {
  return (
    <Box
  sx={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100%",
  }}
>
  <CircularProgress size={60} />
</Box>
  );
}
  

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

      <Stack direction="row" spacing={2}>

  <TextField
    label="Search Customer"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    sx={{ width: 250 }}
  />

  <FormControl sx={{ width: 170 }}>
    <InputLabel>Status</InputLabel>

    <Select
      value={statusFilter}
      label="Status"
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      <MenuItem value="">All</MenuItem>
      <MenuItem value="Active">Active</MenuItem>
      <MenuItem value="Inactive">Inactive</MenuItem>
    </Select>

  </FormControl>

  <FormControl sx={{ width: 170 }}>
    <InputLabel>Type</InputLabel>

    <Select
      value={typeFilter}
      label="Type"
      onChange={(e) => setTypeFilter(e.target.value)}
    >
      <MenuItem value="">All</MenuItem>
      <MenuItem value="Retail">Retail</MenuItem>
      <MenuItem value="Wholesale">Wholesale</MenuItem>
      <MenuItem value="Corporate">Corporate</MenuItem>
    </Select>

  </FormControl>

</Stack>

  <Stack direction="row" spacing={2}>

    <Button
    variant="contained"
    color="success"
    onClick={handleExport}
  >
    Export CSV
  </Button>

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

            {filteredCustomers.length === 0 ? (

            <TableRow>
             <TableCell colSpan={7} align="center">
              <Typography
                 color="text.secondary"
                 py={4}
              >
                  No customers found.
              </Typography>
            </TableCell>
           </TableRow>

        ) : (

             filteredCustomers
             .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
             .map((customer) => {

             const segment = segments.find(
            (item) => item.customer_id === customer.customer_id
            );

            return (

              <TableRow key={customer.id}>

                <TableCell>{customer.customer_id}</TableCell>

                <TableCell>{customer.full_name}</TableCell>

                <TableCell>{customer.email}</TableCell>

                <TableCell>{customer.phone}</TableCell>

                <TableCell>
                   <Chip
                     label={segment?.segment || "New"}
                     color={
                        segment?.segment === "VIP"
                        ? "warning"
                        : segment?.segment === "Loyal"
                        ? "secondary"
                        : segment?.segment === "Regular"
                        ? "primary"
                        : "success"
                      }
                     size="small"
                    />
                  </TableCell>

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

            );
          })
        )} 

          </TableBody>

       </Table>

       <TablePagination
         component="div"
         count={filteredCustomers.length}
         page={page}
         onPageChange={(event, newPage) => setPage(newPage)}
         rowsPerPage={rowsPerPage}
         onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
         setPage(0);
         }}
        rowsPerPageOptions={[5, 10, 25]}
     />

     </Paper> 

    </Box>
  );
}