import { Typography, Box } from "@mui/material";

export default function Dashboard() {
  return (
    <Box p={4}>
      <Typography variant="h3">
        Dashboard
      </Typography>

      <Typography mt={2}>
        Welcome to RetailPulse Analytics
      </Typography>
    </Box>
  );
}