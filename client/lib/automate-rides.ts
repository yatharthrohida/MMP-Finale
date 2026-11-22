export type AutoMateType = "OFFER" | "REQUEST";
export type JoinRequestStatus = "Pending" | "Accepted" | "Rejected";

export interface JoinRequest {
  id: string;
  rideId: string;
  requesterId: string;
  requesterName: string;
  seatsRequested: number;
  note?: string;
  status: JoinRequestStatus;
  createdAt: string;
  contactConsentRequester: boolean;
  contactConsentCreator: boolean;
}

export interface AutoMateRide {
  id: string;
  creatorId: string;
  creatorName: string;
  type: AutoMateType;
  startingPoint: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  totalSeats: number;
  availableSeats: number;
  notes?: string;
  status: "OPEN" | "FULL" | "COMPLETED";
  isDemo?: boolean;
  isBlocked?: boolean;
  createdAt: string;
}

const RIDES_STORAGE_KEY = "saferstreets_automate_rides_v1";
const REQUESTS_STORAGE_KEY = "saferstreets_automate_requests_v1";

// Helper to get formatted tomorrow date string
const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

const INITIAL_DEMO_RIDES: AutoMateRide[] = [
  {
    id: "auto_demo_001",
    creatorId: "usr_elena_demo",
    creatorName: "Elena R.",
    type: "OFFER",
    startingPoint: "Sector 3 North Metro Gate 2",
    destination: "Central Tech Hub, Ranpur",
    departureDate: getTodayDate(),
    departureTime: "17:30",
    totalSeats: 3,
    availableSeats: 2,
    notes: "Auto hired daily at North Gate stand. Split fare directly with driver at drop-off.",
    status: "OPEN",
    isDemo: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "auto_demo_002",
    creatorId: "usr_marcus_demo",
    creatorName: "Marcus V.",
    type: "REQUEST",
    startingPoint: "Sector 3 North Station",
    destination: "West Riverside Market",
    departureDate: getTodayDate(),
    departureTime: "18:00",
    totalSeats: 1,
    availableSeats: 1,
    notes: "Commuting after evening shift. Looking to pool with 1-2 co-passengers.",
    status: "OPEN",
    isDemo: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "auto_demo_003",
    creatorId: "usr_priya_demo",
    creatorName: "Priya S.",
    type: "OFFER",
    startingPoint: "Civic Library Plaza",
    destination: "South Hills Residential Sector",
    departureDate: getTomorrowDate(),
    departureTime: "08:45",
    totalSeats: 3,
    availableSeats: 1,
    notes: "Fixed morning route. Quiet shared ride.",
    status: "OPEN",
    isDemo: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "auto_demo_004",
    creatorId: "usr_tariq_demo",
    creatorName: "Tariq K.",
    type: "REQUEST",
    startingPoint: "Central Tech Hub, Ranpur",
    destination: "Sector 3 North Metro Gate 2",
    departureDate: getTodayDate(),
    departureTime: "18:15",
    totalSeats: 2,
    availableSeats: 2,
    notes: "Returning towards Metro after classes. Auto stand is right outside.",
    status: "OPEN",
    isDemo: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
];

const INITIAL_DEMO_REQUESTS: JoinRequest[] = [
  {
    id: "req_demo_001",
    rideId: "auto_demo_001",
    requesterId: "usr_jordan_demo",
    requesterName: "Jordan L.",
    seatsRequested: 1,
    note: "Heading to the Tech Hub for evening seminar.",
    status: "Accepted",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    contactConsentRequester: true,
    contactConsentCreator: true,
  },
];

export function getStoredRides(): AutoMateRide[] {
  if (typeof window === "undefined") return INITIAL_DEMO_RIDES;
  try {
    const raw = localStorage.getItem(RIDES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(RIDES_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_RIDES));
  } catch (err) {
    console.warn("Could not read AutoMate rides from localStorage:", err);
  }
  return INITIAL_DEMO_RIDES;
}

export function saveStoredRides(rides: AutoMateRide[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RIDES_STORAGE_KEY, JSON.stringify(rides));
  } catch (err) {
    console.error("Could not save AutoMate rides to localStorage:", err);
  }
}

