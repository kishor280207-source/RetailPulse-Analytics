import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", revenue: 15000 },
  { month: "Feb", revenue: 22000 },
  { month: "Mar", revenue: 18000 },
  { month: "Apr", revenue: 35000 },
  { month: "May", revenue: 42000 },
  { month: "Jun", revenue: 51000 },
];

export default function RevenueChart() {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>

        <Typography variant="h6" mb={2}>
          Revenue Trend
        </Typography>

        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#1976d2"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </CardContent>
    </Card>
  );
}