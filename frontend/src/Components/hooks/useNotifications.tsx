import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export interface Notification {
  notification_id: number;
  user_id: number;
  booking_id?: number;
  message: string;
  is_read: boolean;
  created_at: string;
  role: string;
  booking_status?: string;
  sender_name?: string;
  context?: string;
  team?: string;
  action_required?: boolean;
}

const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    const authToken = sessionStorage.getItem("auth_token") || "";

    if (!authToken) {
      setError("No authentication token found");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/notifications", {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to fetch notifications");
      }

      const data: Notification[] = await res.json();
      const transformedData = data.map(notif => ({
        ...notif,
        sender_name: notif.role === "user" ? "Tenant" : "Host",
        context: notif.booking_id ? `Booking #${notif.booking_id}` : undefined,
        team: notif.role === "user" ? "Tenant" : "Host Team",
        action_required: notif.role === "owner" && !notif.booking_status
      }));
      
      setNotifications(transformedData);
      setNotificationCount(transformedData.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number): Promise<boolean> => {
    try {
      const authToken = sessionStorage.getItem("auth_token") || "";
      const res = await fetch(
        `http://localhost:8000/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to mark notification as read");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const authToken = sessionStorage.getItem("auth_token") || "";
      const response = await fetch("http://localhost:8000/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({...n, is_read: true})));
        setNotificationCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      const success = await markAsRead(notif.notification_id);
      if (success) {
        setNotifications(prev =>
          prev.map(n =>
            n.notification_id === notif.notification_id ? {...n, is_read: true} : n
          )
        );
        setNotificationCount(prev => prev - 1);
      }
    }

    if (notif.role === "user" && notif.booking_id) {
      if (notif.message.toLowerCase().includes("approve")) {
        navigate(`/payment/${notif.booking_id}`);
      }
    } else if (notif.role === "owner" && notif.booking_id) {
      navigate(`/bookings/${notif.booking_id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    notifications,
    isLoading,
    error,
    notificationCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
    formatDate,
    setNotifications,
    setNotificationCount
  };
};

export default useNotifications;