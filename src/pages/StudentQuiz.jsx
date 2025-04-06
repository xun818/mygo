import { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { doc, getDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

export default function StudentQuiz() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuiz = async () => {
      const ref = doc(db, "quizzes", quizId);
      const snap = await getDoc(ref);
      if (snap.exists()) setQuiz(snap.data());
    };
    loadQuiz();
  }, [quizId]);

  const handleChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      const a = answers[idx];
      if (q.type === "多選") {
        const correctSet = new Set(q.answer);
        const userSet = new Set(a ?? []);
        if (
          correctSet.size === userSet.size &&
          [...correctSet].every((v) => userSet.has(v))
        )
          correct++;
      } else {
        if (a === q.answer) correct++;
      }
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    const result = {
      quizId,
      studentId: auth.currentUser?.uid ?? "anonymous",
      score,
      createdAt: Timestamp.now(),
      answers,
    };

    await addDoc(collection(db, "answers"), result);
    navigate(`/student/result`, { state: { quiz, answers, score } });
  };

  if (!quiz) return <p>載入中...</p>;

  return (
    <div style={{ padding: "40px" }}>
      <h2>{quiz.name}</h2>
      <ol>
        {quiz.questions.map((q, idx) => (
          <li key={idx} style={{ marginBottom: "20px" }}>
            <p>{q.question}</p>
            {q.type === "多選" ? (
              q.options.map((opt, i) => (
                <label key={i} style={{ display: "block" }}>
                  <input
                    type="checkbox"
                    checked={answers[idx]?.includes(opt) || false}
                    onChange={(e) => {
                      const prev = new Set(answers[idx] || []);
                      e.target.checked ? prev.add(opt) : prev.delete(opt);
                      handleChange(idx, [...prev]);
                    }}
                  />
                  {opt}
                </label>
              ))
            ) : q.type === "是非" ? (
              ["是", "否"].map((opt, i) => (
                <label key={i}>
                  <input
                    type="radio"
                    name={`q${idx}`}
                    value={opt}
                    checked={answers[idx] === opt}
                    onChange={() => handleChange(idx, opt)}
                  />
                  {opt}
                </label>
              ))
            ) : (
              q.options.map((opt, i) => (
                <label key={i} style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={`q${idx}`}
                    value={opt}
                    checked={answers[idx] === opt}
                    onChange={() => handleChange(idx, opt)}
                  />
                  {opt}
                </label>
              ))
            )}
          </li>
        ))}
      </ol>
      <button onClick={handleSubmit}>提交作答</button>
    </div>
  );
}
