import { apiFetch } from "@/lib/api";

export type SafetyConcernCategory =
  | "Poor lighting"
  | "Broken streetlight"
  | "Road hazard"
  | "Pothole"
  | "Garbage"
  | "Damaged footpath"
  | "Unsafe crossing"
  | "Harassment concern"
  | "Other";

export type SafetyConcernStatus =
  | "Unverified"
  | "Verified"
  | "In Progress"
  | "Resolved";

export interface SafetyConcernReport {
  id: string;
  category: SafetyConcernCategory;
  description: string;
  locationName: string;
  coordinates: [number, number];
  status: SafetyConcernStatus;
  createdAt: string;
  updatedAt: string;
  reporterRole: string;
  verificationCount: number;
  imageUrl?: string | null;
}

interface ApiIssue {
  id: string;
  category: SafetyConcernCategory;
  description: string;
  locationName: string;
  longitude: number;
  latitude: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  verificationCount: number;
  imageUrl?: string | null;
  reporter?: { role?: string };
}

function fromApi(issue: ApiIssue): SafetyConcernReport {
  const status: SafetyConcernStatus =
    issue.status === "RESOLVED" ? "Resolved" :
    issue.status === "IN_PROGRESS" ? "In Progress" :
    issue.status === "VERIFIED" ? "Verified" : "Unverified";
  return {
    id: issue.id,
    category: issue.category,
    description: issue.description,
    locationName: issue.locationName,
    coordinates: [issue.longitude, issue.latitude],
    status,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    reporterRole: "Community Member",
    verificationCount: issue.verificationCount,
    imageUrl: issue.imageUrl || null,
  };
}

export async function fetchSafetyReports(): Promise<SafetyConcernReport[]> {
  const issues = await apiFetch<ApiIssue[]>("/community-issues");
  return issues.map(fromApi);
}

export async function uploadSafetyImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch<{ url: string }>("/uploads", {
    method: "POST",
    body: formData,
  });
  return result.url;
}

export async function createSafetyReport(data: {
  category: SafetyConcernCategory;
  description: string;
  locationName: string;
  coordinates: [number, number];
  imageUrl?: string | null;
}): Promise<SafetyConcernReport> {
  const issue = await apiFetch<ApiIssue>("/community-issues", {
    method: "POST",
    body: JSON.stringify({
      category: data.category,
      description: data.description.trim(),
      locationName: data.locationName.trim(),
      longitude: Math.round(data.coordinates[0] * 1000) / 1000,
      latitude: Math.round(data.coordinates[1] * 1000) / 1000,
      imageUrl: data.imageUrl || null,
    }),
  });
  return fromApi(issue);
}

export async function updateReportStatus(
  reportId: string,
  newStatus: SafetyConcernStatus,
): Promise<SafetyConcernReport | null> {
  const status = newStatus === "Resolved" ? "RESOLVED" :
    newStatus === "In Progress" ? "IN_PROGRESS" :
    newStatus === "Verified" ? "VERIFIED" : "UNVERIFIED";
  const issue = await apiFetch<ApiIssue>(`/community-issues/${encodeURIComponent(reportId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return fromApi(issue);
}

export async function verifyReport(reportId: string): Promise<SafetyConcernReport | null> {
  const issue = await apiFetch<ApiIssue>(`/community-issues/${encodeURIComponent(reportId)}/verify`, {
    method: "POST",
  });
  return fromApi(issue);
}
