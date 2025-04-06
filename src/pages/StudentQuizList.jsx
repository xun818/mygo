import { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function StudentQuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [recommendedLevel, setRecommendedLevel] = useState(2);
  const navigate = useNavigate();

  // 取得推薦難度
  useEffect(() => {
    const fetchAnswers = async () => {
      const q = query(
        collection(db, "answers"),
        where("studentId", "==", auth.currentUser?.uid ?? "anonymous")
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => doc.data());

      // 根據難度分類最近連續 3 次作答
      const historyByLevel = {};
      results.forEach((r) => {
        const level = r.quizAvgDifficulty ?? 2;
        historyByLevel[level] = historyByLevel[level] || [];
        historyByLevel[level].push(r.score);
      });

      // 推薦邏輯：連續三次在某難度答對率高 → 推薦升級
      let best = 2;
      for (let level = 1; level <= 5; level++) {
        const scores = historyByLevel[level] || [];
        const recent = scores.slice(-3);
        const highAccuracy = recent.every((s) => s >= 80);
        if (recent.length === 3 && highAccuracy) {
          best = Math.min(5, level + 1); // 升級
        }
      }

      setRecommendedLevel(best);
    };

    fetchAnswers();
  }, []);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const snapshot = await getDocs(collection(db, "quizzes"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 推薦優先排序
      const sorted = list.sort((a, b) => {
        if (a.avgDifficulty === recommendedLevel && b.avgDifficulty !== recommendedLevel) return -1;
        if (b.avgDifficulty === recommendedLevel && a.avgDifficulty !== recommendedLevel) return 1;
        return 0;
      });

      setQuizzes(sorted);
    };

    fetchQuizzes();
  }, [recommendedLevel]);

  return (
    <div style={{ padding: "40px" }}>
      <h1>📘 可作答考卷清單</h1>
      <p>⭐ 推薦難度：{recommendedLevel} 顆星</p>
      <ul>
        {quizzes.map((quiz) => (
          <li
            key={quiz.id}
            style={{
              border:
                quiz.avgDifficulty === recommendedLevel
                  ? "3px solid gold"
                  : "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "10px",
            }}
          >
            <strong>{quiz.name}</strong>（{quiz.avgDifficulty} 星）
            <br />
            <button onClick={() => navigate(`/student/quiz/${quiz.id}`)}>開始作答</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
