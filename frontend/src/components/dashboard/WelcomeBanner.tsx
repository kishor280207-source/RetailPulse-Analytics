import { Card, CardContent, Typography, Box, Button } from "@mui/material";

export default function WelcomeBanner() {
  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: 4,
        background: "linear-gradient(90deg,#1976d2,#42a5f5)",
        color: "#fff",
      }}
    >
      <CardContent>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >

          <Box>

            <Typography
              variant="h4"
              fontWeight="bold"
            >
              Welcome Back 👋
            </Typography>

            <Typography mt={1}>
              Here's what's happening in your business today.
            </Typography>

          </Box>

          <Button
            variant="contained"
            sx={{
              bgcolor: "#fff",
              color: "#1976d2",
              fontWeight: "bold",
            }}
          >
            View Report
          </Button>

        </Box>

      </CardContent>
    </Card>
  );
}