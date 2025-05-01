import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ViewQuizDetail() {
  const { quizId }      = useParams();
  const [search]        = useSearchParams();
  const editable        = search.get("edit") === "1";
  const navigate        = useNavigate();

  const [quizName, setQuizName]   = useState("");
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving]       = useState(false);

  /* 讀考卷 -------------------------------------------------- */
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "quizzes", quizId));
      if (!snap.exists()) { alert("找不到考卷"); navigate(-1); return; }
      const data = snap.data();
      setQuizName(data.name || "");

      const qs = (data.questions || []).map((q) => {
        const base = { ...q, score: q.score ?? 1 };

        /* 單選：文字 ➜ 字母 -------------------------------- */
        if (q.type === "single" && q.options) {
          if (/^[A-D]$/.test(q.answer)) return base;
          const idx = q.options.findIndex((opt) => opt === q.answer);
          return { ...base, answer: idx >= 0 ? String.fromCharCode(65 + idx) : "" };
        }

        /* 多選：文字陣列 ➜ 字母陣列 -------------------------- */
        if ((q.type === "multiple" || q.type === "multi") &&
            Array.isArray(q.answer) && q.options) {
          if (q.answer.every((v) => /^[A-D]$/.test(v))) return base;
          const arr = q.answer
            .map((t) => {
              const idx = q.options.findIndex((opt) => opt === t);
              return idx >= 0 ? String.fromCharCode(65 + idx) : null;
            })
            .filter(Boolean);
          return { ...base, answer: arr };
        }

        return base;
      });
      setQuestions(qs);
    })();
  }, [quizId, navigate]);

  /* 協助函式 ------------------------------------------------ */
  const changeQ = (i, field, val) =>
    setQuestions((p) => {
      const c = [...p];
      c[i] = { ...c[i], [field]: val };
      return c;
    });

  const changeOpt = (qIdx, optIdx, val) =>
    setQuestions((p) => {
      const c = [...p];
      const opts = [...c[qIdx].options];
      opts[optIdx] = val;
      c[qIdx] = { ...c[qIdx], options: opts };
      return c;
    });

  const toggleMulti = (qIdx, letter) =>
    setQuestions((p) => {
      const c = [...p];
      const arr = Array.isArray(c[qIdx].answer) ? [...c[qIdx].answer] : [];
      c[qIdx].answer = arr.includes(letter) ? arr.filter((l) => l !== letter) : [...arr, letter];
      return c;
    });

  /* 儲存 ---------------------------------------------------- */
  const handleSave = async () => {
    /* ➜  總分不得超過 100  */
    const totalScore = questions.reduce((s, q) => s + (q.score ?? 0), 0);
    if (totalScore > 100) {
      alert(`目前總分 ${totalScore} 分，已超過 100 分，請調整！`);
      return;
    }

    setSaving(true);
    const avg = Math.round(questions.reduce((s, q) => s + (q.difficulty || 0), 0) / questions.length);
    await updateDoc(doc(db, "quizzes", quizId), {
      name: quizName,
      questions,
      averageDifficulty: avg,
    });
    setSaving(false);
    alert("儲存完成！");
  };

  if (!questions.length) return <p>載入中…</p>;

  /* ------------------------ UI ------------------------ */
  return (
    <div style={{ padding: 24 }}>
      <h2>編輯考卷：{quizName}</h2>

      <div style={{ margin: "16px 0" }}>
        <label>考卷名稱：</label>
        <input
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      {questions.map((q, i) => (
        <div key={i} style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
          <h4>第 {i + 1} 題（{q.type}）</h4>

          {/* -------- 題幹 -------- */}
          <div>
            <label>題幹：</label><br />
            <textarea
              rows={2}
              value={q.question}
              onChange={(e) => changeQ(i, "question", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* -------- 選項 -------- */}
          {q.type !== "fill" && (
            <div style={{ marginTop: 8 }}>
              <label>選項：</label>
              {Array.isArray(q.options) && q.options.map((opt, j) => (

                <div key={j} style={{ marginLeft: 20 }}>
                  <strong>{String.fromCharCode(65 + j)}.</strong>
                  <input
                    value={opt}
                    onChange={(e) => changeOpt(i, j, e.target.value)}
                    style={{ width: "80%", marginLeft: 8 }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* -------- 答案 -------- */}
          <div style={{ marginTop: 8 }}>
            <label>答案：</label>
            {q.type === "single" && (
              <select
                value={q.answer}
                onChange={(e) => changeQ(i, "answer", e.target.value)}
                style={{ marginLeft: 8 }}
              >
                <option value="">--</option>
                {["A", "B", "C", "D"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            )}

            {(q.type === "multiple" || q.type === "multi") && (
              <span style={{ marginLeft: 8 }}>
                {["A", "B", "C", "D"].map((l) => (
                  <label key={l} style={{ marginRight: 12 }}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(q.answer) && q.answer.includes(l)}
                      onChange={() => toggleMulti(i, l)}
                    />{" "}
                    {l}
                  </label>
                ))}
              </span>
            )}

            {q.type === "fill" && (
              <input
                value={q.answer}
                onChange={(e) => changeQ(i, "answer", e.target.value)}
                style={{ width: 200, marginLeft: 8 }}
              />
            )}
          </div>

          {/* -------- 難度與分數 -------- */}
          <div style={{ marginTop: 8 }}>
            <label>難度：</label>
            <input
              type="number"
              min={1}
              max={5}
              value={q.difficulty}
              onChange={(e) => changeQ(i, "difficulty", Number(e.target.value))}
              style={{ width: 60, marginLeft: 8 }}
            />
            <label style={{ marginLeft: 24 }}>分數：</label>
            <input
              type="number"
              min={0}
              value={q.score}
              onChange={(e) => changeQ(i, "score", Number(e.target.value))}
              style={{ width: 80, marginLeft: 8 }}
            />
          </div>
        </div>
      ))}

      {editable && (
        <button onClick={handleSave} disabled={saving}>
          {saving ? "儲存中…" : "儲存變更"}
        </button>
      )}
    </div>
  );
}
