import { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper,
  Button, Chip, Switch, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import { getRoles, createRole, updateRole, deleteRole } from "../../api/governanceApi";

interface RoleRow {
  id: number;
  role_name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  user_count: number;
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getRoles()
      .then(setRoles)
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load roles."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createRole({ role_name: newRoleName.trim(), description: newRoleDesc.trim() || undefined });
      setOpenCreate(false);
      setNewRoleName("");
      setNewRoleDesc("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create role.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (role: RoleRow) => {
    setError(null);
    try {
      await updateRole(role.id, { is_active: !role.is_active });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to update role.");
    }
  };

  const handleDelete = async (role: RoleRow) => {
    if (!window.confirm(`Delete role "${role.role_name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteRole(role.id);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to delete role.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Role Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage roles. A new role starts with no permissions until you grant them in the Permission Matrix.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
          New Role
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {r.role_name}
                      {r.is_system_role && <Chip size="small" icon={<LockIcon fontSize="small" />} label="System" />}
                    </Box>
                  </TableCell>
                  <TableCell>{r.description || "—"}</TableCell>
                  <TableCell>{r.user_count}</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.is_active}
                      disabled={r.is_system_role}
                      onChange={() => handleToggleActive(r)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={r.is_system_role || r.user_count > 0}
                      onClick={() => handleDelete(r)}
                      title={r.user_count > 0 ? "Reassign all users before deleting" : "Delete role"}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Role Name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} autoFocus fullWidth />
          <TextField label="Description" value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !newRoleName.trim()}>
            {saving ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
