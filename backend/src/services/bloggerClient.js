import { google } from "googleapis";
import { db } from "../db/index.js";
import { clientWithTokens } from "./googleAuth.js";

function authorizedClient(blog) {
  const auth = clientWithTokens({
    access_token: blog.access_token,
    refresh_token: blog.refresh_token,
    expiry_date: blog.token_expiry,
  });
  return google.blogger({ version: "v3", auth });
}

export async function listAvailableBlogs(tokens) {
  const auth = clientWithTokens(tokens);
  const blogger = google.blogger({ version: "v3", auth });
  const res = await blogger.blogs.listByUser({ userId: "self" });
  return res.data.items || [];
}

export async function publishPost(blog, { title, bodyHtml, labels }) {
  const blogger = authorizedClient(blog);
  const res = await blogger.posts.insert({
    blogId: blog.blogger_blog_id,
    requestBody: {
      title,
      content: bodyHtml,
      labels: labels || [],
    },
  });
  return res.data;
}

export function saveBlogTokens(blogId, tokens) {
  db.prepare(
    `UPDATE blogs SET access_token = ?, refresh_token = COALESCE(?, refresh_token), token_expiry = ? WHERE id = ?`
  ).run(tokens.access_token, tokens.refresh_token, tokens.expiry_date, blogId);
}