export function getStoredRequests(): JoinRequest[] {
  if (typeof window === "undefined") return INITIAL_DEMO_REQUESTS;
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
  } catch (err) {
    console.warn("Could not read AutoMate requests from localStorage:", err);
  }
  return INITIAL_DEMO_REQUESTS;
}

export function saveStoredRequests(requests: JoinRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error("Could not save AutoMate requests to localStorage:", err);
  }
}

// Fetch all visible rides (excluding blocked)
export async function fetchAutoMateRides(): Promise<AutoMateRide[]> {
  await new Promise((r) => setTimeout(r, 100));
  const rides = getStoredRides();
  return rides.filter((r) => !r.isBlocked);
}

// Fetch all join requests for a given user (either as creator or requester)
export async function fetchUserJoinRequests(userId: string): Promise<JoinRequest[]> {
  await new Promise((r) => setTimeout(r, 80));
  const requests = getStoredRequests();
  const rides = getStoredRides();
  const userRideIds = new Set(rides.filter((r) => r.creatorId === userId).map((r) => r.id));

  return requests.filter(
    (req) => req.requesterId === userId || userRideIds.has(req.rideId)
  );
}

// Create a new ride or ride request
export async function createAutoMateRide(data: {
  creatorId: string;
  creatorName: string;
  type: AutoMateType;
  startingPoint: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  notes?: string;
}): Promise<AutoMateRide> {
  await new Promise((r) => setTimeout(r, 150));

  const newRide: AutoMateRide = {
    id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    type: data.type,
    startingPoint: data.startingPoint.trim(),
    destination: data.destination.trim(),
    departureDate: data.departureDate,
    departureTime: data.departureTime,
    totalSeats: Number(data.totalSeats),
    availableSeats: Number(data.totalSeats),
    notes: data.notes?.trim() || undefined,
    status: "OPEN",
    isDemo: false,
    createdAt: new Date().toISOString(),
  };

  const rides = getStoredRides();
  const updated = [newRide, ...rides];
  saveStoredRides(updated);
  return newRide;
}

// Request to join a ride
export async function requestToJoinRide(data: {
  rideId: string;
  requesterId: string;
  requesterName: string;
  seatsRequested?: number;
  note?: string;
}): Promise<JoinRequest> {
  await new Promise((r) => setTimeout(r, 120));

  const rides = getStoredRides();
  const ride = rides.find((r) => r.id === data.rideId);
  if (!ride) throw new Error("Ride not found");
  if (ride.availableSeats <= 0 || ride.status !== "OPEN") {
    throw new Error("This ride has no available seats remaining.");
  }

  const existingRequests = getStoredRequests();
  const alreadyRequested = existingRequests.some(
    (req) => req.rideId === data.rideId && req.requesterId === data.requesterId && req.status !== "Rejected"
  );
  if (alreadyRequested) {
    throw new Error("You have already submitted a join request for this ride.");
  }

  const newRequest: JoinRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    rideId: data.rideId,
    requesterId: data.requesterId,
    requesterName: data.requesterName,
    seatsRequested: Math.max(1, data.seatsRequested || 1),
    note: data.note?.trim() || undefined,
    status: "Pending",
    createdAt: new Date().toISOString(),
    contactConsentRequester: false,
    contactConsentCreator: false,
  };

  const updatedRequests = [newRequest, ...existingRequests];
  saveStoredRequests(updatedRequests);
  return newRequest;
}

// Accept or Reject a join request (by ride creator)
export async function respondToJoinRequest(
  requestId: string,
  decision: "Accepted" | "Rejected",
  creatorId: string
): Promise<{ request: JoinRequest; ride: AutoMateRide }> {
  await new Promise((r) => setTimeout(r, 120));

  const requests = getStoredRequests();
  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) throw new Error("Join request not found");

  const req = requests[reqIndex];
  const rides = getStoredRides();
  const rideIndex = rides.findIndex((r) => r.id === req.rideId);
  if (rideIndex === -1) throw new Error("Associated ride not found");

  const ride = rides[rideIndex];
  if (ride.creatorId !== creatorId) {
    throw new Error("Only the ride creator can accept or reject this request.");
  }

  if (decision === "Accepted") {
    if (ride.availableSeats < req.seatsRequested) {
      throw new Error("Not enough available seats left to accept this request.");
    }
    ride.availableSeats -= req.seatsRequested;
    if (ride.availableSeats === 0) {
      ride.status = "FULL";
    }
    req.status = "Accepted";
  } else {
    req.status = "Rejected";
  }

  requests[reqIndex] = req;
  rides[rideIndex] = ride;

  saveStoredRequests(requests);
  saveStoredRides(rides);

  return { request: req, ride };
}

