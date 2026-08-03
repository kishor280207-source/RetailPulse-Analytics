import { Grid, Card, CardContent, Typography } from "@mui/material";

interface Props {
  analytics: any;
}

export default function CustomerDashboardCards({ analytics }: Props) {
  const cards = [
    {
      title: "Total Customers",
      value: analytics.total_customers || 0,
    },
    {
      title: "Active Customers",
      value: analytics.active_customers || 0,
    },
    {
      title: "New Customers",
      value: analytics.new_customers || 0,
    },
    {
      title: "Returning Customers",
      value: analytics.returning_customers || 0,
    },
    {
      title: "Average Spend",
      value: `₹${analytics.average_customer_spend?.toFixed(2) || 0}`,
    },
    {
      title: "Revenue",
      value: `₹${analytics.total_customer_revenue?.toFixed(2) || 0}`,
    },
  ];

  return (
    <Grid container spacing={2} mb={3}>
      {cards.map((card) => (
        <Grid item xs={12} md={4} lg={2} key={card.title}>
          <Card elevation={4}>
            <CardContent>
              <Typography color="text.secondary">
                {card.title}
              </Typography>

              <Typography variant="h5" fontWeight="bold">
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}