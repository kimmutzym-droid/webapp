const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const api = {
  getBlogs: () => request("/blogs"),
  updateBlog: (id, data) =>
    request(`/blogs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBlog: (id) => request(`/blogs/${id}`, { method: "DELETE" }),
  getPosts: () => request("/posts"),
  createPost: (data) => request("/posts", { method: "POST", body: JSON.stringify(data) }),
  getTopicIdeas: (dailyCount) =>
    request("/posts/topics", { method: "POST", body: JSON.stringify({ dailyCount }) }),
  retryTarget: (id) => request(`/posts/targets/${id}/retry`, { method: "POST" }),
  googleAuthUrl: () => `${BASE_URL}/auth/google`,
};
