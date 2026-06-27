import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function QueuePage() {
  const [rows, setRows] = useState([]);

  function load() {
    api.getPosts().then(setRows).catch(console.error);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <h2>발행 현황</h2>
      <table>
        <thead>
          <tr>
            <th>제목</th>
            <th>블로그</th>
            <th>상태</th>
            <th>예약 시각</th>
            <th>발행 시각</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.target_id}>
              <td>{r.title}</td>
              <td>{r.blog_name}</td>
              <td>
                <span className={`badge ${r.status}`}>{r.status}</span>
              </td>
              <td>{r.scheduled_at || "-"}</td>
              <td>{r.published_at || "-"}</td>
              <td>
                {r.status === "failed" && (
                  <button
                    className="btn secondary"
                    onClick={() => api.retryTarget(r.target_id).then(load)}
                  >
                    재시도
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p>아직 큐에 등록된 포스트가 없습니다.</p>}
    </div>
  );
}
