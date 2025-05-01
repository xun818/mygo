// 路徑：src/pages/TeacherQuizList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function TeacherQuizList() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "quizzes"),
      where("course_id", "==", courseId)
    );
    getDocs(q).then((snap) =>
      setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [courseId]);

  return (
    <div style={{ padding: 24 }}>
      <h3>AI 考卷 列表</h3>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {quizzes.map((q) => (
          <div
            key={q.id}
            style={{
              width: 180,
              height: 200,
              border: "2px solid red",       /* ★ 改回紅框 */
              borderRadius: 12,
              padding: 16,
              boxSizing: "border-box",
              position: "relative",
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {q.name || `考卷 ${q.id}`}
            </div>

            {/* ★ 顯示難度星等 */}
            <div style={{ marginBottom: 16 }}>
              {Array.from({ length: q.averageDifficulty ?? 0 }).map((_, i) => (
                <span key={i}>★</span>
              ))}
              {Array.from({
                length: Math.max(0, 5 - (q.averageDifficulty ?? 0)),
              }).map((_, i) => (
                <span key={i}>☆</span>
              ))}
            </div>

            {/* 按鈕區域 */}
            <button
              onClick={() => navigate(`/teacher/quiz/${q.id}`)}
              style={{ marginBottom: 8 }}
            >
              查看
            </button>
            <br />
            <button
              onClick={async () => {
                if (window.confirm("確認要刪除此考卷？")) {
                  await deleteDoc(doc(db, "quizzes", q.id));
                  setQuizzes((prev) => prev.filter((x) => x.id !== q.id));
                }
              }}
            >
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
