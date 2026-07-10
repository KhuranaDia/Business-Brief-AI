import axios from "axios";

// Requests use relative URLs so they work behind the dev proxy (vite) and behind
// nginx / a reverse proxy in production. Override with VITE_API_URL if needed.
const baseURL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export const analyzeData = (data, dataSourceName) =>
  api.post("/api/analyze", { data, data_source_name: dataSourceName });

export const uploadCsv = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/api/upload-csv", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const fetchBriefs = () => api.get("/api/briefs");

export const fetchBrief = (id) => api.get(`/api/briefs/${id}`);

export default api;
