import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../../data/uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateImage(prompt) {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
  });

  const base64 = result.data[0].b64_json;
  const fileName = `${randomUUID()}.png`;
  fs.writeFileSync(path.join(UPLOADS_DIR, fileName), Buffer.from(base64, "base64"));

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:4000";
  return `${baseUrl}/uploads/${fileName}`;
}

export async function generatePostImages({ title, topic }) {
  const thumbnailUrl = await generateImage(
    `블로그 글 썸네일 이미지. 주제: ${title || topic}. 텍스트나 글자 없이, 깔끔하고 클릭을 유도하는 사진/일러스트 스타일.`
  );
  const inlineImageUrl = await generateImage(
    `블로그 본문에 들어갈 보조 이미지. 주제: ${title || topic}. 텍스트나 글자 없이, 본문 내용을 보완하는 사진/일러스트 스타일.`
  );
  return { thumbnailUrl, inlineImageUrl };
}
