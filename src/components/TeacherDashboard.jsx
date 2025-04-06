import { useState } from "react";
import { supabase } from "../services/supabase";
import AiQuizGenerator from "./AiQuizGenerator";
import "../styles/TeacherDashboard.css";

import { db } from "../services/firebase";
import { collection, addDoc, Timestamp, getDocs } from "firebase/firestore";

export default function TeacherDashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedPath, setUploadedPath] = useState("");

  const [courses, setCourses] = useState([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [newQuizName, setNewQuizName] = useState("");
  const [quizzes, setQuizzes] = useState([]);

  const [studentResults, setStudentResults] = useState([]);

  const handleUploadPdf = async () => {
    if (!selectedFile) {
      alert("請選擇一個 PDF");
      return;
    }
    const filePath = `${Date.now()}_${encodeURIComponent(selectedFile.name)}`;
    const { data, error } = await supabase.storage
      .from("lectures")
      .upload(filePath, selectedFile);
    if (error) {
      setUploadStatus("❌ 上傳失敗：" + error.message);
    } else {
      setUploadStatus("✅ 上傳成功！");
      setUploadedPath(data.path);
    }
  };

  const getPublicUrl = () => {
    if (!uploadedPath) return "";
    const { data } = supabase.storage.from("lectures").getPublicUrl(uploadedPath);
    return data.publicUrl;
  };

  const handleAddCourse = () => {
    if (!newCourseName.trim()) return;
    setCourses([...courses, newCourseName.trim()]);
    setNewCourseName("");
  };

  const handleAddQuiz = () => {
    if (!selectedCourse || !newQuizName.trim()) return;
    const newQuiz = {
      course: selectedCourse,
      name: newQuizName.trim(),
      avgDifficulty: 2,
      id: Date.now(),
    };
    setQuizzes([...quizzes, newQuiz]);
    setNewQuizName("");
  };

  const handleDeleteQuiz = (id) => {
    setQuizzes(quizzes.filter((q) => q.id !== id));
  };

  const handleEditQuizName = (id, newName) => {
    setQuizzes(
      quizzes.map((q) => (q.id === id ? { ...q, name: newName } : q))
    );
  };

  const handleSaveAiQuiz = async (quizList) => {
    const newQuiz = {
      course: "AI 考卷",
      name: `AI 自動出題 #${Date.now()}`,
      questions: quizList,
      avgDifficulty: Math.round(
        quizList.reduce((sum, q) => sum + (q.difficulty || 3), 0) / quizList.length
      ),
      createdAt: Timestamp.now(),
    };

    setQuizzes((prev) => [...prev, { ...newQuiz, id: Date.now() }]);

    try {
      await addDoc(collection(db, "quizzes"), newQuiz);
      console.log("✅ AI 考卷已儲存到 Firestore");
    } catch (err) {
      console.error("❌ 儲存考卷失敗：", err.message);
    }
  };

  return (
    <div className="teacher-dashboard">
      <h1>🎓 老師後台</h1>

      <section className="section">
        <h2>📚 新增課程</h2>
        <input
          type="text"
          placeholder="輸入課程名稱"
          value={newCourseName}
          onChange={(e) => setNewCourseName(e.target.value)}
        />
        <button onClick={handleAddCourse}>新增課程</button>
        <ul>
          {courses.map((course, idx) => (
            <li key={idx}>{course}</li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>📄 上傳講義 PDF</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button onClick={handleUploadPdf}>上傳講義</button>
        {uploadStatus && <p>{uploadStatus}</p>}
        {uploadedPath && (
          <a href={getPublicUrl()} target="_blank" rel="noreferrer">
            查看講義
          </a>
        )}
      </section>

      <section className="section">
        <AiQuizGenerator onQuizGenerated={handleSaveAiQuiz} />
      </section>

      <section className="section">
        <h2>📝 建立考卷</h2>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">請選擇課程</option>
          {courses.map((c, idx) => (
            <option key={idx} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="輸入考卷名稱"
          value={newQuizName}
          onChange={(e) => setNewQuizName(e.target.value)}
        />
        <button onClick={handleAddQuiz}>新增考卷</button>
      </section>

      <section className="section">
        <h2>🗂️ 所有考卷</h2>
        {quizzes.length === 0 ? (
          <p>尚未建立考卷</p>
        ) : (
          <ul>
            {quizzes.map((quiz) => (
              <li key={quiz.id}>
                <strong>課程：</strong>{quiz.course} |{" "}
                <strong>名稱：</strong>
                <input
                  value={quiz.name}
                  onChange={(e) => handleEditQuizName(quiz.id, e.target.value)}
                />
                <span> | 難度：{quiz.avgDifficulty} ★</span>
                <button onClick={() => handleDeleteQuiz(quiz.id)}>刪除</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>📊 學生答題結果</h2>
        {studentResults.length === 0 ? (
          <p>目前尚無學生作答紀錄</p>
        ) : (
          studentResults.map((r, idx) => (
            <p key={idx}>
              👤 {r.student || r.nickname} → 「{r.quiz || r.quizName}」得分：{r.score} 分
            </p>
          ))
        )}
      </section>
    </div>
  );
}
