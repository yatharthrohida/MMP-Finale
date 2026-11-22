"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Navigation,
  Car,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Sun,
  Moon,
  LogOut,
  User,
  Search,
  MessageSquare,
  Bell,
  Menu,
  X,
  Radio,
  PhoneCall,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "./NotificationBell";
import { EmergencyModal } from "@/components/safety/EmergencyModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const [isSosOpen, setIsSosOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Primary SaferStreets Navigation Links
  const mainNavItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      tag: "Overview",
    },
    {
      label: "SafeRoute",
      href: "/saferoute",
      icon: Navigation,
      tag: "Safe Nav",
    },
    {
      label: "AutoMate",
      href: "/automate",
      icon: Car,
      tag: "Commute",
    },
    {
      label: "JourneyGuard",
      href: "/journeyguard",
      icon: Shield,
      tag: "Escort",
    },
    {
      label: "SafeAlert",
      href: "/safealert",
      icon: AlertTriangle,
      tag: "Hazards",
    },
  ];

  // Secondary Utilities Links
  const secondaryNavItems = [
    { label: "Community Chat", href: "/chat", icon: MessageSquare },
    { label: "Alerts & Notices", href: "/notifications", icon: Bell },
    { label: "Profile & Contacts", href: "/profile", icon: User },
    ...(user?.role === "ADMIN"
      ? [{ label: "Moderator Console", href: "/admin", icon: ShieldAlert }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/saferoute?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userInitial = user?.name ? user.name[0].toUpperCase() : "S";
  const userIdentifier = user?.name || "Verified Resident";
  const userEmail = user?.email || "resident@saferstreets.net";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col md:flex-row text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR (Dark navy foundation, restrained blue accents) */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] sticky top-0 h-screen p-5 shrink-0 z-30 justify-between">
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Logo & Brand Presentation */}
          <div className="pt-1">
            <Link href="/" className="flex flex-col group">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-4 h-4 fill-current" />
                </div>
                <div className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Safer<span className="text-sky-500">Streets</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-1 pl-0.5">
                Safer Streets. Smarter Journeys.
              </span>
            </Link>
          </div>

          {/* Emergency / SOS Entry Point */}
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-red-700 dark:text-red-400">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                Safety Emergency
              </span>
              <span className="text-[10px] text-red-500 dark:text-red-400 font-mono">24/7 Live</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSosOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-sm shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Trigger Emergency SOS</span>
            </button>
          </div>

          {/* Primary Navigation */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Core Modules
            </div>
            <nav className="space-y-1" aria-label="Main Navigation">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-900/50"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131C2E] font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          active
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {active && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                        {item.tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Secondary Utilities */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Community & Safety
            </div>
            <nav className="space-y-1" aria-label="Secondary Navigation">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-all ${
                      active
                        ? "bg-slate-100 dark:bg-[#131C2E] text-sky-600 dark:text-sky-400 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#131C2E]/60 font-medium"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#1E293B]">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-2 rounded-xl">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 overflow-hidden group"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {userInitial}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 group-hover:text-sky-500 transition-colors">
                    {userIdentifier}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {userEmail}
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#131C2E] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-[#1E293B] text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#131C2E] transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Resident Sign In</span>
            </Link>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE TOP HEADER */}
      {/* ============================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1E293B] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white">
            <Shield className="w-3.5 h-3.5 fill-current" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
              Safer<span className="text-sky-500">Streets</span>
            </div>
            <div className="text-[7.5px] uppercase font-bold tracking-widest text-slate-400 leading-tight">
              Smarter Journeys
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Prominent Mobile SOS Button */}
          <button
            type="button"
            onClick={() => setIsSosOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            aria-label="Emergency SOS trigger"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            <span>SOS</span>
          </button>

          <NotificationBell />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131C2E] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131C2E] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs pt-16 animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] p-5 space-y-4 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Navigation
            </div>
            <div className="space-y-1">
              {[...mainNavItems, ...secondaryNavItems].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive(item.href)
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#131C2E]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between gap-4 px-6 lg:px-8 py-3.5 bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-md border-b border-slate-200 dark:border-[#1E293B] sticky top-0 z-20">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search addresses, safe routes, hazards, community resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#131C2E] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
              />
            </div>
          </form>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Prominent Emergency Button in Desktop Header */}
            <button
              type="button"
              onClick={() => setIsSosOpen(true)}
              className="py-1.5 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs shadow-red-600/30 transition-all active:scale-[0.98]"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>SOS Emergency</span>
            </button>

            <NotificationBell />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131C2E] transition-colors"
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {isAuthenticated && user ? (
              <Link href="/profile" title={user.name}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:opacity-90 transition-opacity">
                    {userInitial}
                  </div>
                )}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ============================================================== */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-center border-t border-slate-200 dark:border-[#1E293B] bg-white/95 dark:bg-[#0F172A]/95 px-1 py-1.5 backdrop-blur-lg"
        aria-label="Mobile Navigation Bar"
      >
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            isActive("/") ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Home className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[9px] mt-0.5">Home</span>
        </Link>

        <Link
          href="/saferoute"
          className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            isActive("/saferoute") ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Navigation className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[9px] mt-0.5">SafeRoute</span>
        </Link>

        <Link
          href="/automate"
          className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            isActive("/automate") ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Car className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[9px] mt-0.5">AutoMate</span>
        </Link>

        <Link
          href="/journeyguard"
          className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            isActive("/journeyguard") ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Shield className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[9px] mt-0.5">Guard</span>
        </Link>

        <Link
          href="/safealert"
          className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            isActive("/safealert") ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[9px] mt-0.5">Alerts</span>
        </Link>
      </nav>

      {/* Controlled Emergency SOS Dialog */}
      <EmergencyModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </div>
  );
}
