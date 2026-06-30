export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:8000";

export function getProfileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

export function getInitials(name: string | null | undefined, fallback = "AI"): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || fallback;
}
