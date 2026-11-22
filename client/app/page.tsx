"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Navigation,
  Car,
  Shield,
  AlertTriangle,
  Radio,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Users,
  Compass,
  PhoneCall,
  Clock,
  Sparkles,
} from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmergencyModal } from "@/components/safety/EmergencyModal";

export default function Home() {
  const [isSosOpen, setIsSosOpen] = useState(false);

  const features = [
    {
      title: "SafeRoute",
      href: "/saferoute",
      icon: Navigation,
      badgeText: "Community Concern Map",
      badgeVariant: "info" as const,
      description:
        "Interactive community map of reported street-safety concerns: poor lighting, broken streetlights, road hazards, and pedestrian concerns.",
      highlight: "Pin, verify, and track community-reported street hazards in your neighborhood.",
      actionLabel: "View SafeRoute Map",
    },
    {
      title: "AutoMate",
      href: "/automate",
      icon: Car,
      badgeText: "Verified Commute Pooling",
      badgeVariant: "info" as const,
      description:
        "Connect with verified neighbors, students, and coworkers heading along your commute corridor for shared, trusted transit.",
      highlight: "Verified IDs, transparent route matching, and zero-surge community travel.",
      actionLabel: "Explore AutoMate Rides",
    },
    {
      title: "JourneyGuard",
      href: "/journeyguard",
      icon: Shield,
      badgeText: "Active Trip Escort",
      badgeVariant: "safe" as const,
      description:
        "Live companion radar and automated trip tracking with periodic check-in timers and instant anomaly detection if you stop or divert.",
      highlight: "Virtual escort monitors your route and notifies guardians if check-in is missed.",
      actionLabel: "Activate JourneyGuard",
    },
    {
      title: "SafeAlert",
      href: "/safealert",
      icon: AlertTriangle,
      badgeText: "Community Street Watch",
      badgeVariant: "warning" as const,
      description:
        "Crowd-sourced, peer-verified reports of street hazards, broken lighting, obstruction, or suspicious activity in your immediate vicinity.",
      highlight: "Real-time neighborhood notifications with upvotes and moderator resolution.",
      actionLabel: "Browse SafeAlerts",
    },
  ];

  return (
    <PageContainer maxWidth="6xl" className="space-y-8">
      {/* ============================================================== */}
      {/* HERO SECTION */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge variant="safe" dot>
              Community Safety Network Active
            </StatusBadge>
            <span className="text-xs font-mono text-slate-400">
              Coverage: Sector 3 North & City Core
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              SaferStreets
            </h1>
            <p className="text-base sm:text-xl text-sky-300 font-medium tracking-wide">
              Safer Streets. Smarter Journeys.
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            A community-driven personal safety and mobility platform. Navigate well-lit paths, share verified commutes, activate live guardian escorts, and report street conditions in real time.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/saferoute">
              <Button variant="primary" size="md">
                <Navigation className="w-4 h-4" />
                <span>Open SafeRoute Map</span>
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setIsSosOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-sm border border-red-500 shadow-xs transition-all active:scale-[0.99]"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Emergency Dispatch (SOS)</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* EMERGENCY / SOS CONTROLLED HIGHLIGHT BANNER */}
      {/* ============================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-900 dark:text-red-200">
                Controlled Emergency SOS Access
              </h3>
              <StatusBadge variant="emergency" dot>
                Ready
              </StatusBadge>
            </div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
              Requires 2-step countdown confirmation to prevent accidental triggers. In an immediate physical emergency, dial 112 directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="emergency"
            size="sm"
            onClick={() => setIsSosOpen(true)}
            className="w-full sm:w-auto"
          >
            <span>Trigger SOS</span>
          </Button>
          <a
            href="tel:112"
            className="py-1.5 px-3 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-[#131C2E] text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 112</span>
          </a>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FOUR CORE FEATURE CARDS */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Safety & Mobility Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Four integrated systems engineered for proactive personal protection.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
            4 Services Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                hover
                className="flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800/40">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                          {feature.title}
                        </h3>
                        <StatusBadge
                          variant={feature.badgeVariant}
                          dot
                          className="mt-0.5"
                        >
                          {feature.badgeText}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                    <span>{feature.highlight}</span>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#1E293B]/60">
                  <Link href={feature.href} className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between group"
                    >
                      <span>{feature.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* COMMUNITY SAFETY TELEMETRY STRIP */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Regional Safety Status</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
            Normal Advisory
          </div>
          <div className="text-[11px] text-slate-500">No high-priority warnings in Sector 3</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Users className="w-4 h-4 text-sky-500" />
            <span>Community Guardians</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
            24 Active in 2.0 km
          </div>
          <div className="text-[11px] text-slate-500">Verified escorts & neighbors nearby</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>Verified Safe Havens</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
            14 Certified Hubs
          </div>
          <div className="text-[11px] text-slate-500">24/7 staffed stations & transit centers</div>
        </div>
      </div>

      {/* Controlled Emergency SOS Dialog */}
      <EmergencyModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </PageContainer>
  );
}
