export const LANGUAGE = '';

export const DEFAULT_NETWORK = 'bcb';
export const DEFAULT_CHAIN = 'bcb';

export const DEFAULT_TOKEN = 'BCB';

export const POPUP_WIDTH = 360;
export const POPUP_HEIGHT = 600;
export const POPUP_LEFT = 80;
export const POPUP_TOP = 80;

export const ENABLED_ASSETS = {
    'BCB': {
        icon: 'https://bcbpushsrv.bcbchain.io/public/resource/coin/icon/fae8dd88927ea0ca872a889681cd2902.png'
    },
    'DC': {
        icon: 'https://bcbpushsrv.bcbchain.io/public/resource/coin/icon/ecdba0e2f6615760b196edd49a2f1bf0.png'
    }
};

export const FIATRATE_UPDATE_INTERVAL = 300; // secs

export const PUBLIC_NETWORKS = {
    'bcb': {
        name: 'Mainnet',
        chains: ['bcb'],
        public: true,
        urls: [
            'https://earth.bcbchain.io'
        ]
    },
    'bcbt': {
        name: 'Testnet',
        chains: ['bcbt'],
        public: true,
        urls: [
            'https://test-earth.bcbchain.io'
        ]
    }
};

export const DISABLED_CHAINS = [ 'yy', 'jiujiu', 'jiuj' ];

export const PROVIDER_NETWORKS = {
    'bcb': {
        chainId: 'bcb',
        coinType: '0x1002',
        default: true,
        url: 'https://wallet.bcbchain.io',
        token: 'BCB'
    },
    'bcbt': {
        chainId: 'bcbt',
        coinType: '0x1003',
        default: true,
        url: 'https://titanwallet.bcbchain.io',
        token: 'BCBT'
    }
};

export const PROVIDER_APP_ID = '100';
