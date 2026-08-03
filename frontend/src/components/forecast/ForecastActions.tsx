import { Stack, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

export default function ForecastActions() {
  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="flex-end"
      sx={{ mb: 3 }}
    >
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
      >
        Export CSV
      </Button>

      <Button
        variant="contained"
        startIcon={<PictureAsPdfIcon />}
      >
        Export PDF
      </Button>
    </Stack>
  );
}