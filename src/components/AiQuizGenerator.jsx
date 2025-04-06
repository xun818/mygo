import { useState } from "react";
import { extractTextFromPDF } from "../utils/pdfToText";
import OpenAI from "openai";

export default function AiQuizGenerator({ onQuizGenerated }) {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [targetDifficulty, setTargetDifficulty] = useState(2);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // ✅ 1. 多份 PDF → 轉文字
      const texts = [];
      for (const file of pdfFiles) {
        const text = await extractTextFromPDF(file);
        texts.push(text);
      }
      const fullText = texts.join("\n\n");

      // ✅ 2. OpenAI v4 初始化（支援瀏覽器）
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      // ✅ 3. 組 prompt
      const prompt = `
以下是講義內容，請根據內容幫我出題：
-----
${fullText}
-----
請幫我出 5 題，格式如下：
- 3 題單選題（type: 單選）
- 1 題多選題（type: 多選）
- 1 題是非題（type: 是非）

每題請用 JSON 陣列格式表示，每題包含：
- question：題幹
- options：選項陣列（若是是非，則為 ["是", "否"]）
- answer：正確答案（單選為字串，多選為陣列，是非為字串）
- type：題型（單選 / 多選 / 是非）
- difficulty：難度預估（1~5 顆星，整數）

平均難度請盡可能接近 ${targetDifficulty} 星。
`;

      // ✅ 4. 呼叫 GPT
      const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      });

      const raw = res.choices[0].message.content;

      // ✅ 5. 擷取 JSON 題組
      const start = raw.indexOf("[");
      const end = raw.lastIndexOf("]");
      const jsonString = raw.slice(start, end + 1);
      const quiz = JSON.parse(jsonString);

      onQuizGenerated(quiz); // 回傳給外部儲存
    } catch (err) {
      console.error("❌ AI 出題失敗：", err);
      setErrorMsg("AI 出題失敗：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "12px" }}>
      <h3>🤖 AI 自動出題</h3>

      <label>上傳講義 PDF（可多個）</label>
      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => setPdfFiles([...e.target.files])}
      />

      <label style={{ marginTop: "10px" }}>
        目標平均難度（1~5 顆星）：
        <select
          value={targetDifficulty}
          onChange={(e) => setTargetDifficulty(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} 星
            </option>
          ))}
        </select>
      </label>

      <br />
      <button onClick={handleGenerate} disabled={loading || !pdfFiles.length}>
        {loading ? "產生中..." : "產生 AI 題目"}
      </button>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
    </div>
  );
}
