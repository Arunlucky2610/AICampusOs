import { api } from "./client";
import type { CompanyData, StudentEligibilityResult } from "../types/placement";

function normalizeEligibility(raw: Record<string, unknown>): StudentEligibilityResult {
  return {
    companyId: (raw.company_id ?? raw.companyId ?? 0) as number,
    companyName: String(raw.company_name ?? raw.companyName ?? ""),
    role: String(raw.role ?? ""),
    package: String(raw.package ?? ""),
    driveDate: (raw.drive_date ?? raw.driveDate ?? null) as string | null,
    status: String(raw.status ?? ""),
    eligible: Boolean(raw.eligible ?? false),
    reasons: Array.isArray(raw.reasons ?? raw.reasons) ? (raw.reasons as string[]) : [],
    matchScore: Number(raw.match_score ?? raw.matchScore ?? 0),
    criteriaMet: (raw.criteria_met ?? raw.criteriaMet ?? {}) as Record<string, boolean>,
  };
}

export async function fetchCompanies(): Promise<CompanyData[]> {
  const { data } = await api.get("/companies");
  return data;
}

export async function fetchCompany(id: number): Promise<CompanyData> {
  const { data } = await api.get(`/companies/${id}`);
  return data;
}

export async function createCompany(body: Partial<CompanyData>): Promise<CompanyData> {
  const { data } = await api.post("/companies", body);
  return data;
}

export async function updateCompany(id: number, body: Partial<CompanyData>): Promise<CompanyData> {
  const { data } = await api.put(`/companies/${id}`, body);
  return data;
}

export async function deleteCompany(id: number): Promise<void> {
  await api.delete(`/companies/${id}`);
}

export async function fetchMyEligibility(): Promise<StudentEligibilityResult[]> {
  const { data } = await api.get("/companies/eligibility/mine");
  if (!Array.isArray(data)) return [];
  return data.map(normalizeEligibility);
}
