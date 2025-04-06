import { useLocation, useNavigate } from "react-router-dom";

export default function StudentResult() {
  const { state } = useLocation();
  const { quiz, answers, score } = state || {};
  const navigate = useNavigate();

  if (!quiz) return <p>無效資料</p>;

  return (
    <div style={{ padding: "40px" }}>
      <h1>🎉 作答完成！</h1>
      <h2>得分：{score} 分</h2>

      <ol>
        {quiz.questions.map((q, idx) => (
          <li key={idx} style={{ marginBottom: "20px" }}>
            <p>{q.question}</p>
            <p>
              ✅ 正解：{Array.isArray(q.answer) ? q.answer.join(", ") : q.answer}
            </p>
            <p>
              🧑 你的答案：{Array.isArray(answers[idx]) ? answers[idx].join(", ") : answers[idx]}
            </p>
            <p>
              {Array.isArray(q.answer)
                ? JSON.stringify(new Set(q.answer)) ===
                  JSON.stringify(new Set(answers[idx] ?? []))
                  ? "✅ 正確"
                  : "❌ 錯誤"
                : q.answer === answers[idx]
                ? "✅ 正確"
                : "❌ 錯誤"}
            </p>
          </li>
        ))}
      </ol>
      <button onClick={() => navigate("/student/quizzes")}>返回考卷列表</button>
    </div>
  );
}
