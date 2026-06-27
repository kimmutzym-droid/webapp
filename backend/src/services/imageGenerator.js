import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../../data/uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Pollinations.ai: free AI image generation, no API key required.
// The prompt is URL-encoded into the path and a PNG is returned directly.
const POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt";

export async function generateImage(prompt) {
  const seed = Math.floor(Math.random() * 1_000_000);
  const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pollinations image generation failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const fileName = `${randomUUID()}.png`;
  fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);

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
