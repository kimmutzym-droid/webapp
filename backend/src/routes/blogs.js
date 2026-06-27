import express from "express";
import { db } from "../db/index.js";

export const blogsRouter = express.Router();

blogsRouter.get("/", (req, res) => {
  const blogs = db
    .prepare("SELECT id, name, url, daily_limit, time_slots, created_at FROM blogs ORDER BY created_at DESC")
    .all()
    .map((b) => ({ ...b, time_slots: JSON.parse(b.time_slots) }));
  res.json(blogs);
});

blogsRouter.patch("/:id", (req, res) => {
  const { dailyLimit, timeSlots } = req.body;
  const blog = db.prepare("SELECT * FROM blogs WHERE id = ?").get(req.params.id);
  if (!blog) return res.status(404).json({ error: "not found" });

  const limit = Math.min(20, Math.max(1, Number(dailyLimit ?? blog.daily_limit)));
  const slots = Array.isArray(timeSlots) ? timeSlots : JSON.parse(blog.time_slots);

  db.prepare("UPDATE blogs SET daily_limit = ?, time_slots = ? WHERE id = ?").run(
    limit,
    JSON.stringify(slots),
    req.params.id
  );
  res.json({ ok: true });
});

blogsRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
