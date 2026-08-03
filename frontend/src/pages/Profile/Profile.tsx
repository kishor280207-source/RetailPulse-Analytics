import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  Chip,
  Button
} from "@mui/material";

export default function Profile() {
  return (
    <Box p={4}>

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        My Profile
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 3 }}>

        <Grid container spacing={3}>

          <Grid
            size={{ xs: 12 }}
            display="flex"
            justifyContent="center"
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                fontSize: 40
              }}
            >
              A
            </Avatar>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Full Name</b></Typography>
            <Typography>Admin User</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Email</b></Typography>
            <Typography>admin@retailpulse.com</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Phone</b></Typography>
            <Typography>9876543210</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Role</b></Typography>
            <Chip
              label="Company Admin"
              color="primary"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Company</b></Typography>
            <Typography>RetailPulse Analytics</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Status</b></Typography>
            <Chip
              label="Active"
              color="success"
            />
          </Grid>

        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" mb={2}>
          Account Information
        </Typography>

        <Grid container spacing={3}>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Username</b></Typography>
            <Typography>admin</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Joined Date</b></Typography>
            <Typography>01-Jan-2026</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography><b>Last Login</b></Typography>
            <Typography>Today</Typography>
          </Grid>

        </Grid>

        <Box mt={4}>
          <Button variant="contained">
            Edit Profile
          </Button>
        </Box>

      </Paper>

    </Box>
  );
}