import express from "express";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { generatePost, generateTopicIdeas } from "../services/contentGenerator.js";

export const postsRouter = express.Router();

function recentPostTitles(limit = 20) {
  return db
    .prepare("SELECT title FROM posts ORDER BY created_at DESC LIMIT ?")
    .all(limit)
    .map((r) => r.title)
    .filter(Boolean);
}

postsRouter.get("/", (req, res) => {
  const posts = db
    .prepare(
      `SELECT p.id, p.title, p.created_at,
              pt.id as target_id, pt.blog_id, pt.status, pt.scheduled_at, pt.published_at, pt.error,
              b.name as blog_name
       FROM posts p
       JOIN post_targets pt ON pt.post_id = p.id
       JOIN blogs b ON b.id = pt.blog_id
       ORDER BY p.created_at DESC`
    )
    .all();
  res.json(posts);
});

// Generate content from a prompt and queue it for one or more selected blogs.
postsRouter.post("/", async (req, res) => {
  const { prompt, blogIds, scheduledAt } = req.body;
  if (!prompt || !Array.isArray(blogIds) || blogIds.length === 0) {
    return res.status(400).json({ error: "prompt and blogIds are required" });
  }

  try {
    const generated = await generatePost({ prompt, recentPosts: recentPostTitles() });
    const postId = randomUUID();

    db.prepare(
      `INSERT INTO posts (id, prompt, title, body_html, meta_description, labels, sources_used, disclaimer, thumbnail_url, inline_image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      postId,
      prompt,
      generated.title,
      generated.bodyHtml,
      generated.metaDescription,
      JSON.stringify(generated.labels),
      generated.sourcesUsed,
      generated.disclaimer,
      generated.thumbnailUrl,
      generated.inlineImageUrl
    );

    const insertTarget = db.prepare(
      `INSERT INTO post_targets (id, post_id, blog_id, status, scheduled_at) VALUES (?, ?, ?, 'pending', ?)`
    );
    for (const blogId of blogIds) {
      insertTarget.run(randomUUID(), postId, blogId, scheduledAt || null);
    }

    res.status(201).json({ postId, ...generated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "generation failed" });
  }
});

postsRouter.post("/topics", async (req, res) => {
  const { dailyCount } = req.body;
  try {
    const recentTopics = recentPostTitles(30);
    const ideas = await generateTopicIdeas({ dailyCount: dailyCount || 5, recentTopics });
    res.json({ ideas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "topic generation failed" });
  }
});

postsRouter.post("/targets/:id/retry", (req, res) => {
  db.prepare("UPDATE post_targets SET status = 'pending', error = NULL WHERE id = ?").run(
    req.params.id
  );
  res.json({ ok: true });
});
