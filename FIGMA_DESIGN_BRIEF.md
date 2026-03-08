# ScholarMe Figma Design Specification

## Project Overview
ScholarMe is a professional online tutoring platform connecting learners with expert tutors. The design system uses a sophisticated blue-navy color palette with warm gold accents, supporting both light and dark modes.

---

## 1. COLOR SYSTEM

### Light Mode
All colors use OKLCH color space for precise device-independent color rendering.

**Primary Colors:**
- **Primary Blue**: `oklch(0.42 0.18 260)` → Hex approx. `#2E5090` — Deep blue for trust & authority
  - Foreground: `oklch(0.99 0 0)` → White
- **Secondary Blue**: `oklch(0.60 0.12 258)` → Hex approx. `#6B8FD4` — Soft periwinkle for supporting actions
  - Foreground: `oklch(0.99 0 0)` → White
- **Accent Gold**: `oklch(0.65 0.18 70)` → Hex approx. `#E8A020` — Warm gold for achievement & highlights
  - Foreground: `oklch(0.15 0.02 70)` → Dark brown/tan

**Neutral Colors:**
- **Background**: `oklch(0.99 0.002 255)` → Off-white `#FAFAFA`
- **Foreground (Text)**: `oklch(0.12 0.02 255)` → Near-black `#1F1F23`
- **Card/Popover**: `oklch(1 0 0)` → Pure white `#FFFFFF`
- **Muted**: `oklch(0.94 0.01 255)` → Light gray `#F0F0F0`
- **Border**: `oklch(0.91 0.01 255)` → Medium gray `#E8E8E8`
- **Input/Field**: `oklch(0.96 0.01 255)` → Very light gray `#F5F5F5`

**Status Colors:**
- **Success**: `oklch(0.52 0.14 145)` → Green (ecosystem)
- **Destructive (Error)**: `oklch(0.63 0.21 30)` → Red
- **Warning**: `oklch(0.74 0.16 68)` → Amber/orange

**Sidebar (Light):**
- Background: `oklch(0.97 0.006 255)` → Very light blue-gray
- Primary: Deep blue
- Accent: `oklch(0.90 0.04 260)` → Very light blue

### Dark Mode
Navy blue base (NOT pitch black) for comfortable late-night use.

**Surfaces:**
- **Background**: `oklch(0.26 0.05 255)` → Deep navy `#1A2744`
- **Card/Popover**: `oklch(0.30 0.055 255)` → Slightly lighter navy `#203050`
- **Input/Field**: `oklch(0.32 0.05 255)` → Navy `#243658`
- **Border**: `oklch(0.36 0.05 255)` → Medium navy `#2D4470`

**Text & Interactive:**
- **Foreground (Text)**: `oklch(0.95 0.01 240)` → Off-white
- **Primary**: `oklch(0.62 0.20 260)` → Bright blue (stronger contrast on navy)
- **Secondary**: `oklch(0.35 0.06 255)` → Lighter navy
- **Accent**: `oklch(0.72 0.18 72)` → Warm gold (pops against navy)
- **Muted Text**: `oklch(0.70 0.03 255)` → Medium gray

**Sidebar (Dark):**
- Background: `oklch(0.22 0.05 255)` → Slightly darker navy than page
- Primary: Bright blue
- Accent: `oklch(0.32 0.06 260)` → Navy
- Accent Foreground: `oklch(0.88 0.05 255)` → Light silver

---

## 2. TYPOGRAPHY

**Font Families:**
- **Sans-serif (Body & UI)**: Geist (default), fall back to system sans
- **Monospace**: Geist Mono (for code/technical content)

