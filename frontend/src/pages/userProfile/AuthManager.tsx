import { useState, useEffect } from 'react';
import Login from "../../Components/auth/Login";
import ProfileMenu from './ProfileMenu';

const AuthManager = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{
    first_name: string;
    last_name: string;
    username: string;
  } | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = (token: string, userData: any) => {
    sessionStorage.setItem('access_token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    setIsLoggedIn(false);
  };

  
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const userData = sessionStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []); 

  return (
    <div className="auth-section">
      {isLoggedIn && user ? (
        <ProfileMenu user={user} onLogout={handleLogout} />
      ) : (
        <>
          <button onClick={() => setShowLogin(true)}>Log In</button>
          {showLogin && (
            <Login 
              onClose={() => setShowLogin(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AuthManager;