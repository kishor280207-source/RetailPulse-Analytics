import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

export default function ForecastFilters() {
  return (
    <Grid container spacing={2} mb={3}>
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          label="Search Product"
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select label="Category" defaultValue="">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Electronics">Electronics</MenuItem>
            <MenuItem value="Accessories">Accessories</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl fullWidth>
          <InputLabel>Period</InputLabel>
          <Select label="Period" defaultValue="">
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="7">Next 7 Days</MenuItem>
            <MenuItem value="30">Next 30 Days</MenuItem>
            <MenuItem value="90">Next 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <Button
          variant="contained"
          fullWidth
          sx={{ height: "56px" }}
        >
          Generate Forecast
        </Button>
      </Grid>
    </Grid>
  );
}