**Scale:**
- **Display**: 4xl (2.25rem / 36px), Font Weight 700, Line Height 1.2
- **Heading 1 (H1)**: 3xl (1.875rem / 30px), Font Weight 700, Line Height 1.25
- **Heading 2 (H2)**: 2xl (1.5rem / 24px), Font Weight 700, Line Height 1.3
- **Heading 3 (H3)**: xl (1.25rem / 20px), Font Weight 600, Line Height 1.35
- **Body Large**: lg (1.125rem / 18px), Font Weight 400, Line Height 1.5
- **Body**: base (1rem / 16px), Font Weight 400, Line Height 1.6 (relaxed)
- **Body Small**: sm (0.875rem / 14px), Font Weight 400, Line Height 1.5
- **Label**: sm (0.875rem / 14px), Font Weight 500, Line Height 1.5
- **Caption**: xs (0.75rem / 12px), Font Weight 400, Line Height 1.5
- **Micro**: 11px, Font Weight 400, Line Height 1.5

**Weight Usage:**
- 400: Body text, descriptions
- 500: Labels, secondary headings
- 600: Section headings (H3)
- 700: Main headings (H1, H2), CTAs

---

## 3. SPACING & SIZING

**Spacing Scale (in rem / px):**
```
0.25rem / 4px
0.5rem / 8px
0.75rem / 12px
1rem / 16px
1.5rem / 24px
2rem / 32px
2.5rem / 40px
3rem / 48px
4rem / 64px
6rem / 96px
```

**Border Radius:**
- Small: calc(0.625rem - 4px) = 2px (fine borders)
- Medium: calc(0.625rem - 2px) = 4px (standard inputs)
- Large: 0.625rem = 10px (cards, buttons)
- XL: calc(0.625rem + 4px) = 14px (large components)

---

## 4. COMPONENT LIBRARY

### Buttons

**Primary Button**
- Background: Primary Blue
- Text: White
- Padding: 10px 16px (py-2.5 px-4)
- Border Radius: Large (10px)
- Font: 14px, Weight 500
- States:
  - **Default**: As above
  - **Hover**: Slightly darker primary
  - **Active**: Darker overlay
  - **Disabled**: 50% opacity, cursor not-allowed
  - **Loading**: Show spinner icon, disabled state

**Secondary Button**
- Background: Secondary Blue / Light gray (light mode) or Navy (dark mode)
- Text: Primary Blue / Dark text (light) or White (dark)
- Same padding & radius as Primary
- States: Same as Primary

**Destructive Button**
- Background: Red `#D32F2F`
- Text: White
- Hover: Darker red
- States: Same as Primary

**Ghost Button**
- Background: Transparent
- Text: Primary Blue
- Border: 1px Primary Blue
- Padding: 10px 16px
- States:
  - Hover: Light background fill
  - Active: Darker background

### Form Inputs

**Text Input / Email / Phone**
- Background: Input color (light gray in light mode, navy in dark)
- Border: 1px solid Border color
- Border Radius: Medium (4px)
- Padding: 8px 12px
- Font: 14px, weight 400
- Focus state: Ring color (primary blue) with 2px offset
- Placeholder text: Muted foreground at 60% opacity
- Error state: Red border, error text below in small red text

**Date Input**
- Same as text input
- Calendar icon on right side (optional visual)

**Password Input**
- Same as text input
- Eye icon on right to toggle visibility
- Password strength bar below (when focused/typing):
  - 4 segments, each 4px tall
  - Weak (1/4): Red
  - Fair (2/4): Amber
  - Good (3/4): Blue
  - Strong (4/4): Green
  - Label: 10px text, colored to match bar

**Select / Dropdown**
- Same styling as text input
- Chevron icon on right
- Dropdown arrow at 12px (muted foreground)

**Checkbox**
- Size: 20px × 20px
- Border: 2px solid Primary Blue (unchecked) or filled Primary Blue (checked)
- Border Radius: 4px
- Checkmark: White, centered, 12px
- Label: 14px, positioned right of checkbox with 8px gap

**Label**
- Font: 14px, weight 500
- Color: Foreground
- Required indicator: Red asterisk `*` in destructive color
- Margin bottom: 6px

### Cards

**Standard Card**
- Background: Card color (white light / navy dark)
- Border: 1px solid Border color
- Border Radius: Large (10px)
- Padding: 24px (inside content)
- Box Shadow (light): 0 1px 3px rgba(0, 0, 0, 0.05)
- Box Shadow (dark): 0 1px 3px rgba(0, 0, 0, 0.3)

