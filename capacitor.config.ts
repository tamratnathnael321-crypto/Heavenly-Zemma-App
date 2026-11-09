import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.heavenlyzemma.app',
  appName: 'Heavenly Zemma',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: 'off',
      resetWhenUpdate: false,
      appReadyTimeout: 1000,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
    App: {},
  },
};

export default config;
