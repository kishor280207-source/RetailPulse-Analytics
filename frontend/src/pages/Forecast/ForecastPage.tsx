import {
  Box,
  Typography,
  Grid,
} from "@mui/material";

import ForecastCards from "../../components/forecast/ForecastCards";
import ForecastTable from "../../components/forecast/ForecastTable";
import ForecastFilters from "../../components/forecast/ForecastFilters";
import ForecastChart from "../../components/forecast/ForecastChart";
import CategoryChart from "../../components/forecast/CategoryChart";
import TopProductsChart from "../../components/forecast/TopProductsChart";
import ForecastActions from "../../components/forecast/ForecastActions";
import InventoryRecommendation from "../../components/forecast/InventoryRecommendation";
export default function ForecastPage() {

  return (

    <Box
    sx={{p: 4,maxWidth: 1600,mx: "auto",}}>

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Demand Forecasting
      </Typography>

      <ForecastCards />

      <Typography
  variant="h4"
  fontWeight="bold"
  mb={3}
>
  Demand Forecasting
</Typography>

<ForecastActions />

<ForecastCards />

<ForecastFilters />

<ForecastChart />

<Grid container spacing={3} sx={{ mt: 2 }}>
  <Grid item xs={12} md={6}>
    <CategoryChart />
  </Grid>

  <Grid item xs={12} md={6}>
    <TopProductsChart />
  </Grid>
</Grid>

<InventoryRecommendation />

<Box mt={4}>
  <ForecastTable />
</Box>

    </Box>

  );

}