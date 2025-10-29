# TrimBot Design System

**Version:** 1.0  
**Status:** Active  
**Last Updated:** Q4 2025

Based on the Organic Data Editor design mockup with a professional dark theme, lime green accents, and organic aesthetic.

---

## 🎨 Color Palette

### Primary Accent
- **Primary:** `#96f20d` (Lime Green) - Main action color, focus states, highlights
- **Primary Light:** `#b3ff4d` - Hover states, lighter accents
- **Primary Dark:** `#6fb800` - Active states, depth

### Background
- **Dark (Primary BG):** `#1b2210` - Main application background
- **Darker:** `#141a0d` - Subtle depth variation
- **Panel:** `#222c15` - Side panels, cards
- **Input:** `#394922` - Form fields, controls
- **Input Hover:** `#4a5a2e` - Elevated input state

### Text
- **Primary:** `#ffffff` - Main text
- **Secondary:** `#b3cb90` - Labels, hints, muted content
- **Tertiary:** `#8a9b6a` - Disabled, very muted
- **Muted:** `#6a7a4a` - Minimal visibility

### Borders
- **Primary:** `#394922` - Standard borders
- **Secondary:** `#526831` - Emphasized borders
- **Light:** `#3d4f26` - Subtle borders

### Semantic
- **Success:** `#6fb800` - Positive actions
- **Warning:** `#ffb800` - Caution state
- **Error:** `#ff3d00` - Destructive/error state
- **Info:** `#00b8ff` - Informational

---

## 🔤 Typography

### Font Family
- **Display:** Space Grotesk (weights: 300-700)
- **Mono:** Menlo, Monaco, Courier New

### Font Sizes
```
xs:   0.75rem   (12px)
sm:   0.875rem  (14px)
md:   1rem      (16px)
lg:   1.125rem  (18px)
xl:   1.25rem   (20px)
2xl:  1.5rem    (24px)
3xl:  1.875rem  (30px)
```

### Font Weights
- Light: 300
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Usage
- **Headings (H1-H3):** Bold, tight line-height
- **Subheadings (H4):** Bold, uppercase, letter-spaced
- **Body:** Normal weight, relaxed line-height
- **Labels:** Semibold, secondary text color
- **Code:** Mono family

---

## 📏 Spacing System

8px base unit

```
xs:   2px
sm:   4px
md:   8px
lg:   12px
xl:   16px
2xl:  24px
3xl:  32px
4xl:  48px
```

**Usage:**
- Use `md` (8px) for small spacing
- Use `xl` (16px) for standard padding
- Use `2xl` (24px) for section spacing
- Use `3xl+` for major layout spacing

---

## 🎭 Border Radius

```
sm:   0.25rem (4px)   - Form fields, small components
md:   0.5rem (8px)    - Standard (buttons, cards, panels)
lg:   0.75rem (12px)  - Large components
xl:   1rem (16px)     - Extra large components
full: 9999px          - Circular (avatars)
```

---

## ✨ Components

### Buttons

#### Primary Button
```
Background: var(--color-primary)
Text: var(--color-bg-dark)
Hover: var(--color-primary-light)
Active: var(--color-primary-dark)
Padding: var(--space-md) var(--space-xl)
Border-radius: var(--radius-md)
```

#### Secondary Button
```
Background: transparent
Border: 1px solid var(--color-border-secondary)
Text: var(--color-text-primary)
Hover: background var(--color-bg-input-hover)
Padding: var(--space-md) var(--space-xl)
Border-radius: var(--radius-md)
```

#### Icon Button
```
Size: 32px or 40px
Background: var(--color-bg-input) on hover
Icon Color: var(--color-text-primary)
Icon Color (active): var(--color-primary)
Border-radius: var(--radius-md)
```

### Form Fields

```
Background: var(--color-bg-input)
Border: 1px solid var(--color-border-primary)
Text Color: var(--color-text-primary)
Placeholder: var(--color-text-secondary)
Focus Border: var(--color-primary)
Focus Box-shadow: 0 0 0 3px var(--color-primary-transparent)
Padding: var(--space-sm) var(--space-md)
Border-radius: var(--radius-md)
```

### Panels & Cards

```
Background: var(--color-bg-panel)
Border: 1px solid var(--color-border-primary)
Padding: var(--space-xl)
Border-radius: var(--radius-md)
Shadow: var(--shadow-md) (cards only)
```

### Inputs & Sliders

