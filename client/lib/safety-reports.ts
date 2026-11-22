export type SafetyConcernCategory =
  | "Poor lighting"
  | "Broken streetlight"
  | "Road hazard"
  | "Harassment concern"
  | "Other";

export type SafetyConcernStatus = "Unverified" | "Verified" | "Resolved";

export interface SafetyConcernReport {
  id: string;
  category: SafetyConcernCategory;
  description: string;
  locationName: string;
  coordinates: [number, number]; // [longitude, latitude]
  status: SafetyConcernStatus;
  createdAt: string;
  updatedAt: string;
  reporterRole: string; // Anonymous, e.g. "Community Resident"
  verificationCount: number;
}

const STORAGE_KEY = "saferstreets_safety_reports_v1";

const INITIAL_REPORTS: SafetyConcernReport[] = [
  {
    id: "rep_safe_101",
    category: "Broken streetlight",
    description: "Streetlight fixture flickering and completely dark between 8 PM and 6 AM.",
    locationName: "North Avenue near Metro Crossing",
    coordinates: [75.8351, 25.0512],
    status: "Verified",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    reporterRole: "Neighborhood Resident",
    verificationCount: 5,
  },
  {
    id: "rep_safe_102",
    category: "Poor lighting",
    description: "Pedestrian walkway along park boundary has non-functional path bollards.",
    locationName: "West Park Perimeter Pathway",
    coordinates: [75.8294, 25.0485],
    status: "Unverified",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    reporterRole: "Community Commuter",
    verificationCount: 1,
  },
  {
    id: "rep_safe_103",
    category: "Road hazard",
    description: "Deep open trench with damaged warning tape near bicycle lane.",
    locationName: "South Market & Industrial Road",
    coordinates: [75.8382, 25.0462],
    status: "Verified",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    reporterRole: "Local Cyclist",
    verificationCount: 8,
  },
  {
    id: "rep_safe_104",
    category: "Harassment concern",
    description: "Group loitering at unmonitored bus bay shouting aggressive remarks at solitary pedestrians.",
    locationName: "Sector 3 Transit Depot (East Bay)",
    coordinates: [75.8271, 25.0531],
    status: "Unverified",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    reporterRole: "Transit Rider",
    verificationCount: 2,
  },
  {
    id: "rep_safe_105",
    category: "Broken streetlight",
    description: "Replacement bulb installed and overhead fixture repaired by utility team.",
    locationName: "Central Library Access Alley",
    coordinates: [75.8335, 25.0498],
    status: "Resolved",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    reporterRole: "Resident Volunteer",
    verificationCount: 12,
  },
];

export function getStoredReports(): SafetyConcernReport[] {
  if (typeof window === "undefined") {
    return INITIAL_REPORTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Initialize storage if absent
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
  } catch (err) {
    console.warn("Could not read safety reports from localStorage:", err);
  }
  return INITIAL_REPORTS;
}

export function saveStoredReports(reports: SafetyConcernReport[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error("Could not write safety reports to localStorage:", err);
  }
}

export async function fetchSafetyReports(): Promise<SafetyConcernReport[]> {
  // Simulate brief realistic latency
  await new Promise((r) => setTimeout(r, 120));
  return getStoredReports();
}

export async function createSafetyReport(data: {
  category: SafetyConcernCategory;
  description: string;
  locationName: string;
  coordinates: [number, number];
}): Promise<SafetyConcernReport> {
  await new Promise((r) => setTimeout(r, 150));

  // Round coordinates to ~100m to preserve privacy
  const fuzzedCoordinates: [number, number] = [
    Math.round(data.coordinates[0] * 1000) / 1000,
    Math.round(data.coordinates[1] * 1000) / 1000,
  ];

  const newReport: SafetyConcernReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: data.category,
    description: data.description.trim(),
    locationName: data.locationName.trim(),
    coordinates: fuzzedCoordinates,
    status: "Unverified",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reporterRole: "Community Member", // Privacy-preserving anonymous tag
    verificationCount: 1,
  };

  const current = getStoredReports();
  const updated = [newReport, ...current];
  saveStoredReports(updated);
  return newReport;
}

export async function updateReportStatus(
  reportId: string,
  newStatus: SafetyConcernStatus
): Promise<SafetyConcernReport | null> {
  await new Promise((r) => setTimeout(r, 100));
  const current = getStoredReports();
  const index = current.findIndex((r) => r.id === reportId);
  if (index === -1) return null;

  const target = current[index];
  const updatedReport: SafetyConcernReport = {
    ...target,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    verificationCount:
      newStatus === "Verified" ? Math.max(target.verificationCount, 2) : target.verificationCount,
  };

  current[index] = updatedReport;
  saveStoredReports(current);
  return updatedReport;
}

export async function verifyReport(reportId: string): Promise<SafetyConcernReport | null> {
  await new Promise((r) => setTimeout(r, 100));
  const current = getStoredReports();
  const index = current.findIndex((r) => r.id === reportId);
  if (index === -1) return null;

  const target = current[index];
  const updatedReport: SafetyConcernReport = {
    ...target,
    verificationCount: target.verificationCount + 1,
    status: target.status === "Unverified" ? "Verified" : target.status,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedReport;
  saveStoredReports(current);
  return updatedReport;
}
