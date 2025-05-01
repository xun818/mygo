import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage, auth } from "../services/firebase";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

export default function StudentHome() {
  const navigate = useNavigate();

  /* ---------- 筆跡註冊 ---------- */
  const [regFiles, setRegFiles] = useState([]);
  const [regStatus, setRegStatus] = useState("");
  const [regUploading, setRegUploading] = useState(false);

  const onSelectRegister = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter((f) =>
      ["image/png", "image/jpeg"].includes(f.type)
    );
    setRegFiles((prev) => {
      const combined = [...prev, ...valid];
      setRegStatus(`已選取 ${combined.length} 張範本`);
      return combined;
    });
    e.target.value = null;
  };

  const handleRegister = async () => {
    if (regUploading) return;
    if (regFiles.length < 3) {
      alert("請至少選 3 張筆跡範本");
      return;
    }
    setRegUploading(true);
    setRegStatus("註冊中…");
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("未登入");
      const form = new FormData();
      form.append("author_name", uid);
      regFiles.forEach((f) => form.append("files", f));
      const resp = await fetch("http://localhost:8000/register", {
        method: "POST",
        body: form,
      });
      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        const err = json?.detail || (await resp.text());
        throw new Error(err);
      }
      setRegStatus("✅ 註冊成功");
      setRegFiles([]);
    } catch (e) {
      console.error(e);
      setRegStatus(`❌ 註冊失敗：${e.message}`);
    } finally {
      setRegUploading(false);
    }
  };

  /* ---------- 上傳手寫考卷 ---------- */
  const [hwFile, setHwFile] = useState(null);
  const [hwStatus, setHwStatus] = useState("");
  const [hwUploading, setHwUploading] = useState(false);

  const onSelectHw = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      alert("僅限 JPG/PNG");
      e.target.value = null;
      return;
    }
    setHwFile(f);
    setHwStatus(`已選：${f.name}`);
  };

  const handleUploadHw = async () => {
    if (!hwFile || hwUploading) return;
    setHwUploading(true);
    setHwStatus("上傳中…");
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("未登入");
      const ext = hwFile.name.split(".").pop();
      const path = `handwritingExams/${uid}/${Date.now()}.${ext}`;
      await uploadBytes(ref(storage, path), hwFile);
      const url = await getDownloadURL(ref(storage, path));
      await addDoc(collection(db, "handwritingExams"), {
        studentId:  uid,
        fileName:   hwFile.name,
        storagePath:path,
        downloadURL:url,
        createdAt:  Timestamp.now(),
      });
      setHwStatus("✅ 上傳成功");
    } catch (e) {
      console.error(e);
      setHwStatus(`❌ 上傳失敗：${e.message}`);
    } finally {
      setHwUploading(false);
      setHwFile(null);
    }
  };

  /* ---------- 考卷 & 講義 ---------- */
  const [courses, setCourses]   = useState([]);
  const [quizzes, setQuizzes]   = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selQuizCourse, setSelQuizCourse]       = useState("");
  const [selLectureCourse, setSelLectureCourse] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      const snap = await getDocs(collection(db, "courses"));
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadCourses();
  }, []);

  useEffect(() => {
    const loadQuizzes = async () => {
      let qRef = collection(db, "quizzes");
      if (selQuizCourse)
        qRef = query(qRef, where("course_id", "==", selQuizCourse));
      const snap = await getDocs(qRef);
      setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadQuizzes();
  }, [selQuizCourse]);

  useEffect(() => {
    const loadLectures = async () => {
      let qRef = collection(db, "lectures");
      if (selLectureCourse)
        qRef = query(qRef, where("course_id", "==", selLectureCourse));
      const snap = await getDocs(qRef);
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const path = data.storagePath || data.pdfPath;
          const url = path ? await getDownloadURL(ref(storage, path)) : "";
          return { id: d.id, ...data, url };
        })
      );
      setLectures(list);
    };
    loadLectures();
  }, [selLectureCourse]);

  const handleLogout = () => navigate("/");

  /* ----------------------- UI ----------------------- */
  return (
    <div style={{ padding: 20 }}>
      {/* 登出 */}
      <button onClick={handleLogout} style={{ float: "right" }}>
        登出
      </button>

      {/* 筆跡註冊 */}
      <h2>✍️ 註冊筆跡範本（3~5 張 JPG/PNG）</h2>
      <input
        type="file"
        multiple
        accept="image/png,image/jpeg"
        onChange={onSelectRegister}
      />
      <button onClick={handleRegister} disabled={regUploading}>
        {regUploading ? "註冊中…" : "註冊"}
      </button>
      {regStatus && <p>{regStatus}</p>}

      {/* 上傳手寫考卷 */}
      <h2>📤 上傳手寫考卷（JPG/PNG）</h2>
      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={onSelectHw}
      />
      <button onClick={handleUploadHw} disabled={hwUploading}>
        {hwUploading ? "上傳中…" : "上傳"}
      </button>
      {hwStatus && <p>{hwStatus}</p>}

      {/* 可作答考卷清單 */}
      <h2 style={{ marginTop: 30 }}>📘 可作答考卷清單</h2>
      <select
        value={selQuizCourse}
        onChange={(e) => setSelQuizCourse(e.target.value)}
      >
        <option value="">全部課程</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {quizzes.length === 0 ? (
        <p>目前沒有考卷</p>
      ) : (
        <ul>
          {quizzes.map((q) => (
            <li key={q.id}>
              ⭐ 推薦難度：{q.averageDifficulty} 顆星 | <strong>{q.name}</strong>{" "}
              <button onClick={() => navigate(`/student/quiz/${q.id}`)}>
                開始作答
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 講義卡片 */}
      <h2 style={{ marginTop: 40 }}>📚 講義</h2>
      <select
        value={selLectureCourse}
        onChange={(e) => setSelLectureCourse(e.target.value)}
      >
        <option value="">全部課程</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {lectures.length === 0 ? (
        <p>目前沒有講義</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 16,
          }}
        >
          {lectures.map((l) => (
            <div
              key={l.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 4,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, color: "#999" }}>📄</div>
              <div
                style={{
                  fontWeight: "bold",
                  margin: "8px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {l.title || l.fileName || "講義"}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                {l.fileName}
              </div>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "blue" }}
              >
                查看
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
