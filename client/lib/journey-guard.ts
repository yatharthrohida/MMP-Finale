export type JourneyStatus = "Active" | "Completed" | "Overdue";

export interface JourneyRecord {
  id: string;
  destination: string;
  startingLocation?: string;
  coordinates?: [number, number];
  startedAt: string;
  expectedArrivalTime: string;
  contactName: string;
  contactMethod: string;
  status: JourneyStatus;
  completedAt?: string;
  notes?: string;
}

const STORAGE_KEY = "saferstreets_journeyguard_v1";

export function getStoredJourneys(): JourneyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Could not read journeys from localStorage:", err);
  }
  return [];
}

export function saveStoredJourneys(journeys: JourneyRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
  } catch (err) {
    console.error("Could not save journeys to localStorage:", err);
  }
}

export async function fetchCurrentJourney(): Promise<JourneyRecord | null> {
  await new Promise((r) => setTimeout(r, 60));
  const journeys = getStoredJourneys();
  // Find most recent active or overdue journey
  const active = journeys.find((j) => j.status === "Active" || j.status === "Overdue");
  if (!active) return null;

  // Check if expected arrival time has passed
  const now = new Date().getTime();
  const arrival = new Date(active.expectedArrivalTime).getTime();
  if (now > arrival && active.status === "Active") {
    active.status = "Overdue";
    saveStoredJourneys(journeys);
  }

  return active;
}

export async function startNewJourney(data: {
  destination: string;
  startingLocation?: string;
  coordinates?: [number, number];
  expectedArrivalTime: string;
  contactName: string;
  contactMethod: string;
  notes?: string;
}): Promise<JourneyRecord> {
  await new Promise((r) => setTimeout(r, 100));

  const randomIdNum = Math.floor(100000 + Math.random() * 900000);
  const newJourney: JourneyRecord = {
    id: `JG-${randomIdNum}`,
    destination: data.destination.trim(),
    startingLocation: data.startingLocation?.trim() || "Starting point unspecified",
    coordinates: data.coordinates,
    startedAt: new Date().toISOString(),
    expectedArrivalTime: data.expectedArrivalTime,
    contactName: data.contactName.trim(),
    contactMethod: data.contactMethod.trim(),
    status: "Active",
    notes: data.notes?.trim() || undefined,
  };

  const journeys = getStoredJourneys();
  // Mark any previous active journey as completed
  const updated = journeys.map((j) =>
    j.status === "Active" || j.status === "Overdue"
      ? { ...j, status: "Completed" as JourneyStatus, completedAt: new Date().toISOString() }
      : j
  );

  saveStoredJourneys([newJourney, ...updated]);
  return newJourney;
}

export async function completeJourney(journeyId: string): Promise<JourneyRecord | null> {
  await new Promise((r) => setTimeout(r, 80));
  const journeys = getStoredJourneys();
  const index = journeys.findIndex((j) => j.id === journeyId);
  if (index === -1) return null;

  journeys[index] = {
    ...journeys[index],
    status: "Completed",
    completedAt: new Date().toISOString(),
  };

  saveStoredJourneys(journeys);
  return journeys[index];
}

export async function extendJourney(
  journeyId: string,
  extraMinutes: number = 15
): Promise<JourneyRecord | null> {
  await new Promise((r) => setTimeout(r, 80));
  const journeys = getStoredJourneys();
  const index = journeys.findIndex((j) => j.id === journeyId);
  if (index === -1) return null;

  const currentExpected = new Date(journeys[index].expectedArrivalTime).getTime();
  // If already past arrival, extend from now; otherwise extend from expected
  const baseTime = Math.max(Date.now(), currentExpected);
  const newExpected = new Date(baseTime + extraMinutes * 60 * 1000).toISOString();

  journeys[index] = {
    ...journeys[index],
    expectedArrivalTime: newExpected,
    status: "Active",
  };

  saveStoredJourneys(journeys);
  return journeys[index];
}

export async function simulateOverdue(journeyId: string): Promise<JourneyRecord | null> {
  const journeys = getStoredJourneys();
  const index = journeys.findIndex((j) => j.id === journeyId);
  if (index === -1) return null;

  journeys[index] = {
    ...journeys[index],
    expectedArrivalTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins in past
    status: "Overdue",
  };

  saveStoredJourneys(journeys);
  return journeys[index];
}
