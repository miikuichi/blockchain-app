import { useState } from "react";
import Login from "../components/auth/Login";
import Register from "../components/auth/Register";
import "../css/style.css";
import "../App.css";

export default function LandingPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="landing-page">
      <div className="auth-wrapper">
        {isLogin ? (
          <Login
            onLogin={onLogin}
            onSwitch={() => setIsLogin(false)}
          />
        ) : (
          <Register
            onSwitch={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
}