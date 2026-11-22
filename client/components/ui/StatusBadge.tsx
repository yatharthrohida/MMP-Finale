import React from "react";

export type StatusVariant =
  | "safe"
  | "warning"
  | "emergency"
  | "info"
  | "neutral";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({
  children,
  variant = "safe",
  className = "",
  dot = true,
}: StatusBadgeProps) {
  const variantStyles = {
    safe: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
    emergency:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40",
    info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
    neutral:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  const dotStyles = {
    safe: "bg-emerald-500",
    warning: "bg-amber-500",
    emergency: "bg-red-500 animate-pulse",
    info: "bg-sky-500",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
}
