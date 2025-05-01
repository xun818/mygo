import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { db, storage } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

export default function AiQuizGenerator({ courseId, teacherId, onDone }) {
  const navigate = useNavigate();
  const [lectureList, setLectureList]   = useState([]);
  const [selectedLecture, setSelected]  = useState(null);
  const [quizName, setQuizName]         = useState("");
  const [targetDiff, setTargetDiff]     = useState(3);
  const [numSingle, setNumSingle]       = useState(3);
  const [numMulti,  setNumMulti]        = useState(1);
  const [numFill,   setNumFill]         = useState(1);
  const [status,    setStatus]          = useState("");

  /* -------- 取講義 -------- */
  useEffect(() => {
    if (!courseId) return;
    (async () => {
      const q = query(collection(db, "lectures"), where("courseId", "==", courseId));
      const snap = await getDocs(q);
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          let url = data.downloadUrl;
          if (!url && data.storagePath)
            url = await getDownloadURL(ref(storage, data.storagePath));
          return { id: d.id, fileName: data.fileName, storagePath: data.storagePath, downloadUrl: url };
        })
      );
      setLectureList(list);
    })();
  }, [courseId]);

  /* -------- 生成考卷 -------- */
  const handleGenerate = async () => {
    if (!selectedLecture) { alert("請先選擇講義"); return; }
    if (!quizName.trim()) { alert("請輸入考卷名稱"); return; }

    setStatus("生成中…");
    try {
      const payload = {
        course_id:    courseId,
        teacher_id:   teacherId,
        quiz_name:    quizName,
        target_diff:  targetDiff,
        single_count: numSingle,
        multi_count:  numMulti,
        fill_count:   numFill,
        pdf_paths:    [selectedLecture.storagePath],
      };
      const backend = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
      const { data } = await axios.post(`${backend}/generate_quiz`, payload);

      /* 通知父層重新 fetchQuizzes，避免重複渲染 */
      typeof onDone === "function" && onDone();
      setStatus("生成完成");
      setQuizName("");

      /* 跳到編輯分數頁面 */
      navigate(`/teacher/quiz/${data.quizId}?edit=1`);
    } catch (e) {
      console.error(e);
      setStatus("生成失敗");
    }
  };

  /* ------------------ UI（僅表單，無列表） ------------------ */
  return (
    <div style={{ padding: 24, border: "1px dashed #bbb", marginTop: 16 }}>
      <h3>建立考卷</h3>

      <div style={{ marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
        <label>講義：</label>
        <select
          value={selectedLecture?.id || ""}
          onChange={(e) => setSelected(lectureList.find((l) => l.id === e.target.value))}
        >
          <option value="">-- 選講義 --</option>
          {lectureList.map((l) => (
            <option key={l.id} value={l.id}>
              {l.fileName}
            </option>
          ))}
        </select>

        <label style={{ marginLeft: 16 }}>考卷名稱：</label>
        <input
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          placeholder="輸入考卷名稱"
        />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div>
          <label>單選：</label>
          <input
            type="number"
            min={0}
            value={numSingle}
            onChange={(e) => setNumSingle(+e.target.value)}
          />
        </div>
        <div>
          <label>多選：</label>
          <input
            type="number"
            min={0}
            value={numMulti}
            onChange={(e) => setNumMulti(+e.target.value)}
          />
        </div>
        <div>
          <label>填空：</label>
          <input
            type="number"
            min={0}
            value={numFill}
            onChange={(e) => setNumFill(+e.target.value)}
          />
        </div>
        <div>
          <label>難度：</label>
          <input
            type="number"
            min={1}
            max={5}
            value={targetDiff}
            onChange={(e) => setTargetDiff(+e.target.value)}
          />
        </div>
        <button onClick={handleGenerate}>AI 自動出題</button>
        <span>{status}</span>
      </div>
    </div>
  );
}