**Card Header**
- Padding: 20px 24px
- Border Bottom: 1px solid Border
- Title: Heading 3 (20px, weight 600)
- Description: 14px, muted foreground

**Card Content**
- Padding: 24px

### Tabs

**Tab List**
- Background: Transparent or Muted
- Border Bottom: 2px solid Border
- Spacing between tabs: 8px

**Tab Trigger**
- Padding: 10px 16px
- Font: 14px, weight 500
- Color (inactive): Muted foreground
- Color (active): Primary blue
- Border Bottom (active): 2px solid Primary blue
- Cursor: Pointer

### Error Alert

**Error Message Box**
- Background: Red at 10% opacity (very light red)
- Border: 1px solid Red
- Border Radius: Medium (4px)
- Padding: 12px 16px
- Icon: Error icon (red X circle), 16px, left-aligned
- Text: 14px, Red color
- Title: 14px bold, Red

---

## 5. PAGE LAYOUTS

### Login Page

**Structure:**
- Full viewport height, centered flex layout
- Flex column, items-center, justify-center
- Background: Light gray muted (light mode) or Navy (dark mode)

**Card Container:**
- Max width: 448px (28rem)
- Width: 100%, padding: 16px on mobile
- Background: White (light) / Navy card (dark)
- Border radius: Large (10px)
- Box shadow: Subtle

**Card Header:**
- Logo: 40px × 40px icon (graduation cap)
- Logo background: Primary blue
- Logo color: White
- Title: "ScholarMe" in 24px bold
- Subtitle: "Sign in to your account" in 14px muted

**Tabs (Email / Card-based):**
- Two tabs: "Email" + "Card"
- Tab content height: auto

**Email Tab Content:**
- Email field: Full width
  - Label: "Email Address"
  - Input: Placeholder "you@example.com"
- Password field: Full width
  - Label: "Password"
  - Input: Type password, show/hide toggle
  - Forgot password link (bottom right): 12px, primary blue
- Error alert: Red background/border if present
- Sign in button: Full width, primary blue, 12px text
- Sign up link: Below button, 14px, centered, "Don't have an account? Sign up"

**Card Tab Content:**
- Card ID field: Full width
  - Label: "Card ID"
  - Placeholder: "Enter your card ID"
- PIN field: Full width
  - Label: "PIN"
  - Input: Password type (dots), 4-digit
- Error alert: Red background/border if present
- Sign in button: Full width, primary blue
- Sign up link: Below button

---

### Sign-Up Page

**Layout:**
- Two-column split (desktop only)
- Mobile: Single column, no left panel

**Left Panel (Desktop Only, Hidden <1024px)**
- Width: 42% on lg, 38% on xl
- Background: Sidebar navy/blue
- Padding: 40px
- Flex: column, justify-between
- Min height: 100vh

**Left Panel - Header:**
- Logo icon: 36px, Graduation cap, white
- Logo text: "ScholarMe" 20px bold, white
- Margin bottom: 32px

**Left Panel - Features Section:**
- Title: "Join thousands of learners" 12px uppercase, muted (60% opacity)
- Heading: "Start your learning journey today" 2xl bold, white, text-balance
- Subtitle: "ScholarMe connects students with expert tutors for personalized, flexible learning — on your schedule." 16px, line-height relaxed, white (70% opacity)
- Feature list: Unordered list, 14px, white (80% opacity)
  - Each item: Check circle icon (16px, gold accent), 8px gap, text
- Margin top: 32px

**Left Panel - Footer:**
- Copyright text: 12px, white (35% opacity)
- Positioned at bottom

**Right Panel (All screens) / Full Width Mobile**
- Width: 58% desktop, 100% mobile
- Background: White (light) / Navy (dark)
- Padding: 40px on desktop, 24px on mobile
- Flex: column, justify-center (vertically center on desktop)
- Max width: 600px

**Sign-Up Form Header:**
- "Create your account" Heading 2 (30px bold, text-balance)
- "Already have an account?" link at top (14px, primary blue)
- Margin bottom: 32px

**Form Sections:**