// Toggle contact sharing consent for accepted participants
export async function toggleContactConsent(
  requestId: string,
  userId: string
): Promise<JoinRequest> {
  await new Promise((r) => setTimeout(r, 80));
  const requests = getStoredRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) throw new Error("Request not found");

  const req = requests[index];
  const rides = getStoredRides();
  const ride = rides.find((r) => r.id === req.rideId);

  if (req.requesterId === userId) {
    req.contactConsentRequester = !req.contactConsentRequester;
  } else if (ride && ride.creatorId === userId) {
    req.contactConsentCreator = !req.contactConsentCreator;
  }

  requests[index] = req;
  saveStoredRequests(requests);
  return req;
}

// Report or block a ride
export async function blockOrReportRide(rideId: string, reason: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 100));
  const rides = getStoredRides();
  const index = rides.findIndex((r) => r.id === rideId);
  if (index !== -1) {
    rides[index].isBlocked = true;
    saveStoredRides(rides);
  }
}

// Simple Corridor & Schedule Matching Algorithm
// Matches rides heading along the same corridor around the same departure time window
export function findPotentialMatches(
  targetRide: Partial<AutoMateRide>,
  allRides: AutoMateRide[]
): { ride: AutoMateRide; matchReason: string; matchType: "corridor" | "time" | "both" }[] {
  if (!targetRide.startingPoint && !targetRide.destination) return [];

  const extractKeywords = (str?: string) => {
    if (!str) return [];
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "and", "near", "gate", "road", "street"].includes(w));
  };

  const targetStartWords = extractKeywords(targetRide.startingPoint);
  const targetDestWords = extractKeywords(targetRide.destination);

  const parseMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const targetMinutes = parseMinutes(targetRide.departureTime);

  const results: {
    ride: AutoMateRide;
    matchReason: string;
    matchType: "corridor" | "time" | "both";
  }[] = [];

  allRides.forEach((other) => {
    if (other.id === targetRide.id || other.isBlocked || other.status !== "OPEN") return;

    // Check corridor keyword overlap
    const otherStartWords = extractKeywords(other.startingPoint);
    const otherDestWords = extractKeywords(other.destination);

    const hasStartOverlap = targetStartWords.some((w) => otherStartWords.includes(w));
    const hasDestOverlap = targetDestWords.some((w) => otherDestWords.includes(w));
    const isCorridorMatch = hasStartOverlap || hasDestOverlap;

    // Check date & time window (within ±120 mins)
    const isSameDate = !targetRide.departureDate || other.departureDate === targetRide.departureDate;
    const otherMinutes = parseMinutes(other.departureTime);
    const timeDiff = Math.abs(targetMinutes - otherMinutes);
    const isTimeMatch = isSameDate && (targetMinutes === 0 || timeDiff <= 120);

    if (isCorridorMatch && isTimeMatch) {
      const startNote = hasStartOverlap ? "Same pickup area" : "Same destination corridor";
      results.push({
        ride: other,
        matchReason: `${startNote} • Departure within ${timeDiff} mins (${other.departureTime})`,
        matchType: "both",
      });
    } else if (isCorridorMatch && !isTimeMatch) {
      results.push({
        ride: other,
        matchReason: `Same travel corridor (${other.startingPoint} → ${other.destination}), different departure time`,
        matchType: "corridor",
      });
    } else if (!isCorridorMatch && isTimeMatch && targetRide.startingPoint) {
      results.push({
        ride: other,
        matchReason: `Similar schedule (±${timeDiff} mins) in nearby sector`,
        matchType: "time",
      });
    }
  });

  return results.slice(0, 6);
}
