// 路徑：src/components/StudentQuiz.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../services/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function StudentQuiz() {
  const { quizId } = useParams();
  const navigate   = useNavigate();

  const [quiz, setQuiz]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [studentName, setStuName] = useState("匿名");
  const [loading, setLoading]     = useState(true);

  /* ---------- 等登入後再抓考卷 ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/login"); return; }

      try {
        const snap = await getDoc(doc(db, "quizzes", quizId));
        if (!snap.exists()) { alert("找不到考卷"); navigate("/student/quizzes"); return; }
        setQuiz(snap.data());
      } catch (e) {
        console.error(e);
        alert("無法載入考卷，請稍後再試");
      } finally {
        setLoading(false);
      }

      /* 讀暱稱 */
      try {
        const usnap = await getDoc(doc(db, "users", u.uid));
        if (usnap.exists()) {
          const d = usnap.data();
          setStuName(d.nickname || d.name || u.displayName || "匿名");
        } else {
          setStuName(u.displayName || "匿名");
        }
      } catch {
        setStuName(u.displayName || "匿名");
      }
    });
    return () => unsub();
  }, [quizId, navigate]);

  /* ---------- 狀態操作 & 工具 ---------- */
  const change = (i, v) => setAnswers(p => ({ ...p, [i]: v }));
  const toggle = (i, l) => setAnswers(p => {
    const arr = Array.isArray(p[i]) ? [...p[i]] : [];
    return { ...p, [i]: arr.includes(l) ? arr.filter(x => x !== l) : [...arr, l] };
  });
  const eqArr  = (a, b) => a.length === b.length && a.every((v,i) => v === b[i]);
  const fillOK = (a, c) => {
    const ans = String(a ?? "").trim().toLowerCase();
    const cor = String(c).trim().toLowerCase();
    if (!ans) return false;
    const na = parseFloat(ans), nc = parseFloat(cor);
    if (!isNaN(na) && !isNaN(nc)) return Math.abs(na - nc) / Math.max(1, nc) < 0.01;
    return ans === cor;
  };

  /* ---------- 送出 ---------- */
  const handleSubmit = async () => {
    if (!quiz) return;
    let score = 0;
    quiz.questions.forEach((q, i) => {
      const ans = answers[i], w = q.score ?? 1;
      if (q.type === "single") {
        if (ans === q.answer) score += w;
      } else if (q.type === "multiple" || q.type === "multi") {
        const a = Array.isArray(ans) ? [...ans].sort() : [];
        const c = Array.isArray(q.answer) ? [...q.answer].sort() : [];
        if (eqArr(a, c)) score += w;
      } else if (q.type === "fill") {
        const arr = Array.isArray(q.answer) ? q.answer : [q.answer];
        if (arr.some(cor => fillOK(ans, cor))) score += w;
      }
    });

    try {
      const ref = await addDoc(collection(db, "studentResults"), {
        quizId,
        teacherId: quiz.teacherId || quiz.teacher_id || "",
        studentId: auth.currentUser.uid,
        studentName,
        name:        studentName,
        answers,
        score,
        createdAt:   Timestamp.now(),
      });
      navigate(`/student/result/${ref.id}`);
    } catch (e) {
      console.error(e);
      alert("儲存失敗，請稍後重試");
    }
  };

  if (loading) return <p>載入中…</p>;
  if (!quiz)    return null;

  return (
    <div style={{ padding: 24 }}>
      <h2>考卷：{quiz.name}</h2>
      <p>平均難度：★{Math.round(quiz.averageDifficulty)}</p>

      {quiz.questions.map((q, i) => (
        <div key={i} style={{ marginBottom: 24 }}>
          <h4>第 {i + 1} 題（{q.type}，{q.score ?? 1} 分）</h4>
          <p>{q.question}</p>

          {/* ----- 單選 ----- */}
          {q.type === "single" &&
            q.options.map((opt, j) => {
              const l = String.fromCharCode(65 + j);
              return (
                <label key={j} style={{ display:"block", marginLeft:16 }}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === l}
                    onChange={() => change(i, l)}
                  /> {l}. {opt}
                </label>
              );
            })}

          {/* ----- 多選 ----- */}
          {(q.type === "multiple" || q.type === "multi") &&
            q.options.map((opt, j) => {
              const l = String.fromCharCode(65 + j);
              return (
                <label key={j} style={{ display:"block", marginLeft:16 }}>
                  <input
                    type="checkbox"
                    checked={Array.isArray(answers[i]) && answers[i].includes(l)}
                    onChange={() => toggle(i, l)}
                  /> {l}. {opt}
                </label>
              );
            })}

          {/* ----- 填空 ----- */}
          {q.type === "fill" && (
            <input
              type="text"
              value={answers[i] || ""}
              onChange={e => change(i, e.target.value)}
              placeholder="請輸入答案"
              style={{ display:"block", marginLeft:16 }}
            />
          )}
        </div>
      ))}

      <button onClick={handleSubmit}>送出作答</button>
    </div>
  );
}
