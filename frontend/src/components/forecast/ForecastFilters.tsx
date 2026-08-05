import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

type Props = {
  period: number;
  setPeriod: React.Dispatch<React.SetStateAction<number>>;
  onGenerate: () => void;
};

export default function ForecastFilters({
  period,
  setPeriod,
  onGenerate,
}: Props) {
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

          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            <MenuItem value={7}>Next 7 Days</MenuItem>
            <MenuItem value={30}>Next 30 Days</MenuItem>
            <MenuItem value={90}>Next 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <Button
          variant="contained"
          fullWidth
          sx={{ height: "56px" }}
          onClick={onGenerate}
        >
          Generate Forecast
        </Button>
      </Grid>
    </Grid>
  );
}