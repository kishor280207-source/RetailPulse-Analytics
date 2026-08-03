import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Paper, Typography } from "@mui/material";

const data = [
  { name: "Laptop", value: 40 },
  { name: "Mouse", value: 20 },
  { name: "Keyboard", value: 15 },
  { name: "Monitor", value: 25 },
];

const COLORS = [
  "#1976d2",
  "#43a047",
  "#ff9800",
  "#e53935",
];

export default function TopProductsChart() {
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
        Top Predicted Products
      </Typography>

      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            outerRadius={100}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index]}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}