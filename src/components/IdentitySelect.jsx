import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/IdentitySelect.css";

const IdentitySelect = () => {
  const navigate = useNavigate();

  return (
    <div
      className="identity-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL + "/images/home-bg.jpg"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* 白底標題橫幅 */}
      <div className="header-banner">
        <h1>
          歡迎來到 <strong>Mygo</strong> 智慧學習平台
        </h1>
      </div>

      {/* 致中顯示區塊 */}
      <div className="identity-center-box">
        <div className="identity-box">
          <p style={{ fontWeight: "bold", color: "#fff", marginBottom: "10px" }}>請選擇您的身份：</p>
          <div>
            <button onClick={() => navigate("/login?role=teacher")}>我是老師</button>
            <button onClick={() => navigate("/login?role=student")} style={{ marginLeft: "10px" }}>
              我是學生
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentitySelect;
