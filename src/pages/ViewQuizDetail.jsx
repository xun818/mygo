import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const ViewQuizDetail = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const docRef = doc(db, "quizzes", quizId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setQuiz(docSnap.data());
        } else {
          console.log("❌ 考卷不存在");
        }
      } catch (error) {
        console.error("❌ 無法取得考卷：", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  if (loading) return <p>載入中...</p>;
  if (!quiz) return <p>找不到該考卷</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>📝 考卷詳情：{quiz.name || "未命名"}</h2>
      <p>平均難度：{quiz.avgDifficulty} ⭐</p>

      <ol>
        {quiz.questions.map((q, index) => (
          <li key={index} style={{ marginBottom: "20px" }}>
            <strong>{q.question}</strong>
            <ul>
              {q.options.map((opt, i) => (
                <li key={i}>
                  {opt}{" "}
                  {q.type === "多選"
                    ? q.answer.includes(opt) && <strong>(✔)</strong>
                    : q.answer === opt && <strong>(✔)</strong>}
                </li>
              ))}
            </ul>
            <p>
              題型：{q.type}｜難度：{q.difficulty} ⭐
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ViewQuizDetail;
