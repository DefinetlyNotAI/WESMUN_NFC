import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.wesmun.nfc',
    appName: 'WESMUN NFC',
    webDir: 'public',
    server: {
        url: 'https://nfc.wesmun.com',
        cleartext: true
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 3000,
            launchAutoHide: true,
            backgroundColor: '#000000',
            androidSplashResourceName: 'splash'
        }
    }
};

export default config;
