import Logger from '@bcbconnect/lib/logger';
import EventEmitter from 'eventemitter3';
import NodeService from '../NodeService';
import StorageService from '../StorageService';
import WalletProvider from './WalletProvider';
import Account from './Account';

import '@bcbconnect/lib/bcbjs';
import { ERRORS, ErrorHandler } from '@bcbconnect/lib/errors';
import { deepCopy } from '@bcbconnect/lib/common';
import { getMainAddress, getChainAddress } from '@bcbconnect/lib/address';
import extensionizer from 'extensionizer';
import UUID from 'uuid/v4';

import {
    APP_STATE,
    ACCOUNT_TYPE,
    CONFIRMATION_TYPE,
    LANGUAGES
} from '@bcbconnect/lib/constants';

const logger = new Logger('WalletService');

// Enable on mainnet
const defaultEnabledAssets = {
    'BCB': {
        icon: 'https://bcbpushsrv.bcbchain.io/public/resource/coin/icon/fae8dd88927ea0ca872a889681cd2902.png'
    },
    'DC': {
        icon: 'https://bcbpushsrv.bcbchain.io/public/resource/coin/icon/ecdba0e2f6615760b196edd49a2f1bf0.png'
    }
};

class Wallet extends EventEmitter {
    constructor() {
        super();

        // Keep on reset
        this.language = false;
        this.state = APP_STATE.UNINITIALISED;

        this.init();
    }

    init() {
        this.reset();

        this._registerListeners();

        this._checkStorage();

        this._setLanguage();
    }

    reset(opts) {
        this.network = false;
        this.chain = false;

        if (!(opts && opts.keepAccounts)) {
            this.accounts = {};
            this.selectedAccount = false;
        }

        if (!(opts && opts.keepAssets)) {
            this.assets = {};
            this.selectedToken = false;
            this.assetsUpdated = false;
            this.currency = false;
        }

        this._timer = {};
        this._shouldPoll = false;

        this.walletProvider = false;

        this.confirmations = [];
        this.popup = false;
    }

    _registerListeners() {
        if (extensionizer.windows.onRemoved === undefined) {
            return;
        }
        // Global window listener, should only be registered once.
        extensionizer.windows.onRemoved.addListener((winId) => {
            if (this.popup && this.popup.id === winId) {
                this.popup = false;
                this.rejectConfirmation();
            }
        });
    }

    async _checkStorage() {
        if (await StorageService.dataExists()) {
            this._setState(APP_STATE.PASSWORD_SET); // initstatus APP_STATE.PASSWORD_SET
        }
    }

    async _setLanguage() {
        const language = await StorageService.getLanguage().catch(err => {});
        this.language = language || 'en-US';
        this.emit('setLanguage', this.language);
    }

    _setState(appState) {
        logger.info(`Setting app state to ${ appState }`);

        if(this.state === appState) {
            return;
        }

        this.state = appState;
        this.emit('setState', appState);

        return appState;
    }

    async _loadSettings() {
        await this._loadChainSettings();
    }

