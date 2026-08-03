import { useEffect, useState } from "react";
import { getCustomerAnalytics } from "../../api/customerApi";

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CustomerAnalyticsPage() {

  const [analytics, setAnalytics] = useState<any>({});

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await getCustomerAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const chartData = [
    {
      name: "Customers",
      Total: analytics.total_customers || 0,
      Active: analytics.active_customers || 0,
      Returning: analytics.returning_customers || 0,
    },
  ];

  return (
    <Box p={4}>

      <Typography variant="h4" mb={3}>
        Customer Analytics
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography>Total Customers</Typography>
              <Typography variant="h4">
                {analytics.total_customers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography>Active Customers</Typography>
              <Typography variant="h4">
                {analytics.active_customers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography>Revenue</Typography>
              <Typography variant="h4">
                ₹{analytics.total_customer_revenue}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography>Average Spend</Typography>
              <Typography variant="h4">
                ₹{analytics.average_customer_spend}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Card sx={{ mt: 4, p: 2 }}>

        <Typography variant="h6" mb={2}>
          Customer Statistics
        </Typography>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />

            <Bar dataKey="Total" />
            <Bar dataKey="Active" />
            <Bar dataKey="Returning" />

          </BarChart>
        </ResponsiveContainer>

      </Card>

    </Box>
  );
}