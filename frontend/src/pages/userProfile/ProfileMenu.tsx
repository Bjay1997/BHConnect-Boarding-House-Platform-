import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ProfileMenu.css";

interface UserType {
  first_name: string;
  last_name: string;
  username: string;
  role: "owner" | "tenant" | "";
  is_verified: boolean;
}

interface ProfileMenuProps {
  onLogout: () => void;
  closeMenu: () => void;
}

function ProfileMenu({ onLogout, closeMenu }: ProfileMenuProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser({
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
            role: data.role,
            is_verified: data.is_verified
          });
        } else {
          console.error("Failed to fetch user");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) return null;

  return (
    <div className="profile-menu">
      <div className="menu-section">
        <div className="Fav-div"></div>

        {user?.role === "tenant" && (
          <Link className="link" to="/favorite">
            <button className="menu-button" onClick={closeMenu}>
              Favorite
            </button>
          </Link>
        )}

        {user?.role === "owner" && (
          <Link className="link" to="/mylistings" state={{ isVerified: user.is_verified }}>
            <button className="menu-button" onClick={closeMenu}>
              Manage Listings
            </button>
          </Link>
        )}

        <Link className="link" to="/notification">
          <button className="menu-button" onClick={closeMenu}>
            Notifications
          </button>
        </Link>

        <hr />

        <Link className="link" to="/profile">
          <button className="menu-button" onClick={closeMenu}>
            Account
          </button>
        </Link>

        <Link className="link" to="/">
          <button
            className="menu-button"
            onClick={() => {
              onLogout();
              closeMenu();
            }}
          >
            Log out
          </button>
        </Link>
      </div>
    </div>
  );
}

export default ProfileMenu;
