import { useEffect, useState } from "react";
import {
  Box, Typography, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Button, Chip, TextField, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  submitAccessRequest, getMyRequests, getApprovalQueue,
  approveWorkflowRequest, rejectWorkflowRequest, cancelWorkflowRequest, getRoles,
} from "../../api/governanceApi";

const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "error"> = {
  "Pending Approval": "warning", Approved: "success", Rejected: "error", Cancelled: "default",
};

export default function AccessRequests() {
  const [tab, setTab] = useState(0);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [roles, setRoles] = useState<{ role_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [requestedRole, setRequestedRole] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      getMyRequests({ request_type: "AccessRequest", limit: 50 }),
      getApprovalQueue({ request_type: "AccessRequest", limit: 50 }).catch(() => ({ items: [] })),
      getRoles(),
    ])
      .then(([mine, q, r]) => {
        setMyRequests(mine.items || mine);
        setQueue(q.items || q);
        setRoles(r.filter((role: any) => role.is_active));
      })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load access requests."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async () => {
    if (!requestedRole || !reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitAccessRequest({ requested_role: requestedRole, reason: reason.trim() });
      setRequestedRole("");
      setReason("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    setError(null);
    try {
      await approveWorkflowRequest(id);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to approve request.");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setError(null);
    try {
      await rejectWorkflowRequest(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to reject request.");
    }
  };

  const handleCancel = async (id: number) => {
    setError(null);
    try {
      await cancelWorkflowRequest(id);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to cancel request.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Access Requests</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Request a different role for yourself, or review requests waiting on your approval. Submitting a request
        never grants access by itself — an Admin has to approve it first, and you cannot approve your own request.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Request a Role</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Requested Role</InputLabel>
            <Select value={requestedRole} label="Requested Role" onChange={(e) => setRequestedRole(e.target.value)}>
              {roles.map((r) => (
                <MenuItem key={r.role_name} value={r.role_name}>{r.role_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 260 }}
          />
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || !requestedRole || !reason.trim()}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </Box>
      </Paper>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="My Requests" />
        <Tab label="Approval Queue" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      ) : tab === 0 ? (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requested Role</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myRequests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.requested_values?.requested_role || "—"}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell><Chip size="small" label={r.status} color={STATUS_COLOR[r.status] || "default"} /></TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {r.status === "Pending Approval" && (
                      <Button size="small" color="error" onClick={() => handleCancel(r.id)}>Cancel</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {myRequests.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No requests yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requested By</TableCell>
                <TableCell>Requested Role</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queue.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.requested_by_name}</TableCell>
                  <TableCell>{r.requested_values?.requested_role || "—"}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell><Chip size="small" label={r.status} color={STATUS_COLOR[r.status] || "default"} /></TableCell>
                  <TableCell align="right">
                    {r.status === "Pending Approval" && (
                      <>
                        <Button size="small" color="success" onClick={() => handleApprove(r.id)}>Approve</Button>
                        <Button size="small" color="error" onClick={() => setRejectTarget(r)}>Reject</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {queue.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">Nothing pending.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reject Access Request</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <TextField
            label="Rejection Reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectReason.trim()}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
