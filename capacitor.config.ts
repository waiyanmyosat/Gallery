import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.android.gallery',
  appName: 'Gallery',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
