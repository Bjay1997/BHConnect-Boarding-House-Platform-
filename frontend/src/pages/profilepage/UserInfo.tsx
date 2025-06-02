import { useEffect, useState } from "react";
import EditUserInfo from "./EditUserInfo";
import "./userinfo.css"

interface UserData {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_picture_url: string | null;
  is_verified: boolean;
  username: string;
}

const UserInfo = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        if (!token) throw new Error("No authentication token found");

        const response = await fetch("http://127.0.0.1:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        setUser(userData);
        sessionStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        const localUser = sessionStorage.getItem("user");
        if (localUser) setUser(JSON.parse(localUser));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) return <div>Loading user data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user data available</div>;

  return isEditing ? (
    <EditUserInfo
      user={user}
      onSave={(updatedUser) => {
        setUser(updatedUser);
        setIsEditing(false);
      }}
      onCancel={() => setIsEditing(false)}
    />
  ) : (
    <div className="user-info-container">
      <div className="profile-picture-section">
        {user.profile_picture_url ? (
          <img  className="profile-picturess" src={`http://127.0.0.1:8000${user.profile_picture_url}`} />
        ) : (
          <div className="profile-picture-placeholder">
            {user.first_name.charAt(0)}
            {user.last_name.charAt(0)}
          </div>
        )}
      </div>

      <div className="user-details-section">
        {/*<h2>User Information</h2>*/}
        <div className="user-detail">
          <strong>Name:</strong> <span>{user.first_name} {user.last_name}</span>
        </div>
        <div className="user-detail">
          <strong>Username:</strong> <span>{user.username}</span>
        </div>
        <div className="user-detail">
          <strong>Email:</strong> <span>{user.email}</span>
        </div>
        <div className="user-detail">
          <strong>Phone:</strong> <span>{user.phone_number || "Not provided"}</span>
        </div>
        <div className="user-detail">
          <strong>Verification Status:</strong> <span>{user.is_verified ? "Verified" : "Not Verified"}</span>
        </div>
        <div className="btn-div" >
          <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
