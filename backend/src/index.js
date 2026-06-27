import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./db/index.js";
import { authRouter } from "./routes/auth.js";
import { blogsRouter } from "./routes/blogs.js";
import { postsRouter } from "./routes/posts.js";
import { startScheduler } from "./jobs/scheduler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// Generated thumbnail/inline images are served from here; Blogger fetches them
// by URL when rendering the post, so APP_BASE_URL must be publicly reachable in production.
app.use("/uploads", express.static(path.resolve(__dirname, "../data/uploads")));

app.use("/api/auth", authRouter);
app.use("/api/blogs", blogsRouter);
app.use("/api/posts", postsRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

startScheduler();

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on :${port}`));
