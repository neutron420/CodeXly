import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codexly.app',
  appName: 'CodeXly',
  webDir: 'out', // Change to '.next' if using hybrid approach
  server: {
    // Uncomment for development - point to your local server
    // url: 'http://localhost:3000',
    // cleartext: true
    
    // Uncomment for production - point to your deployed backend
    // url: 'https://www.codexly.xyz',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
  },
  ios: {
    scheme: 'CodeXly',
  },
};

export default config;

