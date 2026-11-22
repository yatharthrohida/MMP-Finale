# SaferStreets - Architecture & Adaptation Notes

## 1. Discovered Stack

- **Monorepo Architecture**: npm workspaces with `client` and `server`.
- **Frontend Framework**: Next.js 15.1 (App Router), React 19, TypeScript.
- **Styling & Design System**:
  - Tailwind CSS v3 with warm terracotta and slate palette.
  - Primary: `#B9573B` (terracotta-600), Secondary: `#6698C2` (sky blue).
  - Backgrounds: `#F8F5F0` (light) / `#171513` (dark mode); Cards/Sidebars: `#F1ECE5` / `#1E1B18`.
  - Iconography: `lucide-react`.
  - Responsive design with dedicated desktop sidebar and mobile bottom navigation tab bar.
- **Mapping & Geolocation**: MapLibre GL (`maplibre-gl` v6) with route metrics, geocoding coordinates, and custom map styling.
- **Backend & Integrations**:
  - Node.js / Express (TypeScript).
  - Prisma ORM (`server/prisma/schema.prisma`).
  - Real-time websockets via `socket.io` and `socket.io-client`.
  - Complete mock fallback layer in `client/lib/mock-data.ts` and `client/lib/api.ts` (enabling standalone frontend operation with zero external service dependencies).

---

## 2. Dedicated Core Module Routes & System Mapping

| Route | Module / Feature | Functionality & Role | Status |
|---|---|---|---|
| `/` | **Home Dashboard** | Four feature cards, emergency SOS trigger, community telemetry | Implemented Shell |
| `/saferoute` | **SafeRoute** | Community map of reported street-safety concerns & hazards | Implemented |
| `/automate` | **AutoMate** | Shared-auto matching, corridor pooling & join requests | Implemented |
| `/journeyguard`| **JourneyGuard**| Journey check-in, arrival timers, trusted contact share & 112 | Implemented |
| `/safealert` | **SafeAlert** | Emergency incident reporting, moderation & in-app broadcasts | Implemented |
| `/rides` | Mobility / Shared rides | Preserved existing ride-sharing & MapLibre map | Preserved |
| `/trips` | Journey schedules | Preserved trip coordination | Preserved |
| `/lost-found` | Street watch & hazard reports | Preserved incident catalog & registration | Preserved |
| `/train-buddy` | Companion radar | Preserved radar matching | Preserved |
| `/marketplace` | Safety Hub / Resources | Preserved community gear & equipment listings | Preserved |
| `/chat` | Live messaging | Preserved companion & community communication | Preserved |
| `/notifications`| Alert center | Preserved notification center & preferences | Preserved |
| `/profile` | Resident profile | Preserved member profile & emergency contacts | Preserved |
| `/admin` | Moderator console | Preserved moderation & analytics | Preserved |

---

## 3. Reusable Components

- `client/components/layout/AppShell.tsx`:
  - Unified responsive shell handling desktop sidebar, top search header, mobile sticky header, mobile 7-tab bottom navigation, and quick-action bottom sheet.
- `client/components/layout/NotificationBell.tsx`:
  - Live notification indicator popover with badge counts.
- `client/components/rides/RideNavigationMap.tsx`:
  - Interactive MapLibre GL navigation map component with origin/destination geocoding, route metric computation, and responsive styling.
- `client/components/safety/SafetyBanner.tsx`:
  - Expandable, themed safety guidelines and best-practice banner.
- `client/components/report/ReportButton.tsx` & `ReportModal.tsx`:
  - Community moderation, abuse reporting, and incident flagging modal.
- `client/components/match/MatchCard.tsx`:
  - High-confidence match card and similarity score visualization (for companions, incidents, and gear).
- `client/components/ui/EmptyState.tsx`:
  - Reusable empty state view with iconography, title, subtitle, and action buttons.
- `client/components/ui/Skeleton.tsx`:
  - Loading skeleton states for dashboards, cards, and lists.
- `client/components/auth/ProtectedRoute.tsx`:
  - Authentication route guard for protected views.
- `client/components/pwa/PwaRegister.tsx`:
  - Progressive Web App service worker registration.

---

## 4. Data Approach & State Management

- **API Layer (`client/lib/api.ts`)**:
  - Implements API contract methods covering auth, feed, lost-found, rides, train-buddy, marketplace, chat, notifications, reports, and admin analytics.
  - Automatically falls back to client-side localStorage/mock data in `mock-data.ts` if `NEXT_PUBLIC_USE_MOCKS=true` or backend is unavailable.
- **Auth Context (`client/lib/auth-context.tsx`)**:
  - Manages JWT tokens, authenticated member state, OTP verification, and default test user initialization.
- **Theme Context (`client/lib/theme-context.tsx`)**:
  - Supports light/dark mode persistence with system theme detection.
- **Notifications & Toast Contexts**:
  - Global reactive toast notifications and real-time unread alert counters.

---

## 5. Implementation Decisions (Shell Adaptation)

1. **Zero Breaking Changes**:
   - Kept all existing routes and file paths intact so all existing page logic and components continue to function.
2. **Branding & Shell Customization**:
   - Renamed brand to **SaferStreets** across desktop sidebar, mobile header, PWA manifest (`manifest.json`), and root metadata (`layout.tsx`).
   - Adapted navigation labels to reflect community safety & mobility while linking to preserved routes:
     - *Safe Commutes* (`/rides`), *Street Watch* (`/lost-found`), *Safe Walk Radar* (`/train-buddy`), *Safety Hub* (`/marketplace`), *Trips & Routes* (`/trips`).
   - Reconfigured mobile bottom tab bar and center Quick Action modal for safety-focused actions (Report Incident, Find Walk Buddy, Offer Safe Commute, Verify Safe Spot, Share Safety Gear).
3. **Module Isolation**:
   - In accordance with task instructions, the four specific modules were not modified in this initial phase; they remain fully intact and operational.
