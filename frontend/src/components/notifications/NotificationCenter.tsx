import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, IconButton, Popover } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from "../../api/notificationApi";
import type { NotificationRecord } from "../../api/notificationApi";

const PRIORITY_COLORS: Record<string, string> = {
    Low: "#6b7280",
    Medium: "#eab308",
    High: "#f97316",
    Critical: "#dc2626",
};

const TYPE_LABELS: Record<string, string> = {
    StockoutRisk: "Inventory Alert",
    LowStock: "Inventory Alert",
    Overstock: "Inventory Alert",
    ImportCompleted: "Import Alert",
    ImportFailed: "Import Alert",
    SalesAlert: "Sales Alert",
    SystemAlert: "System Alert",
};

const TYPE_OPTIONS = [
    "StockoutRisk",
    "LowStock",
    "Overstock",
    "ImportCompleted",
    "ImportFailed",
    "SalesAlert",
    "SystemAlert",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

const RESOURCE_NAV: Record<string, string> = {
    Product: "/inventory/forecast",
    Import: "/data-import",
};

const timeAgo = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
};

const NotificationCenter = () => {
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [filterTab, setFilterTab] = useState<"all" | "unread" | "read">("all");
    const [typeFilter, setTypeFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");

    const [selectedNotification, setSelectedNotification] = useState<NotificationRecord | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadUnreadCount = async () => {
        try {
            const response = await getUnreadCount();
            setUnreadCount(response.data.unread_count);
        } catch (err) {
            console.error("Failed to load unread count:", err);
        }
    };

    
    useEffect(() => {
        loadUnreadCount();
        pollRef.current = setInterval(loadUnreadCount, 30000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getNotifications({
                page: 1,
                limit: 20,
                read_status: filterTab === "all" ? undefined : filterTab,
                type: typeFilter || undefined,
                priority: priorityFilter || undefined,
            });
            setNotifications(response.data.records);
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (anchorEl) {
            loadNotifications();
        }
    }, [anchorEl, filterTab, typeFilter, priorityFilter]);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setSelectedNotification(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setSelectedNotification(null);
    };

    const handleNotificationClick = async (notification: NotificationRecord) => {
        if (!notification.is_read) {
            try {
                await markAsRead(notification.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (err) {
                console.error("Failed to mark as read:", err);
            }
        }

       
        setSelectedNotification(notification);
    };

    const handleViewResource = () => {
        if (!selectedNotification) return;
        const path = RESOURCE_NAV[selectedNotification.resource_type || ""];
        if (path) {
            navigate(path);
            handleClose();
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: "4px 12px",
        borderRadius: "14px",
        border: "1px solid #ccc",
        background: active ? "#2563eb" : "#fff",
        color: active ? "#fff" : "#374151",
        cursor: "pointer",
        fontSize: "12px",
    });

    const selectStyle: React.CSSProperties = {
        padding: "4px 8px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        fontSize: "12px",
    };

    return (
        <>
            <IconButton onClick={handleOpen}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <div style={{ width: "400px", maxHeight: "560px", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>Notifications</strong>
                        <button
                            onClick={handleMarkAllAsRead}
                            style={{ border: "none", background: "none", color: "#2563eb", cursor: "pointer", fontSize: "12px" }}
                        >
                            Mark all as read
                        </button>
                    </div>

                    <div style={{ padding: "10px 16px", display: "flex", gap: "8px", borderBottom: "1px solid #eee" }}>
                        <button onClick={() => setFilterTab("all")} style={tabStyle(filterTab === "all")}>All</button>
                        <button onClick={() => setFilterTab("unread")} style={tabStyle(filterTab === "unread")}>Unread</button>
                        <button onClick={() => setFilterTab("read")} style={tabStyle(filterTab === "read")}>Read</button>
                    </div>

                    <div style={{ padding: "10px 16px", display: "flex", gap: "8px", borderBottom: "1px solid #eee" }}>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
                            <option value="">All Types</option>
                            {TYPE_OPTIONS.map((t) => (
                                <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                            ))}
                        </select>

                        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selectStyle}>
                            <option value="">All Priorities</option>
                            {PRIORITY_OPTIONS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    {selectedNotification ? (
                        <div style={{ padding: "16px" }}>
                            <button
                                onClick={() => setSelectedNotification(null)}
                                style={{ border: "none", background: "none", color: "#2563eb", cursor: "pointer", fontSize: "12px", marginBottom: "10px", padding: 0 }}
                            >
                                ← Back to list
                            </button>

                            <div style={{ marginBottom: "10px" }}>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        color: "#fff",
                                        background: PRIORITY_COLORS[selectedNotification.priority] || "#6b7280",
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                    }}
                                >
                                    {selectedNotification.priority}
                                </span>
                            </div>

                            <h4 style={{ margin: "0 0 8px" }}>{selectedNotification.title}</h4>
                            <p style={{ fontSize: "14px", color: "#374151", marginBottom: "16px" }}>
                                {selectedNotification.message}
                            </p>

                            <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "16px" }}>
                                <div><strong>Type:</strong> {TYPE_LABELS[selectedNotification.type] || selectedNotification.type}</div>
                                {selectedNotification.resource_type && (
                                    <div><strong>Related:</strong> {selectedNotification.resource_type} #{selectedNotification.resource_id}</div>
                                )}
                                <div><strong>Time:</strong> {timeAgo(selectedNotification.created_at)}</div>
                            </div>

                            {RESOURCE_NAV[selectedNotification.resource_type || ""] && (
                                <button
                                    onClick={handleViewResource}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "5px",
                                        border: "1px solid #2563eb",
                                        background: "#2563eb",
                                        color: "#fff",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                    }}
                                >
                                    {selectedNotification.resource_type === "Product" ? "View Product" : "View Import"}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {error && <p style={{ color: "red", padding: "16px" }}>{error}</p>}

                            {loading ? (
                                <p style={{ padding: "16px", fontSize: "13px" }}>Loading...</p>
                            ) : notifications.length === 0 ? (
                                <div style={{ padding: "32px 16px", textAlign: "center", color: "#6b7280" }}>
                                    <p style={{ margin: 0, fontSize: "14px" }}>You're all caught up.</p>
                                    <p style={{ margin: 0, fontSize: "13px" }}>No new notifications.</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        style={{
                                            padding: "12px 16px",
                                            borderBottom: "1px solid #f3f4f6",
                                            cursor: "pointer",
                                            background: n.is_read ? "#fff" : "#eff6ff",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "12px", color: "#6b7280" }}>
                                                {TYPE_LABELS[n.type] || n.type}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#fff",
                                                    background: PRIORITY_COLORS[n.priority] || "#6b7280",
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                }}
                                            >
                                                {n.priority}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: n.is_read ? "normal" : "bold", fontSize: "14px", marginBottom: "2px" }}>
                                            {n.title}
                                        </div>
                                        <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "4px" }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                            {timeAgo(n.created_at)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </Popover>
        </>
    );
};

export default NotificationCenter;
