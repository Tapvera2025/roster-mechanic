# Responsive UI Implementation Plan

> **Goal:** Make every page and component in the roster-website 100% responsive — no overflowing tables, properly placed controls, native-feeling sliders, and collapsible panels/windows across all screen sizes (320 px → 2560 px).

---

## 1. Guiding Principles

| Principle | Detail |
|---|---|
| Mobile-first | Write base styles for the smallest screen, override upward |
| No overflow | Every table, card, and modal must stay within the viewport |
| Touch-safe | All interactive targets ≥ 44 × 44 px |
| Collapsible by default | Sidebar, filter panels, and detail windows start collapsed on < md |
| Sliders over paginated controls | Range inputs (date, numeric) use `<input type="range">` on mobile |
| Dark-theme consistency | All new elements must use existing CSS variables (`--color-*`) |

---

## 2. Breakpoint Map

| Token | px | Target device |
|---|---|---|
| `sm` | 640 | Large phones (landscape) |
| `md` | 768 | Tablets (portrait) |
| `lg` | 1024 | Tablets (landscape) / small laptops |
| `xl` | 1280 | Desktops |
| `2xl` | 1536 | Wide mon

itors |

---

## 3. Global / Layout Changes

### 3.1 `MainLayout.jsx`
- **Sidebar:** already has a toggle — ensure it is `translate-x-[-100%]` on `< md` by default and slides in on toggle. Add a dark overlay (`bg-black/50`) behind the sidebar when open on mobile; tapping the overlay closes it.
- **Main content area:** add `overflow-x-hidden` to the content wrapper so no child can break the viewport.
- **Top padding:** compensate for a fixed navbar; use `pt-16` on the content wrapper.

```jsx
// MainLayout.jsx — content wrapper
<main className="flex-1 overflow-x-hidden overflow-y-auto min-h-screen pt-16 transition-all duration-300">
```

### 3.2 `Sidebar.jsx`
- Add `w-64 shrink-0` on `lg+`; on `< lg` use `fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300`.
- Expose a `isOpen` prop; apply `translate-x-0` when open, `-translate-x-full` when closed.
- Each nav section should be individually collapsible — wrap with a `<details>` or a local `useState` toggle, chevron rotates 180° when open.
- Bottom of sidebar: user avatar + name + role, collapsed to avatar-only when sidebar is in icon-rail mode (`w-16`).

```jsx
// Sidebar nav section pattern
<button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full px-4 py-2">
  <span>{label}</span>
  <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} size={16} />
</button>
{open && <ul>{children}</ul>}
```

### 3.3 `Navbar.jsx`
- Fix to top (`fixed top-0 inset-x-0 z-30`).
- On `< sm`: hide the search bar, replace with a search icon that expands an overlay input.
- User menu and notification bell always visible.
- Hamburger (☰) / X toggle button visible only on `< lg`.

---

## 4. Table Responsiveness Strategy

All five data tables (`ClientsTable`, `EmployeeTable`, `LeaveTable`, `SitesTable`, `ComplianceTable`) must follow the same three-tier responsive strategy:

### Tier 1 — Desktop (≥ 1024 px)
Full table. All columns visible. Sticky first column. Sortable headers.

### Tier 2 — Tablet (768 – 1023 px)
Horizontal scroll container (`overflow-x-auto`). Show `min-w-[700px]` on the `<table>`. Priority columns (name, status, actions) are always shown; secondary columns hidden with `hidden md:table-cell`.

### Tier 3 — Mobile (< 768 px)
**Card layout.** Replace `<table>` with a list of cards, one per row.
Each card shows: primary identifier (name / ID) as the card title, then key-value pairs for the most important fields, and an action menu (⋮) at the top right. Collapse extra details behind a "Show more" toggle per card.

### Implementation pattern for every table

```jsx
// Wrapper
<div className="w-full overflow-x-auto rounded-lg">
  {/* Desktop / Tablet view */}
  <table className="w-full min-w-[700px] hidden sm:table">
    ...
  </table>

  {/* Mobile card view */}
  <div className="sm:hidden space-y-3 p-3">
    {rows.map(row => (
      <MobileCard key={row.id} row={row} />
    ))}
  </div>
</div>
```

### 4.1 `ClientsTable.jsx`
| Desktop columns | Tablet (hide) | Mobile card fields |
|---|---|---|
| Checkbox, Name, Email, Phone, Sites, Status, Actions | Email, Phone | Name (title), Sites count, Status badge, Actions (⋮) |

