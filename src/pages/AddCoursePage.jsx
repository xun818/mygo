import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function AddCoursePage() {
  const [courseName, setCourseName] = useState("");
  const navigate = useNavigate();

  const handleAddCourse = async () => {
    if (!courseName.trim()) {
      alert("請輸入課程名稱！");
      return;
    }

    const newCourse = {
      name: courseName.trim(),
      description: "",
      teacherId: "teacher_123", // 實際使用時請動態改為登入老師的ID
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, "courses"), newCourse);
      alert("課程新增成功！");
      navigate("/teacher"); // 跳轉回老師主頁
    } catch (error) {
      alert("新增失敗：" + error.message);
    }
  };

  return (
    <div className="section">
      <h2>📚 新增課程</h2>
      <input
        type="text"
        placeholder="輸入課程名稱"
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
      />
      <button onClick={handleAddCourse}>新增課程</button>
      <button onClick={() => navigate("/teacher")}>返回老師主頁</button>
    </div>
  );
}
