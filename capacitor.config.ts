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
