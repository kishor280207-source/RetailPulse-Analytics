import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { Paper, Typography } from "@mui/material";

const data = [
  { category: "Electronics", demand: 320 },
  { category: "Accessories", demand: 180 },
  { category: "Furniture", demand: 90 },
  { category: "Fashion", demand: 240 },
];

export default function CategoryChart() {
  return (
    <Paper
      elevation={4}
      sx={{
        p: 3,
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        mb={2}
      >
        Category Demand Trend
      </Typography>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="demand"
            fill="#1976d2"
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}