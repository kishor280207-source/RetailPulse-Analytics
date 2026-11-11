
import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import {
  getIntegrations,
  getIntegrationDashboard,
  deleteIntegration,
  testIntegration,
} from "../../services/integrationService";

export default function Integrations() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [items, dashboard] = await Promise.all([
        getIntegrations(),
        getIntegrationDashboard(),
      ]);

      setIntegrations(items);
      setSummary(dashboard);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to load integrations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this integration?")) return;

    try {
      await deleteIntegration(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Delete failed");
    }
  };

  const handleTest = async (id: number) => {
    try {
      const result = await testIntegration(id);
      alert(result.message);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Connection test failed");
    }
  };

  const stats = [
    ["Total Integrations", summary?.total_integrations ?? 0],
    ["Active", summary?.active_integrations ?? 0],
    ["Inactive", summary?.inactive_integrations ?? 0],
    ["Failed Jobs", summary?.failed_integrations ?? 0],
    ["Pending Jobs", summary?.pending_jobs ?? 0],
    ["Successful Records", summary?.successful_records ?? 0],
    ["Failed Records", summary?.failed_records ?? 0],
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Data Integrations
          </Typography>
          <Typography color="text.secondary">
            Manage external data sources and synchronization
          </Typography>
        </Box>

        <Button variant="contained" href="/integrations/configure">
          Add Integration
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        {stats.map(([label, value]) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={1}>
            Last Synchronization
          </Typography>

          <Typography>
            {summary?.last_sync_at
              ? new Date(summary.last_sync_at).toLocaleString()
              : "No synchronization completed"}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Configured Integrations
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Sync</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {integrations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.source_type}</TableCell>
                  <TableCell>{item.target_module}</TableCell>

                  <TableCell>
                    <Chip
                      label={item.status}
                      color={
                        item.status === "active"
                          ? "success"
                          : "default"
                      }
                    />
                  </TableCell>

                  <TableCell>
                    {item.last_sync_at
                      ? new Date(item.last_sync_at).toLocaleString()
                      : "Never"}
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => handleTest(item.id)}
                      >
                        Test
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {integrations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No integrations configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Box mt={2}>
        <Button onClick={loadData}>Refresh Dashboard</Button>
      </Box>
    </Box>
  );
}
