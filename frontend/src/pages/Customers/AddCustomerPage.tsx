import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { useForm } from "react-hook-form";
import { createCustomer } from "../../api/customerApi";
import { useNavigate } from "react-router-dom";

type CustomerForm = {
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  customer_type: string;
  preferred_sales_channel: string;
  address: string;
  city: string;
  state: string;
  country: string;
};

export default function AddCustomerPage() {

  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<CustomerForm>();

  const onSubmit = async (data: CustomerForm) => {
  try {
    await createCustomer(data);

    alert("Customer Added Successfully");

    navigate("/customers");

  } catch (error) {
    console.log(error);
    alert("Failed to add customer");
  }
};

  return (
    <Box p={4}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>

          <Typography variant="h4" mb={3} fontWeight="bold">
            Add Customer
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>

            <Grid container spacing={3}>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  {...register("full_name")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  {...register("email")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  {...register("phone")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  defaultValue=""
                  {...register("gender")}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Customer Type"
                  defaultValue=""
                  {...register("customer_type")}
                >
                  <MenuItem value="Retail">Retail</MenuItem>
                  <MenuItem value="Wholesale">Wholesale</MenuItem>
                  <MenuItem value="Corporate">Corporate</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Preferred Sales Channel"
                  {...register("preferred_sales_channel")}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  {...register("address")}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="City"
                  {...register("city")}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="State"
                  {...register("state")}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Country"
                  {...register("country")}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                >
                  Save Customer
                </Button>
              </Grid>

            </Grid>

          </form>

        </CardContent>
      </Card>
    </Box>
  );
}