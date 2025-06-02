import "./Navbar.css";
import { useState, useRef, useEffect } from "react";
import ProfileMenu from "../pages/userProfile/ProfileMenu";
import SignInMenu from "../Components/LoginRegisterMenu/loginMenu";
import Login from "../Components/auth/Login";
import Register from "../Components/auth/Register";
import logo from '../assets/logo-black.png';
import { FaBell } from 'react-icons/fa';
import useNotifications from "../Components/hooks/useNotifications";

const Navbar = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<{
        first_name: string;
        last_name: string;
        username: string;
        role: string;
    } | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    
    const notificationsRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        notificationCount,
        fetchNotifications,
        markAllAsRead,
        handleNotificationClick,
        formatDate
    } = useNotifications();

    const checkAuth = () => {
        const token = sessionStorage.getItem('auth_token');
        const userData = sessionStorage.getItem('user');
        if (token && userData) {
            setIsLoggedIn(true);
            setUser(JSON.parse(userData));
            fetchNotifications();
        } else {
            setIsLoggedIn(false);
            setUser(null);
        }
    };

    useEffect(() => {
        checkAuth();
        window.addEventListener('authChange', checkAuth);
        return () => window.removeEventListener('authChange', checkAuth);
    }, []);

    const closeNotifications = () => setShowNotifications(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close notifications if clicked outside
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                closeNotifications();
            }

            // Close menu if clicked outside
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLoginSuccess = (token: string, userData: any) => {
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setShowMenu(false);
        closeNotifications();
    };

    const handleRegisterSuccess = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
        closeNotifications();
    };

    const handleLogout = () => {
        sessionStorage.clear();
        setUser(null);
        setIsLoggedIn(false);
        closeNotifications();
    };

    const toggleMenu = () => {
        closeNotifications();
        setShowMenu(!showMenu);
    };

    const toggleNotifications = () => {
        const willShow = !showNotifications;
        setShowNotifications(willShow);

        if (willShow) {
            markAllAsRead();
            setShowMenu(false);
        }
    };

    const showLogin = () => {
        closeNotifications();
        setShowMenu(false);
        setShowLoginModal(true);
    };

    const showRegister = () => {
        closeNotifications();
        setShowMenu(false);
        setShowRegisterModal(true);
    };

    return (
        <nav className="navbar">
            <div className="navbar-div">
                <div className="nav-left">
                    <a className="logo" href="/">
                        <img src={logo} id="logo" alt="BHConnect Logo"/>
                    </a>
                </div>

                <ul className="nav-right">
                    {isLoggedIn && (
                        <div className="notification-wrapper" ref={notificationsRef}>
                            <div className="notification-icon-container" onClick={toggleNotifications}>
                                <FaBell className="notification-icon" />
                                {notificationCount > 0 && (
                                    <span className="notification-badge">{notificationCount}</span>
                                )}
                            </div>
                            {showNotifications && (
                                <div className="notifications-dropdown">
                                    <div className="notifications-header">
                                        <h4>Notifications</h4>
                                        <button
                                            className="mark-all-read"
                                            onClick={markAllAsRead}
                                        >
                                            Mark all as read
                                        </button>
                                    </div>
                                    <div className="notifications-list">
                                        {notifications.map(notification => (
                                            <div
                                                key={notification.notification_id}
                                                className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <p>{notification.message}</p>
                                                <span className="notification-time">
                                                    {formatDate(notification.created_at)}
                                                </span>
                                                
                                            </div>
                                        ))}
                                    </div>
                                    <div className="notifications-footer">
                                        <a href="/notification">View all</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="button-wrapper" onClick={toggleMenu}>
                        <i id="list" className="bi bi-list"></i>
                    </div>
                </ul>
            </div>

            {showMenu && (isLoggedIn && user ? (
                <div ref={menuRef}>
                    <ProfileMenu
                        user={user}
                        onLogout={handleLogout}
                        closeMenu={() => setShowMenu(false)}
                    />
                </div>
            ) : (
                <SignInMenu
                    onClose={() => setShowMenu(false)}
                    showRegister={showRegister}
                    showLogin={showLogin}
                />
            ))}

            {showLoginModal && (
                <Login
                    onClose={() => setShowLoginModal(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}

            {showRegisterModal && (
                <Register
                    onClose={() => setShowRegisterModal(false)}
                    onRegisterSuccess={handleRegisterSuccess}
                />
            )}
        </nav>
    );
};

export default Navbar;