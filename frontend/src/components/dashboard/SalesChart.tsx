import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Electronics", value: 40 },
  { name: "Groceries", value: 25 },
  { name: "Fashion", value: 20 },
  { name: "Furniture", value: 15 },
];

const COLORS = [
  "#1976d2",
  "#4caf50",
  "#ff9800",
  "#ef5350",
];

export default function SalesChart() {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>

        <Typography variant="h6" mb={2}>
          Sales by Category
        </Typography>

        <ResponsiveContainer width="100%" height={300}>

          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              outerRadius={100}
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

      </CardContent>
    </Card>
  );
}