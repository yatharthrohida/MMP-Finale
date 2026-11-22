import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-xs transition-all ${
        hover
          ? "hover:border-sky-300 dark:hover:border-sky-700/60 hover:shadow-md"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-[#1E293B]/70 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`font-bold text-slate-900 dark:text-slate-100 text-base ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`pt-3 ${className}`}>{children}</div>;
}
