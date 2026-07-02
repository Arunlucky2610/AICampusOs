import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, "");
const apiBaseUrl = normalizedBaseUrl.endsWith("/api") ? normalizedBaseUrl : `${normalizedBaseUrl}/api`;

export const api = axios.create({ baseURL: apiBaseUrl, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && localStorage.getItem("refresh_token")) {
      original._retry = true;
      const { data } = await api.post("/auth/refresh-token", { refresh_token: localStorage.getItem("refresh_token") });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);
