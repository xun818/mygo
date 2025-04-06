import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import "../styles/AuthPage.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryRole = new URLSearchParams(location.search).get("role");
    if (queryRole === "teacher" || queryRole === "student") {
      setRole(queryRole);
    }
  }, [location]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        role,
        name: nickname,
        ...(role === "student" ? { enrolledCourses: [] } : { teachingCourses: [] })
      });

      alert("註冊成功！請重新登入");
      navigate(-1);
    } catch (err) {
      setError("註冊失敗：" + err.message);
    }
  };

  return (
    <div
      className="auth-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL + "/images/home-bg.jpg"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="auth-box">
        <h2>註冊 {role === "teacher" ? "老師" : "學生"} 帳號</h2>
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="暱稱 / 姓名"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
          <button type="submit">註冊</button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="switch">
          已經有帳號了？<span onClick={() => navigate(`/login?role=${role}`)}>點我登入</span>
        </div>
      </div>
    </div>
  );
}
