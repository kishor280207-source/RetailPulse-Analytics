import { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper,
  Checkbox, Chip, Alert, CircularProgress, Tabs, Tab,
} from "@mui/material";
import { getPermissionMatrix, updatePermissionCell } from "../../api/governanceApi";

interface ModuleRow {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_approve: boolean;
  can_manage_access: boolean;
  locked: boolean;
}

interface RoleMatrix {
  role_name: string;
  is_system_role: boolean;
  modules: ModuleRow[];
}

interface MatrixData {
  modules: string[];
  actions: string[];
  roles: RoleMatrix[];
}

const ACTION_LABELS: Record<string, string> = {
  view: "View", create: "Create", edit: "Edit", delete: "Delete",
  export: "Export", approve: "Approve", manage_access: "Manage Access",
};

export default function PermissionMatrix() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getPermissionMatrix()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load permission matrix."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggle = async (roleName: string, module: ModuleRow, action: string) => {
    const key = `${roleName}:${module.module}:${action}`;
    setSavingCell(key);
    setError(null);
    const newValue = !(module as any)[`can_${action}`];
    try {
      await updatePermissionCell(roleName, module.module, { [`can_${action}`]: newValue });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to update permission.");
    } finally {
      setSavingCell(null);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>;
  if (error && !data) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  if (!data) return null;

  const currentRole = data.roles[tab];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Permission Matrix</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        What each role can do, per module. Changes apply the moment you click a checkbox — the backend enforces this
        on every request, not just in this screen.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {data.roles.map((r) => (
          <Tab
            key={r.role_name}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {r.role_name}
                {r.is_system_role && <Chip size="small" label="Full access" color="primary" variant="outlined" />}
              </Box>
            }
          />
        ))}
      </Tabs>

      {currentRole && (
        <Paper>
          {currentRole.is_system_role && (
            <Alert severity="info" sx={{ m: 2 }}>
              "{currentRole.role_name}" always has full access to every module and cannot be restricted here, to
              prevent accidentally locking every admin out of the system.
            </Alert>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Module</TableCell>
                {data.actions.map((a) => (
                  <TableCell key={a} align="center">{ACTION_LABELS[a] || a}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentRole.modules.map((m) => (
                <TableRow key={m.module}>
                  <TableCell>{m.module}</TableCell>
                  {data.actions.map((a) => {
                    const key = `${currentRole.role_name}:${m.module}:${a}`;
                    return (
                      <TableCell key={a} align="center">
                        <Checkbox
                          checked={(m as any)[`can_${a}`]}
                          disabled={m.locked || savingCell === key}
                          onChange={() => handleToggle(currentRole.role_name, m, a)}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
