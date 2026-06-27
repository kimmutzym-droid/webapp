import { NavLink, Routes, Route } from "react-router-dom";
import BlogsPage from "./pages/BlogsPage.jsx";
import NewPostPage from "./pages/NewPostPage.jsx";
import QueuePage from "./pages/QueuePage.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Blogger 자동화</h1>
        <nav>
          <NavLink to="/blogs" className={({ isActive }) => (isActive ? "active" : "")}>
            블로그 연결
          </NavLink>
          <NavLink to="/new-post" className={({ isActive }) => (isActive ? "active" : "")}>
            포스트 작성
          </NavLink>
          <NavLink to="/queue" className={({ isActive }) => (isActive ? "active" : "")}>
            발행 현황
          </NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<BlogsPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/new-post" element={<NewPostPage />} />
          <Route path="/queue" element={<QueuePage />} />
        </Routes>
      </main>
    </div>
  );
}
