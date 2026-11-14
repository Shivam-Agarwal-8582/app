Act as a senior Android application developer specializing in Capacitor and React.

I already have an existing SplitWise Clone built using:

Frontend:
- React
- Vite
- Tailwind CSS
- Axios
- React Router

Backend:
- Java 21
- Spring Boot
- Spring Security
- JWT
- MySQL
- WebSocket + STOMP

My objective is to convert my existing SplitWise Clone into a fully functional Android application while preserving the existing website.

### Phase 1: Project inspection

Before writing code:

1. Inspect the complete frontend project.
2. Identify the Vite configuration.
3. Identify the React entry point.
4. Inspect the routing structure.
5. Inspect the Axios configuration.
6. Identify the authentication implementation.
7. Inspect the WebSocket implementation.
8. Identify all API endpoints.
9. Identify existing responsive design issues.

Do not assume the project structure. Use the actual files.

### Phase 2: Capacitor integration

Install and configure:

- @capacitor/core
- @capacitor/cli
- @capacitor/android

Requirements:

1. Initialize Capacitor.
2. Configure the application ID as com.shivam.splitwiseclone.
3. Configure the application name as SplitWise.
4. Configure the correct Vite build directory.
5. Add the Android platform.
6. Configure the Android project.
7. Configure the application icon.
8. Configure the splash screen.
9. Configure the status bar.
10. Configure Android permissions only when required.

### Phase 3: Authentication

Ensure:

1. Login works on Android.
2. Registration works on Android.
3. JWT tokens are stored securely.
4. Authentication persists after restarting the application.
5. Logout clears authentication data.
6. Protected routes work correctly.

Use an appropriate secure storage solution for sensitive authentication tokens on Android. Do not store tokens in plain localStorage or expose them in logs.

### Phase 4: Backend connectivity

1. Replace localhost API URLs with configurable environment-based API URLs.
2. Connect the application to the deployed Spring Boot backend.
3. Configure HTTPS.
4. Configure CORS.
5. Ensure API requests work on real Android devices.
6. Handle network failures gracefully.
7. Verify JWT authentication.

Never use localhost as the backend address for a physical Android device.

### Phase 5: Mobile functionality

Test these features:

- User registration and login.
- Dashboard.
- Group creation.
- Group invitations.
- Add and edit expenses.
- Equal, exact, percentage and share-based splitting.
- Balance calculation.
- Debt simplification.
- Settlement management.
- Real-time group chat.
- Notifications.
- Receipt image uploads.
- User profile.

### Phase 6: Native Android integration

Implement where appropriate:

1. Android back-button handling.
2. Status bar configuration.
3. Splash screen.
4. App icon.
5. Camera and gallery access.
6. File upload functionality.
7. Network connectivity handling.
8. Keyboard and safe-area handling.

### Phase 7: Testing

Test on:

1. Android emulator.
2. Physical Android device.
3. Web browser.

Verify that web functionality remains unchanged.

Fix:
- Build errors.
- Runtime errors.
- API connectivity errors.
- Authentication errors.
- Navigation errors.
- WebSocket connection issues.
- Mobile UI issues.

### Phase 8: Generate Android APK

Provide instructions to:

1. Build the React frontend.
2. Synchronize Capacitor.
3. Open Android Studio.
4. Run the application.
5. Generate a signed APK.
6. Generate an Android App Bundle (AAB) for Play Store publishing.

### Important development rules

- Work with my existing codebase.
- Do not rebuild the application from scratch.
- Do not replace Spring Boot with another backend.
- Do not replace React with React Native.
- Do not introduce unnecessary dependencies.
- Do not remove existing features.
- Explain every important modification.
- Implement in small phases.
- Run builds and tests after each phase.
- Stop and report errors rather than silently ignoring them.

Start with project inspection. Do not modify any files until you have presented the implementation plan.