**1. Full Name**
- Label: "Full Name *"
- Input: Placeholder "Maria Santos"
- Error message (if invalid): Red text below, 12px
- Margin bottom: 16px

**2. Email**
- Label: "Email Address *"
- Input: Type email, placeholder "you@example.com"
- Error message (if invalid): Red text below
- Margin bottom: 16px

**3. Phone + DOB (Grid)**
- Two-column grid, gap 12px (mobile: single column)
- **Phone:**
  - Label: "Mobile Number *"
  - Input: Type tel, placeholder "+63 917 123 4567"
  - Error message below
- **Date of Birth:**
  - Label: "Date of Birth *"
  - Input: Type date
  - Error message below

**4. Password**
- Label: "Password *"
- Input: Type password, placeholder "Min. 8 characters", show/hide toggle on right
- Error message below
- Strength bar (always visible when typing):
  - 4 segments, gap 4px between
  - Height: 6px
  - Weak: Red, Fair: Amber, Good: Blue, Strong: Green
  - Label: 12px, colored, right-aligned, "Weak/Fair/Good/Strong"
  - Hint below: "Use 8+ characters with uppercase, numbers, and symbols for a strong password." 11px muted
- Margin bottom: 20px

**5. Confirm Password**
- Label: "Confirm Password *"
- Input: Type password
- Error message below (red if mismatch)
- Margin bottom: 20px

**6. Role Selection**
- Label: "I am a..." 14px bold
- Two cards side-by-side (mobile: stack)
  - **Learner Card:**
    - Icon: BookOpen (24px, primary blue in light mode, bright blue in dark)
    - Icon background: Sidebar accent (light blue/navy)
    - Border: 2px, Primary blue (selected) or muted (unselected)
    - Padding: 16px
    - Border radius: Medium (4px)
    - Title: "Learner" 14px bold
    - Subtitle: "Looking for tutors" 12px muted
    - Hover: Light background fill
    - Cursor: Pointer
  - **Tutor Card:**
    - Icon: Users (24px, same colors)
    - Title: "Tutor" 14px bold
    - Subtitle: "Sharing expertise" 12px muted
    - Same styling as Learner card
- Margin bottom: 24px

**7. Terms Checkbox**
- Checkbox: 20px × 20px, blue
- Label text: "I accept the Terms of Service and Privacy Policy" 14px
- Link colors: Primary blue
- Margin bottom: 24px

**8. Error Alert (if present)**
- Red background (10% opacity), red border, 12px red text
- Icon: Red X circle
- Margin bottom: 16px

**9. Sign Up Button**
- Full width
- Background: Primary blue
- Text: White, 14px bold
- Padding: 12px 20px
- Border radius: Large (10px)
- Hover: Darker blue
- Disabled (while loading): Spinner icon + "Creating account..."
- Margin bottom: 16px

**10. Sign In Link**
- Centered below button
- "Already have an account? Sign in" 14px
- Link color: Primary blue

---

## 6. RESPONSIVE BREAKPOINTS

- **Mobile**: < 768px (md)
- **Tablet**: 768px - 1024px (lg)
- **Desktop**: ≥ 1024px (lg) and up

**Mobile Adjustments:**
- Sign-up: Single column, no left panel, padding 24px
- Forms: Full width inputs, single column for phone/DOB
- Role cards: Stack vertically
- Font sizes: Reduce heading display by 1 level on mobile
- Buttons: Full width

**Tablet Adjustments:**
- Sign-up: Left panel hidden
- Max widths: Increase to 90% of viewport
- Padding: 32px

---

## 7. INTERACTIVE STATES

**Button States:**
- Default: Full color, cursor pointer
- Hover: 5-10% darker, subtle shadow increase
- Active/Pressed: 15% darker, inset shadow
- Disabled: 50% opacity, cursor not-allowed, no hover effect
- Loading: Spinner icon, text faded

**Input States:**
- Default: Border color
- Focus: 2px ring offset with primary blue, border color unchanged
- Hover: Slightly darker border
- Error: Red border, red ring
- Disabled: 50% opacity

