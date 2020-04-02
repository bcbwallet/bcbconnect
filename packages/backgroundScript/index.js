import Logger from '@bcblink/lib/logger';
import MessageDuplex from '@bcblink/lib/MessageDuplex';
import NodeService from './services/NodeService';
import StorageService from './services/StorageService';
import WalletService from './services/WalletService';

import { requestHandler } from '@bcblink/lib/common';
import { Base64 } from 'js-base64';
import { CONFIRMATION_TYPE, APP_STATE } from '@bcblink/lib/constants';
import { BackgroundAPI } from '@bcblink/lib/api';
import extensionizer from 'extensionizer';
import axios from 'axios';

const duplex = new MessageDuplex.Host();
const logger = new Logger('backgroundScript');

const backgroundScript = {
    walletService: requestHandler(
        new WalletService()
    ),

    nodeService: requestHandler(NodeService),

    run() {
        // TODO
        StorageService.reset();
        NodeService.reset();

        BackgroundAPI.init(duplex);
        this.bindPopupDuplex();
        this.bindTabDuplex();
        this.bindWalletEvents();
    },

    bindPopupDuplex() {
        // Popup Handling
        duplex.on('popup:connect', () => (
            this.walletService.startPolling()
        ));

        duplex.on('popup:disconnect', () => (
            this.walletService.stopPolling()
        ));

        //refresh the wallet data
        duplex.on('refresh', this.walletService.refresh);

        // Getter methods
        duplex.on('requestState', ({ resolve }) => resolve(
            this.walletService.state
        ));

        // WalletService: Confirmation
        duplex.on('getConfirmations', this.walletService.getConfirmations);
        duplex.on('acceptConfirmation', this.walletService.acceptConfirmation);
        duplex.on('rejectConfirmation', this.walletService.rejectConfirmation);

        // WalletService: BLockchain actions
        duplex.on('sendTransaction', this.walletService.sendTransaction);
        duplex.on('transfer', this.walletService.transfer);

        // WalletService: Account management
        duplex.on('addAccount', this.walletService.addAccount);
        duplex.on('setAccountName', this.walletService.setAccountName);
        duplex.on('selectAccount', this.walletService.selectAccount);
        duplex.on('getSelectedAccount', this.walletService.getSelectedAccount);
        duplex.on('getAccounts', this.walletService.getAccounts);
        duplex.on('getAccountDetails', this.walletService.getAccountDetails);
        duplex.on('importAccount', this.walletService.importAccount);
        duplex.on('checkMnemonic', this.walletService.checkMnemonic);
        duplex.on('importMnemonic', this.walletService.importMnemonic);
        duplex.on('importJsonWallet', this.walletService.importJsonWallet);
        duplex.on('deleteAccount', this.walletService.deleteAccount);
        duplex.on('exportAccount', this.walletService.exportAccount);
        duplex.on('exportMnemonic', this.walletService.exportMnemonic);
        duplex.on('exportJsonWallet', this.walletService.exportJsonWallet);

        // WalletService: State management
        duplex.on('changeState', this.walletService.changeState);
        duplex.on('resetState', this.walletService.resetState);

        // WalletService: Authentication
        duplex.on('setPassword', this.walletService.setPassword);
        duplex.on('changePassword', this.walletService.changePassword);
        duplex.on('unlockWallet', this.walletService.unlockWallet);
        duplex.on('lockWallet', this.walletService.lockWallet);
        duplex.on('purgeData', this.walletService.purgeData);

        // WalletService: Network
        duplex.on('addNetwork', this.walletService.addNetwork);
        duplex.on('selectChain', this.walletService.selectChain);
        duplex.on('getSelectedChain', this.walletService.getSelectedChain);

        // WalletService: Assets
        duplex.on('getSelectedAccountBalance', this.walletService.getSelectedAccountBalance);
        duplex.on('getNetworkAssets', this.walletService.getNetworkAssets);
        duplex.on('enableAssets', this.walletService.enableAssets);
        duplex.on('addAsset', this.walletService.addAsset);
        duplex.on('getSelectedAccountAssets', this.walletService.getSelectedAccountAssets);
        duplex.on('getSelectedAccountTransactions', this.walletService.getSelectedAccountTransactions);
        duplex.on('selectToken', this.walletService.selectToken);
        duplex.on('getSelectedToken', this.walletService.getSelectedToken);
        duplex.on('setCurrency', this.walletService.setCurrency);
        duplex.on('getCurrency', this.walletService.getCurrency);

        // NodeService: Node management
        duplex.on('getNetworks', this.nodeService.getNetworks);
        duplex.on('deleteNetwork', this.nodeService.deleteNetwork);
        duplex.on('getChainsOfNetwork', this.nodeService.getChainsOfNetwork);
        duplex.on('getNodes', this.nodeService.getNodes);
        duplex.on('getNodeInfo', this.nodeService.getNodeInfo);
        duplex.on('addNode', this.nodeService.addNode);
        duplex.on('deleteNode', this.nodeService.deleteNode);
        duplex.on('resetNodes', this.nodeService.fallbackToDefaultNodes);
        duplex.on('selectNode', this.nodeService.selectNode);
        duplex.on('getSelectedNode', this.nodeService.getSelectedNode);
        duplex.on('getTokenAddress', this.nodeService.getTokenAddressBySymbol);

        // Language
        duplex.on('getLanguage', this.walletService.getLanguage);
        duplex.on('setLanguage', this.walletService.setLanguage);

        // Settings
        duplex.on('getAutoSignSettings', this.walletService.getAutoSignSettings);
        duplex.on('setAutoSignSettings', this.walletService.setAutoSignSettings);
        duplex.on('getSettings', this.walletService.getSettings);
        duplex.on('setSettings', this.walletService.setSettings);

        // Recent recipient address
        duplex.on('getRecentRecipients', this.walletService.getRecentRecipients);
        duplex.on('clearRecentRecipients', this.walletService.clearRecentRecipients);
    },

    bindTabDuplex() {
        duplex.on('tabRequest', async ({ hostname, resolve, data: { action, data, uuid } }) => {
            // Abstract this so we can just do resolve(data) or reject(data)
            // and it will map to { success, data, uuid }

            switch(action) {
            case 'init': {
                let response = {};
                const version = extensionizer.runtime.getManifest().version;
                const account = this.walletService.getSelectedAccount();
                const chain = this.walletService.getSelectedChain();
                response.version = version;
                response.account = account;
                response.chain = chain;

                resolve({
                    success: true,
                    data: response,
                    uuid
                });

                break;
            } case 'getBalance': {
                let tokenAddress = data;

                let success;
                try {
                    const account = this.walletService.getSelectedAccount();

                    let balance = await NodeService.getBalance(account.address, tokenAddress);
                    // logger.info(balance)
                    success = true;
                    data = balance;
                } catch (err) {
                    success = false;
                    data = err.message;
                }
                resolve({ success, data, uuid });

                break;
            } case 'getBalanceBySymbol': {
                let symbol = data;

                let success;
                try {
                    const account = this.walletService.getSelectedAccount();

                    let tokenAddress = await NodeService.getTokenAddressBySymbol(symbol);
                    let balance = await NodeService.getBalance(account.address, tokenAddress);
                    // logger.info(balance)
                    success = true;
                    data = balance;
                } catch (err) {
                    success = false;
                    data = err.message;
                }
                resolve({ success, data, uuid });

                break;
            } case 'requestLogin': {
                await this.walletService.requestLogin();

                resolve({
                    success: true,
                    data: true,
                    uuid 
                });

                break;
            } case 'signMessage': {
                try {
                    const account = this.walletService.getSelectedAccount();

                    let result = await this.walletService.signMessage(data);
                    let { signature, pubkey } = result;

                    if (this.walletService.checkAutoSign()) {
                        return resolve({
                            success: true,
                            data: { signature, pubkey },
                            uuid
                        });
                    }

                    this.walletService.queueConfirmation({
                        type: CONFIRMATION_TYPE.STRING,
                        hostname,
                        account: account.name,
                        result: { signature, pubkey },
                        input: data,
                    }, uuid, resolve);
                } catch (err) {
                    logger.error(`Failed to sign message: ${err}`);
                    return resolve({
                        success: false,
                        data: err.message,
                        uuid
                    });
                }

                break;
            } case 'signTransaction': {
                let transaction = data;

                try {
                    const account = this.walletService.getSelectedAccount();

                    this.walletService.checkTransactionDefaults(transaction);
                    let signedTx = await this.walletService.signTransaction(transaction);
                    // logger.info(signedTx);

                    if (this.walletService.checkAutoSign()) {
                        return resolve({
                            success: true,
                            data: signedTx,
                            uuid
                        });
                    }

                    transaction.cost = await NodeService.getTransactionCost(transaction.calls);

                    this.walletService.queueConfirmation({
                        type: CONFIRMATION_TYPE.TRANSACTION,
                        hostname,
                        account: account.name,
                        result: signedTx,
                        input: transaction,
                    }, uuid, resolve);
                } catch (err) {
                    logger.error(`Failed to sign transaction: ${err}`);
                    return resolve({
                        success: false,
                        data: err.message,
                        uuid
                    });
                }

                break;
            } case 'sendTransaction': {
                let transaction = data;

                try {
                    const account = this.walletService.getSelectedAccount();

                    this.walletService.checkTransactionDefaults(transaction);
                    let signedTx = await this.walletService.signTransaction(transaction);
                    // logger.info(signedTx);

                    let send = (async function(tx, callback) {
                        let success, data;
                        try {
                            let txHash = await NodeService.broadcastTransaction(tx);
                            success = true;
                            data = txHash;
                        } catch (err) {
                            logger.error(`Failed to send transaction: ${err}`);
                            success = false;
                            data = err.message;
                        }
                        return callback({ success, data, uuid });
                    }).bind(this);

                    if (this.walletService.checkAutoSign()) {
                        return send(signedTx, resolve);
                    }

                    transaction.cost = await NodeService.getTransactionCost(transaction.calls);

                    this.walletService.queueConfirmation({
                        type: CONFIRMATION_TYPE.TRANSACTION,
                        hostname,
                        account: account.name,
                        result: signedTx,
                        input: transaction,
                    }, uuid, function(result) {
                        if (result.success) {
                            send(result.data, resolve);
                        } else {
                            resolve(result);
                        }
                    });
                } catch (err) {
                    logger.error(`Failed to sign transaction: ${err}`);
                    return resolve({
                        success: false,
                        data: err.message,
                        uuid
                    });
                }

                break;
            } case 'broadcastTransaction': {
                let signedTx = data;

                let success;
                try {
                    let txHash = await NodeService.broadcastTransaction(signedTx);
                    success = true;
                    data = txHash;
                } catch (err) {
                    logger.error(`Failed to broadcast transaction: ${err}`);
                    success = false;
                    data = err.message;
                }
                resolve({ success, data, uuid });

                break;
            } case 'transferToken': {
                let {
                    token,
                    to,
                    value,
                    note
                } = data;

                try {
                    const account = this.walletService.getSelectedAccount();

                    let transaction = await this.walletService.getTransactionForTransfer({ token, to, value, note });
                    let signedTx = await this.walletService.signTransaction(transaction);
                    // logger.info(signedTx);

                    let send = (async function(signedTx, callback) {
                        let success, data;
                        try {
                            let txHash = await NodeService.broadcastTransaction(signedTx);
                            success = true;
                            data = txHash;
                        } catch (err) {
                            logger.error(`Failed to send transaction: ${err}`);
                            success = false;
                            data = err.message;
                        }
                        return callback({ success, data, uuid });
                    }).bind(this);

                    if (this.walletService.checkAutoSign()) {
                        return send(signedTx, resolve);
                    }

                    transaction.cost = await NodeService.getTransactionCost(transaction.calls);

                    this.walletService.queueConfirmation({
                        type: CONFIRMATION_TYPE.TRANSACTION,
                        hostname,
                        account: account.name,
                        result: signedTx,
                        input: transaction,
                    }, uuid, function(result) {
                        if (result.success) {
                            send(result.data, resolve);
                        } else {
                            resolve(result);
                        }
                    });
                } catch (err) {
                    logger.error(`Failed to transfer token: ${err}`);
                    return resolve({
                        success: false,
                        data: err.message,
                        uuid
                    });
                }

                break;
            } default:
                resolve({
                    success: false,
                    data: 'Unknown method',
                    uuid
                });
                break;
            }
        });
    },

    bindWalletEvents() {
        this.walletService.on('newState', appState => {
            logger.info('newState:', appState);
            BackgroundAPI.setState(appState)
        });

        this.walletService.on('setAccount', account => {
            logger.info('setAccount:', account);
            BackgroundAPI.setAccount(account);
        });

        this.walletService.on('setChain', chain => {
            logger.info('setChain:', chain);
            BackgroundAPI.setChain(chain);
        });

        this.walletService.on('setAccounts', accounts => {
            logger.info('setAccounts:', accounts);
            BackgroundAPI.setAccounts(accounts)
        });

        this.walletService.on('setConfirmations', confirmations => {
            logger.info('setConfirmations:', confirmations);
            BackgroundAPI.setConfirmations(confirmations)
        });
    }
};

backgroundScript.run();
