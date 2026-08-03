import { Grid, Card, CardContent, Typography } from "@mui/material";

const recommendations = [
  {
    title: "Reorder Soon",
    value: "12 Products",
    color: "#fb8c00",
  },
  {
    title: "Immediate Restock",
    value: "5 Products",
    color: "#e53935",
  },
  {
    title: "Healthy Stock",
    value: "84 Products",
    color: "#43a047",
  },
  {
    title: "Overstock Risk",
    value: "8 Products",
    color: "#1e88e5",
  },
];

export default function InventoryRecommendation() {
  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {recommendations.map((item) => (
        <Grid item xs={12} md={3} key={item.title}>
          <Card
            sx={{
              borderLeft: `6px solid ${item.color}`,
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography
                color="text.secondary"
                fontWeight={600}
              >
                {item.title}
              </Typography>

              <Typography
                variant="h5"
                fontWeight="bold"
                mt={1}
              >
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}