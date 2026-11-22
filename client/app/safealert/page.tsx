"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  PlusCircle,
  Filter,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  Crosshair,
  Lock,
  Info,
  Sliders,
  Bell,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import {
  SafeAlertIncident,
  SafeAlertIncidentType,
  SafeAlertStatus,
  SafeAlertUserSettings,
  fetchSafeAlerts,
  createSafeAlertIncident,
  updateIncidentStatus,
  withdrawIncident,
  getStoredSettings,
  saveStoredSettings,
} from "@/lib/safe-alerts";

const INCIDENT_TYPES: SafeAlertIncidentType[] = [
  "Harassment / immediate threat",
  "Assault / violence",
  "Suspected child or vulnerable-person endangerment",
  "Other emergency",
];

export default function SafeAlertPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [incidents, setIncidents] = useState<SafeAlertIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moderatorMode, setModeratorMode] = useState(isAdmin);

  // Settings State
  const [settings, setSettings] = useState<SafeAlertUserSettings>({
    optedIn: true,
    radiusKm: 2.5,
  });
  const [showSettings, setShowSettings] = useState(false);

  // Filter State
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Report Emergency Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedType, setSelectedType] = useState<SafeAlertIncidentType>(
    "Harassment / immediate threat"
  );
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>(undefined);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo broadcast banner state
  const [demoBroadcastAlert, setDemoBroadcastAlert] = useState<{
    title: string;
    location: string;
    type: string;
  } | null>(null);

  // Moderation Note Modal State
  const [modTargetId, setModTargetId] = useState<string | null>(null);
  const [modStatus, setModStatus] = useState<SafeAlertStatus>("Reviewed");
  const [modNote, setModNote] = useState("");

  // Load Data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSafeAlerts();
      setIncidents(data);
      const savedSettings = getStoredSettings();
      setSettings(savedSettings);
    } catch (err) {
      console.error("Failed to load SafeAlert data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update Settings
  const handleUpdateRadius = (radius: number) => {
    const updated = { ...settings, radiusKm: radius };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  const handleToggleOptIn = () => {
    const updated = { ...settings, optedIn: !settings.optedIn };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  // Location request with explicit user permission
  const handleCaptureLocation = () => {
    setGeoNotice(null);
    if (!navigator.geolocation) {
      setGeoNotice("Geolocation is not supported by your browser. Please enter the location manually.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const rounded: [number, number] = [
          Math.round(pos.coords.longitude * 1000) / 1000,
          Math.round(pos.coords.latitude * 1000) / 1000,
        ];
        setCoordinates(rounded);
        setLocationName(`Near GPS [${rounded[1].toFixed(3)}°N, ${rounded[0].toFixed(3)}°E]`);
        setGeoNotice("Approximate coordinates captured. Exact home address is never made public.");
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice("Location permission denied. Please enter the street or landmark name manually.");
        } else {
          setGeoNotice("Unable to detect position. Please type the location manually.");
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Submit Emergency Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) {
      setFormError("Please enter a short factual description of what was observed.");
      return;
    }
    if (description.trim().length < 5) {
      setFormError("Description should be at least 5 characters.");
      return;
    }
    if (!locationName.trim()) {
      setFormError("Please provide an approximate location or landmark.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newAlert = await createSafeAlertIncident({
        incidentType: selectedType,
        description,
        locationName,
        coordinates,
        reporterUserId: user?.id || "usr_current_resident",
      });

      setIncidents((prev) => [newAlert, ...prev]);
      setShowReportModal(false);
      setDescription("");
      setLocationName("");
      setTypeFilter("all");
      setStatusFilter("all");

      // Trigger transparent In-App Demo Alert (No claims of real external push notifications)
      if (settings.optedIn) {
        setDemoBroadcastAlert({
          title: newAlert.id,
          location: newAlert.locationName,
          type: newAlert.incidentType,
        });
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to submit emergency report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Moderator Action Handler
  const handleApplyModeration = async () => {
    if (!modTargetId) return;
    const updated = await updateIncidentStatus(modTargetId, modStatus, modNote);
    if (updated) {
      setIncidents((prev) => prev.map((item) => (item.id === modTargetId ? updated : item)));
    }
    setModTargetId(null);
    setModNote("");
  };

  // Withdraw Accidental Report Handler
  const handleWithdrawReport = async (incidentId: string) => {
    if (confirm("Are you sure you want to withdraw this report as an accidental submission?")) {
      const updated = await withdrawIncident(incidentId);
      if (updated) {
        setIncidents((prev) => prev.map((item) => (item.id === incidentId ? updated : item)));
      }
    }
  };

  // Filtered Incidents
  const filteredIncidents = incidents.filter((item) => {
    if (typeFilter !== "all" && item.incidentType !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  const formatTimeAgo = (isoString: string): string => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diff < 60) return "Just now";
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <PageContainer maxWidth="6xl" className="space-y-6">
      {/* ============================================================== */}
      {/* HEADER & EMERGENCY CALL 112 STRIP */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E293B]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4 fill-current" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              SafeAlert
            </h1>
            <StatusBadge variant="emergency" dot>
              Emergency Network
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Rapid emergency reporting and verified community safety advisories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Prominent Direct 112 Emergency Call */}
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-sm shadow-red-600/30 transition-all active:scale-[0.98]"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 112</span>
          </a>

          {/* Prominent Report Emergency Action */}
          <Button
            variant="emergency"
            size="sm"
            onClick={() => {
              setShowReportModal(true);
              setFormError(null);
            }}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Emergency</span>
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CLEAR SAFETY NOTICE BANNER (CONFRONTATION & POLICE ADVISORY) */}
      {/* ============================================================== */}
      <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-900 dark:text-red-200 space-y-2">
        <div className="flex items-start gap-2.5 font-bold">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>Important Safety & Emergency Protocol:</span>
        </div>
        <ul className="space-y-1 pl-6 list-disc text-red-800 dark:text-red-300 text-[11px] leading-relaxed">
          <li>
            <strong>Do not confront, chase, or attempt to detain anyone.</strong> Stay in a safe, populated, or locked location.
          </li>
          <li>
            <strong>Police are NOT automatically dispatched by submitting an in-app report.</strong> If anyone is in immediate physical danger, dial <strong>112</strong> directly.
          </li>
          <li>
            Nearby residents receiving alerts should assist only if it is completely safe to do so from a distance, or contact emergency responders.
          </li>
        </ul>
      </div>

      {/* ============================================================== */}
      {/* IN-APP DEMO BROADCAST ALERT BANNER (TRANSPARENTLY LABELLED) */}
      {/* ============================================================== */}
      {demoBroadcastAlert && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-amber-700 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
              [In-App Demo Alert] Simulated Local Emergency Broadcast
            </span>
            <button
              onClick={() => setDemoBroadcastAlert(null)}
              className="p-1 rounded-md text-amber-600 hover:text-amber-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="leading-relaxed">
            Emergency alert logged (<strong>{demoBroadcastAlert.type}</strong>) near <strong>{demoBroadcastAlert.location}</strong>.
          </p>
          <div className="text-[10px] text-slate-500 font-mono">
            ℹ️ Notice: In-app demo alert displayed for opted-in residents within your configured {settings.radiusKm} km radius. Real external push notifications to other devices are not configured in this test environment.
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* NOTIFICATION SETTINGS & MODERATOR TOGGLE STRIP */}
      {/* ============================================================== */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleOptIn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
              settings.optedIn
                ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                : "bg-slate-100 dark:bg-[#0B0F19] text-slate-500"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{settings.optedIn ? "✓ Opted In to Alerts" : "Alerts Muted"}</span>
          </button>

          {settings.optedIn && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="text-[11px] text-slate-400">Alert Radius:</span>
              {[1.0, 2.5, 5.0].map((km) => (
                <button
                  key={km}
                  onClick={() => handleUpdateRadius(km)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                    settings.radiusKm === km
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Moderator Mode Toggle for Authorized/Review Testing */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1 cursor-pointer">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Moderator Review Mode</span>
            <input
              type="checkbox"
              checked={moderatorMode}
              onChange={(e) => setModeratorMode(e.target.checked)}
              className="ml-1 accent-sky-600"
            />
          </label>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FILTER CONTROLS */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter Incident Type:
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
          >
            <option value="all">All Incident Types</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <span className="font-bold text-slate-700 dark:text-slate-300 ml-2">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Unverified">Unverified</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Resolved">Resolved</option>
            <option value="False report">False report</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {filteredIncidents.length} incidents logged
        </div>
      </div>

      {/* ============================================================== */}
      {/* INCIDENTS LIST */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        )}

        {!isLoading && filteredIncidents.length === 0 && (
          <Card className="text-center py-10">
            <EmptyState
              icon={ShieldAlert}
              title="No emergency incidents found"
              description="No reports match your active filters in this area."
              actionLabel="Report an Emergency"
              onActionClick={() => setShowReportModal(true)}
            />
          </Card>
        )}

        {!isLoading && filteredIncidents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIncidents.map((incident) => {
              const isUnverified = incident.status === "Unverified";
              const isReviewed = incident.status === "Reviewed";
              const isResolved = incident.status === "Resolved";
              const isFalse = incident.status === "False report";
              const isWithdrawn = incident.status === "Withdrawn";

              return (
                <Card
                  key={incident.id}
                  hover
                  className={`space-y-3 border-l-4 ${
                    isUnverified
                      ? "border-l-red-500"
                      : isReviewed
                      ? "border-l-sky-500"
                      : isResolved
                      ? "border-l-emerald-500"
                      : "border-l-slate-400"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {incident.id}
                        </span>
                        {incident.isDemo && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            Demo Record
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {incident.incidentType}
                      </h3>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                        <span>{incident.locationName}</span>
                      </div>
                      {isUnverified && (
                        <div className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50 inline-flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span>Unverified Report — Pending Moderator Review</span>
                        </div>
                      )}
                    </div>

                    <StatusBadge
                      variant={
                        isUnverified
                          ? "emergency"
                          : isReviewed
                          ? "info"
                          : isResolved
                          ? "safe"
                          : "neutral"
                      }
                      dot
                    >
                      {incident.status}
                    </StatusBadge>
                  </div>

                  {/* Factual Description */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-0.5">
                    {incident.description}
                  </p>

                  {/* Moderation Notes if Reviewed/False Report */}
                  {incident.moderationNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1E293B]">
                      <strong>Moderator Assessment:</strong> {incident.moderationNotes}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 border border-slate-100 dark:border-[#1E293B]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatTimeAgo(incident.createdAt)}</span>
                    </span>
                    <span>•</span>
                    <span>{incident.reporterRole}</span>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B]/60 flex flex-wrap items-center justify-between gap-2">
                    <a
                      href="tel:112"
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 font-bold text-xs flex items-center gap-1.5 transition-colors border border-red-200 dark:border-red-900/50"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                      <span>Call 112</span>
                    </a>

                    {/* Reporter Accidental Cancellation */}
                    {incident.status === "Unverified" && (
                      <button
                        type="button"
                        onClick={() => handleWithdrawReport(incident.id)}
                        className="text-xs text-slate-400 hover:text-red-500 underline"
                      >
                        Withdraw (Accidental)
                      </button>
                    )}

                    {/* Moderator Controls */}
                    {moderatorMode && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setModTargetId(incident.id);
                            setModStatus("Reviewed");
                            setModNote("");
                          }}
                          className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-xs hover:bg-sky-100"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModTargetId(incident.id);
                            setModStatus("Resolved");
                            setModNote("");
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100"
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModTargetId(incident.id);
                            setModStatus("False report");
                            setModNote("Confirmed false or duplicate alarm.");
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                        >
                          False Report
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: REPORT EMERGENCY INCIDENT */}
      {/* ============================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#131C2E] border border-red-200 dark:border-red-900/50 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Report Emergency Incident
                  </h2>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
                    Initial Status: Unverified
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct 112 Shortcut in Form */}
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center justify-between text-xs text-red-900 dark:text-red-200">
              <span className="font-medium">Physical danger in progress?</span>
              <a
                href="tel:112"
                className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 112 First</span>
              </a>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Incident Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Select Incident Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {INCIDENT_TYPES.map((t) => (
                    <label
                      key={t}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedType === t
                          ? "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-900 dark:text-red-200 font-bold"
                          : "border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="incidentType"
                        value={t}
                        checked={selectedType === t}
                        onChange={() => setSelectedType(t)}
                        className="accent-red-600"
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Factual Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Factual Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide a short, objective description of what was observed from a safe distance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
                <p className="text-[10px] text-slate-400">
                  Do not confront anyone, chase anyone, or gather evidence. Do not include unverified names or personal accusations.
                </p>
              </div>

              {/* Approximate Location */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span>Location / Landmark <span className="text-red-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>{isLocating ? "Requesting..." : "Detect Location"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Underpass crossing near Metro Gate 2..."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
                {geoNotice && (
                  <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 text-[11px] border border-sky-200 dark:border-sky-800/40">
                    {geoNotice}
                  </div>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-[11px] text-slate-500 border border-slate-200 dark:border-[#1E293B]">
                🔒 <strong>Privacy & Protection:</strong> Your name, phone number, and personal identity will remain completely anonymous. Reports enter as <strong>Unverified</strong> for moderator review.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="emergency"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Emergency Report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MODERATION REVIEW ACTION */}
      {/* ============================================================== */}
      {modTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Update Incident Status: {modStatus}
            </h3>
            <p className="text-xs text-slate-500">
              Provide an optional assessment note for community audit transparency:
            </p>
            <textarea
              rows={2}
              placeholder="e.g. Patrol attended site, situation cleared..."
              value={modNote}
              onChange={(e) => setModNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-xs"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModTargetId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyModeration}
              >
                Confirm Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
