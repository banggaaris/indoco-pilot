# indoco-pilot Tech Stack Document

This document explains, in everyday language, the key technology choices behind the indoco-pilot web application. It should help everyone—from project managers to end users—understand why we picked each tool and how they all work together.

## 1. Frontend Technologies

These are the tools we used to build everything you see and interact with in your browser.

• Next.js (App Router)
  - Provides a simple folder-based routing system under the `app/` directory.
  - Enables a mix of server-side rendering (SSR) and client-side rendering (CSR) for fast page loads and good SEO.

• React
  - The core library for building interactive user interface components.
  - Lets us split the UI into reusable pieces (buttons, forms, lists, etc.).

• TypeScript
  - A superset of JavaScript that adds type checking.
  - Helps catch errors early, making the code more reliable and easier to maintain.

• CSS (globals.css, theme.css)
  - `globals.css` sets styles that apply across the entire app (colors, fonts, basic layouts).
  - `theme.css` holds custom themes or component-specific styles.
  - Using plain CSS keeps things simple and straightforward.

How these choices enhance the experience:
- Fast page loads thanks to Next.js’s mix of SSR and static generation.
- A consistent, polished look by managing styles in global and theme files.
- Interactive, dynamic content powered by React components.
- Fewer runtime errors and better developer experience with TypeScript.

## 2. Backend Technologies

Here’s what happens behind the scenes when you sign in, fetch data, or submit a form.

• Next.js API Routes
  - Built-in feature of Next.js under `app/api/`.
  - We use it to handle authentication (sign-in, sign-up) and any future data APIs.

• Node.js Runtime
  - Runs our server code in a JavaScript environment outside the browser.

• Database (e.g., PostgreSQL, MongoDB)
  - Stores user accounts, credentials, and any other data.
  - We access it through an ORM (like Prisma for SQL or Mongoose for MongoDB).
  - This lets us write database queries in code instead of raw SQL.

How these components work together:
1. A user fills in the sign-in form on the frontend.
2. The form calls a Next.js API route (e.g., `/api/auth/login`).
3. That API route checks the credentials against the database.
4. On success, it creates a secure session and returns a confirmation to your browser.
5. Your browser stores the session info and grants access to protected pages (like the dashboard).

## 3. Infrastructure and Deployment

We’ve set up a streamlined process so updates go live quickly and reliably.

• Version Control: Git + GitHub
  - All code is stored in a GitHub repository.
  - Branching and pull requests allow safe collaboration and code review.

• Continuous Integration / Continuous Deployment (CI/CD): GitHub Actions
  - Automatically runs tests and checks whenever new code is pushed.
  - On successful checks, deploys the latest version to our hosting platform.

• Hosting Platform: Vercel
  - Optimized for Next.js apps.
  - Handles scaling, HTTPS certificates, and global edge caching out of the box.

These choices ensure:
- Every change goes through review and automated tests.
- Deployments happen automatically with minimal manual work.
- The app stays up and performs well under load.

## 4. Third-Party Integrations

At this stage, we don’t have any external services directly wired into the codebase. However, it’s straightforward to add services like:

• Analytics (e.g., Google Analytics, Mixpanel)
• Payment processing (e.g., Stripe, PayPal)
• Email delivery (e.g., SendGrid, Mailgun)
• Social login (e.g., Google, Facebook)

When needed, we can plug any of these in via their JavaScript SDKs or REST APIs.

## 5. Security and Performance Considerations

Security Measures:
• Password Handling
  - Passwords are hashed and salted before storing in the database.
  - No plain-text passwords ever leave the server.

• Session Management
  - Secure cookies or token-based sessions keep users signed in safely.

• Input Validation & Sanitization
  - Every form input is checked on the server to prevent malicious content (XSS, SQL injection).

• HTTPS Everywhere
  - All traffic to and from our app is encrypted by default.

Performance Optimizations:
• Server-Side Rendering (SSR) & Static Generation
  - Pre-renders pages when possible for instant load times.

• Code Splitting & Dynamic Imports
  - Loads only the code needed for the current page, speeding up initial loads.

• Caching & CDN
  - Vercel’s edge network caches static assets close to users worldwide.

• Lazy Loading
  - Images and heavy components load only when they come into view.

## 6. Conclusion and Overall Tech Stack Summary

• Frontend: Next.js + React + TypeScript + CSS
• Backend: Next.js API Routes + Node.js + Database (via ORM)
• Infrastructure: GitHub, GitHub Actions, Vercel
• Security: Encrypted connections, hashed passwords, input checks
• Performance: SSR/Static, code splitting, caching

Together, these technologies create a fast, secure, and maintainable web application. Our stack choices align with modern best practices, deliver a great user experience, and leave room to grow with new features over time. If you have any questions about why we picked a particular tool or how something works, just let us know!