**Card Hover (interactive):**
- Role selection cards: 2px border becomes colored on hover
- Light shadow increase

**Tab States:**
- Inactive: Muted text
- Active: Primary blue text + blue underline

---

## 8. ANIMATIONS & TRANSITIONS

- **Duration**: 200-300ms for micro-interactions
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) (ease-in-out)
- Password strength bar: Smooth color transition on input
- Field errors: Fade in at 150ms
- Buttons: Smooth background color on hover/active

---

## 9. DARK MODE IMPLEMENTATION

**Auto Toggle Rules:**
- Respect user's system preference (prefers-color-scheme)
- Manual toggle available in navbar/settings (future)
- Persist user preference to localStorage

**Color Shifts (Light → Dark):**
- All backgrounds shift from white/light to navy family
- All text shifts from dark to light
- Borders become navy-tinted
- Gold accent increases saturation for pop against dark bg
- Primary blue increases brightness for contrast

---

## 10. ACCESSIBILITY

**WCAG 2.1 AA Compliance:**
- All text: Minimum 4.5:1 contrast ratio for body, 3:1 for UI components
- Focus indicators: Always visible (default blue ring)
- Form labels: Associated with inputs via `<label>` elements
- Error messages: Linked to inputs, color + icon (not color alone)
- Buttons: Minimum 44×44px touch target
- Links: Underlined or distinct color + text styling

---

## 11. ICONS & ILLUSTRATIONS

**Icon Set**: Lucide React icons (24px standard size)
- Graduation Cap: Logo, 40px logo context
- Mail: Email tab
- CreditCard: Card login tab
- Eye/EyeOff: Password visibility toggle
- CheckCircle2: Feature list checkmarks, term acceptance
- BookOpen: Learner role card
- Users: Tutor role card
- Loader2: Loading spinner
- ChevronDown/Up: Dropdowns, expandable sections

**Brand Color for Icons:**
- Primary action icons: Primary blue
- Accent/highlight icons: Gold
- Muted icons: Muted foreground color
- Light mode icon backgrounds: Sidebar accent (light blue)
- Dark mode icon backgrounds: Sidebar accent (navy)

---

## 12. FINAL NOTES FOR DESIGNER

1. **Typography**: Use Geist from Google Fonts or system fallback
2. **Color Precision**: OKLCH values are device-independent; convert to hex/RGB for Figma displays
3. **Spacing**: Use 4px/8px grid to maintain consistency
4. **Responsive**: Design for mobile-first, then enhance for larger screens
5. **Dark Mode**: Create parallel component sets for light/dark (or use color variables in Figma)
6. **Accessibility**: Use sufficient contrast and clear focus indicators in all designs
7. **Components**: Build reusable component library (buttons, inputs, cards, etc.) for scalability

---

## Example Hex Color Reference (Light Mode)

| Token | OKLCH | Hex Approx |
|-------|-------|-----------|
| Primary | oklch(0.42 0.18 260) | #2E5090 |
| Secondary | oklch(0.60 0.12 258) | #6B8FD4 |
| Accent | oklch(0.65 0.18 70) | #E8A020 |
| Background | oklch(0.99 0.002 255) | #FAFAFA |
| Foreground | oklch(0.12 0.02 255) | #1F1F23 |
| Card | oklch(1 0 0) | #FFFFFF |
| Border | oklch(0.91 0.01 255) | #E8E8E8 |
| Muted | oklch(0.94 0.01 255) | #F0F0F0 |
| Error | oklch(0.63 0.21 30) | #D32F2F |

---

## Example Hex Color Reference (Dark Mode)

| Token | OKLCH | Hex Approx |
|-------|-------|-----------|
| Background | oklch(0.26 0.05 255) | #1A2744 |
| Card | oklch(0.30 0.055 255) | #203050 |
| Foreground | oklch(0.95 0.01 240) | #F0F0F2 |
| Primary | oklch(0.62 0.20 260) | #4D8FFF |
| Accent | oklch(0.72 0.18 72) | #E8A020 |
| Border | oklch(0.36 0.05 255) | #2D4470 |
