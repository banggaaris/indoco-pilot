# indoco-pilot App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new user arrives at the application, they land on the root URL (`/`). This landing page immediately presents them with clear options to either sign in or sign up. If the user is completely new, they click the “Sign Up” link, which takes them to `/sign-up`. On the sign-up page, the user sees a simple form requesting their email address, a chosen password, and a confirmation of that password. After entering valid details and submitting the form, the client sends a request to the backend endpoint at `/api/auth/register`. If the registration succeeds, the user’s session is created and they are automatically redirected into the protected area of the app. If there is a validation error or the email is already in use, an inline message appears above the form field explaining what went wrong.

Existing users choose the “Sign In” link on the landing page to navigate to `/sign-in`. They enter their registered email and password into the form. When they submit, the information is sent to `/api/auth/login`. A successful login results in the user’s session being established and an immediate redirect to the dashboard. If the credentials are incorrect, the page shows an error message next to the relevant field. At any point, if the user needs to sign out, they click the sign-out control in the header of the dashboard, which calls `/api/auth/logout` and returns them to the sign-in view.

## Main Dashboard or Home Page

Once authenticated, the user always lands on `/dashboard`. The dashboard page is wrapped in a dedicated layout that includes a top header bar and a vertical sidebar on the left. The header bar shows the application logo, the user’s name, and the sign-out link. The sidebar contains text links for each main section of the dashboard, although currently it only lists the main overview. The central area of the screen displays a welcome message and any dynamic content or widgets that the application will show, such as recent activity or account summaries. From here, the user can click the logo in the header to return to the root landing page, or use the sidebar links to switch between different sections within the dashboard.

## Detailed Feature Flows and Page Transitions

When a user completes the sign-up form and the response confirms registration, the front-end router immediately pushes the user to the dashboard. The dashboard layout file loads first, building the sidebar and header, then the dashboard page component fetches any needed data before rendering. If the user navigates from the dashboard sidebar to another route under `/dashboard`, the new page content replaces the main area while the header and sidebar remain visible. Each page transition is smooth and leverages client-side navigation to avoid a full page reload.

If the user logs out, the sign-out link triggers a call to the logout API, clears the local session cookie, and then sends the user back to `/sign-in`. Attempting to access any `/dashboard` route without an active session causes the application to detect the missing session on the server side and redirect the user back to the sign-in page. This ensures that protected content always remains inaccessible to unauthenticated visitors.

## Settings and Account Management

At present, detailed account settings such as changing a password or updating profile information are not available as separate pages. The user’s only account management action is to sign out from the dashboard header. Any future extension of personal settings would link from the sidebar or header and follow the same pattern of layout wrapping and API-driven form submission. After completing any settings change, the user would return to the main dashboard view via a redirect or a click on the dashboard link in the sidebar.

## Error States and Alternate Paths

If a user submits invalid input on the sign-up or sign-in forms, the form re-renders with a clear error message next to the field in question. Network failures during API calls display a banner at the top of the page advising the user to check their connection and try again. If the server responds with an unexpected error, a generic error page appears in the main content area, allowing the user to click a “Try Again” button that retries the last request. Any direct navigation to a protected route without a valid session triggers an immediate redirect back to the sign-in page, preventing unauthorized access.

## Conclusion and Overall App Journey

In summary, the user’s journey begins at the public landing page on `/`, where they choose to create a new account or sign in. Successful authentication transports them into the dashboard at `/dashboard`, wrapped in a common header and sidebar layout. From there, the user experiences seamless client-side navigation between sections. Signing out returns them to the sign-in page and clears their session. Throughout the app, clear messages guide the user in case of errors or invalid input, ensuring a smooth and secure workflow from initial registration to everyday usage of the dashboard.