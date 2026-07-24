require("dotenv").config({ path: ".env.local" });
const { GoogleGenAI } = require("@google/genai");

async function test() {
  const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

  if (!project) {
    console.log("No project ID");
    return;
  }
  
  try {
    const ai = new GoogleGenAI({ vertexai: true, project, location });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say hello",
    });
    console.log("Success:", result.text);
  } catch (err) {
    console.error("AI Error:", err);
  }
}
test();
