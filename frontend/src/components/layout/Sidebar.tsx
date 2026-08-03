import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CategoryIcon from "@mui/icons-material/Category";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";

import { Link, useLocation } from "react-router-dom";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
const drawerWidth = 240;

const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
  },
  {
    text: "Inventory",
    icon: <InventoryIcon />,
    path: "/inventory",
  },
  {
    text: "Sales",
    icon: <ShoppingCartIcon />,
    path: "/sales",
  },
  {
    text: "Products",
    icon: <StoreIcon />,
    path: "/products",
  },
  {
    text: "Categories",
    icon: <CategoryIcon />,
    path: "/categories",
  },
  {
    text: "Customers",
    icon: <PeopleIcon />,
    path: "/customers",
  },
  {
    text: "Profile",
    icon: <PersonIcon />,
    path: "/profile",
  },
  {
    text: "Forecast",
    icon: <AutoGraphIcon />,
    path: "/forecast",
},
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#1E293B",
          color: "#fff",
        },
      }}
    >
      <Toolbar />

      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              "&.Mui-selected": {
                backgroundColor: "#1976d2",
              },
              "&:hover": {
                backgroundColor: "#334155",
              },
            }}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              {item.icon}
            </ListItemIcon>

            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}