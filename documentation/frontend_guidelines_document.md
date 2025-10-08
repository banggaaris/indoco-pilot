# Frontend Guidelines for Indoco Pilot

This document lays out how the Indoco Pilot frontend is built, styled, and maintained. It’s written in everyday language so anyone—even without a deep technical background—can understand the setup and best practices.

## 1. Frontend Architecture

**Frameworks and Libraries**
- **Next.js (App Router)**: Uses the `app/` directory to define routes, layouts, and API endpoints in one place. Supports server-side rendering (SSR), static site generation (SSG), and client-side navigation.
- **React & TypeScript**: All UI components are written in React with TypeScript (`.tsx` files) for stronger type safety and better developer tooling.
- **CSS**: Styling is handled with global styles (`globals.css`) and theme-specific styles (`theme.css`).

**How It Supports Scalability, Maintainability, and Performance**
- **Co-location**: Pages, layouts, and related API routes live side by side in folders like `/app/sign-in/`, `/app/dashboard/`. This makes it easy to find and change code for a specific feature.
- **Layouts**: Global and nested layouts (`layout.tsx`) wrap pages consistently—no need to repeat headers, footers, or navigation code.
- **Built-in Optimizations**: Next.js automatically code-splits, lazy-loads assets, and optimizes images out of the box.

## 2. Design Principles

**Key Principles**
- **Usability**: Clear navigation, visible feedback on interactions, and sensible form flows (e.g., sign-in, sign-up) guide users through tasks smoothly.
- **Accessibility**: Color contrasts meet WCAG guidelines. All interactive elements have proper labels, keyboard focus styles, and ARIA attributes when needed.
- **Responsiveness**: UI adapts fluidly from mobile phones to large desktop screens using flexible layouts and media queries.

**How They’re Applied**
- **Forms** include inline error messages and focus management.
- **Navigation** is built with accessible `<nav>` landmarks and skip links for screen reader users.
- **Fluid grids** and relative units (`%, rem`) ensure content resizes gracefully.

## 3. Styling and Theming

**Styling Approach**
- A global stylesheet (`globals.css`) holds base resets, typography rules, and shared utilities.
- A theme stylesheet (`theme.css`) defines colors, spacing scales, and design tokens.
- We follow a **BEM-inspired** naming convention for any component-specific CSS to keep rules predictable and modular.

**Theming**
- All colors and font sizes live in CSS custom properties (`--color-primary`, `--font-base`) so we can switch themes easily.
- If a dark mode or customer-branded theme is needed later, we just override these variables at the root level.

**Visual Style**
- Modern **flat design** with subtle **glassmorphism accents** (semi-transparent panels with soft shadows).

**Color Palette**
- Primary: #1E90FF (blue)
- Secondary: #FF4081 (pink)
- Accent: #00C853 (green)
- Background: #F5F5F5 (light gray)
- Surface: #FFFFFF (white)
- Error: #B00020 (red)
- Text Primary: #212121 (dark gray)
- Text Secondary: #757575 (medium gray)

**Typography**
- Font Family: `Inter, sans-serif`
- Base Font Size: 16px (1 rem)
- Headings use a modular scale (1.25× increments) for hierarchy.

## 4. Component Structure

**Organization**
- Each feature folder under `app/` (e.g., `sign-in`, `dashboard`) contains its own:  
  • `page.tsx` (the page component)  
  • `layout.tsx` (feature-specific wrapper)  
  • `styles.module.css` (optional, for component-scoped CSS)
- Shared UI bits (buttons, forms, cards) live in a `components/` directory at the root.

**Why Component-Based**
- **Reusability**: Build a button once, use it everywhere—consistent look and less duplication.
- **Maintainability**: Fix a bug or tweak a style in one place, and every usage instantly updates.

## 5. State Management

**Approach**
- Local state is handled with React’s `useState` and `useReducer` hooks inside components.
- Shared state (e.g., user session) uses React Context API with a custom `AuthProvider`.

**Why This Works**
- For most onboarding and dashboard scenarios, Context + hooks keep complexity low.
- If we need more advanced state (caching, offline support), we can introduce Zustand or Redux Toolkit later without a full rewrite.

## 6. Routing and Navigation

**How Routing Works**
- File-based routing through Next.js App Router. Every folder under `app/` with a `page.tsx` becomes a route:
  • `/app/sign-in/page.tsx` → `/sign-in`
  • `/app/dashboard/page.tsx` → `/dashboard`

**Navigation Structure**
- A global navigation bar in `app/layout.tsx` shows links like Home, Dashboard (if signed in), and Sign In/Sign Up.
- Inside the dashboard, a sidebar navigation in `app/dashboard/layout.tsx` lets users switch between dashboard subpages.
- Next.js `<Link>` component handles client-side transitions for instant page loads.

## 7. Performance Optimization

**Strategies**
- **Code Splitting & Lazy Loading**: Next.js automatically splits code by route. We can also use `dynamic()` imports for rarely used components.
- **Image Optimization**: Next.js `<Image>` handles resizing, WebP conversion, and lazy loading by default.
- **Asset Minification**: CSS and JS are minified in production builds.
- **Caching**: We set HTTP cache headers on static assets and leverage Next.js ISR (Incremental Static Regeneration) when serving dashboard data that doesn’t change every second.

These practices lead to faster load times, reduced data usage, and smoother interactions.

## 8. Testing and Quality Assurance

**Testing Strategies**
- **Unit Tests** with Jest and React Testing Library. Focus on individual components (buttons, form inputs) and utility functions.
- **Integration Tests** check user flows like signing in, navigating to the dashboard, and submitting forms.
- **End-to-End (E2E) Tests** with Cypress or Playwright to simulate real user scenarios across multiple pages.

**Quality Tools**
- **ESLint**: Enforces consistent code style and catches potential bugs.
- **Prettier**: Auto-formats code on save so everyone follows the same style.
- **TypeScript Compiler**: Flags type errors before runtime.

## 9. Conclusion and Overall Frontend Summary

Indoco Pilot’s frontend is built on modern, battle-tested tools—Next.js, React, and TypeScript—wrapped in a clear folder structure that supports growth and collaboration. We follow design principles of usability, accessibility, and responsiveness to keep our UI friendly for all users. Styling is simple but flexible, with CSS variables driving a modern flat look and easy theme changes. Component and state-management patterns strike a balance between simplicity and power. Routing, performance optimizations, and a strong testing setup ensure our app loads quickly, behaves reliably, and keeps growing without pain.

With these guidelines in hand, anyone can confidently navigate, maintain, and extend the Indoco Pilot frontend to meet future needs.