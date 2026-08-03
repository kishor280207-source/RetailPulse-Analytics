import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack
} from "@mui/material";

const categories = [
  {
    id: 1,
    name: "Electronics",
    description: "Electronic Products",
    products: 35,
    status: "Active"
  },
  {
    id: 2,
    name: "Accessories",
    description: "Computer Accessories",
    products: 20,
    status: "Active"
  },
  {
    id: 3,
    name: "Furniture",
    description: "Office Furniture",
    products: 12,
    status: "Inactive"
  }
];

export default function Categories() {

  return (

    <Box p={4}>

      <Typography variant="h4" fontWeight="bold" mb={3}>
        Category Management
      </Typography>

      <Grid container spacing={2} mb={3}>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography>Total Categories</Typography>
              <Typography variant="h4">18</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography>Active</Typography>
              <Typography variant="h4">16</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography>Inactive</Typography>
              <Typography variant="h4">2</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography>Total Products</Typography>
              <Typography variant="h4">150</Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>

        <Grid container spacing={2}>

          <Grid size={{ xs: 12, md: 9 }}>
            <TextField
              fullWidth
              label="Search Category"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="contained"
              sx={{ height: 56 }}
            >
              Add Category
            </Button>
          </Grid>

        </Grid>

      </Paper>

      <Paper sx={{ p: 2 }}>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Description</b></TableCell>
              <TableCell><b>Products</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell align="center"><b>Actions</b></TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {categories.map((category) => (

              <TableRow key={category.id}>

                <TableCell>{category.name}</TableCell>

                <TableCell>{category.description}</TableCell>

                <TableCell>{category.products}</TableCell>

                <TableCell>
                  <Chip
                    label={category.status}
                    color={category.status === "Active" ? "success" : "error"}
                  />
                </TableCell>

                <TableCell align="center">

                  <Stack direction="row" spacing={1} justifyContent="center">

                    <Button variant="contained" size="small">
                      View
                    </Button>

                    <Button variant="outlined" size="small">
                      Edit
                    </Button>

                    <Button variant="contained" color="error" size="small">
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