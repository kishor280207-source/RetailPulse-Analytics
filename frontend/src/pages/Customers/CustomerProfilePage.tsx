import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCustomerProfile } from "../../api/customerApi";

import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip
} from "@mui/material";

export default function CustomerProfilePage() {

  const { id } = useParams();

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await getCustomerProfile(Number(id));
      setProfile(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!profile) return <Typography p={4}>Loading...</Typography>;

  return (
    <Box p={4}>

      <Typography variant="h4" mb={3}>
        Customer Profile
      </Typography>

      <Paper sx={{ p: 4 }}>

        <Grid container spacing={3}>

          <Grid item xs={6}>
            <Typography><b>Name</b></Typography>
            <Typography>{profile.customer.full_name}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography><b>Email</b></Typography>
            <Typography>{profile.customer.email}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography><b>Phone</b></Typography>
            <Typography>{profile.customer.phone}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography><b>Customer Type</b></Typography>
            <Typography>{profile.customer.customer_type}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography><b>Status</b></Typography>

            <Chip
              label={profile.customer.status}
              color={
                profile.customer.status === "Active"
                  ? "success"
                  : "error"
              }
            />
          </Grid>

        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" mb={2}>
          Purchase Summary
        </Typography>

        <Grid container spacing={3}>

          <Grid item xs={4}>
            <Typography>Total Orders</Typography>
            <Typography variant="h5">
              {profile.summary?.total_orders ?? 0}
            </Typography>
          </Grid>

          <Grid item xs={4}>
            <Typography>Total Revenue</Typography>
            <Typography variant="h5">
              ₹{profile.summary?.total_revenue ?? 0}
            </Typography>
          </Grid>

          <Grid item xs={4}>
            <Typography>Average Order</Typography>
            <Typography variant="h5">
              ₹{profile.summary?.average_order_value ?? 0}
            </Typography>
          </Grid>

        </Grid>

      </Paper>

    </Box>
  );
}