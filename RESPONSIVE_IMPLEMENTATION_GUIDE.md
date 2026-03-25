# Responsive Implementation Guide

## Overview
This guide provides instructions for implementing responsive design across the entire Roster Management System.

## Responsive Utilities
A comprehensive set of responsive utilities has been created in `/client/src/styles/responsive-utilities.css` and automatically imported into the application.

## Breakpoints (Tailwind CSS)
```
sm:  640px  (Small devices - landscape phones)
md:  768px  (Medium devices - tablets)
lg:  1024px (Large devices - desktops)
xl:  1280px (Extra large devices)
2xl: 1536px (2X Extra large devices)
```

## Key Responsive Patterns

### 1. **Tables** - Horizontal Scroll with Sticky First Column

**Pattern:**
```jsx
<div className="table-scroll-container custom-scrollbar overflow-x-auto">
  <table className="w-full min-w-[1200px]">
    {/* First column sticky on mobile */}
    <th className="sticky left-0 bg-[hsl(var(--color-card))] z-10">Column 1</th>
    <th>Column 2</th>
    {/* ... */}
  </table>
</div>
```

**Example Files:**
- `EmployeeTable.jsx` ✅ Already implemented
- `Scheduler.jsx` - Needs implementation

### 2. **Action Bars** - Stack on Mobile

**Pattern:**
```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
  {/* Primary Actions */}
  <div className="flex flex-wrap items-center gap-2">
    <Button className="flex-1 sm:flex-none">Add New</Button>
    <Button className="flex-1 sm:flex-none">Import</Button>
  </div>

  {/* Secondary Actions */}
  <div className="flex flex-wrap items-center gap-2">
    <Button>Export</Button>
    <Select className="w-full sm:w-20">...</Select>
  </div>
</div>
```

**Apply to:**
- All pages with action bars (Employees, Sites, Scheduler, Time Attendance)

### 3. **Modals** - Full Screen on Mobile

**Pattern:**
```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
  <div className="bg-[hsl(var(--color-card))] w-full h-full sm:h-auto sm:w-full sm:max-w-4xl sm:rounded-lg sm:max-h-[90vh] overflow-hidden flex flex-col">
    {/* Modal content */}
  </div>
</div>
```

**Apply to:**
- `AddEmployeeModal.jsx`
- `AddShiftModal.jsx`
- `AddSiteModal.jsx`
- All other modals

### 4. **Navigation** - Mobile Menu

**Pattern:**
The Sidebar component already implements:
- Overlay on mobile (< 1024px)
- Full screen sidebar
- Close on navigation
- Hamburger menu in Navbar

**Files:**
- `Sidebar.jsx` ✅ Already implemented
- `Navbar.jsx` ✅ Already implemented
- `MainLayout.jsx` ✅ Already implemented

### 5. **Headers** - Responsive Padding and Text

**Pattern:**
```jsx
<div className="bg-[hsl(var(--color-primary))] text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
  <div className="flex items-center justify-between">
    <h1 className="text-base sm:text-lg font-semibold">Page Title</h1>
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Icon buttons */}
    </div>
  </div>
</div>
```

**Apply to:**
- All page headers

### 6. **Forms** - Full Width Inputs on Mobile

**Pattern:**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>
    <Label>First Name</Label>
    <Input className="w-full" />
  </div>
  <div>
    <Label>Last Name</Label>
    <Input className="w-full" />
  </div>
</div>
```

### 7. **Cards/Grid Layouts** - Stack on Mobile

**Pattern:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### 8. **Touch Targets** - Minimum 44px

All interactive elements automatically have minimum touch targets on mobile:
- Buttons
- Links
- Checkboxes
- Radio buttons
- Select dropdowns

### 9. **Text Sizes** - Responsive Typography

**Pattern:**
```jsx
<h1 className="text-xl sm:text-2xl lg:text-3xl">Heading</h1>
<p className="text-sm sm:text-base">Body text</p>
<span className="text-xs sm:text-sm">Small text</span>
```

### 10. **Spacing** - Responsive Padding

**Pattern:**
```jsx
<div className="p-3 sm:p-4 lg:p-6">...</div>
<div className="space-y-3 sm:space-y-4 lg:space-y-6">...</div>
```

## Implementation Checklist

### Pages to Update

#### ✅ Already Responsive
- [x] MainLayout
- [x] Sidebar
- [x] Navbar
- [x] EmployeeTable
- [x] EmployeeRow
- [x] Badge (UI Component)

#### 🔄 Needs Updates

##### **Scheduler Page** (Priority: HIGH)
- [ ] Make schedule table horizontally scrollable
- [ ] Stack date selector controls on mobile
- [ ] Collapse shift details on small screens
- [ ] Add horizontal scroll indicator
- [ ] Make "Add Shift" modal full screen on mobile

**File:** `src/pages/Scheduler.jsx`

**Changes Needed:**
```jsx
// Wrap schedule table
<div className="overflow-x-auto custom-scrollbar">
  <table className="min-w-[1200px]">
    {/* existing table content */}
  </table>
