import { useState } from "react";
import { useClickOutside } from "../hooks/useClickOutside";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../auth/Login.css";

interface LoginProps {
    onClose?: () => void;
    onLoginSuccess?: (token: string, user: any) => void;
}

const Login = ({ onClose, onLoginSuccess }: LoginProps) => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const { ref, isVisible, setIsVisible } = useClickOutside<HTMLDivElement>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username: formData.username,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Login failed");
            }

            const data = await response.json();

            sessionStorage.setItem("auth_token", data.access_token);
            sessionStorage.setItem("user", JSON.stringify(data.user));

            window.dispatchEvent(new Event("authChange"));

            if (onLoginSuccess) {
                onLoginSuccess(data.access_token, {
                    first_name: data.user.first_name,
                    last_name: data.user.last_name,
                    username: data.user.username,
                });
            }


            if (data.user.username === "admin") {
            window.location.href = "/admin";
            } else {
            if (onLoginSuccess) {
                onLoginSuccess(data.access_token, data.user);
            }
            window.location.href = "/";
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) {
        if (onClose) onClose();
        return null;
    }

    return (
        <div className="login-container">
            <div className="login-form" ref={ref}>
                <button className="close-button" onClick={onClose}>
                    <i className="bi bi-x-lg"></i>
                </button>

                {success ? (
                    <div className="login-success">
                        <div className="success-message">{success}</div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h2>Welcome back.</h2>

                        {error && <div className="alert alert-danger">{error}</div>}
                        {isLoading && <div className="loading-indicator">Logging in...</div>}

                        <div className="input-groups">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-groups">
                            <label>Password</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={togglePasswordVisibility}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="forgot-pass">
                            <a href="#">Forgot password?</a>
                        </div>

                        <button type="submit" className="login-button" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Log in"}
                        </button>

                        <div className="signup-prompt">
                            No account? <a href="/signup">Sign up</a>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;