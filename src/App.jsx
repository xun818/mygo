import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import IdentitySelect from "./components/IdentitySelect";
import AuthPage from "./components/AuthPage";
import RegisterPage from "./pages/RegisterPage";

import TeacherDashboard from "./components/TeacherDashboard"; // ✅ 修正路徑

import StudentQuizList from "./pages/StudentQuizList";
import StudentQuiz from "./pages/StudentQuiz";
import StudentResult from "./pages/StudentResult";
import StudentChart from "./pages/StudentChart";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IdentitySelect />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/teacher" element={<TeacherDashboard />} />

        <Route path="/student/quizzes" element={<StudentQuizList />} />
        <Route path="/student/quiz/:quizId" element={<StudentQuiz />} />
        <Route path="/student/result" element={<StudentResult />} />
        <Route path="/student/chart" element={<StudentChart />} />
      </Routes>
    </Router>
  );
}

export default App;
