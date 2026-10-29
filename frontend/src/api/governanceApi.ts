import axios from "./axios";

export const getDashboard = () => axios.get("/governance/dashboard").then((r) => r.data);

export const getRoles = () => axios.get("/governance/roles").then((r) => r.data);
export const createRole = (data: { role_name: string; description?: string }) =>
  axios.post("/governance/roles", data).then((r) => r.data);
export const updateRole = (roleId: number, data: { description?: string; is_active?: boolean }) =>
  axios.put(`/governance/roles/${roleId}`, data).then((r) => r.data);
export const deleteRole = (roleId: number) => axios.delete(`/governance/roles/${roleId}`).then((r) => r.data);

export const getPermissionMatrix = () => axios.get("/governance/permission-matrix").then((r) => r.data);
export const updatePermissionCell = ( roleName: string, module: string, data: Record<string, boolean> ) => axios.put(`/governance/permission-matrix/${encodeURIComponent(roleName)}/${encodeURIComponent(module)}`, data).then((r) => r.data);

export const getUsers = (params: { page?: number; limit?: number; search?: string; role?: string }) =>
  axios.get("/governance/users", { params }).then((r) => r.data);
export const assignUserRole = (userId: number, data: { role: string; reason: string }) =>
  axios.put(`/governance/users/${userId}/role`, data).then((r) => r.data);

export const getRoleHistory = (params: { user_id?: number; page?: number; limit?: number }) =>
  axios.get("/governance/role-history", { params }).then((r) => r.data);

export const submitAccessRequest = (data: { requested_role: string; reason: string; priority?: string }) =>
  axios.post("/governance/access-requests", data).then((r) => r.data);

export const getAccessReviews = (params: { page?: number; limit?: number }) =>
  axios.get("/governance/access-reviews", { params }).then((r) => r.data);
export const submitAccessReview = (data: { user_id: number; decision: string; new_role?: string; notes?: string }) =>
  axios.post("/governance/access-reviews", data).then((r) => r.data);

export const getSensitiveFields = () => axios.get("/governance/sensitive-fields").then((r) => r.data);
export const setSensitiveField = (data: { module: string; field_name: string; protection_level: string; allowed_roles: string }) =>
  axios.put("/governance/sensitive-fields", data).then((r) => r.data);

export const getChangeLog = (params: { page?: number; limit?: number; change_type?: string }) =>
  axios.get("/governance/change-log", { params }).then((r) => r.data);


export const getMyRequests = (params: any) => axios.get("/workflow/requests/my", { params }).then((r) => r.data);
export const getApprovalQueue = (params: any) => axios.get("/workflow/requests/queue", { params }).then((r) => r.data);
export const approveWorkflowRequest = (id: number, comment?: string) =>
  axios.post(`/workflow/requests/${id}/approve`, { comment }).then((r) => r.data);
export const rejectWorkflowRequest = (id: number, rejection_reason: string) =>
  axios.post(`/workflow/requests/${id}/reject`, { rejection_reason }).then((r) => r.data);
export const cancelWorkflowRequest = (id: number) => axios.post(`/workflow/requests/${id}/cancel`).then((r) => r.data);