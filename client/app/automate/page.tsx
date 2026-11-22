"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Car,
  Users,
  Clock,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlusCircle,
  Filter,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Info,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import {
  AutoMateRide,
  JoinRequest,
  AutoMateType,
  fetchAutoMateRides,
  fetchUserJoinRequests,
  createAutoMateRide,
  requestToJoinRide,
  respondToJoinRequest,
  toggleContactConsent,
  blockOrReportRide,
  findPotentialMatches,
} from "@/lib/automate-rides";

export default function AutoMatePage() {
  const { user } = useAuth();
  const currentUserId = user?.id || "usr_current_resident";
  const currentUserName = user?.name ? `${user.name.split(" ")[0]} ${user.name.split(" ")[1]?.[0] || ""}.` : "Resident (You)";

  const [rides, setRides] = useState<AutoMateRide[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<"browse" | "matches" | "my-rides">("browse");
  const [typeFilter, setTypeFilter] = useState<"all" | "OFFER" | "REQUEST">("all");

  // Create Ride Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<AutoMateType>("OFFER");
  const [startingPoint, setStartingPoint] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [departureTime, setDepartureTime] = useState("18:00");
  const [seats, setSeats] = useState(2);
  const [notes, setNotes] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Join Ride Modal State
  const [joinRideTarget, setJoinRideTarget] = useState<AutoMateRide | null>(null);
  const [joinSeats, setJoinSeats] = useState(1);
  const [joinNote, setJoinNote] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Match View Focus State
  const [selectedForMatch, setSelectedForMatch] = useState<AutoMateRide | null>(null);

  // Report/Block Alert Modal
  const [reportRideTarget, setReportRideTarget] = useState<AutoMateRide | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // Load Data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ridesData, requestsData] = await Promise.all([
        fetchAutoMateRides(),
        fetchUserJoinRequests(currentUserId),
      ]);
      setRides(ridesData);
      setRequests(requestsData);
      if (ridesData.length > 0 && !selectedForMatch) {
        setSelectedForMatch(ridesData[0]);
      }
    } catch (err) {
      console.error("Failed to load AutoMate data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter rides list
  const filteredRides = rides.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  const myRides = rides.filter((r) => r.creatorId === currentUserId);
  const myJoinRequests = requests.filter((req) => req.requesterId === currentUserId);

  // Handle Create Ride
  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!startingPoint.trim()) {
      setCreateError("Please provide a starting pickup area.");
      return;
    }
    if (!destination.trim()) {
      setCreateError("Please provide a destination.");
      return;
    }
    if (!departureDate || !departureTime) {
      setCreateError("Please select departure date and approximate time.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newRide = await createAutoMateRide({
        creatorId: currentUserId,
        creatorName: currentUserName,
        type: createType,
        startingPoint,
        destination,
        departureDate,
        departureTime,
        totalSeats: seats,
        notes,
      });

      setRides((prev) => [newRide, ...prev]);
      setSelectedForMatch(newRide);
      setTypeFilter("all");
      setCreateSuccess("AutoMate ride request published successfully.");
      setStartingPoint("");
      setDestination("");
      setNotes("");

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
        setActiveTab("matches");
      }, 1400);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create ride.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Request to Join
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRideTarget) return;
    setJoinError(null);

    if (!joinSeats || joinSeats < 1) {
      setJoinError("Please select at least 1 seat requested.");
      return;
    }
    if (joinRideTarget.availableSeats < joinSeats) {
      setJoinError(`Only ${joinRideTarget.availableSeats} seat(s) currently available.`);
      return;
    }

    try {
      setIsJoining(true);
      const newReq = await requestToJoinRide({
        rideId: joinRideTarget.id,
        requesterId: currentUserId,
        requesterName: currentUserName,
        seatsRequested: joinSeats,
        note: joinNote,
      });

      setRequests((prev) => [newReq, ...prev]);
      setJoinSuccess("Join request sent to ride creator. You will see status updates here.");
      setTimeout(() => {
        setJoinRideTarget(null);
        setJoinSuccess(null);
        setJoinNote("");
        setActiveTab("my-rides");
      }, 1500);
    } catch (err: any) {
      setJoinError(err.message || "Could not submit join request.");
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Accept or Reject
  const handleRespond = async (requestId: string, decision: "Accepted" | "Rejected") => {
    try {
      const res = await respondToJoinRequest(requestId, decision, currentUserId);
      setRequests((prev) => prev.map((req) => (req.id === requestId ? res.request : req)));
      setRides((prev) => prev.map((r) => (r.id === res.ride.id ? res.ride : r)));
    } catch (err: any) {
      alert(err.message || "Failed to update request.");
    }
  };

  // Handle Contact Consent Toggle
  const handleConsentToggle = async (requestId: string) => {
    try {
      const updatedReq = await toggleContactConsent(requestId, currentUserId);
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updatedReq : r)));
    } catch (err: any) {
      console.error(err);
    }
  };

  // Handle Block/Report Ride
  const handleReportRide = async () => {
    if (!reportRideTarget) return;
    await blockOrReportRide(reportRideTarget.id, reportReason || "Inappropriate listing");
    setRides((prev) => prev.filter((r) => r.id !== reportRideTarget.id));
    setReportSuccess("Ride removed and hidden from your feed.");
    setTimeout(() => {
      setReportRideTarget(null);
      setReportSuccess(null);
      setReportReason("");
    }, 1200);
  };

  // Calculate potential matches for selected ride
  const currentMatches = selectedForMatch
    ? findPotentialMatches(selectedForMatch, rides)
    : [];

  return (
    <PageContainer maxWidth="7xl" className="space-y-6">
      {/* ============================================================== */}
      {/* HEADER SECTION */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E293B]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Car className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              AutoMate
            </h1>
            <StatusBadge variant="info" dot>
              Shared-Auto Pooling
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            A simple community shared-auto matching service. Pool rides along common corridors, share auto fares directly with drivers, and travel in trusted groups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowCreateModal(true);
              setCreateError(null);
              setCreateSuccess(null);
            }}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Auto Request</span>
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB NAVIGATION */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1E293B] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("browse")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "browse"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-[#131C2E] text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Browse Requests ({filteredRides.length})
          </button>

          <button
            onClick={() => setActiveTab("matches")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === "matches"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-[#131C2E] text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Corridor Matches</span>
          </button>

          <button
            onClick={() => setActiveTab("my-rides")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === "my-rides"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-[#131C2E] text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3 h-3" />
            <span>My Rides & Requests ({myRides.length + myJoinRequests.length})</span>
          </button>
        </div>

        {activeTab === "browse" && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
            >
              <option value="all">All Postings</option>
              <option value="OFFER">Seats Offered</option>
              <option value="REQUEST">Pooling Requests</option>
            </select>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BROWSE RIDES & REQUESTS */}
      {/* ============================================================== */}
      {activeTab === "browse" && (
        <div className="space-y-4">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          )}

          {!isLoading && filteredRides.length === 0 && (
            <Card className="text-center py-10">
              <EmptyState
                icon={Car}
                title="No shared-auto postings found"
                description="There are currently no active ride offers or pooling requests matching this filter."
                actionLabel="Create a Shared-Auto Post"
                onActionClick={() => setShowCreateModal(true)}
              />
            </Card>
          )}

          {!isLoading && filteredRides.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRides.map((ride) => {
                const isCreator = ride.creatorId === currentUserId;
                const myRequest = requests.find((req) => req.rideId === ride.id && req.requesterId === currentUserId);
                const hasPending = myRequest?.status === "Pending";
                const isAccepted = myRequest?.status === "Accepted";

                return (
                  <Card key={ride.id} hover className="flex flex-col justify-between space-y-3">
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              {ride.creatorName}
                            </span>
                            {ride.isDemo && (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                Demo Record
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {ride.type === "OFFER" ? "Offering seats in auto" : "Looking to pool auto"}
                          </div>
                        </div>

                        <StatusBadge
                          variant={ride.type === "OFFER" ? "safe" : "info"}
                          dot
                        >
                          {ride.availableSeats} {ride.availableSeats === 1 ? "seat" : "seats"} left
                        </StatusBadge>
                      </div>

                      {/* Corridor Details */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] space-y-2 text-xs">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <div className="text-[10px] text-slate-400">From</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{ride.startingPoint}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <div className="text-[10px] text-slate-400">To</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{ride.destination}</div>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-slate-100 dark:border-[#1E293B]/70 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{ride.departureDate}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                            <Clock className="w-3 h-3" />
                            <span>{ride.departureTime}</span>
                          </span>
                        </div>
                      </div>

                      {ride.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          "{ride.notes}"
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B]/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedForMatch(ride);
                          setActiveTab("matches");
                        }}
                        className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Find Corridor Matches</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReportRideTarget(ride)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          title="Report or hide this ride"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>

                        {isCreator ? (
                          <span className="text-xs font-bold text-slate-400 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#1E293B]">
                            Your Post
                          </span>
                        ) : isAccepted ? (
                          <StatusBadge variant="safe" dot>
                            Accepted
                          </StatusBadge>
                        ) : hasPending ? (
                          <StatusBadge variant="warning" dot>
                            Request Pending
                          </StatusBadge>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={ride.availableSeats <= 0}
                            onClick={() => {
                              setJoinRideTarget(ride);
                              setJoinError(null);
                              setJoinSuccess(null);
                            }}
                          >
                            <span>Request to Join</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CORRIDOR MATCHES */}
      {/* ============================================================== */}
      {activeTab === "matches" && (
        <div className="space-y-5">
          {/* Reference selector */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                  Target Corridor for Matching
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Showing shared-auto requests that align by common departure window (±2 hrs) and transit area keywords.
                </p>
              </div>

              {rides.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Matching against:</span>
                  <select
                    value={selectedForMatch?.id || ""}
                    onChange={(e) => {
                      const r = rides.find((item) => item.id === e.target.value);
                      if (r) setSelectedForMatch(r);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F19] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {rides.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.creatorName} ({r.startingPoint} → {r.destination})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedForMatch && (
              <div className="p-3 rounded-xl bg-white dark:bg-[#131C2E] border border-sky-200 dark:border-sky-800/40 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {selectedForMatch.startingPoint} → {selectedForMatch.destination}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span>Date: {selectedForMatch.departureDate}</span>
                  <span>Target: {selectedForMatch.departureTime}</span>
                  <span>{selectedForMatch.availableSeats} seats open</span>
                </div>
              </div>
            )}
          </div>

          {/* Matches List */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Potential Overlapping Rides ({currentMatches.length})
            </h3>

            {currentMatches.length === 0 ? (
              <Card className="text-center py-8">
                <EmptyState
                  icon={Sparkles}
                  title="No direct corridor matches found"
                  description="No other ride requests share this exact departure window or area keyword yet. New requests appear as community members publish them."
                  actionLabel="Browse All Available Rides"
                  onActionClick={() => setActiveTab("browse")}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentMatches.map(({ ride, matchReason, matchType }) => (
                  <Card key={ride.id} hover className="space-y-3 border-l-4 border-l-sky-500">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {ride.creatorName}
                          </span>
                          {ride.isDemo && (
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                          ✨ {matchReason}
                        </div>
                      </div>

                      <StatusBadge variant="safe" dot>
                        {ride.availableSeats} open
                      </StatusBadge>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-xs space-y-1 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B]">
                      <div>• Route: {ride.startingPoint} → {ride.destination}</div>
                      <div>• Schedule: {ride.departureDate} at {ride.departureTime}</div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {ride.type === "OFFER" ? "Auto Offer" : "Pooling Request"}
                      </span>
                      {ride.creatorId !== currentUserId && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setJoinRideTarget(ride);
                            setJoinError(null);
                            setJoinSuccess(null);
                          }}
                        >
                          <span>Request to Join</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MY RIDES & REQUEST STATUS (INCLUDING ACCEPT / REJECT) */}
      {/* ============================================================== */}
      {activeTab === "my-rides" && (
        <div className="space-y-6">
          {/* Section A: Incoming Requests on My Rides */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Incoming Passenger Requests (On Rides You Created)
            </h3>

            {myRides.length === 0 ? (
              <p className="text-xs text-slate-400 italic">You haven't posted any rides yet.</p>
            ) : (
              <div className="space-y-3">
                {myRides.map((ride) => {
                  const rideRequests = requests.filter((r) => r.rideId === ride.id);
                  return (
                    <Card key={ride.id} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-[#1E293B]">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {ride.startingPoint} → {ride.destination}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 font-mono">{ride.departureDate} • {ride.departureTime}</span>
                          <StatusBadge variant={ride.status === "OPEN" ? "safe" : "neutral"} dot>
                            {ride.availableSeats} of {ride.totalSeats} seats open
                          </StatusBadge>
                        </div>
                      </div>

                      {rideRequests.length === 0 ? (
                        <div className="text-xs text-slate-400 py-2">
                          No join requests received yet for this ride.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {rideRequests.map((req) => (
                            <div
                              key={req.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {req.requesterName}
                                  </span>
                                  <StatusBadge
                                    variant={
                                      req.status === "Accepted"
                                        ? "safe"
                                        : req.status === "Rejected"
                                        ? "neutral"
                                        : "warning"
                                    }
                                    dot
                                  >
                                    {req.status}
                                  </StatusBadge>
                                  <span className="text-[11px] text-slate-400">
                                    Requested {req.seatsRequested} seat(s)
                                  </span>
                                </div>
                                {req.note && (
                                  <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                                    "{req.note}"
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons for Creator */}
                              <div className="flex items-center gap-2">
                                {req.status === "Pending" ? (
                                  <>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleRespond(req.id, "Accepted")}
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Accept</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRespond(req.id, "Rejected")}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </Button>
                                  </>
                                ) : req.status === "Accepted" ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Participant Confirmed</span>
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Request Declined</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section B: My Sent Requests to Other Rides & Agreed Details */}
          <div className="space-y-3 pt-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              My Sent Join Requests ({myJoinRequests.length})
            </h3>

            {myJoinRequests.length === 0 ? (
              <p className="text-xs text-slate-400 italic">You haven't requested to join any rides yet.</p>
            ) : (
              <div className="space-y-3">
                {myJoinRequests.map((req) => {
                  const targetRide = rides.find((r) => r.id === req.rideId);
                  const isAccepted = req.status === "Accepted";
                  const bothConsented = req.contactConsentRequester && req.contactConsentCreator;

                  return (
                    <Card key={req.id} className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {targetRide ? `${targetRide.startingPoint} → ${targetRide.destination}` : "Ride Details"}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Ride created by {targetRide?.creatorName || "Resident"}
                          </div>
                        </div>

                        <StatusBadge
                          variant={
                            req.status === "Accepted"
                              ? "safe"
                              : req.status === "Rejected"
                              ? "neutral"
                              : "warning"
                          }
                          dot
                        >
                          Request: {req.status}
                        </StatusBadge>
                      </div>

                      {/* Agreed Trip Details for Accepted Participants */}
                      {isAccepted && targetRide && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Agreed Trip Confirmation</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                            <div>• Confirmed Meetup: {targetRide.startingPoint}</div>
                            <div>• Target Destination: {targetRide.destination}</div>
                            <div>• Departure: {targetRide.departureDate} at {targetRide.departureTime}</div>
                            <div>• Seats Booked: {req.seatsRequested} seat(s)</div>
                          </div>

                          <div className="p-2 rounded-lg bg-white/80 dark:bg-[#0B0F19] text-[11px] text-slate-500 border border-slate-200 dark:border-[#1E293B]">
                            💡 Fare agreement: Pay driver directly at drop-off according to meter split. No app payments processed.
                          </div>

                          {/* Mutual Contact Consent Protocol */}
                          <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                                <Lock className="w-3 h-3 text-sky-500" />
                                Mutual Contact Reveal Protocol
                              </span>
                              <button
                                type="button"
                                onClick={() => handleConsentToggle(req.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  req.contactConsentRequester
                                    ? "bg-sky-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                {req.contactConsentRequester ? "✓ Consent Given" : "Consent to Share Contact"}
                              </button>
                            </div>

                            {bothConsented ? (
                              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 font-mono text-xs">
                                🔓 Both accepted: Secure In-App Handle: <strong>@{targetRide.creatorName.toLowerCase().replace(/[\s.]/g, "")}_coord</strong>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 italic">
                                Contact information remains strictly hidden until both co-passengers provide explicit mutual consent.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CREATE RIDE REQUEST */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-sky-600" />
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Create Shared-Auto Ride Post
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-center space-y-2 border border-emerald-200">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-600" />
                <div className="font-bold text-sm">{createSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleCreateRide} className="space-y-4 text-xs">
                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Offering vs Requesting Toggle */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Posting Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateType("OFFER")}
                      className={`p-2.5 rounded-xl border font-bold transition-colors ${
                        createType === "OFFER"
                          ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300"
                          : "border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Offering Seats (In Auto)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateType("REQUEST")}
                      className={`p-2.5 rounded-xl border font-bold transition-colors ${
                        createType === "REQUEST"
                          ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300"
                          : "border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Looking to Pool Auto
                    </button>
                  </div>
                </div>

                {/* Starting Point & Destination */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Starting Point / Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 3 North Station, West Gate..."
                    value={startingPoint}
                    onChange={(e) => setStartingPoint(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Central Tech Hub, Main Market..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                {/* Date, Time & Seats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Date</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Approx Time</label>
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Seats</label>
                    <select
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                    >
                      <option value={1}>1 seat</option>
                      <option value={2}>2 seats</option>
                      <option value={3}>3 seats</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Trip Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Regular evening commute, waiting near Stand A..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-[11px] text-slate-500 border border-slate-200 dark:border-[#1E293B]">
                  🔒 Privacy policy: Phone numbers and personal IDs are never displayed publicly.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Posting..." : "Publish Post"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: REQUEST TO JOIN RIDE */}
      {/* ============================================================== */}
      {joinRideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Request to Join Ride
                </h2>
              </div>
              <button
                onClick={() => setJoinRideTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-center space-y-2 border border-emerald-200">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-600" />
                <div className="font-bold text-sm">{joinSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-4 text-xs">
                {joinError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{joinError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-xs space-y-1 border border-slate-200 dark:border-[#1E293B]">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Route: {joinRideTarget.startingPoint} → {joinRideTarget.destination}
                  </div>
                  <div className="text-slate-500">
                    Schedule: {joinRideTarget.departureDate} at {joinRideTarget.departureTime}
                  </div>
                  <div className="text-sky-600 font-medium">
                    Posted by: {joinRideTarget.creatorName} ({joinRideTarget.availableSeats} seats remaining)
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Seats Needed
                  </label>
                  <select
                    value={joinSeats}
                    onChange={(e) => setJoinSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                  >
                    {[...Array(Math.min(3, joinRideTarget.availableSeats))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} seat{i > 0 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Note for Creator (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Will meet at metro gate 2 with red backpack..."
                    value={joinNote}
                    onChange={(e) => setJoinNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setJoinRideTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isJoining}
                  >
                    {isJoining ? "Sending..." : "Submit Join Request"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: REPORT OR BLOCK RIDE */}
      {/* ============================================================== */}
      {reportRideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E293B]">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Report / Hide Ride
              </h3>
              <button
                onClick={() => setReportRideTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-3 text-xs text-emerald-600 font-bold text-center">
                {reportSuccess}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to flag and hide this ride from your feed?
                </p>
                <input
                  type="text"
                  placeholder="Reason (optional: spam, inappropriate notes)..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-xs"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportRideTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="emergency"
                    size="sm"
                    onClick={handleReportRide}
                  >
                    Hide & Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
