// 路徑：src/components/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import AiQuizGenerator from "./AiQuizGenerator";
import "../styles/TeacherDashboard.css";
import { db, auth, storage } from "../services/firebase";
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { AiOutlineRobot } from "react-icons/ai";
import { onAuthStateChanged } from "firebase/auth";

/* ---------- API 端點：同時支援 Vite 與 CRA ---------- */
const API_BASE =
  // ① Vite (`import.meta.env.VITE_API_BASE`)
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  // ② CRA (`process.env.REACT_APP_API_BASE`)
  process.env.REACT_APP_API_BASE ||
  // ③ 預設：本地 => localhost，正式 => Render
  (window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "https://mygo-api.onrender.com");

export default function TeacherDashboard() {
  /* ---------- state ---------- */
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lectureList, setLectureList] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [studentResults, setStudentResults] = useState([]);

  // 筆跡驗證
  const [students, setStudents] = useState([]); // { uid, name }
  const [selStudent, setSelStudent] = useState(""); // 目前選擇的學生 UID
  const [examList, setExamList] = useState([]); // {id, storagePath, fileName}
  const [checkedExamIds, setCheckedExamIds] = useState([]); // 勾選 ID
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifying, setVerifying] = useState(false);

  // 其他 UI 狀態
  const [newCourseName, setNewCourseName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showAI, setShowAI] = useState(false);

  const navigate = useNavigate();

  /* ---------- 登入狀態 ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
      await Promise.all([
        fetchCourses(),
        fetchLectureMetadata(),
        fetchQuizzes(),
        fetchStudentResults(),
        fetchStudents(),
      ]);
    });
    return () => unsub();
  }, [navigate]);

  /* ---------- 自動選第一門課 ---------- */
  useEffect(() => {
    if (!selectedCourse && courses.length) setSelectedCourse(courses[0].id);
  }, [courses, selectedCourse]);

  /* ---------- 選學生時載答案卷 ---------- */
  useEffect(() => {
    if (selStudent) fetchExams(selStudent);
    else setExamList([]);
    setCheckedExamIds([]);
    setVerifyStatus("");
  }, [selStudent]);

  /* ========== Firestore 讀取 ========== */
  const fetchCourses = async () => {
    const snap = await getDocs(collection(db, "courses"));
    setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchLectureMetadata = async () => {
    const snap = await getDocs(collection(db, "lectures"));
    const list = await Promise.all(
      snap.docs
        .filter((d) => d.data().storagePath)
        .map(async (d) => {
          const data = d.data();
          let url = "";
          try {
            url = await getDownloadURL(ref(storage, data.storagePath));
          } catch {}
          return { id: d.id, ...data, url };
        })
    );
    setLectureList(list);
  };

  const fetchQuizzes = async () => {
    const snap = await getDocs(collection(db, "quizzes"));
    setQuizzes(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          averageDifficulty: data.averageDifficulty ?? 0,
          courseId: data.courseId || data.course_id,
        };
      })
    );
  };

  const fetchStudentResults = async () => {
    const rsnap = await getDocs(collection(db, "studentResults"));
    const results = rsnap.docs.map((d) => d.data());
    const qsnap = await getDocs(collection(db, "quizzes"));
    const quizMap = {};
    qsnap.docs.forEach((d) => {
      quizMap[d.id] = d.data().name || "未命名";
    });
    setStudentResults(
      results.map((r) => ({
        ...r,
        student: r.name || r.studentName || r.student || "-",
        quizName: quizMap[r.quizId] || r.quizId,
      }))
    );
  };

  const fetchStudents = async () => {
    const snap = await getDocs(collection(db, "users"));
    const list = snap.docs
      .filter((d) => d.data().role === "student")
      .map((d) => ({ uid: d.id, name: d.data().name || d.id }));
    setStudents(list);
    if (list.length) setSelStudent(list[0].uid);
  };

  const fetchExams = async (uid) => {
    const snap = await getDocs(collection(db, "handwritingExams"));
    const list = snap.docs
      .filter((d) => d.data().studentId === uid)
      .map((d) => {
        const data = d.data();
        const fname = data.fileName || data.storagePath.split("/").pop();
        return { id: d.id, storagePath: data.storagePath, fileName: fname };
      });
    setExamList(list);
  };

  /* ========== 課程 CRUD ========== */
  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return;
    const docRef = await addDoc(collection(db, "courses"), {
      name: newCourseName.trim(),
      teacherId: user.uid,
      createdAt: Timestamp.now(),
    });
    setCourses([...courses, { id: docRef.id, name: newCourseName.trim() }]);
    setNewCourseName("");
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("確定刪除課程？")) return;
    await deleteDoc(doc(db, "courses", id));
    setCourses(courses.filter((c) => c.id !== id));
    if (selectedCourse === id) setSelectedCourse("");
  };

  /* ========== 講義 CRUD ========== */
  const handleUploadPdf = async () => {
    if (!selectedFile || !selectedCourse) {
      alert("請選擇課程並上傳檔案");
      return;
    }
    const ext = selectedFile.name.split(".").pop();
    const path = `lectures/${selectedCourse}/${Date.now()}.${ext}`;
    try {
      await uploadBytes(ref(storage, path), selectedFile);
      await addDoc(collection(db, "lectures"), {
        courseId: selectedCourse,
        fileName: selectedFile.name,
        storagePath: path,
        createdAt: Timestamp.now(),
      });
      setUploadStatus("✅ 上傳成功");
      fetchLectureMetadata();
    } catch {
      alert("❌ 上傳失敗");
    }
  };

  const handleDeleteLecture = async (lec) => {
    if (!window.confirm("確定下架此講義？")) return;
    await deleteObject(ref(storage, lec.storagePath));
    await deleteDoc(doc(db, "lectures", lec.id));
    fetchLectureMetadata();
  };

  /* ========== 刪考卷 ========== */
  const deleteQuizWithQuestions = async (quizId) => {
    if (!window.confirm("確定刪除考卷？")) return;
    try {
      const rsp = await fetch(`${API_BASE}/quiz/${quizId}`, { method: "DELETE" });
      if (!rsp.ok) throw new Error(await rsp.text());
      await fetchQuizzes();
      await fetchStudentResults();
    } catch (e) {
      console.error("❌ 刪除考卷失敗", e);
      alert("刪除失敗，請稍後重試");
    }
  };

  /* ========== AI 生成完成 ========== */
  const handleQuizGenerated = async () => {
    await fetchQuizzes();
    setShowAI(false);
  };

  /* ========== 筆跡驗證 ========== */
  const toggleExam = (id) => {
    setCheckedExamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleVerify = async () => {
    if (checkedExamIds.length === 0 || verifying) {
      alert("請先勾選至少一張答案卷");
      return;
    }
    setVerifying(true);
    setVerifyStatus("驗證中…");
    try {
      const form = new FormData();
      form.append("author_name", selStudent);

      const names = [];
      for (const e of examList.filter((x) => checkedExamIds.includes(x.id))) {
        const url = await getDownloadURL(ref(storage, e.storagePath));
        const blob = await (await fetch(url)).blob();
        const ext = e.fileName.split(".").pop().toLowerCase().split("?")[0];
        const type = ext === "png" ? "image/png" : "image/jpeg";
        form.append("files", new File([blob], e.fileName, { type }));
        names.push(e.fileName);
      }

      const res = await fetch(`${API_BASE}/verify`, { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.detail || JSON.stringify(j));

      let txt;
      if (Array.isArray(j.results)) {
        txt = j.results
          .map(
            (r) => `${r.file} → ${(r.similarity * 100).toFixed(1)}% : ${r.result}`
          )
          .join("\n");
      } else {
        txt = `${names[0]} → ${(j.similarity * 100).toFixed(1)}% : ${j.result}`;
      }
      setVerifyStatus(txt);
    } catch (e) {
      console.error("驗證失敗", e);
      setVerifyStatus(`❌ ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
  };

  /* ========== UI ========== */
  return (
    <div className="teacher-dashboard">
      {/* ---------- Header ---------- */}
      <header className="dashboard-header">
        <h1>🎓 老師後台</h1>
        <button onClick={handleLogout}>登出</button>
      </header>

      {/* ---------- 1. 課程管理 ---------- */}
      <section className="section course-section">
        <h2>📚 課程管理</h2>
        <div className="form-inline">
          <input
            type="text"
            placeholder="課程名稱"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
          />
          <button onClick={handleAddCourse}>新增課程</button>
        </div>
        <ul className="list">
          {courses.map((c) => (
            <li key={c.id} className="list-item">
              <span>{c.name}</span>
              <div className="actions">
                <button onClick={() => setSelectedCourse(c.id)}>選擇</button>
                <button onClick={() => handleDeleteCourse(c.id)}>下架</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- 2. 講義管理 ---------- */}
      <section className="section list-section">
        <h2>📄 教材管理</h2>
        <div className="form-inline">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">請選擇課程</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <button onClick={handleUploadPdf}>上傳教材</button>
        </div>
        <p style={{ color: "green" }}>{uploadStatus}</p>
        <ul className="grid-list">
          {lectureList
            .filter((l) => l.courseId === selectedCourse)
            .map((lec) => (
              <li key={lec.id} className="grid-item">
                <div className="doc-icon">📄</div>
                <div className="doc-title">{lec.fileName}</div>
                <div className="actions">
                  <button onClick={() => handleDeleteLecture(lec)}>下架</button>
                  <a href={lec.url} target="_blank" rel="noopener noreferrer">
                    查看
                  </a>
                </div>
              </li>
            ))}
        </ul>
      </section>

      {/* ---------- 3. AI 建立考卷 ---------- */}
      <section className="section quiz-section">
        <h2>📝 AI 建立考卷</h2>
        <div className="form-inline">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">請選擇課程</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button onClick={() => setShowAI(!showAI)}>
            <AiOutlineRobot /> AI 自動出題
          </button>
        </div>
        {showAI && selectedCourse && (
          <AiQuizGenerator
            courseId={selectedCourse}
            teacherId={user.uid}
            onDone={handleQuizGenerated}
          />
        )}
        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          {quizzes
            .filter((q) => q.courseId === selectedCourse)
            .map((q) => (
              <div
                key={q.id}
                style={{
                  width: 180,
                  height: 200,
                  border: "2px solid black",
                  borderRadius: 12,
                  padding: 16,
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {q.name || "未命名"}
                </div>
                <div style={{ marginBottom: 16 }}>
                  {Array.from({ length: Math.round(q.averageDifficulty) }).map(
                    (_, i) => (
                      <span key={i}>★</span>
                    )
                  )}
                  {Array.from({
                    length: 5 - Math.round(q.averageDifficulty),
                  }).map((_, i) => (
                    <span key={i}>☆</span>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/teacher/quiz/${q.id}`)}
                  style={{ marginBottom: 8 }}
                >
                  查看
                </button>
                <br />
                <button onClick={() => deleteQuizWithQuestions(q.id)}>
                  刪除
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* ---------- 4. 學生成果 ---------- */}
      <section className="section result-section">
        <h2>📊 學生成果</h2>
        {studentResults.length === 0 ? (
          <p>尚無紀錄</p>
        ) : (
          <ul className="list">
            {studentResults.map((r, i) => (
              <li key={i}>
                {r.student} – {r.quizName}：{r.score} 分
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- 5. 筆跡驗證 ---------- */}
      <section className="section verify-section" style={{ marginTop: 40 }}>
        <h2>✍️ 筆跡驗證</h2>
        <div className="form-inline">
          <select
            value={selStudent}
            onChange={(e) => setSelStudent(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.uid} value={s.uid}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCheckedExamIds(examList.map((e) => e.id))}
            style={{ marginLeft: 8 }}
          >
            全選
          </button>
          <button
            onClick={() => setCheckedExamIds([])}
            style={{ marginLeft: 8 }}
          >
            清除
          </button>
        </div>

        <ul
          className="list"
          style={{ marginTop: 12, maxHeight: 200, overflowY: "auto" }}
        >
          {examList.length === 0 ? (
            <li>此學生尚未上傳答案卷</li>
          ) : (
            examList.map((exam) => (
              <li key={exam.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checkedExamIds.includes(exam.id)}
                    onChange={() => toggleExam(exam.id)}
                  />
                  &nbsp;{exam.fileName}
                </label>
              </li>
            ))
          )}
        </ul>

        <button
          onClick={handleVerify}
          disabled={checkedExamIds.length === 0 || verifying}
          style={{ marginTop: 12 }}
        >
          {verifying ? "驗證中…" : "開始驗證"}
        </button>

        {verifyStatus && (
          <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
            {verifyStatus}
          </pre>
        )}
      </section>
    </div>
  );
}
