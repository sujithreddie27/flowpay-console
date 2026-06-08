# FlowPay Console - Frontend Day-Wise Development Plan

> **Project:** Real-Time Payment Processing Platform (Admin/User Console)  
> **Tech Stack:** React, TypeScript, Vite, TailwindCSS, Redux Toolkit, React Query, Recharts  
> **Duration:** 5 Weeks (24 Working Days)  
> **Repo:** flowpay-console (Frontend)

---

## Week 1: Project Setup, Routing & Core Layout

### Day 1 — Project Initialization & Configuration
- [x] Configure `package.json` with project metadata
- [x] Install core dependencies: React 18, TypeScript, Vite
- [x] Install UI: TailwindCSS, Headless UI, Heroicons, clsx
- [x] Install state/data: Redux Toolkit, React Query, Axios
- [x] Install routing: React Router v6
- [x] Configure `vite.config.ts` (aliases, proxy to backend API)
- [x] Configure `tailwind.config.ts` (custom theme, colors, fonts)
- [x] Set up `tsconfig.json` with path aliases (`@/components`, `@/pages`, etc.)
- [x] Create `.env` and `.env.example` files
- [x] Verify dev server runs with `npm run dev`

### Day 2 — Project Structure & Base Layout
- [ ] Set up folder structure:
  - `components/` (shared UI components)
  - `pages/` (route-level components)
  - `services/` (API layer)
  - `store/` (Redux slices)
  - `hooks/` (custom hooks)
  - `types/` (TypeScript interfaces)
  - `utils/` (helpers)
- [ ] Create `MainLayout` component (sidebar + header + content area)
- [ ] Create `AuthLayout` component (centered card layout)
- [ ] Create responsive Sidebar with navigation items
- [ ] Create Header with user avatar, notifications bell, search
- [ ] Implement mobile-responsive hamburger menu

### Day 3 — Routing & Navigation
- [ ] Set up React Router with route configuration
- [ ] Define routes:
  - `/login`, `/register` (public)
  - `/dashboard` (protected)
  - `/transactions`, `/transactions/:id`
  - `/payments/new`
  - `/accounts`, `/accounts/:id`
  - `/settings`
  - `/admin/*` (admin-only routes)
- [ ] Create `ProtectedRoute` wrapper (redirect to login if unauthenticated)
- [ ] Create `RoleBasedRoute` wrapper (redirect if wrong role)
- [ ] Implement breadcrumbs component
- [ ] Create 404 Not Found page
- [ ] Add route-based code splitting with `React.lazy`

### Day 4 — Shared UI Components Library
- [ ] Create `Button` component (variants: primary, secondary, danger, ghost; sizes: sm, md, lg)
- [ ] Create `Input` component (text, password, with validation states)
- [ ] Create `Card` component (with header, body, footer slots)
- [ ] Create `Modal` component (with Headless UI Dialog)
- [ ] Create `Table` component (sortable, with pagination)
- [ ] Create `Badge` / `StatusBadge` component (color-coded by status)
- [ ] Create `LoadingSpinner` and `Skeleton` components
- [ ] Create `Toast` / notification system (success, error, warning, info)
- [ ] Create `EmptyState` component

### Day 5 — API Layer & Axios Configuration
- [ ] Create Axios instance with base URL from env
- [ ] Add request interceptor (attach JWT token from store)
- [ ] Add response interceptor (handle 401 → refresh token → retry)
- [ ] Create API service modules:
  - `authService.ts` (login, register, refresh, logout)
  - `accountService.ts` (CRUD operations)
  - `transactionService.ts` (list, details, initiate)
  - `paymentService.ts` (initiate, retry, cancel)
- [ ] Create TypeScript interfaces for all API request/response types
- [ ] Set up React Query `QueryClient` with default options (staleTime, retry)

---

## Week 2: Authentication & Dashboard

### Day 6 — Authentication Pages (Login & Register)
- [ ] Create Login page (email + password form)
- [ ] Create Register page (name, email, phone, password, confirm password)
- [ ] Add form validation with React Hook Form + Zod
- [ ] Implement "Show/Hide password" toggle
- [ ] Add "Remember me" checkbox
- [ ] Create "Forgot Password" link/page placeholder
- [ ] Style forms with Tailwind (responsive, clean design)
- [ ] Handle loading states and error messages