</div>

// Stack controls
<div className="flex flex-col sm:flex-row gap-3">
  {/* site selector, view mode, etc */}
</div>
```

##### **Employees Page** (Priority: MEDIUM)
- [x] Header already responsive
- [ ] Action bar needs to stack on mobile
- [x] Table already responsive
- [ ] Pagination needs mobile optimization

**File:** `src/pages/Employees.jsx`

**Changes Needed:**
```jsx
// Action bar
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
  {/* Primary actions */}
  <div className="flex flex-wrap items-center gap-2">
    <Button className="flex-1 sm:flex-none">Add New</Button>
  </div>
  {/* Secondary actions */}
</div>
```

##### **Time Attendance Page** (Priority: MEDIUM)
- [x] Header responsive
- [ ] Filter sidebar - collapse on mobile
- [ ] Table horizontal scroll
- [ ] Tabs - scroll horizontally on mobile

**File:** `src/pages/TimeAttendance.jsx`

**Changes Needed:**
```jsx
// Tabs container
<div className="overflow-x-auto custom-scrollbar">
  <div className="flex min-w-max gap-2">
    {/* tabs */}
  </div>
</div>

// Hide filter sidebar on mobile, add toggle button
{isMobile && <Button onClick={toggleFilters}>Filters</Button>}
```

##### **Sites Page** (Priority: MEDIUM)
- [ ] Similar to Employees page
- [ ] Table responsiveness
- [ ] Action bar stacking
- [ ] Modal full screen on mobile

##### **Employee Portal** (Priority: LOW)
- [x] Already mostly responsive
- [ ] Fine-tune spacing and touch targets

### UI Components to Update

#### **Buttons** (Priority: HIGH)
- [ ] Ensure all buttons have proper touch targets (44px minimum)
- [ ] Stack button groups on mobile

**Files:** `src/components/ui/Button.jsx`

#### **Select/Dropdown** (Priority: MEDIUM)
- [ ] Full width on mobile
- [ ] Larger touch targets

**Files:** `src/components/ui/Select.jsx`

#### **Input Fields** (Priority: MEDIUM)
- [ ] Full width on mobile
- [ ] Proper touch targets

**Files:** `src/components/ui/Input.jsx`

#### **Modals** (Priority: HIGH)
- [ ] Full screen on mobile
- [ ] Scrollable content
- [ ] Close button touch target

**Files:**
- `src/components/employees/AddEmployeeModal.jsx`
- `src/components/scheduler/AddShiftModal.jsx`
- `src/components/sites/AddSiteModal.jsx`

## Mobile Testing Checklist

### Devices to Test
- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone 14 Pro Max (428px width)
- [ ] Samsung Galaxy S20/S21 (360px width)
- [ ] iPad (768px width)
- [ ] iPad Pro (1024px width)

### Features to Test
- [ ] Navigation menu opens/closes
- [ ] All tables scroll horizontally
- [ ] Buttons are tappable (44px minimum)
- [ ] Forms are usable
- [ ] Modals are full screen
- [ ] Text is readable (not too small)
- [ ] No horizontal overflow
- [ ] Touch targets don't overlap

## Quick Reference - Common Responsive Classes

```jsx
// Flex Direction
flex flex-col sm:flex-row

// Width
w-full sm:w-auto

// Padding
p-3 sm:p-4 lg:p-6

// Text Size
text-sm sm:text-base lg:text-lg

// Grid
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

// Gap
gap-2 sm:gap-3 lg:gap-4

// Hide/Show
hidden sm:block
block sm:hidden

// Overflow
overflow-x-auto
overflow-y-auto

// Sticky
sticky top-0
sticky left-0
```

## Performance Considerations

1. **Image Optimization**: Use responsive images with srcset
2. **Lazy Loading**: Implement for tables with many rows
3. **Touch Events**: Use passive listeners for better scroll performance
4. **Viewport Meta Tag**: Ensure proper mobile scaling

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```

## Accessibility

- Maintain proper color contrast on all screen sizes
- Ensure focus states are visible
- Support keyboard navigation
- Test with screen readers
- Provide skip links for complex tables

## Next Steps

1. Start with high-priority pages (Scheduler, Employees)
2. Update modals to be full screen on mobile
3. Test on real devices or browser dev tools
4. Gather user feedback
5. Iterate and improve

## Support

For questions or issues, refer to:
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- MDN Responsive Design: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design
