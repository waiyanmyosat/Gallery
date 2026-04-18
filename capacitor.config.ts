import type { CapacitorConfig } from '@capacitor/cli';

const config: any = {
  appId: 'com.android.gallery',
  appName: 'Gallery',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    compact: true,
    buildOptions: {
      keystorePath: 'undefined',
      keystoreAlias: 'undefined',
    }
  }
};

export default config;
