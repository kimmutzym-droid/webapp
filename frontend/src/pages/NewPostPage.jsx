import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function NewPostPage() {
  const [blogs, setBlogs] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [selectedBlogIds, setSelectedBlogIds] = useState([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState("");

  useEffect(() => {
    api.getBlogs().then(setBlogs).catch(console.error);
  }, []);

  function toggleBlog(id) {
    setSelectedBlogIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  async function loadIdeas() {
    setLoading(true);
    try {
      const res = await api.getTopicIdeas(5);
      setIdeas(res.ideas);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!prompt || selectedBlogIds.length === 0) return;
    setLoading(true);
    try {
      const res = await api.createPost({
        prompt,
        blogIds: selectedBlogIds,
        scheduledAt: scheduledAt || null,
      });
      setGenerated(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="card">
        <h2>오늘 쓸 주제 추천받기</h2>
        <button className="btn secondary" onClick={loadIdeas} disabled={loading}>
          주제 추천 받기
        </button>
        {ideas && <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{ideas}</pre>}
      </div>

      <div className="card">
        <h2>포스트 작성</h2>
        <label>프롬프트 (주제, 키워드, 지시 사항)</label>
        <textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />

        <label>발행할 블로그 선택</label>
        {blogs.map((blog) => (
          <div key={blog.id}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                style={{ width: "auto" }}
                checked={selectedBlogIds.includes(blog.id)}
                onChange={() => toggleBlog(blog.id)}
              />
              {blog.name}
            </label>
          </div>
        ))}

        <label>예약 발행 시각 (선택, 비워두면 큐에 대기)</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />

        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? "생성 중..." : "AI 글 생성 + 큐에 추가"}
        </button>
      </div>

      {generated && (
        <div className="card">
          <h3>{generated.title}</h3>
          <p>
            <strong>메타 설명:</strong> {generated.metaDescription}
          </p>
          <p>
            <strong>라벨:</strong> {generated.labels?.join(", ")}
          </p>
          <div dangerouslySetInnerHTML={{ __html: generated.bodyHtml }} />
        </div>
      )}
    </div>
  );
}
