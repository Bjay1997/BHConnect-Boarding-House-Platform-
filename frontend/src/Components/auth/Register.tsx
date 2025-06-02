import { useState } from "react";
import { useClickOutside } from "../hooks/useClickOutside";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../auth/Register.css";

interface RegisterProps {
  onClose?: () => void;
  onRegisterSuccess?: () => void;
}

const Register = ({ onClose }: RegisterProps) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phonenumber: "",
    password: "",   
    role: "",
  });

  const { ref, isVisible, setIsVisible } = useClickOutside<HTMLDivElement>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phonenumber: "",
      password: "",
      role: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
  
    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phonenumber,
          role:formData.role,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }
  
      const data = await response.json();
      console.log("Registration successful:", data);
      setSuccess("User created successfully!");
      resetForm(); // Clear all form fields
      
      // Optional: Auto-close the form after 2 seconds
      setTimeout(() => {
        setSuccess(null);
        if (onClose) onClose();
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    if (onClose) onClose();
    return null;
  }

  return (
    <div className="register-container" ref={ref}>
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Register</h2>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {isLoading && <div className="loading-indicator">Loading...</div>}

        <div className="input-groups">
          <i className="bi bi-person-circle"></i>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            required
            onChange={handleChange}
        />
        </div>

        <div className="input-groups">
          <i className="bi bi-person-fill"></i>
          <input 
            type="text" 
            name="lastName" 
            placeholder="Last Name" 
            value={formData.lastName}
            required 
            onChange={handleChange} 
          />
        </div>

        <div className="input-groups">
          <i className="bi bi-person-circle"></i>
          <input 
            type="text" 
            name="username" 
            placeholder="Username" 
            value={formData.username}
            required 
            onChange={handleChange} 
          />
        </div>

        <div className="input-groups">
          <i className="bi bi-envelope-fill"></i>
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            value={formData.email}
            required 
            onChange={handleChange} 
          />
        </div>
        
        <div className="input-groups">
          <i className="bi bi-telephone-fill"></i>
          <input 
            type="tel"  // Changed from "number" to "tel" for phone numbers
            name="phonenumber" 
            placeholder="Phone Number" 
            value={formData.phonenumber}
            required 
            onChange={handleChange} 
          />
        </div>

        <div className="input-groups">
          <i className="bi bi-lock-fill"></i>
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={formData.password}
            required 
            onChange={handleChange} 
          />
        </div>
        <i className="bi bi-person-badge-fill"></i>
        <select name="role" id="user-role-dropdown" value={formData.role} required onChange={handleChange}>
          <option value="">Select Role</option>
          <option value="tenant">Tenant</option>
          <option value="owner">Owner</option>
        </select>

        <button 
          type="submit" 
          className="register-button" 
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default Register;