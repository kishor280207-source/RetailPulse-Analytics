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
    "#2e7d32",
    "#ed6c02",
    "#d32f2f"
];

export default function StockStatusChart({
    data
}: Props) {

    return (

        <Paper sx={{ p: 3, mt: 4 }}>

            <Typography variant="h6" mb={2}>
                Stock Status Summary
            </Typography>

            <ResponsiveContainer width="100%" height={300}>

                <PieChart>

                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="status"
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