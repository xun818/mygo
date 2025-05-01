import { useEffect, useState } from "react";
import { db, storage } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

export default function StudentLectures() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [lectureList, setLectureList] = useState([]);

  /* 取得所有課程供下拉 */
  const fetchCourses = async () => {
    const snap = await getDocs(collection(db, "courses"));
    setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* 依課程抓講義 */
  const fetchLectures = async (courseId = "") => {
    const snap = await getDocs(collection(db, "lectures"));
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (courseId) list = list.filter((l) => l.courseId === courseId);

    // 取得 Storage URL，fallback to filePath
    const withUrl = await Promise.all(
      list.map(async (l) => {
        const path = l.storagePath ?? l.filePath;
        const url  = path ? await getDownloadURL(ref(storage, path)) : "";
        return { ...l, url };
      })
    );
    setLectureList(withUrl);
  };

  useEffect(() => {
    fetchCourses();
    fetchLectures(); // 預設顯示全部
  }, []);

  const handleSelect = (e) => {
    const cid = e.target.value;
    setSelectedCourse(cid);
    fetchLectures(cid);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📚 講義</h2>

      {/* 課程下拉 */}
      <select value={selectedCourse} onChange={handleSelect}>
        <option value="">全部課程</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* 講義卡片 */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        {lectureList.map((lec, idx) => (
          <div
            key={lec.id}
            style={{
              border: "2px solid red",
              width: "180px",
              height: "250px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "60px" }}>📄</div>
            <p>講義 {idx + 1}</p>
            <p style={{ fontSize: "14px", color: "gray" }}>{lec.fileName}</p>
            {lec.url ? (
              <a href={lec.url} target="_blank" rel="noreferrer">
                查看
              </a>
            ) : (
              <p style={{ color: "gray" }}>尚無檔案</p>
            )}
          </div>
        ))}
        {lectureList.length === 0 && <p>目前無講義</p>}
      </div>
    </div>
  );
}
