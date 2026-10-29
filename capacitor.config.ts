import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sovereignshield.manuscriptstudio',
  appName: 'Manuscript Studio',
  webDir: 'out',
  server: {
    // Load from the live production deployment.
    // App updates deploy automatically without an app store review.
    url: 'https://manuscript-studio-os.vercel.app',
    cleartext: false,
  },
  // Marks the native shell so the site hides purchase UI (store build mode).
  appendUserAgent: 'ManuscriptStudioApp',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#4f6df5',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#ffffff',
    },
  },
  ios: {
    contentInset: 'always',
    // Local Capacitor origin only. The WebView still loads server.url.
    // A URL scheme cannot contain spaces.
    scheme: 'manuscriptstudio',
    backgroundColor: '#ffffff',
  },
  android: {
    backgroundColor: '#ffffff',
  },
};

export default config;
