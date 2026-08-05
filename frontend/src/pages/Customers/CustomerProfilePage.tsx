import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCustomerProfile } from "../../api/customerApi";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Button
} from "@mui/material";

export default function CustomerProfilePage() {

  const { id } = useParams();
  const navigate = useNavigate();

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

  if (!profile) {
  return (
    <Box p={4}>
      <Typography>Loading Customer Profile...</Typography>
    </Box>
  );
}

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
              <Typography><b>Address</b></Typography>
             <Typography>{profile.customer.address}</Typography>
          </Grid>

         <Grid item xs={6}>
           <Typography><b>City</b></Typography>
          <Typography>{profile.customer.city}</Typography>
          </Grid>

            <Grid item xs={6}>
             <Typography><b>State</b></Typography>
             <Typography>{profile.customer.state}</Typography>
            </Grid>

          <Grid item xs={6}>
             <Typography><b>Country</b></Typography>
            <Typography>{profile.customer.country}</Typography>
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
          <Grid item xs={6}>
            <Typography><b>Customer Segment</b></Typography>

             <Chip
               label={
                profile.summary?.total_orders <= 1
                ? "New"
                : profile.summary?.total_orders <= 5
                ? "Regular"
                : profile.summary?.total_orders <= 10
                ? "Loyal"
                : "VIP"
               }
              color={
               profile.summary?.total_orders > 10
              ? "warning"
              : profile.summary?.total_orders > 5
              ? "secondary"
              : profile.summary?.total_orders > 1
              ? "primary"
              : "success"
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

          <Grid item xs={4}>
           <Typography>Last Purchase</Typography>

            <Typography variant="h6">
              {profile.summary?.last_purchase_date ?? "No Purchases"}
            </Typography>
          </Grid>
        </Grid>  
          <Divider sx={{ my: 4 }} />

         <Typography variant="h6" mb={2}>
            Recent Purchases
         </Typography>

         <Paper variant="outlined" sx={{ p: 2 }}>
           <Typography color="text.secondary">
              Purchase history will be displayed here.
           </Typography>
       </Paper>


        

        <Button
           variant="contained"
           sx={{ mt: 4 }}
           onClick={() =>
           navigate(`/customers/purchase-history/${id}`)}

       >
          View Purchase History
       </Button>

      </Paper>

    </Box>
  );
}