**Range Slider:**
```
Track: var(--color-bg-input)
Thumb: var(--color-primary) (12px circle)
Thumb Hover: var(--color-primary-light) scaled 1.2x
```

---

## 🎬 Animations & Transitions

```
--transition-fast: 100ms ease-in-out   (subtle changes)
--transition-base: 200ms ease-in-out   (standard interactions)
--transition-slow: 300ms ease-in-out   (important changes)
```

**Common Uses:**
- Hover states: fast transition
- Color/opacity changes: base transition
- Modal entrance/exit: slow transition
- All interactive elements: base as default

---

## 🌙 Dark Mode (Default)

The design system is optimized for dark mode by default. All colors provided assume a dark theme.

### Light Mode Support (Future)

```css
@media (prefers-color-scheme: light) {
  --color-bg-dark: #f7f8f5;
  --color-bg-panel: #ffffff;
  --color-text-primary: #1b2210;
  --color-text-secondary: #4a5a2e;
  /* ... and more */
}
```

---

## ♿ Accessibility

### Focus States
- All interactive elements have a visible outline: `2px solid var(--color-primary)` with `2px offset`
- Focus ring appears on keyboard navigation

### Color Contrast
- Text on background: min 4.5:1 (WCAG AA)
- Interactive elements: min 3:1 contrast ratio
- Not relying on color alone for information

### Keyboard Navigation
- Tab order follows visual hierarchy
- Focus visible on all focusable elements
- Escape closes modals

### Screen Reader Support
- Semantic HTML used throughout
- ARIA labels on icon-only buttons
- Proper heading hierarchy

---

## 🎨 Component Library

### Pre-built Components

Located in `src/components/ui/`:

- **Button.tsx** - Reusable button component
- **Input.tsx** - Text input component
- **Select.tsx** - Dropdown select
- **Card.tsx** - Container component
- **Spinner.tsx** - Loading indicator
- **Tooltip.tsx** - Helpful hints
- **Modal.tsx** - Dialog component

### Usage Example

```tsx
import { Button } from '@/components/ui/Button';

export function MyComponent() {
  return (
    <Button 
      variant="primary"
      size="md"
      onClick={() => console.log('Clicked')}
    >
      Click Me
    </Button>
  );
}
```

---

## 📱 Responsive Design

### Breakpoints
```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Design Principles
- Mobile-first approach
- Touch targets minimum 44px × 44px
- Flexible layouts for all screen sizes
- Test at: 320px, 768px, 1920px minimum

---

## 🔧 CSS Variables

All design tokens are available as CSS variables:

```css
/* Colors */
var(--color-primary)
var(--color-bg-dark)
var(--color-text-primary)
var(--color-border-primary)

/* Spacing */
var(--space-md)
var(--space-xl)

/* Typography */
var(--font-display)
var(--font-size-md)
var(--font-weight-bold)

/* Misc */
var(--radius-md)
var(--transition-base)
var(--shadow-md)
```

---

## 📋 Component Checklist

When building new components, ensure:

- [ ] Uses design token CSS variables
- [ ] Accessible (keyboard nav, ARIA labels, contrast)
- [ ] Responsive (works on mobile, tablet, desktop)
- [ ] Consistent spacing from design system
- [ ] Smooth transitions using design tokens
- [ ] Focus states visible
- [ ] Hover states defined
- [ ] Loading states handled
- [ ] Error states visible
- [ ] Disabled states grayed out

---

## 🚀 Implementation Guidelines

### Do ✅
- Use CSS variables for all colors, spacing, typography
- Follow semantic HTML structure
- Ensure keyboard accessibility
- Test contrast with WAVE or Axe
- Use flexbox/grid for layouts
- Keep animations smooth and purposeful
- Document complex components

### Don't ❌
- Hardcode colors - always use variables
- Ignore focus states
- Create new colors - use palette
- Forget dark mode support
- Overcomplicate animations
- Use divs for everything - use semantic HTML
- Skip accessibility checks

---

## 📚 Resources

- **Design Mockup:** Organic Data Editor (provided HTML)
- **Token Source:** `src/styles/design-tokens.css`
- **Components:** `src/components/ui/`
- **Tailwind Config:** `tailwind.config.js`

---

## 👥 Feedback & Updates

Found an issue with the design system?
- Create an issue in GitHub
- Tag with `design-system` label
- Include screenshot and component affected

Want to propose changes?
- Update this document
- Include rationale
- Get team approval before implementing

---

**Last Updated:** Q4 2025  
**Version:** 1.0 - Initial Design System  
**Maintained by:** TrimBot Design Team
