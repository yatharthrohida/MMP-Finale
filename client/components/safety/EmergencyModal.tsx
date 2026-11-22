"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Users,
  AlertTriangle,
  X,
  CheckCircle,
  Radio,
  Share2,
} from "lucide-react";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sosSent, setSosSent] = useState(false);
  const [activeStep, setActiveStep] = useState<"ready" | "countdown" | "activated">("ready");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeStep === "countdown" && countdown !== null) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        setActiveStep("activated");
        setSosSent(true);
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, activeStep]);

  if (!isOpen) return null;

  const handleStartCountdown = () => {
    setCountdown(3);
    setActiveStep("countdown");
  };

  const handleCancel = () => {
    setCountdown(null);
    setActiveStep("ready");
    setSosSent(false);
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#131C2E] border border-red-200 dark:border-red-900/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <div>
              <h2 id="sos-modal-title" className="font-extrabold text-lg tracking-wide uppercase">
                Emergency SOS Dispatch
              </h2>
              <p className="text-xs text-red-100">
                Controlled Personal Safety Alert System
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-red-100 hover:text-white hover:bg-red-700/60 transition-colors"
            aria-label="Close emergency modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Display */}
          {activeStep === "ready" && (
            <>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-sm text-red-900 dark:text-red-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p>
                  Pressing <strong>Broadcast SOS</strong> will share your live GPS location with your pre-configured emergency contacts, nearby verified JourneyGuard companions, and community safety responders.
                </p>
              </div>

              {/* Current Telemetry Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    GPS Telemetry Location
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Live Accurate
                  </span>
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400">
                  Lat: 25.0499° N, Long: 75.8321° E • Sector 3 North Hub
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 pt-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>3 Emergency Guardians on stand-by</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartCountdown}
                  className="w-full py-4 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-base tracking-wider uppercase shadow-lg shadow-red-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Radio className="w-5 h-5 animate-pulse" />
                  <span>Broadcast Emergency SOS</span>
                </button>

                {/* Direct Call 112 */}
                <a
                  href="tel:112"
                  className="w-full py-3 px-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-red-600" />
                  <span>Direct Emergency: Call 112</span>
                </a>
              </div>
            </>
          )}

          {activeStep === "countdown" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 border-4 border-red-500 flex items-center justify-center text-4xl font-black text-red-600 dark:text-red-400 animate-pulse">
                {countdown}
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">
                  Broadcasting in {countdown} seconds...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Accidental tap? Cancel immediately below.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-3 px-4 rounded-xl bg-slate-200 dark:bg-[#1E293B] hover:bg-slate-300 dark:hover:bg-[#2A374E] text-slate-900 dark:text-slate-100 font-bold text-sm transition-colors"
              >
                Cancel SOS Broadcast
              </button>
            </div>
          )}

          {activeStep === "activated" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
                  In-App Demo Simulation
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mt-1.5">
                  SOS Beacon Logged
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Local safety beacon simulated with fuzzed coordinates. Emergency services are NOT automatically dispatched by in-app triggers.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0B0F19] text-xs text-slate-600 dark:text-slate-400 text-left space-y-1">
                <div>• Status: Simulated Local Trigger</div>
                <div>• Coordinates: ~100m Privacy Fuzzed</div>
                <div>• Beacon ID: SOS-{Math.floor(100000 + Math.random() * 900000)}</div>
              </div>
              <div className="space-y-2">
                <a
                  href="tel:112"
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-red-600/30"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call 112 (Live Emergency Services)</span>
                </a>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-[#1E293B] hover:bg-slate-300 dark:hover:bg-[#2A374E] text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
                >
                  Disarm / Dismiss Alert
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
