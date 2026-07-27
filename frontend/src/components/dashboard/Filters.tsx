import {
    Paper,
    Grid,
    TextField,
    MenuItem,
    Button
} from "@mui/material";

export default function Filters() {

    return (

        <Paper sx={{ p: 3, mb: 4 }}>

            <Grid container spacing={2}>

                <Grid item xs={12} md={2}>
                    <TextField
                        fullWidth
                        type="date"
                        label="From"
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={2}>
                    <TextField
                        fullWidth
                        type="date"
                        label="To"
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={2}>
                    <TextField
                        select
                        fullWidth
                        label="Category"
                    >
                        <MenuItem value="">
                            All
                        </MenuItem>
                        <MenuItem value="Electronics">
                            Electronics
                        </MenuItem>
                        <MenuItem value="Grocery">
                            Grocery
                        </MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12} md={2}>
                    <TextField
                        select
                        fullWidth
                        label="Payment"
                    >
                        <MenuItem value="">
                            All
                        </MenuItem>
                        <MenuItem value="Cash">
                            Cash
                        </MenuItem>
                        <MenuItem value="Card">
                            Card
                        </MenuItem>
                        <MenuItem value="UPI">
                            UPI
                        </MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12} md={2}>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{ height: 56 }}
                    >
                        Apply
                    </Button>
                </Grid>

                <Grid item xs={12} md={2}>
                    <Button
                        fullWidth
                        color="secondary"
                        variant="outlined"
                        sx={{ height: 56 }}
                    >
                        Refresh
                    </Button>
                </Grid>

            </Grid>

        </Paper>

    );

}