import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.visit.starter',
  appName: 'Brahmadev Plus',
  webDir: 'www',
  plugins: {
    OtaKit: {
      appId: 'io.visit.starter',
      cdnUrl: 'https://brahmadev-api.democompany.in.net/ota',
      allowInsecureUrls: true
    }
  }
};

export default config;
