import cron from "node-cron";
import { db } from "../db/index.js";
import { publishPost, saveBlogTokens } from "../services/bloggerClient.js";

function countPublishedToday(blogId) {
  const row = db
    .prepare(
      `SELECT COUNT(*) as n FROM post_targets
       WHERE blog_id = ? AND status = 'published' AND date(published_at, '+9 hours') = date('now', '+9 hours')`
    )
    .get(blogId);
  return row.n;
}

const KST_OFFSET_MINUTES = 9 * 60;

function isSlotDue(timeSlots) {
  const now = new Date(Date.now() + KST_OFFSET_MINUTES * 60 * 1000);
  const hhmm = now.toISOString().slice(11, 16); // user enters slots in KST (UTC+9)
  return timeSlots.some((slot) => slot === hhmm);
}

async function runTick() {
  const blogs = db.prepare("SELECT * FROM blogs").all();

  for (const blog of blogs) {
    const timeSlots = JSON.parse(blog.time_slots || "[]");
    if (timeSlots.length === 0) continue;
    if (!isSlotDue(timeSlots)) continue;

    const publishedToday = countPublishedToday(blog.id);
    if (publishedToday >= blog.daily_limit) continue;

    const due = db
      .prepare(
        `SELECT pt.*, p.title, p.body_html, p.labels FROM post_targets pt
         JOIN posts p ON p.id = pt.post_id
         WHERE pt.blog_id = ? AND pt.status = 'pending'
         ORDER BY pt.created_at ASC LIMIT 1`
      )
      .get(blog.id);
    if (!due) continue;

    try {
      const result = await publishPost(blog, {
        title: due.title,
        bodyHtml: due.body_html,
        labels: JSON.parse(due.labels || "[]"),
      });
      db.prepare(
        `UPDATE post_targets SET status = 'published', published_at = datetime('now'), blogger_post_id = ? WHERE id = ?`
      ).run(result.id, due.id);
    } catch (err) {
      db.prepare(`UPDATE post_targets SET status = 'failed', error = ? WHERE id = ?`).run(
        String(err.message || err),
        due.id
      );
    }
  }
}

// Checks every minute; each blog's configured time slots and daily limit gate actual publishing.
export function startScheduler() {
  cron.schedule("* * * * *", () => {
    runTick().catch((err) => console.error("scheduler tick failed", err));
  });
}