    async _loadAssets() {
        logger.info('Load assets');

        if (!this.network) {
            ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: 'Network not set' });
        }
        const allAssets = StorageService.getAssets();
        if (allAssets[this.network] && Object.keys(allAssets[this.network]).length) {
            this.assets = allAssets[this.network];
        }
        const selectedToken = StorageService.getSelectedToken();
        if (selectedToken) {
            this.selectedToken = selectedToken;
        } else {
            // default token
            let tokenInfo = await NodeService.getTokenInfoOfNetwork(this.network);
            this.selectedToken = tokenInfo.symbol;
            StorageService.saveSelectedToken(this.selectedToken);
        }
        const currency = StorageService.getCurrency();
        if (currency) {
            this.currency = currency;
        }
        logger.info('assets:', this.assets, 'selectedToken:', this.selectedToken, 'currency:', this.currency);
    }

    async _loadChainSettings() {
        NodeService.init();

        let { network, chain } = NodeService.getSelectedChain();

        logger.info(`Load chain: ${network}[${chain}]`);

        // Check and set default network
        if (!network) {
            logger.info('Fallback to default chain');
            await this.selectChain(NodeService.getDefaultChain());
        } else {
            this.network = network;
            this.chain = chain;
        }

        this.emit('setChain', this.getSelectedChain());
        this.emit('setNode', NodeService.getSelectedNode());

        if (WalletProvider.supports(this.network, this.chain)) {
            this.walletProvider = new WalletProvider(this.network, this.chain);
        }
    }

    _loadAccounts() {
        logger.info('Load accounts...');

        this.accounts = {};

        const accounts = StorageService.getAccounts();
        const selectedAccount = StorageService.getSelectedAccount();

        logger.info('Stored accounts:', accounts, 'selected:', selectedAccount);

        // Compute account addresses by current network
        Object.entries(accounts).forEach(([ accountId, account ]) => {
            let accountObj;
            if (account.type === ACCOUNT_TYPE.MNEMONIC) {
                let mnemonic = StorageService.getMnemonic();
                accountObj = new Account(
                    this.network,
                    account.type,
                    mnemonic,
                    account.accountIndex
                );
            } else {
                accountObj = new Account(
                    this.network,
                    account.type,
                    account.privateKey,
                );
            }
            // accountObj.loadCache();
            accountObj.name = account.name;
            this.accounts[ accountId ] = accountObj;
        });
        this.emit('setAccounts', this.getAccounts());

        if (!(selectedAccount in accounts)) {
            ErrorHandler.throwError({ id: ERRORS.DATA_CORRUPT, data: 'Selected account' });
        }
        this.selectedAccount = selectedAccount;
        this.emit('setAccount', this.getAccountDetails(this.selectedAccount));
    }

    // _poll(fn, interval) {
    //     interval = interval || 1000;
    
    //     var checkCondition = function(resolve, reject) {
    //         var result = fn();
    //         if (result) {
    //             resolve(result);
    //         } else {
    //             setTimeout(checkCondition, interval, resolve, reject);
    //         }
    //     };
    
    //     return new Promise(checkCondition);
    // }

    async _pollAccounts() {
        logger.info('Polling ...');
        clearTimeout(this._timer);
        if(!this._shouldPoll) {
            logger.info('Stopped polling');
            return;
        }

        const accounts = Object.values(this.accounts);
        if (accounts.length > 0) {
            this._shouldPoll = false;
        }
        this._timer = setTimeout(() => {
            this._pollAccounts(); // ??TODO repeatedly request
        }, 1000);
    }

    startPolling() {
        logger.info('Started polling');
        logger.info(this.state);

        this._shouldPoll = true;
        this._pollAccounts();
    }

    stopPolling() {
        this._shouldPoll = false;
    }

    async refresh() {
        this.emit('setAccounts', this.getAccounts());
    }

    changeState(appState) {
        const stateAry = [
            APP_STATE.PASSWORD_SET,
            APP_STATE.RESTORING,
            APP_STATE.CREATING,
            APP_STATE.RECEIVE,
            APP_STATE.SEND,
            APP_STATE.TRANSACTIONS,
            APP_STATE.SETTING,
            APP_STATE.READY
        ];
        if(!stateAry.includes(appState)) {
            return logger.error(`Attempted to change app state to ${ appState }. Only 'restoring' and 'creating' is permitted`);
        }

        this._setState(appState);
    }

    async resetState() {
        logger.info('Resetting app state');

        if (!StorageService.hasAccounts) {
            return this._setState(APP_STATE.UNINITIALISED);
        }

        if (!StorageService.ready) {
            return this._setState(APP_STATE.PASSWORD_SET);
        }

        if (!StorageService.hasAccounts && StorageService.ready) {
            return this._setState(APP_STATE.UNLOCKED);
        }

        if (this.confirmations.length > 0) {
            return this._setState(APP_STATE.REQUESTING_CONFIRMATION);
        }

        return this._setState(APP_STATE.READY);
    }

    isReady() {
        return this.state !== APP_STATE.UNINITIALISED
            && this.state !== APP_STATE.PASSWORD_SET;
    }

    checkReadyThrowsError() {
        if (this.state === APP_STATE.UNINITIALISED) {
            ErrorHandler.throwError(ERRORS.NOT_SETUP);
        }
        if (this.state === APP_STATE.PASSWORD_SET) {
            ErrorHandler.throwError(ERRORS.NOT_UNLOCKED);
        }
    }

    async purgeData(password) {
        await StorageService.purge();

        NodeService.reset();
        this.reset();
    }

    async setPassword(password) {
        if(this.state !== APP_STATE.UNINITIALISED && this.state !== APP_STATE.PASSWORD_SET) {
            ErrorHandler.throwError(ERRORS.WRONG_APP_STATE);
        }

        StorageService.authenticate(password);

        await this._loadSettings();

        StorageService.save();

        logger.info('User has set a password');
        this._setState(APP_STATE.UNLOCKED);
        return true;
    }

    async changePassword({ oldPassword, newPassword }) {
        if(!StorageService.ready) {
            ErrorHandler.throwError(ERRORS.NOT_UNLOCKED);
        }

        if (oldPassword !== StorageService.password) {
            ErrorHandler.throwError(ERRORS.WRONG_PASSWORD);
        }

        StorageService.authenticate(newPassword);
        StorageService.save();

        logger.info('User has changed password');
        this.lockWallet();
        return true;
    }

    async unlockWallet(password) {
        logger.info('Unlock wallet');

        if(this.state !== APP_STATE.PASSWORD_SET) {
            logger.error('Attempted to unlock wallet whilst not in PASSWORD_SET state');
            ErrorHandler.throwError(ERRORS.NOT_LOCKED);
        }

        await StorageService.unlock(password).catch(err => {
            logger.error('Failed to unlock wallet:', err);
            ErrorHandler.throwError(ERRORS.WRONG_PASSWORD);
        });

        if(!StorageService.hasAccounts) {
            logger.info('Wallet does not have any accounts');
            this._setState(APP_STATE.UNLOCKED);
            return true;
        }

        await this._loadSettings();

        await this._loadAssets();

        this._loadAccounts();

        if (this.confirmations.length === 0) {
            // this.setCache();
            this._setState(APP_STATE.READY);
        } else {
            this._setState(APP_STATE.REQUESTING_CONFIRMATION);
        }

        return true;
    }

    lockWallet() {
        logger.info('Lock wallet');

        StorageService.lock();
        this.accounts = {};
        this.selectedAccount = false;
        this.emit('setAccount', this.getAccountDetails(this.selectedAccount));
        return this._setState(APP_STATE.PASSWORD_SET);
        // return true;
    }

    async _updateWindow() {
        logger.info('Update popup window');
        return new Promise(resolve => {
            if(typeof chrome !== 'undefined') {
                return extensionizer.windows.update(this.popup.id, { focused: true }, window => {
                    resolve(!!window);
                });
            }

            extensionizer.windows.update(this.popup.id, {
                focused: true
            }).then(resolve).catch(() => resolve(false));
        });
    }

    async _openPopup() {
        if(this.popup && await this._updateWindow()) {
            return;
        }

        // Chrome accepts a callback to get details about the created window.
        if(typeof chrome !== 'undefined') {
            let width = 360;
            let height = 600;
            // Chrome may show a different size popup window, tweaks.
            if (window.navigator.userAgent.indexOf('Windows') != -1) {
                width = 372;
                height = 632;
            } else if (window.navigator.userAgent.indexOf('Mac') != -1) {
                height = 620;
            }
            return extensionizer.windows.create({
                url: 'packages/popup/dist/index.html',
                type: 'popup',
                width,
                height,
                left: 80,
                top: 80
            }, window => this.popup = window);
        }

        this.popup = await extensionizer.windows.create({
            url: 'packages/popup/dist/index.html',
            type: 'popup',
            width: 360,
            height: 600,
            left: 80,
            top: 80
        });
    }

    _closePopup() {
        if (!this.popup) {
            return;
        }
        extensionizer.windows.remove(this.popup.id);
        this.popup = false;
    }

    getConfirmations() {
        return this.confirmations;
    }

    async requestLogin() {
        await this._openPopup();
    }

    async queueConfirmation(confirmation, uuid, callback) {
        logger.info(`Queue confirmation ${uuid}`, { ...confirmation, result: '' });

        if (this.confirmations.length > 0) {
            // TODO? A confirmation is pending
        }

        this.confirmations.push({ confirmation, uuid, callback });

        if (this.state !== APP_STATE.REQUESTING_CONFIRMATION) {
            this._setState(APP_STATE.REQUESTING_CONFIRMATION);
        }

        this.emit('setConfirmations', this.confirmations);

        await this._openPopup();
    }

    async acceptConfirmation() {
        logger.info('Accept confirmation');

        if (this.confirmations.length === 0) {
            logger.warn('No confirmation to accept');
            return this._closePopup();
        }

        const {
            confirmation,
            callback,
            uuid
        } = this.confirmations.pop();

        callback({
            success: true,
            data: confirmation.result,
            uuid
        });

        this._closePopup();
        this.resetState();
    }

    async rejectConfirmation(message) {
        logger.info(`Reject confirmation ${message}`);

        if (this.confirmations.length === 0) {
            logger.info('No confirmation to reject');
            return this._closePopup();
        }

        const {
            confirmation,
            callback,
            uuid
        } = this.confirmations.pop();

        callback({
            success: false,
            data: ErrorHandler.newError(ERRORS.REQUEST_DECLINED),
            uuid
        });

        this._closePopup();
        this.resetState();
    }

    _generateAccount() {
        let mnemonic = StorageService.getMnemonic();
        if (!mnemonic) {
            mnemonic = bcbjs.Wallet.createRandom(this.network).mnemonic;
            StorageService.saveMnemonic(mnemonic);
            StorageService.saveAccountIndex(-1);
        }
        let accountIndex = StorageService.getAccountIndex();
        if (!Number.isInteger(accountIndex)) {
            ErrorHandler.throwError({ id: ERRORS.DATA_CORRUPT, data: 'Account index' });
        }
        accountIndex += 1;
        let account = new Account(
            this.network,
            ACCOUNT_TYPE.MNEMONIC,
            mnemonic,
            accountIndex
        );

        StorageService.saveAccountIndex(accountIndex);
        return account;
    }

    _saveAccount(accountId, account) {
        logger.info('Save account', accountId);
        const accounts = StorageService.getAccounts();
        const { type, name, lastUpdated } = account;
        accounts[ accountId ] = {
            type,
            name,
            lastUpdated
        }

        if (type === ACCOUNT_TYPE.MNEMONIC) {
            accounts[ accountId ].accountIndex = account.accountIndex;
        } else {
            accounts[ accountId ].privateKey = account.privateKey;
        }
        StorageService.saveAccounts(accounts);
    }

    /**
     *
     * @param mnemonic
     * @param name
     * @returns {Promise.<boolean>} create an account with mnemonic after confirming by generated mnemonic
     */

    async addAccount(name) {
        logger.info(`Adding account '${ name }' from popup`);

        // if (!this.mnemonic) {
        //     this.mnemonic = StorageService.getMnemonic();
        //     this.accountIndex = StorageService.getAccountIndex();
        // }

        // if(Object.keys(this.accounts).length === 0) {
        //     this.setCache();
        // }
        const account = this._generateAccount();
        account.name = name;

        const accountId = UUID();
        this.accounts[ accountId ] = account;
        this._saveAccount(accountId, account);
        this.emit('setAccounts', this.getAccounts());
        this.selectAccount(accountId);

        return true;
    }
    
    setAccountName({ accountId, name }) {
        if (!(accountId in this.accounts))
            return false;

        this.accounts[ accountId ].name = name;
        this._saveAccount(accountId, this.accounts[ accountId ]);

        if (accountId == this.selectedAccount) {
            this.emit('setAccount', this.getAccountDetails(accountId));
        }
        this.emit('setAccounts', this.getAccounts());
        return true;
    }

    _accountExists(address) {
        let keys = Object.keys(this.accounts);
        for (let i = 0; i < keys.length; i++) {
            if (this.accounts[keys[i]].address === address) {
                return true;
            }
        }
        return false;
    }

    // This and the above func should be merged into one
    /**
     *
     * @param privateKey
     * @param name
     * @returns {Promise.<boolean>}
     */

    async importAccount({ privateKey, name }) {
        logger.info(`Importing account '${ name }' from popup`);

        const account = new Account(
            this.network,
            ACCOUNT_TYPE.PRIVATE_KEY,
            privateKey
        );

        if (this._accountExists(account.address)) {
            ErrorHandler.throwError(ERRORS.ACCOUNT_EXISTS);
        }

        account.name = name;
        // if(Object.keys(this.accounts).length === 0) {
        //     this.setCache();
        // }
        const accountId = UUID();
        this.accounts[ accountId ] = account;
        this._saveAccount(accountId, account);

        this.emit('setAccounts', this.getAccounts());
        this.selectAccount(accountId);
        return true;
    }

    checkMnemonic(mnemonic) {
        return bcbjs.utils.HDNode.isValidMnemonic(mnemonic);
    }

    async importMnemonic({ mnemonic, name }) {
        logger.info(`Importing account '${ name }' from popup`);

        const account = new Account(
            this.network,
            ACCOUNT_TYPE.MNEMONIC,
            mnemonic
        );

        account.name = name;
        // if(Object.keys(this.accounts).length === 0) {
        //     this.setCache();
        // }
        const accountId = UUID();
        this.accounts[ accountId ] = account;
        this._saveAccount(accountId, account);

        StorageService.saveMnemonic(mnemonic);
        StorageService.saveAccountIndex(0);

        this.emit('setAccounts', this.getAccounts());
        this.selectAccount(accountId);
        return true;
    }

    async importJsonWallet({ json, password, name }) {
        logger.info(`Adding account '${ name }' from popup`);
        // if(Object.keys(this.accounts).length === 0) {
        //     this.setCache();
        // }

        let wallet = await bcbjs.Wallet.fromEncryptedJson(json, password);
        const account = new Account(
            wallet.network,
            ACCOUNT_TYPE.PRIVATE_KEY,
            wallet.privateKey,
        );

        if (this._accountExists(account.address)) {
            ErrorHandler.throwError(ERRORS.ACCOUNT_EXISTS);
        }

        account.name = name;

        const accountId = UUID();
        this.accounts[ accountId ] = account;
        this._saveAccount(accountId, account);

        this.emit('setAccounts', this.getAccounts());
        this.selectAccount(accountId);
        return true;
    }

    selectAccount(accountId) {
        // accountId can be false
        logger.info('Select account', accountId);

        this.selectedAccount = accountId;

        StorageService.saveSelectedAccount(accountId);
        this.emit('setAccount', this.getAccountDetails(accountId));

        if (this.state === APP_STATE.UNLOCKED) {
            this._setState(APP_STATE.READY);
        }
        return true;
    }

    getAccounts() {
        const accounts = Object.entries(this.accounts).reduce((accounts, [ accountId, account ]) => {
            accounts[ accountId ] = {
                address: this.getChainAddress(account.address),
                name: account.name,
                type: account.type
            };

            return accounts;
        }, {});
        return accounts;
    }

    async addNetwork(networkInfo) {
        logger.info('Add network', networkInfo);

        let chainOpts = await NodeService.addNetwork(networkInfo);
        await this.selectChain(chainOpts);
        return chainOpts;
    }

    async selectChain(chainOpts) {
        logger.info('Select chain', chainOpts);

        let { network, chain } = chainOpts;
        if (!network) {
            ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: 'No network' });
        }
        if (!chain) {
            chain = network;
        }
        let networkChanged = (network !== this.network);

        try {
            NodeService.init();
            await NodeService.selectChain({ network, chain });

            let tokenSymbol, source;
            let walletProvider = false;
            if (WalletProvider.supports(network, chain)) {
                walletProvider = new WalletProvider(network, chain);
                tokenSymbol = walletProvider.getMainToken();
                source = 'network';
            } else {
                let nodeInfo = await NodeService.getNodeInfo(await NodeService.getSeedNodeUrl(network));
                if (!nodeInfo || !nodeInfo.token || !nodeInfo.token.symbol) {
                    ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: 'No token info' });
                }
                tokenSymbol = nodeInfo.token.symbol;
                // tag as 'user, balance is requested from node
                source = 'user';
            }

            this.reset({ keepAccounts: !networkChanged, keepAssets: !networkChanged });
            this.network = network;
            this.chain = chain;
            this.emit('setChain', { network, chain });
            this.walletProvider = walletProvider;

            if (!(tokenSymbol in this.assets)) {
                logger.info('Add main token', tokenSymbol);
                await this.addAsset(tokenSymbol, { source });
            }
            // select a token as default
            if (!this.selectedToken) {
                this.selectToken(tokenSymbol);
            }

            logger.info(`Selected chain ${this.network}[${this.chain}]`);

            if (await StorageService.dataExists()) {
                if (networkChanged) {
                    this._loadAccounts();
                } else {
                    this.emit('setAccounts', this.getAccounts());
                    this.emit('setAccount', this.getAccountDetails(this.selectedAccount));
                }
            }
            return true;
        } catch(err) {
            // rollback
            await NodeService.selectChain({ network: this.network, chain: this.chain });
            throw err;
        }
    }

    getSelectedChain() {
        if (this.network || this.chain) {
            return { network: this.network, chain: this.chain };
        }
        return NodeService.getDefaultChain();
    }

    async selectNode(nodeID) {
        NodeService.selectNode(nodeID);

        // Object.values(this.accounts).forEach(account => (
        //     account.reset()
        // ));

        const node = NodeService.getSelectedNode();
        this.emit('setNode', node);
        return true;
    }

    async addNode(node) {
        let nodeId = await NodeService.addNode(node);
        return await this.selectNode(nodeId);
    }

    selectToken(symbol) {
        logger.info('Select token', symbol);

        if (!symbol) {
            return false;
        }
        this.selectedToken = symbol;
        StorageService.saveSelectedToken(symbol);
        return true;
    }

    getSelectedToken() {
        return this.selectedToken || '';
    }

    setCurrency(currency) {
        this.currency = currency;
        StorageService.saveCurrency(currency);
        return true;
    }

    getCurrency() {
        return this.currency || '';
    }

    getChainAddress(address) {
        return getChainAddress(address, this.getSelectedChain());
    }

    async getSelectedTokenAddress() {
        let tokenAddress = await NodeService.getTokenAddressBySymbol(this.selectedToken);
        return tokenAddress;
    }

    async getSelectedAccountBalanceFromNode(token) {
        logger.info('Get balance from node');

        let address = this.getSelectedAccountAddress();
        let tokenAddress = await NodeService.getTokenAddressBySymbol(token);

        let value = await NodeService.getBalance(address, tokenAddress);
        return {
            balance: value / 1000000000
        };
    }

    async getSelectedAccountBalanceFromProvider(token) {
        logger.info('Get balance from provider');

        let address = this.getSelectedAccountAddress();
        let tokenAddress = await NodeService.getTokenAddressBySymbol(token);

        let { balance, fiatValue, fees } = await this.walletProvider.getBalance(address, tokenAddress);
        return {
            balance,
            fiatValue,
            fees,
            feeToken: this.walletProvider.getMainToken(),
        };
    }

    async getSelectedAccountBalance(token) {
        logger.info('Get selected account balance');

        if (!token) {
            if (this.selectedToken) {
                token = this.selectedToken;
            } else {
                ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: 'No selected token' });
            }
        }

        let result = {};
        if (this.walletProvider) {
            result = await this.getSelectedAccountBalanceFromProvider(token);
        } else {
            result = await this.getSelectedAccountBalanceFromNode(token);
        }
        // add selected token
        result.token = token;
        return result;
    }

    async getNetworkAssets() {
        logger.info('Get network assets', this.assets);
        
        return this.assets;
    }

    _timeSince(start) {
        let time = new Date().getTime();
        return time - start;
    }

    saveNetworkAssets() {
        logger.info('Saving network assets', this.assets);
        if (!this.network) {
            return false;
        }
        let allAssets = StorageService.getAssets();
        allAssets[this.network] = this.assets;
        StorageService.saveAssets(allAssets);
        return true;
    }

    enableAssets(assets) {
        logger.info('Enable assets:', assets);

        if (!Array.isArray(assets)) {
            ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: 'No asset list' });
        }

        let changed = false;
        let walletAssets = deepCopy(this.assets);
        logger.info('current assets:', walletAssets);
        Object.keys(walletAssets).forEach(key => {
            if (assets.includes(key)) {
                if (walletAssets[key].enabled !== true) {
                    changed = true;
                }
                walletAssets[key].enabled = true;
            } else {
                if (walletAssets[key].enabled !== false) {
                    changed = true;
                }
                walletAssets[key].enabled = false;
            }
        });
        logger.info('new assets:', walletAssets, 'changed:', changed);
        if (changed) {
            this.assets = walletAssets;
            this.saveNetworkAssets();
        }
    }

    async _addAsset(symbol, opts) {
        logger.info('Add asset', symbol, opts);

        if (symbol in this.assets) {
            ErrorHandler.throwError({ id: ERRORS.TOKEN_EXISTS, data: `${symbol} exists` });
        }
        let source = (opts && typeof opts.source !== 'undefined') ? opts.source : 'user';
        let tokenAddress = await NodeService.getTokenAddressBySymbol(symbol);
        this.assets[symbol] = { address: tokenAddress, enabled: true, source };
    }

    async addAsset(symbol, opts) {
        await this._addAsset(symbol, opts);
        this.saveNetworkAssets();
        return true;
    }

    async _updateNetworkAssets() {  
        if (!this.walletProvider) {
            ErrorHandler.throwError(ERRORS.NO_WALLET_PROVIDER);
        }

        let assets = await this.walletProvider.getNetworkAssets();
        Object.keys(assets).forEach(key => {
            assets[key].source = 'network';
        });

        this.assets = assets;
        this.saveNetworkAssets();
    }

    // Get account enabled assets
    async getSelectedAccountAssets() {
        logger.info('Get selected account assets', this.assets);

        const assets = deepCopy(this.assets);
        if (this.walletProvider) {
            let address = this.getSelectedAccountAddress();
            let accountAssets = await this.walletProvider.getAccountAssets(address);

            // console.log('updated assets', accountAssets)
            // console.log('current assets', assets)
            Object.entries(accountAssets).forEach(([ key, value ]) => {
                // keep enabled
                let enabled = assets[key] && assets[key].enabled;
                assets[key] = { ...value };
                assets[key].enabled = enabled;
                if (typeof assets[key].source === 'undefined') {
                    assets[key].source = 'network';
                }
                assets[key].source = 'network';
            });
            // Add default tokens
            if (this.walletProvider.isMainNet) {
                for (let key of Object.keys(defaultEnabledAssets)) {
                    if (!(key in assets)) {
                        assets[key] = {
                            source: 'network',
                            enabled: true
                        }
                    }
                    if (typeof assets[key].icon === 'undefined') {
                        assets[key].icon = defaultEnabledAssets[key].icon;
                    }
                }
            } 
            Object.keys(assets).forEach(key => {
                if (assets[key].source === 'network' && typeof assets[key].balance === 'undefined') {
                    assets[key].balance = 0;
                    assets[key].fiatValue = 0;
                }
            });         
        }

        const enabledAssets = {};
        for (let key of Object.keys(assets)) {
            if (key in defaultEnabledAssets && typeof assets[key].enabled === 'undefined') {
                assets[key].enabled = true;
            }
            if (key === this.selectedToken) {
                assets[key].enabled = true;
            }
            if (assets[key].enabled) {
                if (assets[key].source === 'user') {
                    let result = await this.getSelectedAccountBalanceFromNode(key);
                    assets[key].balance = result.balance;
                }
                enabledAssets[key] = assets[key];
            }
        }

        this.assets = assets;
        this.saveNetworkAssets();
        this.assetsUpdated = new Date().getTime();

        logger.info('enabled assets:', enabledAssets);
        logger.info('token:', this.selectedToken)
        return enabledAssets;
    }

    async getSelectedAccountTransactions(opts) {
        let { page, pageSize } = opts;

        if (!this.walletProvider) {
            ErrorHandler.throwError(ERRORS.NO_WALLET_PROVIDER);
        }
        if (!this.selectedToken) {
            ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: 'No selected token' });
        }
        let tokenAddress = await NodeService.getTokenAddressBySymbol(this.selectedToken);

        let address = this.getSelectedAccountAddress();
        let result = await this.walletProvider.getAccountTransactions(address, tokenAddress, page, pageSize);
        // logger.info('transactions:', result);
        return result;
    }

    setSettings(settings) {
        logger.info('Set settings', settings);

        if (!Object.keys(settings).length) {
            StorageService.saveSettings({});
            return true;
        }

        let currentSettings = StorageService.getSettings();
        Object.keys(settings).forEach(key => {
            currentSettings[key] = settings[key];
        });
        StorageService.saveSettings(currentSettings);

        this.emit('setSetting', settings);
        return true;
    }

    getSettings() {
        return StorageService.getSettings();
    }

    setAutoSignSettings(settings) {
        let currentSettings = StorageService.getSettings();
        currentSettings.autoSign = settings;
        StorageService.saveSettings(currentSettings);
    }

    getAutoSignSettings() {
        const currentSettings = StorageService.getSettings();
        // old version has autoConfirm
        let settings = currentSettings.autoSign || currentSettings.autoConfirm;
        if (settings) {
            return settings;
        } else {
            return {
                fromTime: 0,
                duration: 0
            };
        }
    }

    checkAutoSign() {
        const autoSign = this.getAutoSignSettings();
        let nowTime = Date.now();
        return (autoSign.fromTime <= nowTime && nowTime < (autoSign.fromTime + autoSign.duration));
    }

    addToRecentRecipients(address) {
        let recent = StorageService.getRecentRecipients();
        let pos = recent.indexOf(address);
        if (pos >= 0) {
            recent.splice(pos, 1);
        }
        recent.unshift(address);
        if (recent.length > 20) {
            recent.pop();
        }
        StorageService.saveRecentRecipients(recent);
    }

    getRecentRecipients() {
        return StorageService.getRecentRecipients();
    }

    clearRecentRecipients() {
        StorageService.clearRecentRecipients();
        return true; 
    }

    setLanguage(language) {
        if (!LANGUAGES.includes(language)) {
            ErrorHandler.throwError(ERRORS.INVALID_PARAMS);
        }
        StorageService.saveLanguage(language);
        this.language = language;
        this.emit('setLanguage', language);
        return true;
    }

    async getLanguage() {
        const language = await StorageService.getLanguage();
        return language || '';
    }

    getAccount(accountId) {
        return this.accounts[accountId];
    }

    getAccountDetails(accountId) {
        logger.info('Get account details of', accountId);

        if(!accountId) {
            return {
                type: null,
                name: null,
                address: null
            };
        }

        let { type, name, address } = this.accounts[ accountId ];
        address = this.getChainAddress(address);
        return {
            type,
            name,
            address
        };
    }

    getSelectedAccount() {
        return this.selectedAccount || '';
    }

    getSelectedAccountAddress() {
        return this.getChainAddress(this.accounts[this.selectedAccount].address);
    }

    getSelectedAccountDetails() {
        return this.getAccountDetails(this.selectedAccount);
    }

    deleteAccount(accountId) {
        logger.info('Delete account', accountId);

        if (!(accountId in this.accounts)) {
            return false;
        }
        delete this.accounts[ accountId ];
        StorageService.deleteAccount(accountId);

        this.emit('setAccounts', this.getAccounts());

        if(!Object.keys(this.accounts).length) {
            this.selectAccount(false);
            this._setState(APP_STATE.UNLOCKED);
            return true;
        }

        if (accountId === this.selectedAccount) {
            this.selectAccount(Object.keys(this.accounts)[ 0 ]);
        }
        return true;
    }

    async signMessage(message) {
        try {
            let result = await this.accounts[this.selectedAccount].signMessage(message);
            return result;
        } catch (err) {
            ErrorHandler.throwError({ id: ERRORS.INVALID_PARAMS, data: err });
        }
    }

    checkTransactionDefaults(transaction) {
        if (typeof transaction.network === 'undefined') {
            transaction.network = this.network;
        }
        if (typeof transaction.chain === 'undefined' && this.chain) {
            transaction.chain = this.chain;
        }
        if (typeof transaction.version === 'undefined') {
            transaction.version = 2;
        }
        transaction.calls.forEach((call, index) => {
            if (typeof call.type === 'undefined') {
                transaction.calls[index].type = 'standard';
            }
        });
    }

    async signTransaction(transaction) {
        // console.log('tx:', transaction)
        this.checkTransactionDefaults(transaction);
        if (typeof transaction.nonce === 'undefined') {
            let nonce = await NodeService.getTransactionCount(
                                this.getSelectedAccountAddress());
            transaction.nonce = (nonce + 1).toString();
        }

        try {
            let signedTx = await this.accounts[this.selectedAccount].signTransaction(transaction);
            return signedTx;
        } catch (err) {
            ErrorHandler.throwError({ id: ERRORS.INVALID_PARAMS, data: err });
        }
    }

    async sendTransaction(transaction) {
        let signedTx = await this.signTransaction(transaction);
        let txHash = await NodeService.broadcastTransaction(signedTx);
        return txHash;
    }

    async getTransactionForTransfer({ token, to, value, note }) {
        let tokenAddress = await NodeService.getTokenAddressBySymbol(token);

        let val;
        if (typeof value === 'number') {
            val = (value * 1000000000).toFixed().toString();
        } else if (typeof value === 'string') {
            val = (parseFloat(value) * 1000000000).toFixed().toString();
        }

        let tx = {
            version: 2,
            note: note,
            gasLimit: '2500',
            calls: [
                {
                    type: 'standard',
                    contract: tokenAddress,
                    method: 'Transfer(types.Address,bn.Number)',
                    params: [ to, val ]
                }
            ]
        };

        return tx;
    }

    async transfer({ token, to, value, note, history }) {
        let tx = await this.getTransactionForTransfer({ token, to, value, note });
        if (history) {
            this.addToRecentRecipients(to);
        }
        let signedTx = await this.signTransaction(tx);
        let txHash = await NodeService.broadcastTransaction(signedTx);
        return txHash;
    }

    exportAccount() {
        const {
            privateKey
        } = this.accounts[this.selectedAccount];

        return {
            privateKey
        };
    }

    exportMnemonic() {
        return {
            mnemonic: StorageService.getMnemonic(),
            accountIndex: StorageService.getAccountIndex()
        };
    }

    exportJsonWallet() {
        let password = StorageService.password;
        try {
            return this.accounts[this.selectedAccount].exportJsonWallet(password);
        } catch (err) {
            ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: err });
        }
    }

}
export default Wallet;