- Checkbox column: hide on mobile, use long-press to enter multi-select mode.
- Pagination footer: stack on mobile — `flex-col items-center gap-2`.

### 4.2 `EmployeeTable.jsx`
15+ columns — must aggressively prune on small screens.

| Priority | Columns |
|---|---|
| Always visible | Photo, Name, Status, Actions |
| `md+` | Role, Sites |
| `lg+` | Phone, Email, Start Date |
| `xl+` | All remaining columns |

Mobile card: photo circle top-left, name + role + status, action button row at bottom.

### 4.3 `LeaveTable.jsx`
- On mobile: card shows employee name, leave type, date range, status badge. Approve/Decline buttons stack full-width below.
- The inline note-input row expands as an accordion below the relevant card on mobile.

### 4.4 `SitesTable.jsx`
| Always | `md+` | `lg+` |
|---|---|---|
| Name, Status, Actions | Address, Manager | Client, Phone, Created |

- Map icon button stays in the actions column at all sizes.
- On mobile the map button opens the `MapModal` full-screen.

### 4.5 `ComplianceTable.jsx`
Already has column hiding — standardise it to match the tier system above. Add the mobile card view for `< sm`.

---

## 5. Modal / Dialog Responsiveness

All 11 modals must follow this pattern:

```jsx
// DialogContent responsive classes
<DialogContent className="
  w-full max-w-lg          /* default max-width */
  sm:rounded-xl            /* rounded corners on larger screens */
  max-sm:rounded-t-xl      /* rounded only top on mobile (bottom sheet) */
  max-sm:fixed max-sm:bottom-0 max-sm:inset-x-0 max-sm:m-0  /* bottom sheet on mobile */
  max-sm:max-h-[90dvh] overflow-y-auto /* scrollable tall content */
">
```

### Bottom-sheet behaviour on mobile (< 640 px)
- Modal slides up from the bottom (transform: `translateY(100%)` → `translateY(0)`).
- A drag handle bar (pill) at the top — dragging down closes.
- Use `max-h-[90dvh]` so it never covers the full screen.
- A swipe-down gesture (via `pointer` events) dismisses the sheet.

### 5.1 `AddClientModal.jsx`
- 2-column grid → 1-column on mobile.
- Save/Cancel buttons: full-width stacked on mobile, side-by-side on `sm+`.

### 5.2 `AddLeaveModal.jsx`
- Date range picker: replace or supplement with a horizontal range slider on mobile (start day / end day as numeric slider within the month).
- Working-days count shown as a badge below the slider.

### 5.3 `MapModal.jsx`
- On mobile: map takes full screen (`100dvh`), controls appear as a floating panel that can be collapsed (tap the handle to show/hide address fields and geofence radius slider).
- Geofence radius: **replace number input with a horizontal `<input type="range">`** (min 50 m, max 2000 m, step 10 m). Show current value in a badge next to the slider.

```jsx
<label className="flex flex-col gap-1">
  <span className="text-sm text-muted-foreground">
    Geofence Radius: <span className="text-primary font-semibold">{radius}m</span>
  </span>
  <input
    type="range" min={50} max={2000} step={10}
    value={radius} onChange={e => setRadius(+e.target.value)}
    className="w-full accent-orange-500"
  />
</label>
```

### 5.4 `AddShiftModal.jsx` / `AddAdhocShiftModal.jsx`
- Time inputs: use native `<input type="time">` on mobile (system time-picker).
- Date: use native `<input type="date">`.
- Duration display: read-only badge auto-calculated from start/end.

### 5.5 Bulk Upload Modals (`AddMultipleClientsModal`, `AddMultipleSitesModal`)
- File drop zone: full-width, minimum `h-32` touch target.
- Preview table of parsed rows: use the card view pattern for `< sm`.

### 5.6 `ViewDeletedShiftsModal.jsx` / `PurchaseSuccessModal.jsx`
- Follow the bottom-sheet pattern for mobile.
- Ensure all action buttons are `w-full` on mobile.

### Collapsible Modal Sections
Any modal with more than 4 fields must divide fields into collapsible sections:

```jsx
<details open className="group border border-border rounded-lg">
  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
    <span className="font-medium">Basic Details</span>
    <ChevronDown className="transition-transform group-open:rotate-180" size={16} />
  </summary>
  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* fields */}
  </div>
</details>
```

---

## 6. Filter Panels

All filter components (`EmployeeFilters`, `ClientFilters`, `SiteFilters`, `LeaveFilters`, `ComplianceFilters`, `AttendanceFilters`) must become collapsible on mobile.

