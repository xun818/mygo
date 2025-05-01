// 路徑：src/components/StudentResult.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../services/firebase";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* ---------- 樣式工具 ---------- */
const letter = (i) => String.fromCharCode(65 + i);
const isEqualArr = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export default function StudentResult() {
  const { resultId } = useParams();                // URL: /student/result/:id
  const navigate    = useNavigate();

  const [result, setResult]   = useState(null);    // studentResults doc
  const [quiz, setQuiz]       = useState(null);    // quizzes doc
  const [loading, setLoading] = useState(true);

  /* ---------- 等登入 → 讀成績 ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/login"); return; }

      try {
        const rsnap = await getDoc(doc(db, "studentResults", resultId));
        if (!rsnap.exists()) { alert("找不到紀錄"); navigate("/student/quizzes"); return; }
        const rdata = rsnap.data();
        setResult(rdata);

        // 讀考卷
        const qsnap = await getDoc(doc(db, "quizzes", rdata.quizId));
        if (!qsnap.exists()) { alert("找不到考卷"); navigate("/student/quizzes"); return; }
        setQuiz(qsnap.data());
      } catch (e) {
        console.error(e);
        alert("無法載入結果，請稍後再試");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [resultId, navigate]);

  if (loading) return <p>載入中…</p>;
  if (!result || !quiz) return null;

  const { answers, score } = result;

  /* ---------- UI ---------- */
  return (
    <div style={{ padding: 24 }}>
      <h1>🎉 作答完成！</h1>
      <h2>得分：{score} 分</h2>

      {quiz.questions.map((q, idx) => {
        /* 取正解 & 我的答案 (整理成陣列方便比對) */
        const correct =
          q.type === "single"
            ? [q.answer]
            : Array.isArray(q.answer)
            ? q.answer
            : [q.answer];

        const mineRaw = answers[idx];
        const mine =
          q.type === "single"
            ? [mineRaw]
            : Array.isArray(mineRaw)
            ? mineRaw
            : [mineRaw];

        const isRight =
          q.type === "fill"
            ? correct.some((c) => String(c).trim().toLowerCase() === String(mineRaw).trim().toLowerCase())
            : isEqualArr(
                mine.filter(Boolean).sort(),
                correct.filter(Boolean).sort()
              );

        return (
          <div key={idx} style={{ marginBottom: 32 }}>
            <h3>
              {idx + 1}. {q.question}
            </h3>

            {/* ========== 顯示選項 ========== */}
            {(q.type === "single" || q.type === "multiple") && (
              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {q.options.map((opt, i) => {
                  const ltr = letter(i);
                  return (
                    <li key={i}>
                      {ltr}. {opt}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* 填空題無選項，直接略過 */}

            {/* 正確答案 */}
            <p style={{ color: "green", marginBottom: 4 }}>
              ✅ 正解：{q.type === "fill" ? correct[0] : correct.join(", ")}
            </p>

            {/* 我的答案 */}
            <p style={{ marginBottom: 4 }}>
              🧑‍🎓 你的答案：
              {mineRaw === undefined || mineRaw === null || mineRaw === ""
                ? "（未作答）"
                : q.type === "fill"
                ? mineRaw
                : mine.join(", ")}
            </p>

            {/* 正誤提示 */}
            {isRight ? (
              <p style={{ color: "green" }}>✅ 正確</p>
            ) : (
              <p style={{ color: "crimson" }}>❌ 錯誤</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
