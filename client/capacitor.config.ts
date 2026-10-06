import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.attendance.app',
  appName: 'AMS',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000, // 2 seconds tak splash screen dikhegi
      launchAutoHide: true,
      backgroundColor: "#4f46e5", // Aapka Indigo theme color
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#ffffff"
    }
  }
};

export default config;