### Pattern

```jsx
// Desktop: always visible horizontal strip
// Mobile: collapsed behind a "Filters" button with a badge showing active count

<div>
  {/* Mobile toggle */}
  <button className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-border">
    <SlidersHorizontal size={16} />
    Filters
    {activeCount > 0 && <Badge>{activeCount}</Badge>}
  </button>

  {/* Filter body */}
  <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
    <div className="flex flex-wrap gap-3 items-end">
      {/* filter controls */}
    </div>
  </div>
</div>
```

### Date Range Sliders in Filters
Replace dual date-picker inputs with a **date-range slider** on mobile:

```jsx
// Date range slider — values are day offsets from a reference date
<div className="flex flex-col gap-1">
  <span className="text-sm">{formatDate(startDate)} → {formatDate(endDate)}</span>
  <input type="range" min={0} max={90} value={startOffset}
    onChange={e => setStartOffset(+e.target.value)}
    className="w-full accent-orange-500" />
  <input type="range" min={0} max={90} value={endOffset}
    onChange={e => setEndOffset(+e.target.value)}
    className="w-full accent-orange-500" />
</div>
```

On `sm+` show the standard date-picker inputs as they are.

---

## 7. Dashboard

### 7.1 `DashboardStats.jsx`
- Stats grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7`.
- Each card: `min-w-0` so text truncates instead of overflowing.
- On `< sm`: 1-column stack.

### 7.2 Dashboard Widgets
All 6 widgets (`AttendanceChart`, `CoverageWidget`, `LeaveRequestsWidget`, `AvailabilityRequestsWidget`, `SubcontractorWidget`) must be individually collapsible.

Add a collapse toggle to every widget card header:

```jsx
<CardHeader className="flex flex-row items-center justify-between">
  <CardTitle>{title}</CardTitle>
  <button onClick={() => setCollapsed(c => !c)} aria-label="Toggle">
    <ChevronDown className={`transition-transform ${collapsed ? '-rotate-180' : ''}`} size={16} />
  </button>
</CardHeader>
{!collapsed && <CardContent>{children}</CardContent>}
```

### 7.3 `AttendanceChart.jsx`
- Chart container: `w-full h-48 sm:h-64 lg:h-80` with `overflow-hidden`.
- Chart library must use `responsive: true` / `maintainAspectRatio: false`.
- On mobile: show a simplified bar chart; hide gridlines and reduce label density.

---

## 8. Attendance / Time Records

### 8.1 `ManagerTimeRecords.jsx`
- Filter bar: wrap in the collapsible filter panel pattern (Section 6).
- Table: apply table tier-2 / tier-3 strategy.
  - Mobile card: employee photo (40 px circle), name, clock-in/out times, site, duration badge.
- CSV export button: always visible but icon-only on `< sm`.
- Photo viewer: full-screen overlay on mobile with swipe-left/right navigation.

### 8.2 `TimeRecordsHistory.jsx`
- Same table and filter pattern as above.
- Date range: slider on mobile (Section 6).

---

## 9. Scheduler / Roster

### 9.1 `SchedulerHeader.jsx`
- Week navigation (prev/next arrows + date range label): keep on all screens.
- View-switcher (Day / Week / Month): tabs on desktop, a native `<select>` dropdown on `< sm`.
- Action buttons (Add Shift, View Deleted): icon-only buttons on `< sm` with tooltips.

### 9.2 Roster Grid / Scheduler Body
- **Desktop:** traditional grid — employees on rows, days on columns.
- **Tablet:** reduce column width, allow horizontal scroll within the roster container (not the whole page).
- **Mobile:** switch to a **day-view list** — one day displayed at a time, swiping left/right navigates days. The day selector is a horizontally scrollable pill strip at the top.

```jsx
// Mobile day-pill strip
<div className="flex gap-2 overflow-x-auto py-2 snap-x snap-mandatory">
  {days.map(day => (
    <button key={day} onClick={() => setActiveDay(day)}
      className={`snap-start shrink-0 px-3 py-1 rounded-full text-sm
        ${activeDay === day ? 'bg-primary text-white' : 'bg-muted'}`}>
      {format(day, 'EEE d')}
    </button>
  ))}
