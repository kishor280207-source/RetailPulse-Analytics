import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";

import SummaryCard from "../../components/dashboard/SummaryCard";
import RevenueChart from "../../components/dashboard/RevenueChart";
import SalesChart from "../../components/dashboard/SalesChart";
import RecentSales from "../../components/dashboard/RecentSales";
import TopProducts from "../../components/dashboard/TopProducts";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import { Stack, Button } from "@mui/material";

export default function Dashboard() {

  return (

    <>
      <WelcomeBanner />
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={4}
      >
        Dashboard
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Revenue"
            value="₹12,45,000"
            color="#1976d2"
            icon={<AttachMoneyIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Orders"
            value="1,245"
            color="#4caf50"
            icon={<ShoppingCartIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Products"
            value="325"
            color="#ff9800"
            icon={<InventoryIcon />}
          />
        </Grid>

       <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Customers"
            value="856"
            color="#9c27b0"
            icon={<PeopleIcon />}
          />
        </Grid>

      </Grid>
      <Grid container spacing={3} sx={{ mt: 2 }}>

      <Grid item xs={12} md={8}>
        <RevenueChart />
      </Grid>

      <Grid item xs={12} md={4}>
        <SalesChart />
      </Grid>

    </Grid>
    <Grid container spacing={3} sx={{ mt: 2 }}>

    <Grid item xs={12} md={8}>
     <RecentSales />
    </Grid>

    <Grid item xs={12} md={4}>
     <TopProducts />
    </Grid>

   </Grid>
   <Stack
    direction="row"
    spacing={2}
    mt={4}
    mb={4}
>

       <Button variant="contained">
        Add Product
       </Button>

      <Button variant="contained">
      Add Sale
     </Button>

     <Button variant="contained">
     Add Customer
    </Button>

     <Button variant="outlined">
      Export Report
    </Button>

</Stack>
  

    </>

  );
}