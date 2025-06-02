import { useRef, useState } from "react";
import "./edituserinfo.css"


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

interface EditUserInfoProps {
  user: UserData;
  onSave: (updatedUser: UserData) => void;
  onCancel: () => void;
}

const EditUserInfo = ({ user, onSave, onCancel }: EditUserInfoProps) => {
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    phone_number: user.phone_number || "",
    email: user.email,
    username: user.username,
    profile_picture: null as File | null,
    id_document: null as File | null, // Add ID document field
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null); // Ref for ID input

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, profile_picture: e.target.files![0] }));
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, id_document: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = sessionStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const formDataToSend = new FormData();
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("phone_number", formData.phone_number);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("username", formData.username);

      // Attach profile picture if present
      if (formData.profile_picture) {
        formDataToSend.append("profile_picture", formData.profile_picture);
      }

      // Attach ID document if present for verification
      if (formData.id_document) {
        formDataToSend.append("id_document", formData.id_document);
      }

      const response = await fetch("http://127.0.0.1:8000/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Failed to update user data");

      const updatedUser = await response.json();
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      onSave(updatedUser);
    } catch (error) {
      alert("Failed to update profile");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="user-info-container">
      <div className="profile-picture-sections">
        {formData.profile_picture ? (
          <img src={URL.createObjectURL(formData.profile_picture)} alt="Preview" className="profile-pictures" />
        ) : user.profile_picture_url ? (
          <img src={user.profile_picture_url} alt="Profile" className="profile-pictures" />
        ) : (
          <div className="profile-picture-placeholder">
            {formData.first_name.charAt(0)}{formData.last_name.charAt(0)}
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: "none" }}
        />
        <button type="button" className="change-photo-btn" onClick={() => fileInputRef.current?.click()}>
          Change Photo
        </button>
      </div>

      <div className="user-details-section">
        {/*<h2>Edit Profile</h2>*/}
        <div className="forms-group">
          <strong>First Name</strong>
          <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required/>
        </div>

        <div className="forms-group">
          <strong>Last Name</strong>
          <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required/>
        </div>

        <div className="forms-group">
          <strong>Username</strong>
          <input type="text" name="username" value={formData.username} onChange={handleInputChange} required/>
        </div>

        <div className="forms-group">
          <strong>Email</strong>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required/>
        </div>

        <div className="forms-group">
          <strong>Phone Number</strong>
          <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange}/>
        </div>

        {/* New ID Upload Section */}
        {!user.is_verified && (
            <div className="forms-group">
              <label>Verify My Account (Upload ID)</label>
              <input
                  type="file"
                  ref={idInputRef}
                  onChange={handleIdChange}
                  accept="image/*,application/pdf"
                  required={!user.is_verified}
              />
              <p className="id-upload-instructions">Please upload a valid government ID for verification.</p>
            </div>
        )}

        <div className="form-buttons">
          <button type="submit" className="save-btn">Save Changes</button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </form>
  );
};

export default EditUserInfo;