</div>
```

---

## 10. Forms and Inputs

### All forms
- Labels always above inputs (never inline) on `< sm`.
- `input`, `select`, `textarea` — `w-full` at all sizes.
- Grids: `grid-cols-1 sm:grid-cols-2` as the default for form fields.
- Error messages below the field, `text-sm text-red-400`.

### Select dropdowns
- On `< sm`: use native `<select>` elements for better mobile UX (system picker).
- On `sm+`: use custom `Select` component.

### Number inputs with known ranges → Sliders
| Field | Slider config |
|---|---|
| Geofence radius (MapModal) | min=50, max=2000, step=10, unit=m |
| Leave days count preview | read-only, calculated |
| Shift duration | min=0.5, max=24, step=0.5, unit=hr |
| Pagination page size | min=10, max=100, step=10 |
| Report date range (days back) | min=1, max=365, step=1 |

All sliders must show the live value in a badge / text node next to the track.

---

## 11. Pagination

Replace the current footer pagination on all 5 tables with a compact responsive version:

```jsx
// Desktop: First | Prev | 1 2 3 ... 9 | Next | Last + rows-per-page select
// Mobile: Prev | Page X of Y | Next  (no page number list)

<div className="flex items-center justify-between px-4 py-3 border-t border-border">
  {/* Rows per page — hidden on mobile */}
  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
    <span>Rows per page</span>
    <select value={pageSize} onChange={e => setPageSize(+e.target.value)}
      className="bg-input border border-border rounded px-2 py-1">
      {[10,25,50,100].map(n => <option key={n}>{n}</option>)}
    </select>
  </div>

  {/* Navigation */}
  <div className="flex items-center gap-2">
    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
      className="p-2 rounded disabled:opacity-40">
      <ChevronLeft size={16} />
    </button>
    <span className="text-sm">Page {page} of {totalPages}</span>
    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
      className="p-2 rounded disabled:opacity-40">
      <ChevronRight size={16} />
    </button>
  </div>

  {/* Page number pills — desktop only */}
  <div className="hidden lg:flex items-center gap-1">
    {pageNumbers.map(n => (
      <button key={n} onClick={() => setPage(n)}
        className={`w-8 h-8 rounded text-sm ${n === page ? 'bg-primary text-white' : 'bg-muted'}`}>
        {n}
      </button>
    ))}
  </div>
</div>
```

---

## 12. Sidebar Navigation — Collapsible Sections

Each top-level nav group in `Sidebar.jsx` must be independently collapsible:

```
▼ Workforce          ← open
    Employees
    Clients
    Sites
▶ Scheduling         ← collapsed
▼ Reports
    Compliance
    Attendance
```

State: `useState` per group, persisted to `localStorage` so the state survives page refreshes.

Icon-rail mode (sidebar collapsed to 64 px):
- Show only icons, no labels.
- Hovering an icon shows a tooltip with the label.
- Groups are not expandable in icon-rail mode — clicking navigates directly.

---

## 13. Company / Settings Pages

### `Company.jsx`
- Section dividers: each section (General Info, Locations, Billing, etc.) must be a collapsible `<details>` panel.
- Maps/location section: use the slider pattern for radius.

### `Settings.jsx`
- Tabbed layout: horizontal tabs on `lg+`, a `<select>` dropdown on `< md`.
- Each settings section independently collapsible.

### `Profile.jsx` / `user/Profile.jsx`
- Avatar upload: full-width drop zone on mobile.
- Info grid: 2-col on `sm+`, 1-col on mobile.

---

## 14. Packages Page

### `Packages.jsx`
- Plan cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Feature comparison table: horizontally scrollable on mobile, or switch to a card-per-plan layout.
- Plan slider (if pricing tiers differ by seats/usage): `<input type="range">` with live price update.

---

## 15. Notifications Page

### `Notifications.jsx`
- List of notification items: full-width cards, stacked.
- Filter (All / Unread / By type): horizontal scrollable pill tabs.
- Mark-all-read button: top right, icon + label on `sm+`, icon-only on `< sm`.

---

## 16. CSS Additions (global)

Add the following to `src/index.css` (or a new `src/styles/responsive-enhancements.css` imported there):

```css
/* ── Horizontal scroll table wrapper ── */
.table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  /* Fade shadow indicating scrollable content */
  background:
    linear-gradient(to right, var(--color-card) 30%, transparent) center left,
    linear-gradient(to left,  var(--color-card) 30%, transparent) center right,
    radial-gradient(farthest-side at 0 50%, rgba(0,0,0,.3), transparent) center left,
    radial-gradient(farthest-side at 100% 50%, rgba(0,0,0,.3), transparent) center right;
  background-repeat: no-repeat;
  background-size: 40px 100%, 40px 100%, 14px 100%, 14px 100%;
  background-attachment: local, local, scroll, scroll;
}

