import { Outlet } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box
} from "@mui/material";
import { Link } from "react-router-dom";

const drawerWidth = 240;

export default function MainLayout() {
  return (
    <Box sx={{ display: "flex" }}>

      <AppBar
        position="fixed"
        sx={{ zIndex: 1201 }}
      >
        <Toolbar>
          <Typography variant="h6">
            RetailPulse Analytics
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            mt: 8
          }
        }}
      >
        <List>

          <ListItemButton component={Link} to="/dashboard">
            <ListItemText primary="Dashboard" />
          </ListItemButton>

          <ListItemButton component={Link} to="/inventory">
            <ListItemText primary="Inventory" />
          </ListItemButton>

          <ListItemButton component={Link} to="/sales">
            <ListItemText primary="Sales" />
          </ListItemButton>

          <ListItemButton component={Link} to="/products">
            <ListItemText primary="Products" />
          </ListItemButton>

          <ListItemButton component={Link} to="/categories">
            <ListItemText primary="Categories" />
          </ListItemButton>

          <ListItemButton component={Link} to="/profile">
            <ListItemText primary="Profile" />
          </ListItemButton>

        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: "240px"
        }}
      >
        <Outlet />
      </Box>

    </Box>
  );
}