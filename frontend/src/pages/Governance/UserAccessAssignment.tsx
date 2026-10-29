import { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper,
  TextField, Select, MenuItem, Button, Chip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, InputLabel, FormControl,
} from "@mui/material";
import { getUsers, assignUserRole, getRoles } from "../../api/governanceApi";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login: string | null;
  last_reviewed_at: string | null;
}

export default function UserAccessAssignment() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<{ role_name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getUsers({ search, limit: 100 }), getRoles()])
      .then(([u, r]) => {
        setUsers(u.items);
        setRoles(r.filter((role: any) => role.is_active));
      })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load users."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    
  }, [search]);

  const openAssign = (user: UserRow) => {
    setEditUser(user);
    setNewRole(user.role);
    setReason("");
  };

  const handleAssign = async () => {
    if (!editUser || !newRole || !reason.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await assignUserRole(editUser.id, { role: newRole, reason: reason.trim() });
      setEditUser(null);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to assign role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>User Access Assignment</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Directly assign roles to users. Every change is logged with who made it, when, and why.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: 320 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Reviewed</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Chip size="small" label={u.role} color={u.role === "Admin" ? "primary" : "default"} /></TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>{u.last_reviewed_at ? new Date(u.last_reviewed_at).toLocaleDateString() : "Never"}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openAssign(u)}>Change Role</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={!!editUser} onClose={() => setEditUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Change Role — {editUser?.name}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>New Role</InputLabel>
            <Select value={newRole} label="New Role" onChange={(e) => setNewRole(e.target.value)}>
              {roles.map((r) => (
                <MenuItem key={r.role_name} value={r.role_name}>{r.role_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={saving || !reason.trim() || newRole === editUser?.role}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
