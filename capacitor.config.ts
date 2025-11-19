import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.wesmun.nfc',
    appName: 'WESMUN NFC',
    webDir: 'public',
    server: {
        url: 'https://nfc.wesmun.com',
        cleartext: true
    }
};

export default config;


// To use this configuration, ensure you have Capacitor installed in your project. And run:
// npx cap add android
// npx cap add ios
// npx cap sync
// npx cap open android // To open the Android project [Need Android Studio installed], then build
// npx cap open ios  // To open the iOS project [Need a Mac with Xcode installed], then build