import { Grid } from "@mui/material";
import SummaryCard from "../dashboard/SummaryCard";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import InventoryIcon from "@mui/icons-material/Inventory";
import InsightsIcon from "@mui/icons-material/Insights";

export default function ForecastCards() {

    return (

        <Grid container spacing={3}>

            <Grid item xs={12} md={3}>
                <SummaryCard
                    title="Predicted Demand"
                    value="1,250"
                    color="#1976d2"
                    icon={<TrendingUpIcon />}
                />
            </Grid>

            <Grid item xs={12} md={3}>
                <SummaryCard
                    title="Run Out Products"
                    value="12"
                    color="#ef5350"
                    icon={<WarningIcon />}
                />
            </Grid>

            <Grid item xs={12} md={3}>
                <SummaryCard
                    title="Healthy Stock"
                    value="84"
                    color="#4caf50"
                    icon={<InventoryIcon />}
                />
            </Grid>

            <Grid item xs={12} md={3}>
                <SummaryCard
                    title="Forecast Accuracy"
                    value="91%"
                    color="#ff9800"
                    icon={<InsightsIcon />}
                />
            </Grid>

        </Grid>

    );

}