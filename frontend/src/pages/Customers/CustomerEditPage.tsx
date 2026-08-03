import { useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomer, updateCustomer } from "../../api/customerApi";

export default function CustomerEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const response = await getCustomer(Number(id));
      reset(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await updateCustomer(Number(id), data);

      alert("Customer Updated Successfully");

      navigate("/customers");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box p={4}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" mb={3}>
          Edit Customer
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Full Name"
                {...register("full_name")}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                {...register("email")}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                {...register("phone")}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Customer Type"
                {...register("customer_type")}
              >
                <MenuItem value="Retail">Retail</MenuItem>
                <MenuItem value="Wholesale">Wholesale</MenuItem>
                <MenuItem value="Corporate">Corporate</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
              >
                Update Customer
              </Button>
            </Grid>

          </Grid>
        </form>
      </Paper>
    </Box>
  );
}