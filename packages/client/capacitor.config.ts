import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'social.terminal.app',
  appName: 'Forkverse',
  webDir: 'dist',
  server: {
    // In development, use the Vite dev server
    // For Android emulator, 10.0.2.2 maps to host localhost
    ...(process.env.NODE_ENV === 'development'
      ? { url: 'http://10.0.2.2:7878', cleartext: true }
      : {}),
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#08090d',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0d1117',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
