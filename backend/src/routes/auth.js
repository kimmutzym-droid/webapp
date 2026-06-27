import express from "express";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { getAuthUrl, exchangeCodeForTokens } from "../services/googleAuth.js";
import { listAvailableBlogs } from "../services/bloggerClient.js";

export const authRouter = express.Router();

authRouter.get("/google", (req, res) => {
  res.redirect(getAuthUrl());
});

authRouter.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await exchangeCodeForTokens(code);
    const bloggerBlogs = await listAvailableBlogs(tokens);

    const insert = db.prepare(`
      INSERT INTO blogs (id, blogger_blog_id, name, url, access_token, refresh_token, token_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);

    for (const b of bloggerBlogs) {
      const existing = db
        .prepare("SELECT id FROM blogs WHERE blogger_blog_id = ?")
        .get(b.id);
      if (existing) {
        db.prepare(
          "UPDATE blogs SET access_token = ?, refresh_token = COALESCE(?, refresh_token), token_expiry = ? WHERE id = ?"
        ).run(tokens.access_token, tokens.refresh_token, tokens.expiry_date, existing.id);
      } else {
        insert.run(
          randomUUID(),
          b.id,
          b.name,
          b.url,
          tokens.access_token,
          tokens.refresh_token,
          tokens.expiry_date
        );
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/blogs?connected=1`);
  } catch (err) {
    console.error(err);
    res.redirect(`${process.env.FRONTEND_URL}/blogs?error=1`);
  }
});
