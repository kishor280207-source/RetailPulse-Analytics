import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Paper, Typography } from "@mui/material";

const data = [
  { month: "Jan", sales: 120, forecast: 130 },
  { month: "Feb", sales: 180, forecast: 190 },
  { month: "Mar", sales: 210, forecast: 220 },
  { month: "Apr", sales: 170, forecast: 180 },
  { month: "May", sales: 260, forecast: 275 },
  { month: "Jun", sales: 310, forecast: 330 },
];

export default function ForecastChart() {
  return (
    <Paper
      elevation={4}
      sx={{
        mt: 4,
        p: 3,
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        mb={2}
      >
        Historical Sales vs Forecast
      </Typography>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="sales"
            stroke="#1976d2"
            strokeWidth={3}
          />

          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#4caf50"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}