### Day 7 — Auth State Management & Token Handling
- [ ] Create `authSlice` in Redux (user, token, isAuthenticated, loading)
- [ ] Implement login flow: API call → store token → redirect to dashboard
- [ ] Implement register flow: API call → auto-login → redirect
- [ ] Implement logout: clear store → clear localStorage → redirect to login
- [ ] Implement token refresh logic (on 401, before expiry)
- [ ] Store tokens in `localStorage` (access + refresh)
- [ ] Create `useAuth()` custom hook (user, isAuthenticated, login, logout)
- [ ] Persist auth state across page refreshes

### Day 8 — Dashboard Page (Overview)
- [ ] Create Dashboard layout with grid/flex sections
- [ ] Build stat cards row:
  - Total transactions (today/week/month)
  - Total volume processed
  - Success rate percentage
  - Active accounts count
- [ ] Create "Recent Transactions" table (last 10)
- [ ] Create quick action buttons (New Payment, View All Transactions)
- [ ] Add loading skeletons for each section
- [ ] Fetch dashboard data via React Query
- [ ] Make dashboard responsive (stack on mobile)

### Day 9 — Dashboard Charts & Analytics
- [ ] Install Recharts library
- [ ] Create "Transaction Volume" line chart (last 7/30 days)
- [ ] Create "Transaction Status Distribution" pie/donut chart
- [ ] Create "Revenue by Day" bar chart
- [ ] Add date range picker for chart filtering
- [ ] Create chart wrapper component (title, loading state, empty state)
- [ ] Add tooltips and legends to charts
- [ ] Make charts responsive

### Day 10 — Real-Time Updates (WebSocket/Polling)
- [ ] Set up WebSocket connection (or SSE) for real-time transaction updates
- [ ] Create `useWebSocket()` custom hook
- [ ] Update dashboard stats in real-time when new transactions arrive
- [ ] Show toast notification on new transaction received
- [ ] Add "live" indicator badge on dashboard
- [ ] Implement fallback polling (every 30s) if WebSocket unavailable
- [ ] Handle reconnection logic on disconnect

---

## Week 3: Transaction & Payment Pages

### Day 11 — Transaction List Page
- [ ] Create Transactions page with data table
- [ ] Implement server-side pagination (page, size params)
- [ ] Add filters:
  - Status (Pending, Completed, Failed, Reversed)
  - Type (Credit, Debit, Transfer)
  - Date range (from/to date pickers)
  - Amount range (min/max)
- [ ] Add search by reference ID or recipient
- [ ] Implement column sorting (date, amount, status)
- [ ] Add "Export CSV" button
- [ ] Show loading and empty states

### Day 12 — Transaction Detail Page
- [ ] Create Transaction detail view (`/transactions/:id`)
- [ ] Display:
  - Transaction status with timeline/stepper
  - Sender & receiver details
  - Amount, currency, fees
  - Timestamps (initiated, processed, completed)
  - Reference ID, idempotency key
- [ ] Create status timeline component (visual step indicator)
- [ ] Add "Retry" button for failed transactions
- [ ] Add "Download Receipt" button (PDF generation)
- [ ] Show related audit log entries

### Day 13 — Initiate Payment Page
- [ ] Create "New Payment" form:
  - Recipient selection (search by email/phone/account)
  - Amount input with currency selector
  - Payment method selection
  - Description/note field
- [ ] Add real-time balance check (show available balance)
- [ ] Implement form validation (amount limits, required fields)
- [ ] Create payment confirmation modal (review before submit)
- [ ] Handle payment submission (loading → success/failure)
- [ ] Show success page with transaction reference
- [ ] Redirect to transaction detail on completion

