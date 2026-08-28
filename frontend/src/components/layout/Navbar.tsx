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
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
   const [search, setSearch] = useState("");

  const handleSearch = () => {
    const value = search.trim().toLowerCase();

    const pages: Record<string, string> = {
      dashboard: "/dashboard",
      inventory: "/inventory",
      sales: "/sales",
      products: "/products",
      categories: "/categories",
      customers: "/customers",
      profile: "/profile",
      forecast: "/forecast",
    };

    if (pages[value]) {
      navigate(pages[value]);
      setSearch("");
    } else {
      alert("Page not found");
    }
  };
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === "Enter") {
                  handleSearch();
              }
  }}
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

        </IconButton >

        <IconButton  onClick={() => navigate("/profile")}
          sx={{ ml: 1 }}>
          <Avatar sx={{ ml: 2, bgcolor: "#1976d2" }}>
          A
        </Avatar>
        </IconButton>

      </Toolbar>
    </AppBar>
  );
}