export async function generateQuizFromLecture(text, targetDifficulty = 2) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
    const prompt = `
  你是一位專業的出題 AI，請根據以下講義內容，產生一份包含 5 題的考卷：
  - 題型為：3 題單選、1 題多選、1 題是非題
  - 每題包含：題目、選項（若有）、正解、難度（1~5 顆星）
  - 請根據題目難易程度自行評估難度
  - 平均難度請盡量靠近 ${targetDifficulty} 顆星
  
  講義內容如下：
  """
  ${text.slice(0, 5000)}  // 為避免 token 過長先取前 5000 字
  """
  
  請用以下 JSON 陣列格式回傳：
  
  [
    {
      "type": "單選",
      "question": "哪一項是 HTML 的區塊元素？",
      "options": ["<span>", "<div>", "<a>", "<img>"],
      "answer": "<div>",
      "difficulty": 2
    },
    {
      "type": "多選",
      "question": "...",
      "options": [...],
      "answer": ["A", "B"],
      "difficulty": 3
    },
    ...
  ]
  `;
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });
  
    const result = await response.json();
    const rawText = result.choices?.[0]?.message?.content ?? "";
    try {
      return JSON.parse(rawText);
    } catch (err) {
      console.error("解析 JSON 失敗：", rawText);
      throw new Error("AI 回傳格式錯誤，無法解析考卷 JSON。");
    }
  }
  