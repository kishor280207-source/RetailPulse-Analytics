import api from "./axios";

export interface NotificationRecord {
    id: number;
    type: string;
    priority: string;
    title: string;
    message: string;
    resource_type: string | null;
    resource_id: string | null;
    is_read: boolean;
    created_at: string;
}

export interface NotificationListResponse {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    records: NotificationRecord[];
}

export interface NotificationFilters {
    page?: number;
    limit?: number;
    read_status?: "read" | "unread";
    type?: string;
    priority?: string;
}

export const getNotifications = (params?: NotificationFilters) =>
    api.get<NotificationListResponse>("/notifications/", { params });

export const getUnreadCount = () =>
    api.get<{ unread_count: number }>("/notifications/unread-count");

export const markAsRead = (id: number) =>
    api.patch(`/notifications/${id}/read`);

export const markAllAsRead = () =>
    api.patch("/notifications/read-all");