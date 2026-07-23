const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

if (!project) {
  console.error("Missing GOOGLE_CLOUD_PROJECT_ID in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ vertexai: true, project, location });
const filesList = fs.readFileSync('needs_schema.txt', 'utf8').split('\n').filter(Boolean);

async function processFile(filePath) {
  console.log('Processing:', filePath);
  const code = fs.readFileSync(filePath, 'utf8');
  
  const prompt = `You are a strict TypeScript AST modifier. I will provide you with a Next.js route.ts file.
Your job is to:
1. Add \`import { z } from "zod";\` at the top if it doesn't exist.
2. For any place where \`req.json()\`, \`request.json()\`, \`searchParams.get\`, or \`formData()\` is called, create a Zod schema defining the expected fields. (Infer types based on usage or destructured variables).
3. Call \`.safeParse()\` with the schema.
4. If validation fails, return \`NextResponse.json({ error: "Invalid input" }, { status: 400 })\`.
5. Only return the final raw file content. Do not include markdown blocks like \`\`\`typescript. Just the raw code. Do not change existing logic unnecessarily, just wrap the input parsing in a zod safeParse.

Here is the file:
${code}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    
    let newCode = response.text;
    if (newCode.startsWith('\`\`\`typescript')) {
      newCode = newCode.substring(13, newCode.length - 3);
    } else if (newCode.startsWith('\`\`\`')) {
      newCode = newCode.substring(3, newCode.length - 3);
    }
    
    fs.writeFileSync(filePath, newCode.trim() + '\n');
    console.log('Successfully updated:', filePath);
  } catch (err) {
    console.error('Failed on:', filePath, err);
  }
}

async function run() {
  for (let i = 0; i < filesList.length; i++) {
    await processFile(filesList[i]);
    // Sleep a bit to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('Done!');
}

run();
