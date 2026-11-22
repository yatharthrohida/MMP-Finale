"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  PhoneCall,
  Share2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Lock,
  ArrowRight,
  Crosshair,
  Check,
  Calendar,
  AlertCircle,
  Radio,
} from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  JourneyRecord,
  JourneyStatus,
  fetchCurrentJourney,
  startNewJourney,
  completeJourney,
  extendJourney,
  simulateOverdue,
  getStoredJourneys,
} from "@/lib/journey-guard";

export default function JourneyGuardPage() {
  const [currentJourney, setCurrentJourney] = useState<JourneyRecord | null>(null);
  const [pastJourneys, setPastJourneys] = useState<JourneyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [destination, setDestination] = useState("");
  const [startingLocation, setStartingLocation] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>(undefined);
  const [minutesFromNow, setMinutesFromNow] = useState<number>(30);
  const [contactName, setContactName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [notes, setNotes] = useState("");

  // Feedback States
  const [formError, setFormError] = useState<string | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown clock state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Load journey data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const active = await fetchCurrentJourney();
      setCurrentJourney(active);
      const all = getStoredJourneys();
      setPastJourneys(all.filter((j) => j.status === "Completed").slice(0, 5));
    } catch (err) {
      console.error("Failed to load JourneyGuard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer loop: updates countdown & checks overdue state
  useEffect(() => {
    if (!currentJourney) {
      setRemainingSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const arrivalTime = new Date(currentJourney.expectedArrivalTime).getTime();
      const diffSec = Math.floor((arrivalTime - now) / 1000);

      if (diffSec <= 0) {
        setRemainingSeconds(0);
        if (currentJourney.status === "Active") {
          setCurrentJourney((prev) => (prev ? { ...prev, status: "Overdue" } : null));
        }
      } else {
        setRemainingSeconds(diffSec);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentJourney]);

  // Request browser geolocation permission only when clicked
  const handleCaptureLocation = () => {
    setGeoNotice(null);
    if (!navigator.geolocation) {
      setGeoNotice("Geolocation is not supported by your browser. Please enter location manually.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords: [number, number] = [
          Math.round(pos.coords.longitude * 1000) / 1000,
          Math.round(pos.coords.latitude * 1000) / 1000,
        ];
        setCoordinates(coords);
        setStartingLocation(`GPS Pin [${coords[1].toFixed(3)}°N, ${coords[0].toFixed(3)}°E]`);
        setGeoNotice("Current approximate location added. Private coordinates will not be made public.");
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice("Location permission was denied. You can proceed without location or enter it manually.");
        } else {
          setGeoNotice("Could not determine position. Please enter your starting point manually.");
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Start Journey Submit
  const handleStartJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!destination.trim()) {
      setFormError("Please enter your destination.");
      return;
    }
    if (!contactName.trim()) {
      setFormError("Please provide the name of your emergency / trusted contact.");
      return;
    }
    if (!contactMethod.trim()) {
      setFormError("Please provide your contact's phone number or email.");
      return;
    }

    try {
      setIsSubmitting(true);
      const expectedTime = new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();

      const newJourney = await startNewJourney({
        destination,
        startingLocation,
        coordinates,
        expectedArrivalTime: expectedTime,
        contactName,
        contactMethod,
        notes,
      });

      setCurrentJourney(newJourney);
      setDestination("");
      setStartingLocation("");
      setNotes("");
      setShareFeedback(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to start journey.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete Journey
  const handleCompleteJourney = async () => {
    if (!currentJourney) return;
    const completed = await completeJourney(currentJourney.id);
    if (completed) {
      setCurrentJourney(null);
      setPastJourneys((prev) => [completed, ...prev]);
    }
  };

  // Extend Journey
  const handleExtendJourney = async (extraMinutes: number = 15) => {
    if (!currentJourney) return;
    const extended = await extendJourney(currentJourney.id, extraMinutes);
    if (extended) {
      setCurrentJourney(extended);
    }
  };

  // Fast-Forward Overdue Simulator (For testing & review)
  const handleSimulateOverdue = async () => {
    if (!currentJourney) return;
    const overdue = await simulateOverdue(currentJourney.id);
    if (overdue) {
      setCurrentJourney(overdue);
    }
  };

  // Share Trip Details with chosen contact only
  const handleShareTrip = async () => {
    if (!currentJourney) return;

    const formattedTime = new Date(currentJourney.expectedArrivalTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const shareText = `SaferStreets JourneyGuard: I started a journey to ${currentJourney.destination}. Expected arrival: ${formattedTime}. Trip ID: ${currentJourney.id}. Contacting you (${currentJourney.contactName}) as my check-in guardian. If I haven't confirmed my arrival by then, please check on me.`;

    // Use Web Share API if supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: `JourneyGuard: Trip to ${currentJourney.destination}`,
          text: shareText,
        });
        setShareFeedback("Trip details shared with your trusted contact.");
        setTimeout(() => setShareFeedback(null), 3000);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback("Trip details copied to clipboard. Paste into your messaging app to notify your contact.");
      setTimeout(() => setShareFeedback(null), 4000);
    } catch (e) {
      setShareFeedback("Could not copy automatically. Please share the trip ID manually.");
    }
  };

  const formatCountdown = (totalSec: number | null) => {
    if (totalSec === null) return "--:--";
    if (totalSec <= 0) return "00:00 (Overdue)";
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <PageContainer maxWidth="6xl" className="space-y-6">
      {/* ============================================================== */}
      {/* PAGE HEADER */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E293B]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4 fill-current" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              JourneyGuard
            </h1>
            <StatusBadge
              variant={
                currentJourney?.status === "Overdue"
                  ? "warning"
                  : currentJourney?.status === "Active"
                  ? "safe"
                  : "neutral"
              }
              dot
            >
              {currentJourney?.status === "Overdue"
                ? "Needs Check-in"
                : currentJourney?.status === "Active"
                ? "Active Trip Escort"
                : "Standby"}
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            A simple journey check-in and trusted-contact feature. Set expected arrival timers, share secure trip details with your designated contact, and prompt check-ins if overdue.
          </p>
        </div>

        {/* Direct Call 112 Emergency Button */}
        <div className="flex items-center gap-2.5">
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm shadow-red-600/30 transition-all active:scale-[0.98]"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 112</span>
          </a>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {/* ============================================================== */}
      {/* ACTIVE JOURNEY MONITOR CARD (IF RUNNING) */}
      {/* ============================================================== */}
      {!isLoading && currentJourney && (
        <div className="space-y-4">
          {/* Overdue Reminder Banner (Does NOT declare an emergency) */}
          {currentJourney.status === "Overdue" && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Expected Arrival Time Has Passed — Please Check In</span>
              </div>
              <p className="text-xs leading-relaxed">
                Your journey has exceeded the scheduled arrival time. Please confirm that you arrived safely. If you are delayed, extend your check-in time below.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCompleteJourney}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>I'm Safe (Complete Journey)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExtendJourney(15)}
                >
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  <span>Extend by +15 mins</span>
                </Button>

                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-[#131C2E] text-red-600 hover:bg-red-50 text-xs font-bold"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call 112</span>
                </a>
              </div>
            </div>
          )}

          {/* Active Trip Details Card */}
          <Card className="border-sky-300 dark:border-sky-700/60 shadow-md">
            <CardHeader className="border-b-0 pb-1">
              <div className="flex flex-wrap items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-500">
                    Trip ID: {currentJourney.id}
                  </span>
                </div>

                <StatusBadge
                  variant={currentJourney.status === "Overdue" ? "warning" : "safe"}
                  dot
                >
                  {currentJourney.status === "Overdue" ? "Check-in Overdue" : "Trip Active"}
                </StatusBadge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B]">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Destination</div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>{currentJourney.destination}</span>
                  </div>
                  {currentJourney.startingLocation && (
                    <div className="text-[10px] text-slate-400">
                      From: {currentJourney.startingLocation}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Expected Arrival</div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-mono">
                    {new Date(currentJourney.expectedArrivalTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-bold">
                    Countdown: {formatCountdown(remainingSeconds)}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Trusted Contact</div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{currentJourney.contactName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentJourney.contactMethod}
                  </div>
                </div>
              </div>

              {/* Share Feedback Toast */}
              {shareFeedback && (
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{shareFeedback}</span>
                </div>
              )}

              {/* Actions Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {/* Share Trip Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleShareTrip}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Trip with {currentJourney.contactName}</span>
                  </Button>

                  {/* Extend Time Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExtendJourney(15)}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>+15 mins</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Complete Journey */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCompleteJourney}
                    className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </Button>

                  {/* Test Overdue Simulation Shortcut */}
                  {currentJourney.status === "Active" && (
                    <button
                      type="button"
                      onClick={handleSimulateOverdue}
                      className="text-[10px] text-slate-400 hover:text-amber-500 underline ml-1"
                      title="Simulate overdue arrival time for testing"
                    >
                      (Test Overdue)
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* START NEW JOURNEY FORM */}
      {/* ============================================================== */}
      {!isLoading && !currentJourney && (
        <Card className="p-6">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-sky-600" />
                <span>Start a New Monitored Journey</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up a check-in timer and specify a trusted contact to be notified if you don't arrive on time.
              </p>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <form onSubmit={handleStartJourney} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Destination */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span>Destination <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Central Library, Home Apartment Block B, Metro Station..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>

              {/* Optional Starting Location with explicit permission request */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Starting Location (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>{isLocating ? "Requesting permission..." : "Capture Current GPS"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. North Sector Station, Office Plaza, or tap Capture GPS..."
                  value={startingLocation}
                  onChange={(e) => setStartingLocation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                {geoNotice && (
                  <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 text-[11px] border border-sky-200 dark:border-sky-800/40">
                    {geoNotice}
                  </div>
                )}
              </div>

              {/* Expected Arrival Interval Presets */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Expected Arrival Window <span className="text-red-500">*</span></span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setMinutesFromNow(mins)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        minutesFromNow === mins
                          ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300 shadow-xs"
                          : "border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400">
                  Target arrival time: {new Date(Date.now() + minutesFromNow * 60 * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Trusted Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Trusted Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Chen, David Miller..."
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Contact Phone / Email / Handle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 234-5678, WhatsApp, or email..."
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Journey Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Walking via Well-Lit Boulevard; wearing blue jacket..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-[11px] text-slate-500 border border-slate-200 dark:border-[#1E293B] flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Privacy protection: Trip details are shared only with your designated contact. Live location is never made public.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isSubmitting ? "Starting..." : "Start JourneyGuard Escort"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ============================================================== */}
      {/* RECENT COMPLETED JOURNEYS */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Recent Completed Journeys
        </h3>

        {pastJourneys.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No past journeys on record.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pastJourneys.map((j) => (
              <Card key={j.id} className="p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {j.destination}
                  </span>
                  <StatusBadge variant="safe" dot>
                    Arrived Safely
                  </StatusBadge>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Trip ID: {j.id}</span>
                  <span>Contact: {j.contactName}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
