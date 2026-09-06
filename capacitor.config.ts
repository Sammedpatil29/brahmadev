import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.visit.starter',
  appName: 'Brahmadev Plus',
  webDir: 'www',
  plugins: {
    OtaKit: {
      appId: '5717488f-8cbe-46d2-8bbf-4f5b038edb72'
    }
  }
};

export default config;
