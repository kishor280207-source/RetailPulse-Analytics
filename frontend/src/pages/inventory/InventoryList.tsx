import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
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

const inventory = [
  {
    id: 1,
    product: "Laptop",
    sku: "LP1001",
    category: "Electronics",
    stock: 25,
    reorder: 10,
    status: "In Stock"
  },
  {
    id: 2,
    product: "Mouse",
    sku: "MS1002",
    category: "Accessories",
    stock: 8,
    reorder: 10,
    status: "Low Stock"
  },
  {
    id: 3,
    product: "Keyboard",
    sku: "KB1003",
    category: "Accessories",
    stock: 0,
    reorder: 10,
    status: "Out of Stock"
  }
];

export default function InventoryList() {

  return (

    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Inventory Management
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
              <Typography>In Stock</Typography>
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
              label="Stock Status"
              defaultValue=""
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="In Stock">In Stock</MenuItem>
              <MenuItem value="Low Stock">Low Stock</MenuItem>
              <MenuItem value="Out of Stock">Out of Stock</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              sx={{ height: 56 }}
            >
              Add Stock
            </Button>
          </Grid>

        </Grid>

      </Paper>

      <Paper sx={{ p: 2 }}>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell><b>Product</b></TableCell>
              <TableCell><b>SKU</b></TableCell>
              <TableCell><b>Category</b></TableCell>
              <TableCell><b>Available Stock</b></TableCell>
              <TableCell><b>Reorder Level</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell align="center"><b>Actions</b></TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {inventory.map((item) => (

              <TableRow key={item.id}>

                <TableCell>{item.product}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>{item.reorder}</TableCell>

                <TableCell>

                  <Chip
                    label={item.status}
                    color={
                      item.status === "In Stock"
                        ? "success"
                        : item.status === "Low Stock"
                        ? "warning"
                        : "error"
                    }
                  />

                </TableCell>

                <TableCell align="center">

                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                  >

                    <Button
                      size="small"
                      variant="contained"
                    >
                      View
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                    >
                      Edit
                    </Button>

                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                    >
                      Remove
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