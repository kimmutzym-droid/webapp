import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);

  function load() {
    api.getBlogs().then(setBlogs).catch(console.error);
  }

  useEffect(() => {
    load();
  }, []);

  function updateSlots(blog, value) {
    const slots = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    api.updateBlog(blog.id, { timeSlots: slots, dailyLimit: blog.daily_limit }).then(load);
  }

  function updateLimit(blog, value) {
    const limit = Math.min(20, Math.max(1, Number(value) || 1));
    api.updateBlog(blog.id, { dailyLimit: limit, timeSlots: blog.time_slots }).then(load);
  }

  return (
    <div>
      <div className="card">
        <h2>블로그 연결</h2>
        <p>Google 계정으로 로그인해서 운영 중인 Blogger 블로그를 연결하세요.</p>
        <a className="btn" href={api.googleAuthUrl()}>
          Google로 블로그 연결하기
        </a>
      </div>

      {blogs.map((blog) => (
        <div className="card" key={blog.id}>
          <h3>{blog.name}</h3>
          <a href={blog.url} target="_blank" rel="noreferrer">
            {blog.url}
          </a>

          <label>하루 최대 포스팅 수 (최대 20)</label>
          <input
            type="number"
            min={1}
            max={20}
            defaultValue={blog.daily_limit}
            onBlur={(e) => updateLimit(blog, e.target.value)}
          />

          <label>발행 시간대 (한국 시간 기준 HH:MM, 쉼표로 구분, 예: 09:00,13:00,18:00)</label>
          <input
            type="text"
            defaultValue={blog.time_slots.join(",")}
            onBlur={(e) => updateSlots(blog, e.target.value)}
          />

          <button className="btn secondary" onClick={() => api.deleteBlog(blog.id).then(load)}>
            연결 해제
          </button>
        </div>
      ))}

      {blogs.length === 0 && <p>아직 연결된 블로그가 없습니다.</p>}
    </div>
  );
}
