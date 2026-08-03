import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function MainLayout() {

  return (

    <Box sx={{ display: "flex" }}>

      <Navbar />

      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f5f7fa",
          minHeight: "100vh",
          p: 5,
        }}
      >

        <Toolbar />

        <Outlet />

      </Box>

    </Box>

  );

}