import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "emergency"
  | "outline"
  | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-semibold rounded-lg",
    md: "px-4 py-2 text-sm font-bold rounded-xl",
    lg: "px-6 py-3 text-base font-bold rounded-xl",
  };

  const variantStyles = {
    primary:
      "bg-sky-600 hover:bg-sky-700 text-white shadow-xs focus:ring-2 focus:ring-sky-500/40",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-[#1E293B] dark:hover:bg-[#2A374E] dark:text-slate-100",
    emergency:
      "bg-red-600 hover:bg-red-700 text-white shadow-xs focus:ring-2 focus:ring-red-500/40",
    outline:
      "border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-800 dark:text-slate-200",
    ghost:
      "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-[#1E293B]",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
