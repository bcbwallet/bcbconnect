import EventChannel from '@bcblink/lib/EventChannel';
import Logger from '@bcblink/lib/logger';
import RequestHandler from './handlers/RequestHandler';

import { injectPromise } from '@bcblink/lib/common';
import { ethToBcbAddress, bcbToEthAddress } from '@bcblink/lib/address';

const logger = new Logger('inPageScript');

const inPageScript = {

    _callbacks: {},

    _bindBcbWeb() {
        if(typeof window.bcbWeb !== 'undefined') {
            logger.warn('BcbWeb is already initiated. BcbWeb will overwrite the current instance');
        }

        const bcbWeb = {};
        bcbWeb.ready = false;

        bcbWeb.getBalance = (...args) => (
            this.getBalance(...args)
        );

        bcbWeb.getBalanceBySymbol = (...args) => (
            this.getBalanceBySymbol(...args)
        );

        bcbWeb.requestLogin = (...args) => (
            this.requestLogin(...args)
        );

        bcbWeb.signMessage = (...args) => (
            this.signMessage(...args)
        );

        bcbWeb.signTransaction = (...args) => (
            this.signTransaction(...args)
        );

        bcbWeb.transferToken = (...args) => (
            this.transferToken(...args)
        );

        bcbWeb.sendTransaction = (...args) => (
            this.sendTransaction(...args)
        );

        bcbWeb.broadcastTransaction = (...args) => (
            this.broadcastTransaction(...args)
        );

        bcbWeb.onStateChanged = (callback) => {
            if (callback && typeof callback === 'function') {
                this._callbacks['onStateChanged'] = callback;
            }
        };

        bcbWeb.onAccountChanged = (callback) => {
            if (callback && typeof callback === 'function') {
                this._callbacks['onAccountChanged'] = callback;
            }
        };

        bcbWeb.onChainChanged = (callback) => {
            if (callback && typeof callback === 'function') {
                this._callbacks['onChainChanged'] = callback;
            }
        };

        window.bcbWeb = bcbWeb;
    },

    _bindBcbWebUtils() {
        if(typeof window.bcbWeb === 'undefined') {
            logger.warn('BcbWeb is not ready yet.');
            return;
        }

        const utils = {};

        utils.ethToBcbAddress = (ethAddress, chainOpts) => {
            if (typeof chainOpts === 'undefined' && bcbWeb.selectedChain.network) {
                chainOpts = bcbWeb.selectedChain;
            }
            return ethToBcbAddress(ethAddress, chainOpts)
        };

        utils.bcbToEthAddress = (address, chainOpts) => {
            if (typeof chainOpts === 'undefined' && bcbWeb.selectedChain.network) {
                chainOpts = bcbWeb.selectedChain;
            }
            return bcbToEthAddress(address, chainOpts)
        };

        bcbWeb.utils = utils;
    },

    _bindEventChannel() {
        this.eventChannel = new EventChannel('inPageScript');
        this.request = RequestHandler.init(this.eventChannel);
    },

    _bindEvents() {
        this.eventChannel.on('setAccount', account => {
            this.setAccount(account);
            if (typeof this._callbacks['onAccountChanged'] === 'function') {
                this._callbacks['onAccountChanged'](bcbWeb.selectedAccount);
            }
        });

        this.eventChannel.on('setChain', chain => {
            this.setChain(chain);
            if (typeof this._callbacks['onChainChanged'] === 'function') {
                this._callbacks['onChainChanged'](bcbWeb.selectedChain);
            }
        });
    },

    setVersion(version) {
        bcbWeb.version = version;
    },

    setAccount({ name, address }) {
        let account = {};
        account.name = name;
        account.address = address;
        bcbWeb.selectedAccount = account;

        if (account.address) {
            if (!bcbWeb.ready) {
                bcbWeb.ready = true;
                if (typeof this._callbacks['onStateChanged'] === 'function') {
                    this._callbacks['onStateChanged'](bcbWeb.ready);
                }
            }
        } else {
            if (bcbWeb.ready) {
                bcbWeb.ready = false;
                if (typeof this._callbacks['onStateChanged'] === 'function') {
                    this._callbacks['onStateChanged'](bcbWeb.ready);
                }
            }
        }
    },

    setChain({ network, chain }) {
        let chainInfo = {};
        chainInfo.network = network;
        chainInfo.chain = chain;
        bcbWeb.selectedChain = chainInfo;
    },

    init() {
        this._bindBcbWeb();
        this._bindBcbWebUtils();
        this._bindEventChannel();
        this._bindEvents();

        this.request('init').then(({ version, account, chain }) => {
            if (version)
                this.setVersion(version);
            if (account)
                this.setAccount(account);
            if (chain)
                this.setChain(chain);

            logger.info('BcbWeb initiated');
        }).catch(err => {
            logger.error(`Failed to initialise BcbWeb: ${err}`);
        });
    },

    getBalance(tokenAddress, callback = false) {
        if (!callback)
            return injectPromise(this.getBalance.bind(this), tokenAddress);

        if (!tokenAddress)
            return callback('Invalid token address provided');

        if(!bcbWeb.ready)
            return callback('User has not unlocked wallet');

        this.request('getBalance', tokenAddress).then(balance => {
            callback(null, balance);
        }).catch(err => {
            callback(err);
        });
    },

    getBalanceBySymbol(tokenSymbol, callback = false) {
        if (!callback)
            return injectPromise(this.getBalanceBySymbol.bind(this), tokenSymbol);

        if (!tokenSymbol)
            return callback('Invalid token symbol provided');

        if(!bcbWeb.ready)
            return callback('User has not unlocked wallet');

        this.request('getBalanceBySymbol', tokenSymbol).then(balance => {
            callback(null, balance);
        }).catch(err => {
            callback(err);
        });
    },

    requestLogin(callback = false) {
        if (!callback)
            return injectPromise(this.requestLogin.bind(this));

        this.request('requestLogin').then(() => {
            callback(null, true);
        }).catch(err => {
            callback(err);
        });
    },

    signMessage(message, callback = false) {
        if(!callback)
            return injectPromise(this.signMessage.bind(this), message);

        if(!message)
            return callback('Invalid message provided');

        if(!bcbWeb.ready)
            return callback('User has not unlocked wallet');

        this.request('signMessage', message
        ).then(res => (
            callback(null, res)
        )).catch(err => {
            logger.error(`Failed to sign message: ${err}`);
            callback(err);
        });
    },

    signTransaction(transaction, callback = false) {
        if (!callback)
            return injectPromise(this.signTransaction.bind(this), transaction);

        if(!transaction)
            return callback('Invalid transaction provided');

        if(!bcbWeb.ready)
            return callback('User has not unlocked wallet');

        this.request('signTransaction', transaction).then(signedTransaction => {
            callback(null, signedTransaction);
        }).catch(err => {
            callback(err);
        });
    },

    broadcastTransaction(signedTransaction, callback = false) {
        if (!callback)
            return injectPromise(this.broadcastTransaction.bind(this), signedTransaction);

        if(!signedTransaction)
            return callback('Invalid transaction provided');

        if(!bcbWeb.ready)
            return callback('User has not unlocked wallet');

        this.request('broadcastTransaction', signedTransaction).then(txHash => {
            callback(null, txHash);
        }).catch(err => {
            callback(err);
        });
    },

    transferToken(token, to, value, note = '', callback = false) {
        if (!callback)
            return injectPromise(this.transferToken.bind(this), token, to, value, note);

        if(!token || !to || !value)
            return callback('Invalid parameter provided');

        if(!bcbWeb.ready)
            return callback('User has not unlocked wallet');

        this.request('transferToken', { token, to, value, note }).then(txHash => {
            callback(null, txHash);
        }).catch(err => {
            callback(err);
        });
    },

    sendTransaction(transaction, callback = false) {
        if (!callback)
            return injectPromise(this.sendTransaction.bind(this), transaction);

        if(!transaction)
            return callback('Invalid transaction provided');

        if(!bcbWeb.ready)
            return callback('User has not unlocked wallet');

        this.request('sendTransaction', transaction).then(txHash => {
            callback(null, txHash);
        }).catch(err => {
            callback(err);
        });
    },

};

inPageScript.init();
