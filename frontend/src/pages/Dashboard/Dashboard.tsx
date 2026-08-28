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

      <Grid container spacing={2} sx={{ width: "100%" }}>

        <Grid size={{ xs: 12, md: 6 }}>
          <SummaryCard
            title="Revenue"
            value="₹12,45,000"
            color="#1976d2"
            icon={<AttachMoneyIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SummaryCard
            title="Orders"
            value="1,245"
            color="#4caf50"
            icon={<ShoppingCartIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SummaryCard
            title="Products"
            value="325"
            color="#ff9800"
            icon={<InventoryIcon />}
          />
        </Grid>

       <Grid size={{ xs: 12, md: 6 }}>
          <SummaryCard
            title="Customers"
            value="856"
            color="#9c27b0"
            icon={<PeopleIcon />}
          />
        </Grid>

      </Grid>
      <Grid container spacing={3} sx={{ mt: 2 }}>

      <Grid size={{ xs: 12, md: 6 }}>
        <RevenueChart />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <SalesChart />
      </Grid>

    </Grid>
    <Grid container spacing={3} sx={{ mt: 2 }}>

    <Grid size={{ xs: 12, md: 6 }}>
     <RecentSales />
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
     <TopProducts />
    </Grid>

   </Grid>
   <br></br>
   {/* <Stack
    direction="row"
    spacing={4}
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

</Stack> */}
  

    </>

  );
}