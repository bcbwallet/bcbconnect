const ERRORS = {
    NOT_SETUP: 'NOT_SETUP',
    NOT_UNLOCKED: 'NOT_UNLOCKED',
    NOT_LOCKED: 'NOT_LOCKED',
    WRONG_PASSWORD: 'WRONG_PASSWORD',
    WRONG_APP_STATE: 'WRONG_APP_STATE',
    WRONG_CHAIN_ID: 'WRONG_CHAIN_ID',
    WRONG_NETWORK_ID: 'WRONG_NETWORK_ID',
    ACCOUNT_EXISTS: 'ACCOUNT_EXISTS',
    TOKEN_EXISTS: 'TOKEN_EXISTS',
    NETWORK_EXISTS: 'NETWORK_EXISTS',
    NODE_EXISTS: 'NODE_EXISTS',
    NO_WALLET_PROVIDER: 'NO_WALLET_PROVIDER',
    DATA_CORRUPT: 'DATA_CORRUPT',
    INTERNEL_ERROR: 'INTERNEL_ERROR',
    INVALID_PARAMS: 'INVALID_PARAMS',
    INVALID_MNEMONIC: 'INVALID_MNEMONIC',
    INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',
    INVALID_KEYSTORE: 'INVALID_KEYSTORE',

    NETWORK_ERROR: 'NETWORK_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    REQUEST_DECLINED: 'REQUEST_DECLINED',

    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}

const ERROR_CODES = {
    NOT_SETUP: 1,
    NOT_UNLOCKED: 2,
    NOT_LOCKED: 3,
    WRONG_PASSWORD: 4,
    WRONG_APP_STATE: 5,
    WRONG_CHAIN_ID: 6,
    WRONG_NETWORK_ID: 7,
    ACCOUNT_EXISTS: 8,
    TOKEN_EXISTS: 9,
    NETWORK_EXISTS: 10,
    NODE_EXISTS: 11,
    NO_WALLET_PROVIDER: 12,
    DATA_CORRUPT: 13,
    INTERNEL_ERROR: 14,
    INVALID_PARAMS: 15,
    INVALID_MNEMONIC: 16,
    INVALID_PRIVATE_KEY: 17,
    INVALID_KEYSTORE: 18,

    NETWORK_ERROR: 128,
    SERVER_ERROR: 129,
    REQUEST_DECLINED: 130,

    UNKNOWN_ERROR: 255
}

const ERROR_MESSAGES = {
    'en-US': {
        NOT_SETUP: 'Not set up',
        NOT_UNLOCKED: 'Not unlocked',
        NOT_LOCKED: 'Not locked',
        WRONG_PASSWORD: 'Wrong password',
        WRONG_APP_STATE: 'Wrong app state',
        WRONG_CHAIN_ID: 'Wrong chain id',
        WRONG_NETWORK_ID: 'Wrong network id',
        ACCOUNT_EXISTS: 'Account exists',
        TOKEN_EXISTS: 'Token exists',
        NETWORK_EXISTS: 'Network exists',
        NODE_EXISTS: 'Node exists',
        NO_WALLET_PROVIDER: 'No wallet provider',
        DATA_CORRUPT: 'Data corrupt',
        INTERNEL_ERROR: 'Internel error',
        INVALID_PARAMS: 'Invalid params',
        INVALID_MNEMONIC: 'Invalid mnemonic',
        INVALID_PRIVATE_KEY: 'Invalid private key',
        INVALID_KEYSTORE: 'Invalid keystore',

        NETWORK_ERROR: 'Network error',
        SERVER_ERROR: 'Server error',
        REQUEST_DECLINED: 'Request declined by user',

        UNKNOWN_ERROR: 'Unknown error'
    },
    'zh-CN': {
        NOT_SETUP: '钱包未初始化',
        NOT_UNLOCKED: '钱包未解锁',
        NOT_LOCKED: '钱包未锁定',
        WRONG_PASSWORD: '密码错误',
        WRONG_APP_STATE: '钱包状态错误',
        WRONG_CHAIN_ID: '链ID错误',
        WRONG_NETWORK_ID: '网络ID错误',
        ACCOUNT_EXISTS: '账户已存在',
        TOKEN_EXISTS: '代币已存在',
        NETWORK_EXISTS: '网络已存在',
        NODE_EXISTS: '节点已存在',
        NO_WALLET_PROVIDER: '没有钱包服务提供者',
        DATA_CORRUPT: '数据损坏',
        INTERNEL_ERROR: '内部错误',
        INVALID_PARAMS: '参数错误',
        INVALID_MNEMONIC: '助记词错误',
        INVALID_PRIVATE_KEY: '私钥错误',
        INVALID_KEYSTORE: 'Keystore错误',

        NETWORK_ERROR: '网络错误',
        SERVER_ERROR: '服务器错误',
        REQUEST_DECLINED: '用户已取消',

        UNKNOWN_ERROR: '未知错误'
    }
}

const ErrorHandler = {
    language: 'en-US',

    setLanguage(language) {
        if ([ 'en-US', 'zh-CN' ].includes(language)) {
            this.language = language;
        }
    },

    newError(error) {
        let code, message, data, source;
    
        if (typeof error === 'string' && error in ERROR_CODES) {
            let errorId = error;
            code = ERROR_CODES[errorId];
            message = ERROR_MESSAGES[this.language][errorId];
        } else if (typeof error === 'object') {
            code = error.code;
            message = error.message;
            data = error.data;
            source = error.source;
        } else {
            code = error;
        }
    
        if (!message) {
            message = ERROR_MESSAGES[this.language][ERRORS.UNKNOWN_ERROR];
        }
        let errorObj = {};
        errorObj.code = code;
        errorObj.message = message;
        if (data) {
            errorObj.data = data;
        }
        if (source) {
            errorObj.source = source;
        }

        return errorObj;
    },

    throwError(error) {
        throw this.newError(error);
    }
}

export { ERRORS, ErrorHandler };
