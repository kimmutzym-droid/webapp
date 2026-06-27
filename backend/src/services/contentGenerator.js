import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generatePostImages } from "./imageGenerator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.resolve(__dirname, "../../../prompts");

const WRITING_PROMPT = fs.readFileSync(
  path.join(PROMPTS_DIR, "blog-writing-prompt.md"),
  "utf-8"
);
export const KEYWORD_PROMPT = fs.readFileSync(
  path.join(PROMPTS_DIR, "keyword-analysis-prompt.md"),
  "utf-8"
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini's built-in Google Search grounding tool lets the model actually search
// the web instead of guessing, which the keyword prompt's [웹검색 실행 원칙] requires.
async function callGemini(userMessage, { grounding = false } = {}) {
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    tools: grounding ? [{ googleSearch: {} }] : undefined,
  });
  const result = await model.generateContent(userMessage);
  return result.response.text();
}

// Parses the structured output blocks the writing prompt asks the model to emit.
function parseStructuredPost(text) {
  const field = (name) => {
    const re = new RegExp(`${name}:\\s*([\\s\\S]*?)(?=\\n\\w+:|$)`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };
  return {
    title: field("title"),
    metaDescription: field("meta_description"),
    labels: field("labels")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    bodyHtml: field("body_html"),
    sourcesUsed: field("sources_used"),
    disclaimer: field("disclaimer"),
  };
}

// Inserts the thumbnail as the first image (Blogger uses the first post image as
// its auto-detected thumbnail) and places the inline image before the second H2
// section so it breaks up the body roughly midway through.
function insertImages(bodyHtml, { thumbnailUrl, inlineImageUrl }) {
  const thumbnailTag = `<img src="${thumbnailUrl}" alt="thumbnail" />`;
  const inlineTag = `<img src="${inlineImageUrl}" alt="" />`;

  const h2Matches = [...bodyHtml.matchAll(/<h2[^>]*>/gi)];
  let withInline = bodyHtml;
  if (h2Matches.length >= 2) {
    const insertAt = h2Matches[1].index;
    withInline = bodyHtml.slice(0, insertAt) + inlineTag + bodyHtml.slice(insertAt);
  } else {
    withInline = `${bodyHtml}\n${inlineTag}`;
  }

  return `${thumbnailTag}\n${withInline}`;
}

export async function generatePost({ prompt, recentPosts = [] }) {
  const userMessage = `${WRITING_PROMPT}\n\n---\n주제/지시: ${prompt}\n\nrecent_posts: ${JSON.stringify(
    recentPosts
  )}`;

  const text = await callGemini(userMessage, { grounding: true });
  const post = parseStructuredPost(text);

  const { thumbnailUrl, inlineImageUrl } = await generatePostImages({
    title: post.title,
    topic: prompt,
  });
  post.bodyHtml = insertImages(post.bodyHtml, { thumbnailUrl, inlineImageUrl });
  post.thumbnailUrl = thumbnailUrl;
  post.inlineImageUrl = inlineImageUrl;

  return post;
}

export async function generateTopicIdeas({ dailyCount = 5, recentTopics = [] }) {
  const userMessage = `${KEYWORD_PROMPT}\n\n---\n일일 경량 모드: daily_count=${dailyCount}\nrecent_topics_used: ${JSON.stringify(
    recentTopics
  )}`;

  return callGemini(userMessage, { grounding: true });
}
