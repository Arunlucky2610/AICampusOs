export type Role = "STUDENT" | "FACULTY" | "PARENT" | "PLACEMENT_OFFICER" | "ADMIN";
export type User = { id: number; full_name: string; email: string; role: Role; is_active: boolean; is_verified: boolean; created_at: string };
export type Dashboard = { role: Role; kpis: { label: string; value: string | number; trend: string }[]; charts: Record<string, any>; tables: Record<string, any>; notifications: any[]; predictions: any[]; recommendations: string[] };
