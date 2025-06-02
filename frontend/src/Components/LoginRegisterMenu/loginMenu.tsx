import React, { useState } from "react";
import "./loginMenu.css";
import Register from "../auth/Register";
import Login from "../auth/Login";
import {Link} from "react-router-dom";

interface SignInMenuProps {
  onClose?: () => void;
  showRegister: () => void; 
  showLogin: () => void;    
}

const SignInMenu: React.FC<SignInMenuProps> = ({ onClose, showRegister, showLogin }) => {
  return (
    <div className="login-menu">
      <div className="menu-section">

        {/*<Link  className="link" to="/listingPage">*/}
        {/*  <button className="menu-button">*/}
        {/*    BHConnect your apartment*/}
        {/*  </button>*/}
        {/*</Link>*/}


        {/*<hr className="line"/>*/}
        
        <Link to='/signup'><button className="menu-button"> Sign up
        </button> </Link>
        
        
        <button className="menu-button"  onClick={() => {
          showLogin();
          if (onClose) onClose();
        }}>
          Log in
        </button>
      </div>
    </div>
  );
};

export default SignInMenu;