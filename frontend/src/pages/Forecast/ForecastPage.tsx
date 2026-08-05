import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Button,
} from "@mui/material";

import ForecastCards from "../../components/forecast/ForecastCards";
import ForecastFilters from "../../components/forecast/ForecastFilters";
import ForecastTable from "../../components/forecast/ForecastTable";
import ForecastChart from "../../components/forecast/ForecastChart";
import CategoryChart from "../../components/forecast/CategoryChart";
import TopProductsChart from "../../components/forecast/TopProductsChart";
import InventoryRecommendation from "../../components/forecast/InventoryRecommendation";
import ForecastActions from "../../components/forecast/ForecastActions";

import {
  generateForecast,
  getForecasts,
} from "../../api/forecastApi";

export default function ForecastPage() {

  const [forecasts, setForecasts] = useState([]);
  const [period, setPeriod] = useState(30);

  const loadForecasts = async () => {
    try {
      const response = await getForecasts();
      setForecasts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadForecasts();
  }, []);

  const handleGenerate = async () => {
  console.log("Generate button clicked");

  await generateForecast(period);

  console.log("API called");

  loadForecasts();
};
 return (
  <Box p={4}>

    <Typography variant="h4" fontWeight="bold" mb={3}>
      Demand Forecasting
    </Typography>

    <ForecastCards />

    <Box mt={3}>
      <ForecastFilters
         period={period}
         setPeriod={setPeriod}
         onGenerate={handleGenerate}
/>
    </Box>

    <Box mt={3}>
      <ForecastActions />
    </Box>

    <Box mt={3}>
      <ForecastTable />
    </Box>

    <Box mt={3}>
      <ForecastChart />
    </Box>

    <Box mt={3}>
      <CategoryChart />
    </Box>

    <Box mt={3}>
      <TopProductsChart />
    </Box>

    <Box mt={3}>
      <InventoryRecommendation />
    </Box>

  </Box>
);
  
}