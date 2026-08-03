import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack
} from "@mui/material";

const products = [
  {
    id: 1,
    name: "Laptop",
    sku: "LP1001",
    category: "Electronics",
    price: 65000,
    stock: 18,
    status: "Active"
  },
  {
    id: 2,
    name: "Mouse",
    sku: "MS1002",
    category: "Accessories",
    price: 800,
    stock: 45,
    status: "Active"
  },
  {
    id: 3,
    name: "Keyboard",
    sku: "KB1003",
    category: "Accessories",
    price: 1500,
    stock: 0,
    status: "Out of Stock"
  }
];

export default function Products() {

  return (

    <Box p={4}>

      <Typography variant="h4" fontWeight="bold" mb={3}>
        Product Management
      </Typography>

      <Grid container spacing={2} mb={3}>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography>Total Products</Typography>
              <Typography variant="h4">150</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography>Active Products</Typography>
              <Typography variant="h4">132</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography>Low Stock</Typography>
              <Typography variant="h4">12</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography>Out of Stock</Typography>
              <Typography variant="h4">6</Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>

        <Grid container spacing={2}>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search Product"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Category"
              defaultValue=""
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Accessories">Accessories</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Status"
              defaultValue=""
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Out of Stock">Out of Stock</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              sx={{ height: 56 }}
            >
              Add Product
            </Button>
          </Grid>

        </Grid>

      </Paper>

      <Paper sx={{ p: 2 }}>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell><b>Name</b></TableCell>
              <TableCell><b>SKU</b></TableCell>
              <TableCell><b>Category</b></TableCell>
              <TableCell><b>Price</b></TableCell>
              <TableCell><b>Stock</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell align="center"><b>Actions</b></TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {products.map((product) => (

              <TableRow key={product.id}>

                <TableCell>{product.name}</TableCell>

                <TableCell>{product.sku}</TableCell>

                <TableCell>{product.category}</TableCell>

                <TableCell>₹ {product.price}</TableCell>

                <TableCell>{product.stock}</TableCell>

                <TableCell>

                  <Chip
                    label={product.status}
                    color={
                      product.status === "Active"
                        ? "success"
                        : "error"
                    }
                  />

                </TableCell>

                <TableCell align="center">

                  <Stack direction="row" spacing={1} justifyContent="center">

                    <Button size="small" variant="contained">
                      View
                    </Button>

                    <Button size="small" variant="outlined">
                      Edit
                    </Button>

                    <Button size="small" color="error" variant="contained">
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