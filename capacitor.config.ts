import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.visit.starter',
  appName: 'Brahmadev Plus',
  webDir: 'www',
  plugins: {
    LiveUpdates: {
      appId: '7d71b691',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 2
    }
  }
};

export default config;