/* ── Range slider custom styles ── */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 9999px;
  background: hsl(var(--color-muted));
  outline: none;
  cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: hsl(var(--color-primary));
  box-shadow: 0 0 0 4px hsl(var(--color-primary) / 0.2);
  transition: box-shadow 150ms;
}
input[type="range"]::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 6px hsl(var(--color-primary) / 0.3);
}
input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: hsl(var(--color-primary));
}

/* ── Bottom-sheet modal ── */
@media (max-width: 639px) {
  [data-modal-mobile="bottom-sheet"] {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    transform: none !important;
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    border-top-left-radius: 1rem !important;
    border-top-right-radius: 1rem !important;
    max-height: 90dvh !important;
    overflow-y: auto;
    animation: slide-up 250ms ease-out;
  }
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
}

/* ── Sidebar overlay ── */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 30;
  backdrop-filter: blur(2px);
}

/* ── Mobile card list ── */
.mobile-card {
  background: hsl(var(--color-card));
  border: 1px solid hsl(var(--color-border));
  border-radius: 0.75rem;
  padding: 1rem;
  position: relative;
}
.mobile-card-title {
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
}
.mobile-card-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  padding: 0.2rem 0;
  border-bottom: 1px solid hsl(var(--color-border) / 0.5);
}
.mobile-card-row:last-child { border-bottom: none; }
.mobile-card-label { color: hsl(var(--color-muted-foreground)); }

/* ── Day pill strip (Scheduler) ── */
.day-pill-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 1rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.day-pill-strip::-webkit-scrollbar { display: none; }
.day-pill {
  scroll-snap-align: start;
  flex-shrink: 0;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  white-space: nowrap;
  cursor: pointer;
  transition: background 150ms, color 150ms;
}

/* ── Collapsible widget ── */
.widget-body {
  overflow: hidden;
  transition: max-height 300ms ease, opacity 300ms ease;
}
.widget-body.collapsed {
  max-height: 0;
  opacity: 0;
}
.widget-body.expanded {
  max-height: 600px;
  opacity: 1;
}
```

---

## 17. Implementation Order (Priority)

| # | Task | Files | Impact |
|---|---|---|---|
| 1 | Global CSS additions | `index.css` | All components |
| 2 | Sidebar collapsible sections + mobile overlay | `Sidebar.jsx`, `MainLayout.jsx` | Navigation |
| 3 | Table → card view on mobile | `ClientsTable`, `EmployeeTable`, `SitesTable`, `LeaveTable`, `ComplianceTable` | Core data views |
| 4 | Modal bottom-sheet pattern | `Dialog.jsx` + all modals | All forms |
| 5 | Collapsible filter panels | All `*Filters.jsx` | Data discoverability |
| 6 | Sliders (geofence, date range, pagination) | `MapModal`, filter panels, pagination | UX |
| 7 | Dashboard widget collapse | `DashboardStats`, all widgets | Home page |
| 8 | Scheduler mobile day-view | `Scheduler.jsx`, `Roster.jsx` | Scheduling |
| 9 | Navbar search overlay on mobile | `Navbar.jsx` | Navigation |
| 10 | Settings / Company collapsible sections | `Settings.jsx`, `Company.jsx` | Config pages |

---

## 18. Testing Checklist

For each screen size (320 px, 375 px, 390 px, 768 px, 1024 px, 1280 px, 1440 px):

- [ ] No horizontal scrollbar on `<body>`
- [ ] All text readable (no overflow clipping)
- [ ] All tables fully visible (card view on mobile OR table with no body overflow)
- [ ] All modals fit within the viewport with scroll
- [ ] Sidebar opens/closes smoothly
- [ ] All buttons / taps reachable (≥ 44 px targets)
- [ ] Sliders draggable and value updates live
- [ ] Collapsible sections animate smoothly
- [ ] Dark-theme colors consistent
- [ ] No z-index conflicts between sidebar, modals, and toasts
- [ ] Keyboard navigation and focus rings present

---

## 19. Accessibility Notes

- Every `<input type="range">` must have `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Collapsible sections using `<details>/<summary>` are natively accessible; custom toggles need `aria-expanded`.
- Modal: `role="dialog"`, `aria-modal="true"`, focus trapped inside while open, focus returns to trigger on close.
- Bottom-sheet: `aria-labelledby` pointing to the modal title.
- Sidebar: `role="navigation"`, `aria-label="Main navigation"`.

---

*Last updated: 2026-03-27*
