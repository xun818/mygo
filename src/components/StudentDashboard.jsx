import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { supabase } from "../services/supabase";

export default function StudentDashboard({ currentUser }) {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [lectureFiles, setLectureFiles] = useState([]);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const snapshot = await getDocs(collection(db, "courses"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
    };

    const fetchQuizzes = async () => {
      const snapshot = await getDocs(collection(db, "quizzes"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setQuizzes(data);
    };

    const fetchLectures = async () => {
      const { data, error } = await supabase.storage.from("lectures").list("", {
        limit: 100,
      });
      if (!error) setLectureFiles(data);
    };

    const fetchResults = async () => {
      if (!currentUser) return;
      const q = query(
        collection(db, "studentResults"),
        where("studentId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => doc.data());
      setResults(data);
    };

    fetchCourses();
    fetchQuizzes();
    fetchLectures();
    fetchResults();
  }, [currentUser]);

  const getPublicUrl = (filename) => {
    const { data } = supabase.storage.from("lectures").getPublicUrl(filename);
    return data.publicUrl;
  };

  const handleStartQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  return (
    <div className="student-dashboard">
      <h1>🎓 學生主控台</h1>

      <section>
        <h2>📚 我的課程</h2>
        <ul>
          {courses.map((course) => (
            <li key={course.id}>{course.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>📄 上課講義</h2>
        {lectureFiles.length === 0 ? (
          <p>目前沒有講義</p>
        ) : (
          <ul>
            {lectureFiles.map((file) => (
              <li key={file.name}>
                <a href={getPublicUrl(file.name)} target="_blank" rel="noreferrer">
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>📝 可作答考卷</h2>
        {quizzes.length === 0 ? (
          <p>目前尚無考卷</p>
        ) : (
          <ul>
            {quizzes.map((quiz) => (
              <li key={quiz.id}>
                {quiz.name}（{quiz.course}）- 難度：{quiz.avgDifficulty}★
                <button onClick={() => handleStartQuiz(quiz.id)}>開始作答</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>📊 我的作答紀錄</h2>
        {results.length === 0 ? (
          <p>尚無作答資料</p>
        ) : (
          <ul>
            {results.map((r, idx) => (
              <li key={idx}>
                {r.quizName} - 分數：{r.score}，正確率：{r.correctRate}%
                <button onClick={() => navigate(`/result/${r.quizId}`)}>觀看正解</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
