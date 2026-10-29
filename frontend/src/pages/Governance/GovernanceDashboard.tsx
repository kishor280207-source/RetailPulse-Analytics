import { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, Alert,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import HistoryIcon from "@mui/icons-material/History";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import { getDashboard } from "../../api/governanceApi";

interface DashboardData {
  total_roles: number;
  total_users: number;
  pending_access_requests: number;
  permission_changes_last_30_days: number;
  users_needing_review: number;
  sensitive_fields_configured: number;
  role_breakdown: { role: string; count: number }[];
}

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, borderRadius: 2, p: 1.2, display: "flex" }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

export default function GovernanceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  if (!data) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Data Governance Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Roles, permissions and access across your company at a glance.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<AdminPanelSettingsIcon />} label="Total Roles" value={data.total_roles} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<GroupIcon />} label="Total Users" value={data.total_users} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<PendingActionsIcon />} label="Pending Access Requests" value={data.pending_access_requests} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<HistoryIcon />} label="Permission Changes (30d)" value={data.permission_changes_last_30_days} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<FactCheckIcon />} label="Users Needing Review" value={data.users_needing_review} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<LockPersonIcon />} label="Sensitive Fields Configured" value={data.sensitive_fields_configured} color="success" />
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Role Breakdown</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {data.role_breakdown.map((r) => (
              <Chip key={r.role} label={`${r.role}: ${r.count}`} variant="outlined" />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
