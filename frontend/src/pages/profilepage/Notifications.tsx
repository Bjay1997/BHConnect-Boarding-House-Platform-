import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./notification.css";
import Navbar from "../../Components/Navbar.tsx";

interface Notification {
  notification_id: number;
  user_id: number;
  booking_id?: number;
  message: string;
  is_read: boolean;
  created_at: string;
  role: string;
  booking_status?: string;
  sender_name: string;
  context?: string;
  team?: string;
  action_required?: boolean;
}

const Notifications: React.FC = () => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("inbox");
  const [userRole, setUserRole] = useState<string>("");
  const authToken = sessionStorage.getItem("auth_token") || "";
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);

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
      
      // Determine user role from the first notification (assuming all notifications have the same role)
      if (data.length > 0) {
        setUserRole(data[0].role);
      }

      const transformedData = data.map(notif => ({
        ...notif,
        sender_name: notif.role === "user" ? "Tenant" : "Host",
        context: notif.booking_id ? `Booking #${notif.booking_id}` : undefined,
        team: notif.role === "user" ? "Tenant" : "Host Team",
        action_required: notif.role === "owner" && !notif.booking_status
      }));
      setAllNotifications(transformedData);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "inbox":
        return allNotifications.filter(notif => 
          !notif.booking_status || notif.booking_status === "pending"
        );
      case "approved":
        return allNotifications.filter(notif => 
          notif.booking_status === "approved"
        );
      case "rejected":
        return allNotifications.filter(notif => 
          notif.booking_status === "rejected"
        );
      default:
        return allNotifications;
    }
  };

  const notifications = getFilteredNotifications();

  const markAsRead = async (notificationId: number): Promise<boolean> => {
    try {
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

    const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      const success = await markAsRead(notif.notification_id);
      if (success) {
        setAllNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notif.notification_id ? { ...n, is_read: true } : n
          )
        );
      }
    }

    if (notif.role === "user" && notif.booking_id) {
      if (notif.message.toLowerCase().includes("approve")) {
        navigate(`/payment/${notif.booking_id}`);
      }
    } else if (notif.role === "owner") {
      // Redirect owner to main notifications page
      navigate('/notification');
    }
  };


  const handleAcceptBooking = async (notif: Notification) => {
    if (!notif.booking_id) return;

    try {
      const res = await fetch(`http://localhost:8000/bookings/${notif.booking_id}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setAllNotifications((prev) =>
            prev.map((n) =>
                n.notification_id === notif.notification_id
                    ? { ...n, booking_status: "approved", action_required: false }
                    : n
            )
        );
      } else {
        alert("Failed to accept booking.");
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
    }
  };

  const handleRejectBooking = async (notif: Notification) => {
    if (!notif.booking_id) return;

    try {
      const res = await fetch(`http://localhost:8000/bookings/${notif.booking_id}/reject`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setAllNotifications((prev) =>
            prev.map((n) =>
                n.notification_id === notif.notification_id
                    ? { ...n, booking_status: "rejected", action_required: false }
                    : n
            )
        );
      } else {
        alert("Failed to reject booking.");
      }
    } catch (error) {
      console.error("Error rejecting booking:", error);
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

  return (
      <>
        <Navbar/>
        <div className="notifications-container">
          <h1>Notifications</h1>

          <div className="notification-tabs">
            <button
                className={`tab ${activeTab === 'inbox' ? 'active' : ''}`}
                onClick={() => setActiveTab('inbox')}
            >
              Inbox
            </button>
            {userRole === "owner" && (
              <>
                <button
                    className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                  Approved
                </button>
                <button
                    className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                  Rejected
                </button>
              </>
            )}
          </div>

          <div className="notifications-scrollable">
            {isLoading ? (
                <div className="loading-state">Loading notifications...</div>
            ) : error ? (
                <div className="error-state">{error}</div>
            ) : notifications.length === 0 ? (
                <div className="empty-state">No notifications found</div>
            ) : (
                <div className="notifications-list">
                  {notifications.map((notif) => (
                      <div
                          key={notif.notification_id}
                          className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                          onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notification-content">
                          <div className="notification-header">
                            <span className="time">{formatDate(notif.created_at)}</span>
                          </div>

                          <p className="notification-message">
                            {notif.message}
                          </p>

                          {notif.action_required && activeTab === "inbox" && (
                              <div className="action-buttons">
                                <button
                                    className="approve-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAcceptBooking(notif);
                                    }}
                                >
                                  Approve
                                </button>
                                <button
                                    className="reject-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectBooking(notif);
                                    }}
                                >
                                  Reject
                                </button>
                              </div>
                          )}

                          {notif.booking_status === "approved" && (
                              <div className="status-badge approved">Approved</div>
                          )}
                          {notif.booking_status === "rejected" && (
                              <div className="status-badge rejected">Rejected</div>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </>
  );
};

export default Notifications;