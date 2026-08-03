import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import {
    Paper,
    Typography
} from "@mui/material";

interface Props {
    data: any[];
}

const COLORS = [
    "#1976d2",
    "#2e7d32",
    "#ed6c02",
    "#9c27b0",
    "#d32f2f"
];

export default function PaymentMethodChart({ data }: Props) {

    return (

        <Paper sx={{ p: 3, mt: 4 }}>

            <Typography variant="h6" mb={2}>
                Sales by Payment Method
            </Typography>

            <ResponsiveContainer width="100%" height={300}>

                <PieChart>

                    <Pie
                        data={data}
                        dataKey="amount"
                        nameKey="method"
                        outerRadius={110}
                        label
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={index}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>

                    <Tooltip />

                </PieChart>

            </ResponsiveContainer>

        </Paper>

    );

}