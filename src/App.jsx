// 路徑：src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

/* ---------- 公用 ---------- */
import IdentitySelect  from "./components/IdentitySelect";
import AuthPage        from "./components/AuthPage";
import RegisterPage    from "./pages/RegisterPage";

/* ---------- 老師端 ---------- */
import TeacherDashboard  from "./components/TeacherDashboard";
import AiQuizGenerator   from "./components/AiQuizGenerator";  // 產題頁
import TeacherQuizList   from "./pages/TeacherQuizList";      // 列表頁
import ViewQuizDetail    from "./pages/ViewQuizDetail";
import AddCoursePage     from "./pages/AddCoursePage";

/* ---------- 學生端 ---------- */
import StudentHome       from "./pages/StudentHome";
import StudentQuizList   from "./pages/StudentQuizList";
import StudentQuiz       from "./pages/StudentQuiz";
import StudentResult     from "./pages/StudentResult";
import StudentChart      from "./pages/StudentChart";
import StudentLectures   from "./pages/StudentLectures";

function App() {
  return (
    <Routes>
      {/* 公用 */}
      <Route path="/"          element={<IdentitySelect />} />
      <Route path="/login"     element={<AuthPage />} />
      <Route path="/register"  element={<RegisterPage />} />

      {/* 老師端 */}
      <Route path="/teacher"                        element={<TeacherDashboard />} />
      <Route path="/teacher/ai-generate/:courseId"  element={<AiQuizGenerator />} />
      <Route path="/teacher/quizzes/:courseId"      element={<TeacherQuizList />} />
      <Route path="/teacher/quiz/:quizId"           element={<ViewQuizDetail />} />
      <Route path="/teacher/add-course"             element={<AddCoursePage />} />

      {/* 學生端 */}
      <Route path="/student/home"                   element={<StudentHome />} />
      <Route path="/student/quizzes"                element={<StudentQuizList />} />
      <Route path="/student/quiz/:quizId"           element={<StudentQuiz />} />
      {/* ⬇︎ 改為 resultId，對應 StudentResult.jsx 取得 useParams().resultId */}
      <Route path="/student/result/:resultId"       element={<StudentResult />} />
      <Route path="/student/chart"                  element={<StudentChart />} />
      <Route path="/student/lectures"               element={<StudentLectures />} />
    </Routes>
  );
}

export default App;
