import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db/index.js";
import { authRouter } from "./routes/auth.js";
import { blogsRouter } from "./routes/blogs.js";
import { postsRouter } from "./routes/posts.js";
import { startScheduler } from "./jobs/scheduler.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/blogs", blogsRouter);
app.use("/api/posts", postsRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

startScheduler();

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on :${port}`));
