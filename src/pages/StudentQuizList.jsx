// src/pages/StudentQuizList.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/StudentQuizList.css';

export default function StudentQuizList() {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(''); // '' => 全部
  const navigate = useNavigate();

  // 1. 抓取所有課程
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'courses'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourses(list);
    })();
  }, []);

  // 2. 抓取所有考卷
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'quizzes'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuizzes(list);
    })();
  }, []);

  // 3. 篩選：selectedCourse === '' → 全部；否則只留屬於該 courseId 的
  const available = selectedCourse
    ? quizzes.filter(q => q.courseId === selectedCourse)
    : quizzes;

  return (
    <div className="student-quiz-list" style={{ padding: 24 }}>
      <h1>📘 可作答考卷清單</h1>

      <div style={{ marginBottom: 16 }}>
        <label>選擇課程： </label>
        <select
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
        >
          <option value="">全部課程</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {available.length === 0 ? (
        <p>目前沒有考卷</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {available.map(q => (
            <li key={q.id} style={{ marginBottom: 12 }}>
              <strong>{q.name || '未命名考卷'}</strong>{' '}
              （★{Math.round(q.averageDifficulty)}）{' '}
              <button onClick={() => navigate(`/student/quiz/${q.id}`)}>
                作答
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