### Day 14 — Accounts Page
- [ ] Create Accounts list page (user's accounts)
- [ ] Display account cards:
  - Account type (Savings, Current, Wallet)
  - Balance with currency
  - Status badge (Active, Frozen, Closed)
  - Last activity date
- [ ] Create "Account Detail" page:
  - Balance history chart
  - Recent transactions for this account
  - Account settings (freeze, close)
- [ ] Add "Create Account" flow (type selection, currency)
- [ ] Implement account switching (if multiple accounts)

### Day 15 — Payment Methods & Settings
- [ ] Create "Payment Methods" section:
  - List saved cards/bank accounts (masked display)
  - Add new payment method form
  - Set default payment method
  - Remove payment method (with confirmation)
- [ ] Create "Settings" page:
  - Profile settings (name, email, phone)
  - Security settings (change password, 2FA placeholder)
  - Notification preferences (email, push, SMS toggles)
  - Transaction limits display
- [ ] Add form validation and success/error feedback

---

## Week 4: Admin Panel, Monitoring & Testing

### Day 16 — Admin Dashboard
- [ ] Create admin-specific dashboard (`/admin/dashboard`)
- [ ] Build system overview cards:
  - Total users count
  - Transactions today / total volume
  - System health status
  - Active alerts count
- [ ] Create "Transaction Processing Rate" real-time chart
- [ ] Create "System Latency" gauge/chart
- [ ] Show top merchants by volume table
- [ ] Add quick links to admin actions

### Day 17 — Admin: User & Transaction Management
- [ ] Create "Users" admin page:
  - User list with search and filters
  - User detail/edit page
  - Freeze/unfreeze accounts
  - View user's transactions
- [ ] Create "All Transactions" admin view:
  - View all system transactions
  - Manual status override (with reason)
  - Flag suspicious transactions
  - Bulk actions (export, batch retry)
- [ ] Add audit trail viewer (who did what, when)

### Day 18 — Monitoring Dashboard
- [ ] Create "System Monitoring" page (`/admin/monitoring`)
- [ ] Display:
  - Service health status (Backend, Kafka, Redis, DB)
  - API response time charts (p50, p95, p99)
  - Error rate trend graph
  - Kafka consumer lag metrics
- [ ] Create alerts panel:
  - Active alerts list
  - Alert history
  - Alert severity badges (Critical, Warning, Info)
- [ ] Add auto-refresh toggle (every 10s/30s/60s)
- [ ] Connect to backend `/actuator` endpoints

### Day 19 — Error Handling, Loading States & UX Polish
- [ ] Create global error boundary component
- [ ] Implement retry UI for failed API calls
- [ ] Add optimistic updates for common actions
- [ ] Implement proper form dirty state (warn on navigation)
- [ ] Add keyboard shortcuts (Ctrl+K for search, Esc to close modals)
- [ ] Implement infinite scroll alternative for mobile transaction list
- [ ] Add animations/transitions (page transitions, modal enter/exit)
- [ ] Accessibility audit (aria labels, focus management, color contrast)

### Day 20 — Unit & Integration Testing
- [ ] Set up Vitest + React Testing Library
- [ ] Write tests for:
  - Auth flow (login, logout, token refresh)
  - Payment initiation form validation
  - Transaction list filtering and pagination
  - Dashboard data rendering
- [ ] Write component tests for shared UI (Button, Modal, Table)
- [ ] Write hook tests (useAuth, useWebSocket)
- [ ] Mock API calls with MSW (Mock Service Worker)
- [ ] Aim for 70%+ coverage on critical paths

---

## Week 5: Performance, Responsiveness & Production Readiness

### Day 21 — Responsive Design & Mobile Optimization
- [ ] Audit all pages on mobile viewport (375px, 768px)
- [ ] Fix table layouts for mobile (horizontal scroll or card view)
- [ ] Optimize sidebar for mobile (drawer behavior)
- [ ] Ensure all modals are mobile-friendly
- [ ] Test touch interactions (swipe, tap targets)
- [ ] Add PWA manifest and service worker (optional)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

### Day 22 — Performance Optimization
- [ ] Implement code splitting per route (lazy loading)
- [ ] Optimize bundle size (analyze with `vite-bundle-visualizer`)
- [ ] Add image optimization (lazy loading, WebP)
- [ ] Implement virtualized lists for large data sets (react-virtual)
- [ ] Add `React.memo` and `useMemo` where needed
- [ ] Configure proper caching headers for static assets
- [ ] Lighthouse audit: target 90+ score
- [ ] Optimize re-renders with React DevTools Profiler

### Day 23 — Dark Mode & Theming
- [ ] Implement dark/light mode toggle
- [ ] Configure Tailwind dark mode (class-based)
- [ ] Update all components to support dark mode
- [ ] Store theme preference in localStorage
- [ ] Add system preference detection (`prefers-color-scheme`)
- [ ] Ensure charts and graphs support dark mode
- [ ] Test contrast ratios in both modes

### Day 24 — Final Polish, Build & Documentation
- [ ] Fix all TypeScript errors and warnings
- [ ] Remove unused imports and dead code
- [ ] Run ESLint and Prettier across codebase
- [ ] Create production build (`npm run build`) — verify no errors
- [ ] Test production build locally (`npm run preview`)
- [ ] Update `README.md`:
  - Project overview and screenshots
  - Setup instructions
  - Environment variables
  - Available scripts
  - Folder structure explanation
- [ ] Create `.env.production` with production API URL
- [ ] Final cross-browser testing

---

## Project Structure (Target)

```
flowpay-console/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
├── index.html
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── docs/
│   └── FRONTEND_DAY_PLAN.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes.tsx
│   ├── components/
│   │   ├── ui/ (Button, Input, Card, Modal, Table, Badge, Toast)
│   │   ├── layout/ (MainLayout, AuthLayout, Sidebar, Header)
│   │   ├── charts/ (LineChart, PieChart, BarChart wrappers)
│   │   └── common/ (LoadingSpinner, Skeleton, EmptyState, ErrorBoundary)
│   ├── pages/
│   │   ├── auth/ (Login, Register, ForgotPassword)
│   │   ├── dashboard/ (Dashboard, DashboardCharts)
│   │   ├── transactions/ (TransactionList, TransactionDetail)
│   │   ├── payments/ (InitiatePayment, PaymentSuccess)
│   │   ├── accounts/ (AccountList, AccountDetail)
│   │   ├── settings/ (Profile, Security, PaymentMethods, Notifications)
│   │   └── admin/ (AdminDashboard, UserManagement, Monitoring)
│   ├── services/
│   │   ├── api.ts (Axios instance)
│   │   ├── authService.ts
│   │   ├── transactionService.ts
│   │   ├── accountService.ts
│   │   └── paymentService.ts
│   ├── store/
│   │   ├── index.ts (configureStore)
│   │   ├── authSlice.ts
│   │   └── uiSlice.ts (sidebar, theme, notifications)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   └── useDebounce.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── transaction.types.ts
│   │   ├── account.types.ts
│   │   └── api.types.ts
│   └── utils/
│       ├── formatCurrency.ts
│       ├── formatDate.ts
│       └── validators.ts
└── tests/
    ├── setup.ts
    ├── components/
    ├── pages/
    └── hooks/
```

---

## Key Pages & Features

| Page | Route | Role | Description |
|------|-------|------|-------------|
| Login | `/login` | Public | Email + password authentication |
| Register | `/register` | Public | New user registration |
| Dashboard | `/dashboard` | User | Overview stats, charts, recent activity |
| Transactions | `/transactions` | User | Paginated list with filters |
| Transaction Detail | `/transactions/:id` | User | Full transaction info + timeline |
| New Payment | `/payments/new` | User | Initiate a payment |
| Accounts | `/accounts` | User | Account list and balances |
| Settings | `/settings` | User | Profile, security, preferences |
| Admin Dashboard | `/admin/dashboard` | Admin | System-wide metrics |
| User Management | `/admin/users` | Admin | Manage users and accounts |
| Monitoring | `/admin/monitoring` | Admin | System health and alerts |

---

## Progress Tracker

| Week | Day | Status | Notes |
|------|-----|--------|-------|
| 1 | Day 1 | ✅ | Project Init |
| 1 | Day 2 | ⬜ | Layout |
| 1 | Day 3 | ⬜ | Routing |
| 1 | Day 4 | ⬜ | UI Components |
| 1 | Day 5 | ⬜ | API Layer |
| 2 | Day 6 | ⬜ | Auth Pages |
| 2 | Day 7 | ⬜ | Auth State |
| 2 | Day 8 | ⬜ | Dashboard |
| 2 | Day 9 | ⬜ | Charts |
| 2 | Day 10 | ⬜ | Real-Time |
| 3 | Day 11 | ⬜ | Transaction List |
| 3 | Day 12 | ⬜ | Transaction Detail |
| 3 | Day 13 | ⬜ | Payments |
| 3 | Day 14 | ⬜ | Accounts |
| 3 | Day 15 | ⬜ | Settings |
| 4 | Day 16 | ⬜ | Admin Dashboard |
| 4 | Day 17 | ⬜ | Admin Management |
| 4 | Day 18 | ⬜ | Monitoring |
| 4 | Day 19 | ⬜ | UX Polish |
| 4 | Day 20 | ⬜ | Testing |
| 5 | Day 21 | ⬜ | Responsive |
| 5 | Day 22 | ⬜ | Performance |
| 5 | Day 23 | ⬜ | Dark Mode |
| 5 | Day 24 | ⬜ | Final Polish |

---

*Replace ⬜ with ✅ as you complete each day.*
