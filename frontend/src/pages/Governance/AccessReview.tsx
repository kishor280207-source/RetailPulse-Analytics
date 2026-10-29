import { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper,
  Button, Chip, Select, MenuItem, FormControl, InputLabel, TextField,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { getUsers, getRoles, submitAccessReview, getAccessReviews } from "../../api/governanceApi";

const STALE_DAYS = 90;

export default function AccessReview() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<{ role_name: string }[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<any | null>(null);
  const [decision, setDecision] = useState("Confirmed");
  const [newRole, setNewRole] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getUsers({ limit: 200 }), getRoles(), getAccessReviews({ limit: 25 })])
      .then(([u, r, h]) => {
        setUsers(u.items);
        setRoles(r.filter((role: any) => role.is_active));
        setHistory(h.items);
      })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load access review data."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const isStale = (lastReviewedAt: string | null) => {
    if (!lastReviewedAt) return true;
    const days = (Date.now() - new Date(lastReviewedAt).getTime()) / 86400000;
    return days > STALE_DAYS;
  };

  const openReview = (user: any) => {
    setTarget(user);
    setDecision("Confirmed");
    setNewRole(user.role);
    setNotes("");
  };

  const handleSave = async () => {
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      await submitAccessReview({
        user_id: target.id, decision,
        new_role: decision === "Changed" ? newRole : undefined,
        notes: notes.trim() || undefined,
      });
      setTarget(null);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to save review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Periodic Access Review</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Confirm that each user's current role is still appropriate, or revoke/change it. Users not reviewed in the
        last {STALE_DAYS} days are flagged below.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <Paper sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Last Reviewed</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name} <Typography component="span" variant="caption" color="text.secondary">({u.email})</Typography></TableCell>
                    <TableCell><Chip size="small" label={u.role} /></TableCell>
                    <TableCell>
                      {u.last_reviewed_at ? new Date(u.last_reviewed_at).toLocaleDateString() : "Never"}
                      {isStale(u.last_reviewed_at) && <Chip size="small" color="warning" label="Due" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openReview(u)}>Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Recent Review History</Typography>
          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Decision</TableCell>
                  <TableCell>Role at Review</TableCell>
                  <TableCell>Reviewed By</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{h.user_name}</TableCell>
                    <TableCell>{h.decision}{h.new_role ? ` → ${h.new_role}` : ""}</TableCell>
                    <TableCell>{h.role_at_review}</TableCell>
                    <TableCell>{h.reviewed_by_name}</TableCell>
                    <TableCell>{new Date(h.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No reviews recorded yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      <Dialog open={!!target} onClose={() => setTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Review Access — {target?.name}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Decision</InputLabel>
            <Select value={decision} label="Decision" onChange={(e) => setDecision(e.target.value)}>
              <MenuItem value="Confirmed">Confirm current access</MenuItem>
              <MenuItem value="Changed">Change role</MenuItem>
              <MenuItem value="Revoked">Revoke access</MenuItem>
            </Select>
          </FormControl>
          {decision === "Changed" && (
            <FormControl fullWidth>
              <InputLabel>New Role</InputLabel>
              <Select value={newRole} label="New Role" onChange={(e) => setNewRole(e.target.value)}>
                {roles.map((r) => (
                  <MenuItem key={r.role_name} value={r.role_name}>{r.role_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Review"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
