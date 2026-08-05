import { useEffect, useState } from "react";

import { Grid, Card, CardContent, Typography } from "@mui/material";

import { getRecommendations } from "../../api/forecastApi";

export default function InventoryRecommendation() {

  const [recommendations, setRecommendations] = useState<any[]>([]);

  const loadRecommendations = async () => {
    try {
      const res = await getRecommendations();
      setRecommendations(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {recommendations.map((item, index) => (
        <Grid item xs={12} md={3} key={index}>
          <Card
            sx={{
              borderLeft: "6px solid #1976d2",
              borderRadius: 3,
            }}
          >
            <CardContent>

              <Typography
                color="text.secondary"
                fontWeight={600}
              >
                {item.status}
              </Typography>

              <Typography
                variant="h5"
                fontWeight="bold"
                mt={1}
              >
                {item.product}
              </Typography>

            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}