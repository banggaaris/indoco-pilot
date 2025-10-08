# Indoco-Pilot: Project Requirements Document (PRD)

## 1. Project Overview

Indoco-Pilot is a web application built on a modern React-based framework (Next.js) that offers a secure, password-protected user experience with a personalized dashboard. It lets new users sign up, existing users sign in, and directs them to a dynamic dashboard that displays relevant data and interactive UI components. Behind the scenes, API routes handle authentication logic, session management, and data fetching, while the App Router structure keeps pages, layouts, and endpoints neatly organized.

This project is being built to provide a clear, modular starting point for future growth—whether adding advanced analytics, external integrations, or mobile support. Key objectives for version 1.0 include:  
• Reliable user registration, login, and logout flows  
• A protected dashboard layout that only authenticated users can access  
• Consistent global styling and theming  
• Maintainable code structure following the App Router paradigm  

Success will be measured by users’ ability to register and log in without errors, fast page loads (sub-2-second initial load), and zero known security breaches in authentication paths.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (v1.0)
- User sign-up and sign-in pages with form validation  
- API routes for authentication (register, login, logout)  
- Session/cookie-based session management  
- Protected dashboard route and layout  
- Global layout (header/footer) and dashboard-specific layout (sidebar/navigation)  
- Basic CSS styling: `globals.css` and `theme.css`  
- Error handling and user-friendly error messages in auth flows

### Out-of-Scope (Later Phases)
- Third-party OAuth or social login (e.g., Google, Facebook)  
- Database schema design beyond user credentials (no advanced data models)  
- Payment or subscription features  
- Real-time updates (WebSockets)  
- Internationalization (i18n)  
- Detailed reporting, analytics, or dashboards with charts  
- Mobile-native app or React Native support

## 3. User Flow

When a new visitor lands on the home page (`/`), they see a call-to-action to either sign up or sign in. Clicking **Sign Up** takes them to `/sign-up`, where they complete a form (email, password). On submission, the frontend sends the data to `/api/auth/register`. If registration succeeds, a session cookie is set and the user is redirected to `/dashboard`. If there’s an error (duplicate email, weak password), a clear message is displayed.

An existing user clicks **Sign In**, lands on `/sign-in`, and enters their credentials. The form submits to `/api/auth/login`. On success, the session is stored and the user lands on their dashboard. The dashboard layout features a sidebar (navigation links), a header (showing user name and logout button), and a main content area that fetches user-specific data. Clicking **Logout** calls `/api/auth/logout`, clears the session, and returns the user to `/sign-in`.

## 4. Core Features

- **Authentication API**: Endpoints in `/app/api/auth/` for register, login, logout.  
- **Sign-Up Page** (`/app/sign-up/page.tsx`): Form with email/password fields, client-side validation, API call.  
- **Sign-In Page** (`/app/sign-in/page.tsx`): Email/password login form and error display.  
- **Session Management**: HTTP-only cookies, session expiry, server-side session checks on protected pages.  
- **Protected Dashboard** (`/app/dashboard/page.tsx`): Dashboard main view accessible only when authenticated.  
- **Layouts**:  
  • Root layout (`/app/layout.tsx`) for header, footer, global styles  
  • Dashboard layout (`/app/dashboard/layout.tsx`) for sidebar/nav  
- **Global & Theme CSS**: `globals.css` for base styles, `theme.css` for color schemes.  
- **Error Handling**: Centralized logic to catch API errors and display user-friendly messages.  

## 5. Tech Stack & Tools

- **Frontend Framework**: Next.js (v13+ with App Router)  
- **UI Library**: React with TypeScript (.tsx files)  
- **Styling**: Plain CSS modules or global CSS (`globals.css`, `theme.css`)  
- **Backend**: Next.js API routes (Node.js + Express-style handlers)  
- **Session Store**: In-memory or Redis (configurable via environment variables)  
- **Database (Assumed)**: PostgreSQL or MongoDB, accessed via ORM (e.g., Prisma)  
- **Auth Libraries (Optional)**: bcrypt for hashing, jsonwebtoken for JWT if chosen  
- **IDE & Plugins**: VS Code with ESLint, Prettier, and optional AI assistants like Cursor or Windsurf

## 6. Non-Functional Requirements

- **Performance**:  
  • Initial page load < 2 seconds on 3G throttling  
  • API response times < 300ms under normal load  
- **Security**:  
  • OWASP Top 10 compliance (XSS, CSRF protection)  
  • Secure, HTTP-only cookies for sessions  
  • Passwords hashed & salted  
  • Input validation on both client and server  
- **Scalability**:  
  • Code structured in modules for easy feature additions  
- **Usability & Accessibility**:  
  • Responsive design for desktop/tablet/mobile  
  • WCAG 2.1 AA compliance for forms and navigation  
- **Maintainability**:  
  • Consistent code style enforced by ESLint/Prettier  
  • Well-documented file and directory structure

## 7. Constraints & Assumptions

- Next.js v13+ App Router must be available in hosting environment.  
- Node.js version ≥ 16.0 is required.  
- A relational or document database and session store will be configured separately.  
- Environment variables for secrets (JWT secret, database URL) are set at deploy time.  
- No external OAuth systems in v1—authentication is custom.  
- Assumes basic email/password auth; no email verification or password resets included yet.

## 8. Known Issues & Potential Pitfalls

- **Database Connection**: Without a configured ORM or connection pool, auth routes will fail.  
  _Mitigation_: Provide a `.env.example` and connection-check logic on startup.  
- **API Rate Limits**: Brute-force attacks on login endpoint could be possible.  
  _Mitigation_: Implement simple rate limiting or captcha after X failed attempts.  
- **SSR vs. Client Data Fetching**: Mixing server-side and client-side data fetching can cause flicker.  
  _Mitigation_: Use Next.js data fetching methods (`getServerSideProps` or React Server Components) consistently.  
- **Session Store Persistence**: In-memory sessions will be lost on server restart.  
  _Mitigation_: Recommend Redis or database-backed session store.  
- **Error Boundary**: Uncaught errors in nested layouts or pages could crash the entire app.  
  _Mitigation_: Add React error boundaries and fallback UIs around sensitive components.

---  
This document outlines everything needed for an AI-driven code generation or for engineering teams to implement version 1.0 of Indoco-Pilot without ambiguity. All subsequent technical documents (Tech Stack, App Flow, Frontend/Backend Specs) can reference this PRD as the single source of truth.