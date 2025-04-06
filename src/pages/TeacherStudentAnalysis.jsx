import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

export default function TeacherStudentAnalysis() {
  const [answers, setAnswers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentList, setStudentList] = useState([]);

  useEffect(() => {
    const fetchAnswers = async () => {
      const snapshot = await getDocs(collection(db, "answers"));
      const data = snapshot.docs.map((doc) => doc.data());
      setAnswers(data);

      // 彙整學生列表
      const ids = [...new Set(data.map((r) => r.studentId))];
      setStudentList(ids);
    };
    fetchAnswers();
  }, []);

  const getScoreChart = () => {
    const records = answers.filter((a) => a.studentId === selectedStudent);
    return records.map((r, i) => ({
      name: r.quizName ?? `考卷 ${i + 1}`,
      score: r.score,
    }));
  };

  const getRadarChart = () => {
    const records = answers.filter((a) => a.studentId === selectedStudent);
    const typeStats = { 單選: [], 多選: [], 是非: [] };

    records.forEach((r) => {
      const quiz = r.quiz || {};
      (quiz.questions || []).forEach((q, i) => {
        const type = q.type;
        const correct = Array.isArray(q.answer)
          ? JSON.stringify(new Set(q.answer)) === JSON.stringify(new Set(r.answers?.[i] ?? []))
          : q.answer === r.answers?.[i];
        typeStats[type]?.push(correct ? 1 : 0);
      });
    });

    return Object.entries(typeStats).map(([type, list]) => ({
      type,
      accuracy:
        list.length > 0
          ? Math.round((list.filter((v) => v).length / list.length) * 100)
          : 0,
    }));
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>👩‍🏫 老師 - 學生成績分析</h1>

      <label>選擇學生：</label>
      <select
        onChange={(e) => setSelectedStudent(e.target.value)}
        value={selectedStudent || ""}
      >
        <option value="">請選擇</option>
        {studentList.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {selectedStudent && (
        <>
          <h3>📊 各考卷得分</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getScoreChart()}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#4a90e2" />
            </BarChart>
          </ResponsiveContainer>

          <h3>📈 題型能力分析</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={getRadarChart()}>
              <PolarGrid />
              <PolarAngleAxis dataKey="type" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                dataKey="accuracy"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
