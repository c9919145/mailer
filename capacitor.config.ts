import type { CapacitorConfig } from "@capacitor/cli";

// The Capacitor Android app loads the DEPLOYED backend inside its WebView,
// because this app's auth, database and email features run server-side.
// Set MAILER_SERVER_URL (e.g. https://your-app.vercel.app) to the deployed
// app, and VITE_ prefix is not needed here since Capacitor reads this file.
const serverUrl =
  process.env.MAILER_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "com.mailer.app",
  appName: "Mailer",
  webDir: "out",
  server: {
    url: serverUrl,
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
