import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

import {
    Paper,
    Typography
} from "@mui/material";

interface Props {
    data: any[];
}

export default function TopCategoryChart({
    data
}: Props) {

    return (

        <Paper sx={{ p: 3, mt: 4 }}>

            <Typography
                variant="h6"
                mb={2}
            >
                Top Performing Categories
            </Typography>

            <ResponsiveContainer
                width="100%"
                height={300}
            >

                <BarChart data={data}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="category" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                        dataKey="sales"
                        fill="#1976d2"
                    />

                </BarChart>

            </ResponsiveContainer>

        </Paper>

    );

}