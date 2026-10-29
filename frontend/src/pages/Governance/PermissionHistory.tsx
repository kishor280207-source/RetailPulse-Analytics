import { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper,
  Chip, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress,
} from "@mui/material";
import { getChangeLog } from "../../api/governanceApi";

const TYPE_COLOR: Record<string, "default" | "primary" | "success" | "warning" | "error"> = {
  RoleAssignment: "primary", PermissionMatrixUpdate: "warning",
  RoleCreated: "success", RoleUpdated: "default", AccessReview: "error",
};

export default function PermissionHistory() {
  const [items, setItems] = useState<any[]>([]);
  const [changeType, setChangeType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getChangeLog({ limit: 100, change_type: changeType || undefined })
      .then((d) => setItems(d.items))
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load change history."))
      .finally(() => setLoading(false));
  }, [changeType]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Permission Change History</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Every role assignment and permission matrix change, with who made it and why. These same events also appear
        in Audit Logs.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <FormControl size="small" sx={{ minWidth: 220, mb: 2 }}>
        <InputLabel>Change Type</InputLabel>
        <Select value={changeType} label="Change Type" onChange={(e) => setChangeType(e.target.value)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="RoleAssignment">Role Assignment</MenuItem>
          <MenuItem value="PermissionMatrixUpdate">Permission Matrix Update</MenuItem>
          <MenuItem value="RoleCreated">Role Created</MenuItem>
          <MenuItem value="AccessReview">Access Review</MenuItem>
        </Select>
      </FormControl>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Before</TableCell>
                <TableCell>After</TableCell>
                <TableCell>Changed By</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell><Chip size="small" label={i.change_type} color={TYPE_COLOR[i.change_type] || "default"} /></TableCell>
                  <TableCell>{i.target_label}</TableCell>
                  <TableCell>{i.old_value || "—"}</TableCell>
                  <TableCell>{i.new_value || "—"}</TableCell>
                  <TableCell>{i.changed_by_name}</TableCell>
                  <TableCell>{i.reason || "—"}</TableCell>
                  <TableCell>{new Date(i.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">No changes recorded yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
