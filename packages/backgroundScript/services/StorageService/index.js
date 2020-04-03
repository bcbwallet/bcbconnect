import extensionizer from 'extensionizer';
import Logger from '@bcblink/lib/logger';
import Utils from '@bcblink/lib/utils';
const logger = new Logger('StorageService');

const StorageService = {
    // We could instead scope the data so we don't need this array
    storageKeys: [
        'networks',         // { [network]: { name, chains: [], urls: [] }}
        'selectedChain',    // { network, chain }
        'nodes',            // { [nodeId]: { url, chainId, source } }
        'selectedNode',     // nodeId
        'assets',           // { [network]: { [symbol]: { name, address } } }
        'selectedToken',    // symbol
        'mnemonic',         // mnemonic
        'accountIndex',     // accountIndex
        'accounts',         // { [address]: { network, type, name, address } }
        'selectedAccount',  // address
        'recentTo',         // [ address ]
        'currency',         // currency
        'setting',          // { [key]: [value] }
    ],
    storage: extensionizer.storage.local,

    // keep on reset
    password: false,
    ready: false,
    language: false,

    reset() {
        this.networks = {};
        this.selectedChain = false;
        this.nodes = {};
        this.selectedNode = false;
        this.assets = {};
        this.selectedToken = false;

        this.mnemonic = false;
        this.accountIndex = false;
        this.accounts = {};
        this.selectedAccount = false;
        this.recentTo = [];

        this.setting = {};

        this.currency = '';

        this._resetAssets();
    },

    _resetAssets() {
        this.assets = {};
        this.selectedToken = false;
    },

    _saveAssets() {
        this.save('assets');
        this.save('selectedToken');
    },

    getStorage(key) {
        return new Promise(resolve => (
            this.storage.get(key, data => {
                if(key in data)
                    return resolve(data[ key ]);

                resolve(false);
            })
        ));
    },

    async dataExists() {
        return !!(await this.getStorage('accounts'));
    },

    lock() {
        this.password = false;
        this.ready = false;
        this.reset();
    },

    async unlock(password) {
        if(this.ready) {
            logger.error('Attempted to decrypt data whilst already unencrypted');
            return Promise.reject('ERRORS.ALREADY_UNLOCKED');
        }

        if(!await this.dataExists()) {
            return Promise.reject('ERRORS.NOT_SETUP');
        }

        this.reset();

        try {
            for(let i = 0; i < this.storageKeys.length; i++) {
                const key = this.storageKeys[ i ];
                const encrypted = await this.getStorage(key);

                if(!encrypted)
                    continue;

                this[ key ] = Utils.decrypt(
                    encrypted,
                    password
                );
            }
        } catch (err) {
            logger.warn(`Failed to decrypt wallet ${err}`);
            return Promise.reject('ERRORS.INVALID_PASSWORD');
        }

        logger.info('Decrypted wallet data');

        this.password = password;
        this.ready = true;

        return true;
    },

    authenticate(password) {
        this.password = password;
        this.ready = true;

        logger.info('Set storage password');
    },

    save(...keys) {
        if(!this.ready) {
            // TODO: Network/chain selection needs to be kept before password is set
            logger.warn('Attempted to write storage when not ready');
            return;
        }

        if(!keys.length)
            keys = this.storageKeys;

        logger.info(`Writing storage for keys ${ keys.join(', ') }`);

        keys.forEach(key => (
            this.storage.set({
                [ key ]: Utils.encrypt(this[ key ], this.password)
            })
        ));

        logger.info('Storage saved');
    },

    async purge() {
        logger.warn('Purging... This will remove all stored data');
        return new Promise((resolve, reject) => {
            try {
                this.storage.clear(() => {
                    this.reset();
                    logger.info('Purge complete');
                    resolve(true);
                });
            } catch (err) {
                logger.error('Purge error');
                reject('Failed to clear storage');
            }
        });
    },

    get hasAccounts() {
        return Object.keys(this.accounts).length;
    },

    hasAccount(accountId) {
        return (accountId in this.accounts);
    },

    saveSelectedAccount(accountId) {
        logger.info('Storing selected account', accountId);

        this.selectedAccount = accountId;
        this.save('selectedAccount');
    },

    getSelectedAccount() {
        return this.selectedAccount;
    },

    getMnemonic() {
        return this.mnemonic;
    },

    saveMnemonic(mnemonic) {
        this.mnemonic = mnemonic;
        this.save('mnemonic');
    },

    getAccountIndex() {
        return this.accountIndex;
    },

    saveAccountIndex(index) {
        logger.info('Saving account index', index);

        this.accountIndex = index;
        this.save('accountIndex');
    },

    getAccounts() {
        return this.accounts;
    },

    getAccount(accountId) {
        return this.accounts[ accountId ];
    },

    deleteAccount(accountId) {
        logger.info('Deleting account', accountId);

        delete this.accounts[ accountId ];
        this.save('accounts');
    },

    saveAccounts(accounts) {
        logger.info('Saving accounts');

        this.accounts = accounts;
        this.save('accounts');
    },

    saveNetworks(networks) {
        logger.info('Saving networks', networks);

        this.networks = networks;
        this.save('networks');
    },

    getNetworks() {
        return this.networks;
    },

    saveSelectedChain(chainOpts) {
        logger.info('Saving selected chain', chainOpts);

        this.selectedChain = chainOpts;
        this.save('selectedChain');
    },

    getSelectedChain() {
        return this.selectedChain;
    },

    saveNodes(nodes) {
        logger.info('Saving nodes', nodes);

        this.nodes = nodes;
        this.save('nodes');
    },

    getNodes() {
        return this.nodes;
    },

    deleteNode(nodeId) {
        logger.info('Deleting node', nodeId);

        delete this.nodes[ nodeId ];
        this.save('nodes');
    },

    saveSelectedNode(nodeId) {
        logger.info('Saving selected node', nodeId);

        this.selectedNode = nodeId;
        this.save('selectedNode');
    },

    getSelectedNode() {
        return this.selectedNode;
    },

    saveAssets(assets) {
        logger.info('Saving assets', assets);

        this.assets = assets;
        this.save('assets');
    },

    getAssets() {
        return this.assets;
    },

    deleteAsset(asset) {
        logger.info('Deleting asset', asset);

        let { network, token } = asset;
        if (!network || !token) return;

        if (network in this.assets && token in this.assets[network]) {
            delete this.assets[network][token];
            this.save('assets');
        }
    },

    saveSelectedToken(token) {
        logger.info('Saving selected token', token);

        this.selectedToken = token;
        this.save('selectedToken');
    },

    getSelectedToken() {
        return this.selectedToken;
    },

    clearAssets() {
        this._resetAssets();
        this._saveAssets();
    },

    saveAssets(assets) {
        this.assets = assets;
        this.save('assets')
    },

    saveLanguage(language) {
        logger.info('Saving language', language);

        this.language = language;
        this.storage.set({ language });
    },

    async getLanguage() {
        if (this.language) {
            return this.language;
        }
        this.language = await this.getStorage('language');
        return this.language;
    },

    saveCurrency(currency) {
        logger.info('Saving currency', currency);

        this.currency = currency;
        this.save('currency');
    },

    getCurrency() {
        return this.currency;
    },

    saveSettings(setting) {
        logger.info('Saving settings', setting);

        this.save('setting');
    },

    getSettings() {
        return this.setting;
    },

    saveRecentRecipients(recentTo) {
        this.recentTo = recentTo;
        this.save('recentTo');
    },

    getRecentRecipients() {
        return this.recentTo;
    },

    clearRecentRecipients() {
        this.recentTo = [];
        this.save('recentTo');
    }
};


export default StorageService;
