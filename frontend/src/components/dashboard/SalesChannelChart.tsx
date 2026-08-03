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

export default function SalesChannelChart({
    data
}: Props) {

    return (

        <Paper sx={{ p: 3, mt: 4 }}>

            <Typography
                variant="h6"
                mb={2}
            >
                Sales by Sales Channel
            </Typography>

            <ResponsiveContainer
                width="100%"
                height={300}
            >

                <BarChart data={data}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="channel" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                        dataKey="amount"
                        fill="#2e7d32"
                    />

                </BarChart>

            </ResponsiveContainer>

        </Paper>

    );

}