import { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function StudentChart() {
  const [scoreData, setScoreData] = useState([]);
  const [radarData, setRadarData] = useState([]);

  useEffect(() => {
    const fetchAnswers = async () => {
      const q = query(
        collection(db, "answers"),
        where("studentId", "==", auth.currentUser?.uid ?? "anonymous")
      );
      const snapshot = await getDocs(q);

      const results = snapshot.docs.map((doc) => doc.data());
      const barData = results.map((r) => ({
        name: r.quizName ?? "未命名考卷",
        score: r.score,
      }));

      const typeStats = { 單選: [], 多選: [], 是非: [] };
      results.forEach((r) => {
        const quiz = r.quiz || {}; // 存 quiz 題目快照（選填）
        (quiz.questions || []).forEach((q, i) => {
          const type = q.type;
          const correct = Array.isArray(q.answer)
            ? JSON.stringify(new Set(q.answer)) === JSON.stringify(new Set(r.answers?.[i] ?? []))
            : q.answer === r.answers?.[i];
          typeStats[type]?.push(correct ? 1 : 0);
        });
      });

      const radarData = Object.entries(typeStats).map(([type, list]) => ({
        type,
        accuracy:
          list.length > 0
            ? Math.round((list.filter((v) => v).length / list.length) * 100)
            : 0,
      }));

      setScoreData(barData);
      setRadarData(radarData);
    };

    fetchAnswers();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>📊 學生成績圖表分析</h1>

      <h3>各考卷得分</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={scoreData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="score" fill="#4a90e2" />
        </BarChart>
      </ResponsiveContainer>

      <h3>各題型正確率（%）</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="type" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
