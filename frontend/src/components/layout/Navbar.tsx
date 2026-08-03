import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Avatar,
  TextField,
  InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function Navbar() {
  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        background: "#ffffff",
        color: "#374151",
        zIndex: 1300,
      }}
    >
      <Toolbar>

        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "#1976d2",
            width: 260,
          }}
        >
          RetailPulse Analytics
        </Typography>

        <TextField
          size="small"
          placeholder="Search..."
          sx={{
            width: 320,
            bgcolor: "#f5f7fa",
            borderRadius: 2,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ flexGrow: 1 }} />

        <IconButton>

          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>

        </IconButton>

        <Avatar sx={{ ml: 2, bgcolor: "#1976d2" }}>
          A
        </Avatar>

      </Toolbar>
    </AppBar>
  );
}