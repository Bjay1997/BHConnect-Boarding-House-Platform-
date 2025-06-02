import React, { useState, useEffect } from "react";
import "./profilepage.css";
import UserInfo from "./UserInfo";
import MyListings from "./MyListings";
import MyBookings from "./MyBookings";
import Favorites from "./Favorites";
import Notifications from "./Notifications";
import TenantReports from "./TenantRecords"; // Add this import
import Navbar from '../../Components/Navbar';

interface UserType {
  user_id: number;
  role: "owner" | "tenant" | "";
  isVerified: boolean;
}

function ProfilePage() {
  const [user, setUser] = useState<UserType>({
    user_id: 0,
    role: "",
    isVerified: false,
  });

  const [activeSection, setActiveSection] = useState("userinfo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = sessionStorage.getItem("auth_token");
      const res = await fetch("http://127.0.0.1:8000/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          user_id: data.id,
          role: data.role,
          isVerified: data.is_verified,
        });
      } else {
        console.error("Failed to fetch user info");
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
      <>
        <Navbar/>
        <div className="profile-wrapper">
          <div className="sidebar">
            <h2 className="sidebar-title">Dashboard</h2>
            <ul>
              <li
                  onClick={() => setActiveSection("userinfo")}
                  className={activeSection === "userinfo" ? "active" : ""}
              >
                User Info
              </li>

              {user.role === "owner" && (
                  <>
                    <li
                        onClick={() => setActiveSection("listings")}
                        className={activeSection === "listings" ? "active" : ""}
                    >
                      My Listings
                    </li>
                    <li
                        onClick={() => setActiveSection("tenant-reports")}
                        className={activeSection === "tenant-reports" ? "active" : ""}
                    >
                      Tenant Reports
                    </li>
                  </>
              )}

              {user.role === "tenant" && (
                  <>
                    <li
                        onClick={() => setActiveSection("bookings")}
                        className={activeSection === "bookings" ? "active" : ""}
                    >
                      My Bookings
                    </li>
                    <li
                        onClick={() => setActiveSection("favorites")}
                        className={activeSection === "favorites" ? "active" : ""}
                    >
                      Favorites
                    </li>
                  </>
              )}

              <li
                  onClick={() => setActiveSection("notifications")}
                  className={activeSection === "notifications" ? "active" : ""}
              >
                Notifications
              </li>
            </ul>
          </div>

          <div className="content-area">
            {activeSection === "userinfo" && <UserInfo />}
            {activeSection === "listings" && user.role === "owner" && (
                <MyListings user={user} />
            )}
            {activeSection === "bookings" && user.role === "tenant" && (
                <MyBookings />
            )}
            {activeSection === "favorites" && user.role === "tenant" && (
                <Favorites />
            )}
            {activeSection === "notifications" && <Notifications />}
            {activeSection === "tenant-reports" && user.role === "owner" && (
                <TenantReports />
            )}
          </div>
        </div>
      </>
  );
}

export default ProfilePage;