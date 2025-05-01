import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import "../styles/AuthPage.css";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("student");

  useEffect(() => {
    const queryRole = new URLSearchParams(location.search).get("role");
    if (queryRole) setRole(queryRole);
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      role === "teacher" ? navigate("/teacher") : navigate("/student/home");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container" style={{
      backgroundImage: `url(${process.env.PUBLIC_URL + "/images/home-bg.jpg"})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div className="auth-box">
        <h2>登入 {role === "teacher" ? "老師" : "學生"} 帳號</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">登入</button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="switch">
          還沒有帳號？ <span onClick={() => navigate(`/register?role=${role}`)}>點我註冊</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
