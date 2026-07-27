import { Grid, Paper, Typography } from "@mui/material";

export default function DashboardCharts() {
    return (
        <Grid container spacing={3} sx={{ mt: 2 }}>

            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3, height: 300 }}>
                    <Typography variant="h6">
                        Sales Analytics
                    </Typography>

                    <Typography sx={{ mt: 5 }}>
                        Sales Chart will be displayed here
                    </Typography>
                </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3, height: 300 }}>
                    <Typography variant="h6">
                        Inventory Analytics
                    </Typography>

                    <Typography sx={{ mt: 5 }}>
                        Inventory Chart will be displayed here
                    </Typography>
                </Paper>
            </Grid>

        </Grid>
    );
}