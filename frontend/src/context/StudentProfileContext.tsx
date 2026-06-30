import { createContext, ReactNode, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import type { StudentProfile } from "../types";

type ProfileCompletion = {
  percent: number;
  missing: string[];
};

type StudentProfileContextValue = {
  profile: StudentProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  updateProfile: (data: Partial<StudentProfile>) => Promise<StudentProfile>;
  isUpdating: boolean;
  completion: ProfileCompletion;
};

const defaultProfile = (name: string, email: string): StudentProfile => ({
  id: 0,
  user_id: 0,
  roll_number: "",
  registration_number: null,
  department: "Computer Science",
  course: "B.Tech",
  branch: null,
  section: null,
  year: 1,
  semester: 1,
  academic_year: null,
  date_of_birth: null,
  gender: null,
  phone_number: null,
  address: null,
  profile_photo_url: null,
  cgpa: null,
  current_semester_gpa: null,
  attendance_percentage: null,
  credits_earned: null,
  total_credits: 180,
  faculty_advisor: null,
  placement_readiness_score: null,
  risk_score: null,
  skill_score: null,
  resume_score: null,
  coding_score: null,
  mock_interview_score: null,
  communication_score: null,
  applications: null,
  eligible_companies: null,
  offers: null,
  preferred_role: null,
  expected_package: null,
  semester_gpas: [],
  subjects_data: [],
  skills_data: {},
  certifications: [],
  eligible_companies_list: [],
  applied_companies_list: [],
  github_url: null,
  linkedin_url: null,
  leetcode_url: null,
  portfolio_url: null,
  resume_url: null,
  parent_name: null,
  parent_phone: null,
  parent_email: null,
});

const StudentProfileContext = createContext<StudentProfileContextValue | null>(null);

export function StudentProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => (await api.get<StudentProfile>("/student/profile")).data,
    enabled: isStudent,
    staleTime: 30_000,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: async (body: Partial<StudentProfile>) =>
      (await api.put<StudentProfile>("/student/profile", body)).data,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      queryClient.invalidateQueries({ queryKey: ["coding-progress"] });
    },
    onError: (err) => {
      console.error("[StudentProfile] Save failed:", err);
    },
  });

  const profile = data ?? (isStudent ? defaultProfile(user?.full_name || "Student", user?.email || "") : null);

  const completion = useMemo((): ProfileCompletion => {
    if (!profile) return { percent: 0, missing: [] };
    const checks: [string, boolean][] = [
      ["Profile Photo", !!(data?.profile_photo_url)],
      ["Roll Number", !!profile.roll_number && profile.roll_number !== `TEMP-${profile.user_id}`],
      ["Registration Number", !!profile.registration_number],
      ["Department", !!profile.department && profile.department !== "Not Set"],
      ["Course", !!profile.course],
      ["Branch", !!profile.branch],
      ["Section", !!profile.section],
      ["Year", profile.year > 0],
      ["Semester", !!profile.semester],
      ["Academic Year", !!profile.academic_year],
      ["Date of Birth", !!profile.date_of_birth],
      ["Gender", !!profile.gender],
      ["Phone Number", !!profile.phone_number],
      ["Address", !!profile.address],
      ["Faculty Advisor", !!profile.faculty_advisor],
      ["CGPA", profile.cgpa != null && profile.cgpa > 0],
      ["Skills", Object.keys(profile.skills_data).length > 0],
      ["Certifications", profile.certifications.length > 0],
      ["GitHub", !!profile.github_url],
      ["LinkedIn", !!profile.linkedin_url],
      ["Parent Name", !!profile.parent_name],
    ];
    const filled = checks.filter(([, ok]) => ok).length;
    const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
    return { percent: Math.round((filled / checks.length) * 100), missing };
  }, [profile, data]);

  const value = useMemo(
    () => ({
      profile,
      loading: isLoading,
      error: error as Error | null,
      refetch,
      updateProfile: async (body: Partial<StudentProfile>) => mutation.mutateAsync(body),
      isUpdating: mutation.isPending,
      completion,
    }),
    [profile, isLoading, error, refetch, mutation.isPending, completion]
  );

  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfile() {
  const ctx = useContext(StudentProfileContext);
  if (!ctx) throw new Error("useStudentProfile must be used within StudentProfileProvider");
  return ctx;
}

export function useOptionalStudentProfile(): StudentProfileContextValue {
  try {
    return useStudentProfile();
  } catch {
    return {
      profile: null,
      loading: false,
      error: null,
      refetch: () => {},
      updateProfile: async () => { throw new Error("Not a student"); },
      isUpdating: false,
      completion: { percent: 0, missing: [] },
    };
  }
}
