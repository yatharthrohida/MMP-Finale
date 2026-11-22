export type SafeAlertIncidentType =
  | "Harassment / immediate threat"
  | "Assault / violence"
  | "Suspected child or vulnerable-person endangerment"
  | "Other emergency";

export type SafeAlertStatus =
  | "Unverified"
  | "Reviewed"
  | "Resolved"
  | "False report"
  | "Withdrawn";

export interface SafeAlertIncident {
  id: string;
  incidentType: SafeAlertIncidentType;
  description: string;
  locationName: string;
  coordinates?: [number, number];
  status: SafeAlertStatus;
  createdAt: string;
  updatedAt: string;
  reporterRole: string; // Anonymous tag, e.g. "Community Resident"
  reportedByUserId?: string;
  moderationNotes?: string;
  isDemo?: boolean;
}

const STORAGE_KEY = "saferstreets_safealerts_v1";
const SETTINGS_KEY = "saferstreets_safealerts_settings_v1";

export interface SafeAlertUserSettings {
  optedIn: boolean;
  radiusKm: number; // 1, 2.5, 5
}

const INITIAL_DEMO_INCIDENTS: SafeAlertIncident[] = [
  {
    id: "ALT-924102",
    incidentType: "Harassment / immediate threat",
    description: "Two individuals aggressively following a lone commuter near the underpass and making verbal threats.",
    locationName: "Underpass crossing between North Gate and Sector 3 Plaza",
    coordinates: [75.8335, 25.0505],
    status: "Unverified",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18m ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    reporterRole: "Community Member (Anonymous)",
    isDemo: true,
  },
  {
    id: "ALT-883910",
    incidentType: "Assault / violence",
    description: "Physical altercation reported near the taxi stand. Bystanders called municipal patrol.",
    locationName: "East Terminal Commercial Taxi Bay",
    coordinates: [75.8378, 25.0478],
    status: "Reviewed",
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(), // 95m ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    reporterRole: "Transit Passenger (Anonymous)",
    moderationNotes: "Area patrol confirmed incident attended. Situation dispersed.",
    isDemo: true,
  },
  {
    id: "ALT-771204",
    incidentType: "Suspected child or vulnerable-person endangerment",
    description: "Unaccompanied young toddler wandering near high-traffic arterial intersection without an adult.",
    locationName: "Corner of Civic Park & Highway Service Road",
    coordinates: [75.8291, 25.0522],
    status: "Resolved",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4h ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    reporterRole: "Local Resident (Anonymous)",
    moderationNotes: "Child safely reunited with guardian at Community Safety Hub.",
    isDemo: true,
  },
];

export function getStoredAlerts(): SafeAlertIncident[] {
  if (typeof window === "undefined") return INITIAL_DEMO_INCIDENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_INCIDENTS));
  } catch (err) {
    console.warn("Could not read SafeAlerts from localStorage:", err);
  }
  return INITIAL_DEMO_INCIDENTS;
}

export function saveStoredAlerts(alerts: SafeAlertIncident[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch (err) {
    console.error("Could not write SafeAlerts to localStorage:", err);
  }
}

export function getStoredSettings(): SafeAlertUserSettings {
  const defaultSettings: SafeAlertUserSettings = { optedIn: true, radiusKm: 2.5 };
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    // ignore
  }
  return defaultSettings;
}

export function saveStoredSettings(settings: SafeAlertUserSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    // ignore
  }
}

export async function fetchSafeAlerts(): Promise<SafeAlertIncident[]> {
  await new Promise((r) => setTimeout(r, 100));
  return getStoredAlerts();
}

export async function createSafeAlertIncident(data: {
  incidentType: SafeAlertIncidentType;
  description: string;
  locationName: string;
  coordinates?: [number, number];
  reporterUserId?: string;
}): Promise<SafeAlertIncident> {
  await new Promise((r) => setTimeout(r, 140));

  const randomId = Math.floor(100000 + Math.random() * 900000);
  const newIncident: SafeAlertIncident = {
    id: `ALT-${randomId}`,
    incidentType: data.incidentType,
    description: data.description.trim(),
    locationName: data.locationName.trim(),
    coordinates: data.coordinates,
    status: "Unverified",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reporterRole: "Community Member (Anonymous)",
    reportedByUserId: data.reporterUserId,
    isDemo: false,
  };

  const current = getStoredAlerts();
  const updated = [newIncident, ...current];
  saveStoredAlerts(updated);
  return newIncident;
}

export async function updateIncidentStatus(
  incidentId: string,
  newStatus: SafeAlertStatus,
  moderationNotes?: string
): Promise<SafeAlertIncident | null> {
  await new Promise((r) => setTimeout(r, 80));
  const alerts = getStoredAlerts();
  const index = alerts.findIndex((a) => a.id === incidentId);
  if (index === -1) return null;

  alerts[index] = {
    ...alerts[index],
    status: newStatus,
    updatedAt: new Date().toISOString(),
    moderationNotes: moderationNotes || alerts[index].moderationNotes,
  };

  saveStoredAlerts(alerts);
  return alerts[index];
}

export async function withdrawIncident(incidentId: string): Promise<SafeAlertIncident | null> {
  return updateIncidentStatus(incidentId, "Withdrawn", "Withdrawn by original reporter as accidental report.");
}
