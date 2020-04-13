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

        bcbWeb.onLanguageChanged = (callback) => {
            if (callback && typeof callback === 'function') {
                this._callbacks['onLanguageChanged'] = callback;
            }
        };

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
        this.eventChannel.on('setLanguage', language => {
            this.setLanguage(language);
        });

        this.eventChannel.on('setState', ready => {
            this.setState(ready);
        });

        this.eventChannel.on('setAccount', account => {
            this.setAccount(account);
        });

        this.eventChannel.on('setChain', chain => {
            this.setChain(chain);
        });
    },

    setVersion(version) {
        bcbWeb.version = version;
    },

    setLanguage(language) {
        bcbWeb.language = language;

        if (typeof this._callbacks['onLanguageChanged'] === 'function') {
            this._callbacks['onLanguageChanged'](language);
        }
    },

    setState(ready) {
        if (bcbWeb.ready == ready) {
            return;
        }
        bcbWeb.ready = ready;

        if (typeof this._callbacks['onStateChanged'] === 'function') {
            this._callbacks['onStateChanged'](ready);
        }
    },

    setAccount(account) {
        bcbWeb.selectedAccount = account;

        if (typeof this._callbacks['onAccountChanged'] === 'function') {
            this._callbacks['onAccountChanged'](account);
        }
    },

    setChain(chainOpts) {
        bcbWeb.selectedChain = chainOpts;

        if (typeof this._callbacks['onChainChanged'] === 'function') {
            this._callbacks['onChainChanged'](chainOpts);
        }
    },

    init() {
        this._bindBcbWeb();
        this._bindBcbWebUtils();
        this._bindEventChannel();
        this._bindEvents();

        this.request('init').then(({ version, language, ready, account, chain }) => {
            if (version) {
                this.setVersion(version);
            }
            if (language) {
                this.setLanguage(language);
            }
            if (ready) {
                this.setState(ready);
            }
            if (account) {
                this.setAccount(account);
            }
            if (chain) {
                this.setChain(chain);
            }

            logger.info('BcbWeb initiated');
        }).catch(err => {
            logger.error('Failed to initialise BcbWeb:', err);
        });
    },

    getBalance(tokenAddress, callback = false) {
        if (!callback) {
            return injectPromise(this.getBalance.bind(this), tokenAddress);
        }

        this.request('getBalance', tokenAddress).then(balance => {
            callback(null, balance);
        }).catch(err => {
            callback(err);
        });
    },

    getBalanceBySymbol(tokenSymbol, callback = false) {
        if (!callback) {
            return injectPromise(this.getBalanceBySymbol.bind(this), tokenSymbol);
        }

        this.request('getBalanceBySymbol', tokenSymbol).then(balance => {
            callback(null, balance);
        }).catch(err => {
            callback(err);
        });
    },

    requestLogin(callback = false) {
        if (!callback) {
            return injectPromise(this.requestLogin.bind(this));
        }

        this.request('requestLogin').then(success => {
            callback(null, success);
        }).catch(err => {
            callback(err);
        });
    },

    signMessage(message, callback = false) {
        if(!callback) {
            return injectPromise(this.signMessage.bind(this), message);
        }

        this.request('signMessage', message).then(result => (
            callback(null, result)
        )).catch(err => {
            callback(err);
        });
    },

    signTransaction(transaction, callback = false) {
        if (!callback) {
            return injectPromise(this.signTransaction.bind(this), transaction);
        }

        this.request('signTransaction', transaction).then(signedTransaction => {
            callback(null, signedTransaction);
        }).catch(err => {
            callback(err);
        });
    },

    broadcastTransaction(signedTransaction, callback = false) {
        if (!callback) {
            return injectPromise(this.broadcastTransaction.bind(this), signedTransaction);
        }

        this.request('broadcastTransaction', signedTransaction).then(txHash => {
            callback(null, txHash);
        }).catch(err => {
            callback(err);
        });
    },

    transferToken(token, to, value, note = '', callback = false) {
        if (!callback) {
            return injectPromise(this.transferToken.bind(this), token, to, value, note);
        }

        this.request('transferToken', { token, to, value, note }).then(txHash => {
            callback(null, txHash);
        }).catch(err => {
            callback(err);
        });
    },

    sendTransaction(transaction, callback = false) {
        if (!callback) {
            return injectPromise(this.sendTransaction.bind(this), transaction);
        }

        this.request('sendTransaction', transaction).then(txHash => {
            callback(null, txHash);
        }).catch(err => {
            callback(err);
        });
    },

};

inPageScript.init();
