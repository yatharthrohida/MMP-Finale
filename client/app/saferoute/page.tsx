"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  CheckCircle,
  Clock,
  PlusCircle,
  ThumbsUp,
  Filter,
  Check,
  X,
  RotateCcw,
  Navigation,
  Crosshair,
  AlertCircle,
  Info,
  Search,
  Shield,
  PhoneCall,
} from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import SafeRouteMap from "@/components/safety/SafeRouteMap";
import {
  SafetyConcernCategory,
  SafetyConcernReport,
  SafetyConcernStatus,
  fetchSafetyReports,
  createSafetyReport,
  updateReportStatus,
  verifyReport,
} from "@/lib/safety-reports";

const CATEGORIES: SafetyConcernCategory[] = [
  "Poor lighting",
  "Broken streetlight",
  "Road hazard",
  "Harassment concern",
  "Other",
];

export default function SafeRoutePage() {
  const [reports, setReports] = useState<SafetyConcernReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Form State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [category, setCategory] = useState<SafetyConcernCategory>("Poor lighting");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number]>([75.8321, 25.0499]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter State
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Geolocation Permission notice state
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Load Reports
  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchSafetyReports();
        setReports(data);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const q = params.get("q");
          if (q) setSearchQuery(q);
        }
      } catch (err) {
        console.error("Failed to load safety reports:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Filter logic
  const filteredReports = reports.filter((r) => {
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        r.locationName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Handle map location selection
  const handleMapLocationSelect = (coords: [number, number], approxAddress: string) => {
    setCoordinates(coords);
    setLocationName(approxAddress);
    setShowSubmitModal(true);
    setFormSuccess(null);
    setFormError(null);
  };

  // Browser Geolocation Permission Request
  const handleRequestGeolocation = () => {
    setGeoNotice(null);
    if (!navigator.geolocation) {
      setGeoNotice("Geolocation is not supported by your browser. Please enter the location manually.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const roundedLng = Math.round(pos.coords.longitude * 1000) / 1000;
        const roundedLat = Math.round(pos.coords.latitude * 1000) / 1000;
        setCoordinates([roundedLng, roundedLat]);
        setLocationName(`Near GPS [${roundedLat.toFixed(3)}°N, ${roundedLng.toFixed(3)}°E]`);
        setGeoNotice("Current approximate location captured. Your exact home coordinates will not be exposed.");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice("Geolocation access was denied. You can manually enter the street name or landmark.");
        } else {
          setGeoNotice("Unable to detect current position. Please enter the location manually.");
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Submit Handler
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) {
      setFormError("Please provide a short description of the safety concern.");
      return;
    }
    if (description.trim().length < 5) {
      setFormError("Description should be at least 5 characters.");
      return;
    }
    if (!locationName.trim()) {
      setFormError("Please enter a location name or select a point on the map.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newReport = await createSafetyReport({
        category,
        description,
        locationName,
        coordinates,
      });

      setReports((prev) => [newReport, ...prev]);
      setSelectedReportId(newReport.id);
      // Reset active filters so new report is visible in the list immediately
      setCategoryFilter("all");
      setStatusFilter("all");
      setSearchQuery("");
      setFormSuccess("Safety concern report submitted to the community map.");
      setDescription("");
      setLocationName("");
      setTimeout(() => {
        setShowSubmitModal(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Action Handlers
  const handleVerify = async (reportId: string) => {
    const updated = await verifyReport(reportId);
    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    }
  };

  const handleSetStatus = async (reportId: string, status: SafetyConcernStatus) => {
    const updated = await updateReportStatus(reportId, status);
    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    }
  };

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
    <PageContainer maxWidth="7xl" className="space-y-6">
      {/* ============================================================== */}
      {/* HEADER SECTION */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E293B]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Navigation className="w-4 h-4 fill-current" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              SafeRoute
            </h1>
            <StatusBadge variant="info" dot>
              Community Concern Map
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            A crowd-verified map of reported street-safety concerns. Submit hazards, check dark spots, and verify conditions to keep neighborhoods informed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="emergency"
            size="sm"
            onClick={() => {
              setShowSubmitModal(true);
              setFormError(null);
              setFormSuccess(null);
            }}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Street Concern</span>
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAP & SUBMIT FORM SECTION */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* Interactive Map */}
        <SafeRouteMap
          reports={filteredReports}
          selectedReportId={selectedReportId}
          onSelectReport={(id) => setSelectedReportId(id)}
          selectedLocation={coordinates}
          onLocationSelect={handleMapLocationSelect}
        />
      </div>

      {/* ============================================================== */}
      {/* REPORT SUBMISSION DIALOG / DRAWER */}
      {/* ============================================================== */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Report Street Safety Concern
                </h2>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-center space-y-2 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-600" />
                <div className="font-bold text-sm">{formSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Concern Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SafetyConcernCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the issue (e.g. non-working lamp post, damaged pavement, obstructed view)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                {/* Location Selection & Manual Entry */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      <span>Approximate Location <span className="text-red-500">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRequestGeolocation}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>Detect Location</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter street intersection, landmark, or tap on map..."
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                  <div className="text-[10px] text-slate-400">
                    Selected map coordinates: [{coordinates[1].toFixed(3)}°N, {coordinates[0].toFixed(3)}°E]
                  </div>
                  {geoNotice && (
                    <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 text-[11px] border border-sky-200 dark:border-sky-800/40">
                      {geoNotice}
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-[11px] text-slate-500 flex items-start gap-1.5 border border-slate-200 dark:border-[#1E293B]">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Privacy note: Your personal identity and exact home number are never shared. Reports are shown as approximate neighborhood spots.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubmitModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Publish Report"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FILTER & REPORTS LIST */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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
              <option value="Verified">Verified</option>
              <option value="Resolved">Resolved</option>
            </select>

            <div className="relative ml-1">
              <input
                type="text"
                placeholder="Search concerns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none w-36 sm:w-48 placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"} on map
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredReports.length === 0 && (
          <Card className="text-center py-6">
            <EmptyState
              icon={AlertTriangle}
              title="No reports match your filter"
              description="There are currently no reported street-safety concerns matching these criteria in this community sector."
              actionLabel="Report a Concern"
              onActionClick={() => setShowSubmitModal(true)}
            />
          </Card>
        )}

        {/* Reports List */}
        {!isLoading && filteredReports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const isSelected = selectedReportId === report.id;
              const isResolved = report.status === "Resolved";
              const isVerified = report.status === "Verified";

              return (
                <Card
                  key={report.id}
                  hover
                  className={`flex flex-col justify-between transition-all ${
                    isSelected
                      ? "ring-2 ring-sky-500 border-sky-400 dark:border-sky-600"
                      : ""
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {report.category === "Broken streetlight" ? (
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : report.category === "Poor lighting" ? (
                            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : report.category === "Harassment concern" ? (
                            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <span>{report.category}</span>
                        </span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="truncate">{report.locationName}</span>
                        </div>
                      </div>

                      <StatusBadge
                        variant={
                          isResolved ? "safe" : isVerified ? "emergency" : "warning"
                        }
                        dot
                      >
                        {report.status}
                      </StatusBadge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {report.description}
                    </p>

                    {/* Metadata */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 border border-slate-100 dark:border-[#1E293B]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTimeAgo(report.createdAt)}</span>
                      </span>
                      <span>•</span>
                      <span>Approx: {report.coordinates[1].toFixed(3)}°N, {report.coordinates[0].toFixed(3)}°E</span>
                      <span>•</span>
                      <span>{report.reporterRole}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#1E293B]/60 flex flex-wrap items-center justify-between gap-2">
                    {/* User Verification Action */}
                    <button
                      type="button"
                      onClick={() => handleVerify(report.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0B0F19] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      title="Confirm you also noticed this concern"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-sky-500" />
                      <span>Confirm ({report.verificationCount})</span>
                    </button>

                    {/* Admin/User Resolution Action */}
                    <div className="flex items-center gap-1.5">
                      {report.status !== "Resolved" ? (
                        <button
                          type="button"
                          onClick={() => handleSetStatus(report.id, "Resolved")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-200 dark:border-emerald-800/40"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetStatus(report.id, "Unverified")}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Flag concern as still present"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
