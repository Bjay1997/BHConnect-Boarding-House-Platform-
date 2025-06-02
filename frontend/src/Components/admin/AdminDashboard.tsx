import React, { useState, useEffect } from "react";
import "./AdminDashboard.css"
import Navbar from "../../Components/Navbar.tsx";
import { Link } from "react-router-dom";

interface UserData {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture_url: string | null;
  is_verified: boolean;
  id_document_url: string | null;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = sessionStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:8000/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        alert("Failed to fetch users");
      }
    };

    fetchUsers();
  }, []);

  const handleApprove = async (userId: number) => {
    const token = sessionStorage.getItem("access_token");
    const response = await fetch(`http://127.0.0.1:8000/admin/approve-user/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      alert("User approved");
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
    } else {
      alert("Failed to approve user");
    }
  };

  const handleReject = async (userId: number) => {
    const token =sessionStorage.getItem("access_token");
    const response = await fetch(`http://127.0.0.1:8000/admin/reject-user/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      alert("User rejected");
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
    } else {
      alert("Failed to reject user");
    }
  };

  const handleImageClick = (imageUrl: string | null) => {
    if (imageUrl) {
      setModalImage(imageUrl);
    }
  };

  const closeModal = () => {
    setModalImage(null);
  };

  return (
      <>
        <Navbar/>
        <div className="admin-dashboard-container">
          <button onClick={() => {
            sessionStorage.clear();
            window.location.href = "/";
          }} className="admin-back-btn"
          >Back
          </button>

          <h2>Admin Dashboard</h2>
          <table className="admin-dashboard-table">
            <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Profile Picture</th>
              <th>ID Document</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td className="profile-picture-cell">
                    {user.profile_picture_url ? (
                        <img className="profile-picture" src={`http://127.0.0.1:8000${user.profile_picture_url}`}/>
                    ) : (
                        "No photo"
                    )}
                  </td>
                  <td>
                    {user.id_document_url ? (
                        <img
                            src={`http://127.0.0.1:8000${user.id_document_url}`}
                            alt="ID Document"
                            className="id-document"
                            onClick={() => handleImageClick(`http://127.0.0.1:8000${user.id_document_url}`)}
                        />
                    ) : "No ID"}
                  </td>
                  <td>{user.is_verified ? "Verified" : "Pending"}</td>
                  <td>
                    {!user.is_verified && (
                        <>
                          <button className="approve-btn" onClick={() => handleApprove(user.user_id)}>Approve</button>
                          <button className="reject-btn" onClick={() => handleReject(user.user_id)}>Reject</button>
                        </>
                    )}
                  </td>
                </tr>
            ))}
            </tbody>
          </table>

          {modalImage && (
              <div className="modal" onClick={closeModal}>
                <div className="modal-content">
                  <img src={modalImage} alt="Zoomed" className="modal-image"/>
                </div>
              </div>
          )}
        </div>
      </>

  );
};

export default AdminDashboard;
