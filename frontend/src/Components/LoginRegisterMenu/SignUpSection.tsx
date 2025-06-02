import React, { useState } from 'react';
import Navbar from "../../Components/Navbar.tsx";
import "./SignUpSection.css";
import logo from '../../assets/logo-black.png';
import Login from '../auth/Login.tsx';

function SignUpSection() {
    const [showLogin, setShowLogin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        role: '',
    });

    const handleLoginSuccess = (token: string, user: any) => {
        setShowLogin(false);
        // Handle any post-login logic if needed
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            username: '',
            password: '',
            role: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        // Prevent numbers in first name or last name
        const nameRegex = /^[A-Za-z\s'-]+$/;
        if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
            setIsLoading(false);
            setError("First Name and Last Name must not contain numbers or special characters (except - or ').");
            return;
        }

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
                    phone_number: formData.phone,
                    role: formData.role.toLowerCase(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Registration failed");
            }

            const data = await response.json();
            console.log("Registration successful:", data);
            setSuccess("User created successfully!");
            resetForm();

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            {showLogin && (
                <Login
                    onClose={() => setShowLogin(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}
            <div className="bhconect-signup-container">
                <div className="bhconnect-section">
                    <h1><img src={logo} id="logo-pic" alt="BHConnect Logo"/> BHConnect</h1>
                    <h2>Discover Your Ideal Boarding House with BHConnect</h2>

                    <div className="benefits-container">
                        <div className="benefit-item">
                            <h3>Find Your Ideal Home</h3>
                            <p>Browse verified boarding houses with filters for location, budget, and amenities—so you can move in with confidence.</p>
                        </div>

                        <div className="benefit-item">
                            <h3>Safe and Secure Listings</h3>
                            <p>We verify tenant profiles and handle payment processing, so you can focus on providing a great living experience.</p>
                        </div>

                        <div className="benefit-item">
                            <h3>Simplify Management</h3>
                            <p>From applications to move-in, manage everything in one place—no more juggling spreadsheets or messages.</p>
                        </div>
                    </div>

                    <div className="footer-note">
                        <p>© 2025 BHConnect. All rights reserved. </p>
                    </div>
                </div>

                <div className="bhconnect-signup-form">
                    <div className="form-header">
                        <h2>Join BHConnect Today</h2>
                        <div className="tagline">
                            <p>Find—or list—the perfect boarding house for you</p>
                        </div>
                    </div>

                    {success && <div className="alert alert-success">{success}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="name-fields">
                            <div className="input-groupss">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="First Name"
                                />
                            </div>
                            <div className="input-groupss">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Last Name"
                                />
                            </div>
                        </div>

                        <div className="input-groupss">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Username"
                            />
                        </div>
                        <div className="input-groupss">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="johndoe@email.com"
                            />
                        </div>
                        <div className="input-groupss">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="Phone Number"
                            />
                        </div>
                        <div className="input-groupss">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Password"
                            />
                        </div>
                        <div className="input-groupss">
                            <label>Role</label>
                            <select
                                className="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Role</option>
                                <option value="owner">Landlord/Owner</option>
                                <option value="tenant">Tenant</option>
                            </select>
                        </div>

                        <button type="submit" className="signup-button" disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Sign Up Now"}
                        </button>

                        <div className="login-link">
                            <p>Already have an account? <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setShowLogin(true);
                            }}>Log in here</a></p>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default SignUpSection;
