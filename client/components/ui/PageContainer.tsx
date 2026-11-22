import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "6xl" | "7xl" | "full";
}

export function PageContainer({
  children,
  className = "",
  maxWidth = "6xl",
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={`w-full ${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 ${className}`}
    >
      {children}
    </div>
  );
}
