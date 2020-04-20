import StorageService from '../StorageService';
import Logger from '@bcblink/lib/logger';
import { ERRORS, ErrorHandler } from '@bcblink/lib/errors';

import '@bcblink/lib/bcbjs';

import {
    ACCOUNT_TYPE
} from '@bcblink/lib/constants';

const logger = new Logger('WalletService/Account');

class Account {
    constructor(network, accountType, importData, accountIndex = 0) {
        this.network = network;
        this.type = accountType;
        this.accountIndex = accountIndex;

        this.address = false;
        this.name = false;
        this.lastUpdated = 0;

        if(accountType == ACCOUNT_TYPE.MNEMONIC) {
            this._importMnemonic(importData, accountIndex);
        } else{
            this._importPrivateKey(importData);
        }
        // this.loadCache();
    }

    _importMnemonic(mnemonic, accountIndex) {
        if (!this.network) {
            ErrorHandler.throwError({ id: ERRORS.INVALID_PARAMS, data: 'Network not set' });
        }
        try {
            // this.mnemonic = mnemonic;
            let path = "m/44'/60'/0'/0/" + accountIndex.toString();
            let wallet = bcbjs.Wallet.fromMnemonic(this.network, mnemonic, path);
            this.privateKey = wallet.privateKey;
            this.address = wallet.address;
        } catch (err) {
            ErrorHandler.throwError(ERRORS.INVALID_MNEMONIC);
        }
    }

    _importPrivateKey(privateKey) {
        if (!this.network) {
            ErrorHandler.throwError({ id: ERRORS.INVALID_PARAMS, data: 'Network not set' });
        }
        try {
            this.privateKey = privateKey;
            let wallet = new bcbjs.Wallet(privateKey, this.network);
            this.address = wallet.address;
        } catch (err) {
            ErrorHandler.throwError(ERRORS.INVALID_PRIVATE_KEY);
        }
    }

    loadCache() {
        if(!StorageService.hasAccount(this.address)) {
            logger.warn('Attempted to load cache for an account that does not exist');
            return;
        }

        const {
            network,
            // For backward compatibility
            chainId,
            type,
            name,
            lastUpdated
        } = StorageService.getAccount(this.address);

        this.network = network || chainId;
        this.type = type;
        this.name = name;
        this.lastUpdated = lastUpdated;
    }

    // matches(accountType, importData) {
    //     if(this.type !== accountType)
    //         return false;

    //     if(accountType == ACCOUNT_TYPE.MNEMONIC && this.mnemonic === importData)
    //         return true;

    //     if(accountType == ACCOUNT_TYPE.PRIVATE_KEY && this.privateKey === importData)
    //         return true;

    //     return false;
    // }

    reset() {
    }

    getEthAddress() {
        let ethAddress = bcbjs.utils.getEthAddressByAddress(this.network, this.address);
        return ethAddress;
    }

    getDetails() {
        return {
            network: this.network,
            type: this.type,
            name: this.name,
            address: this.address,
            lastUpdated: this.lastUpdated
        };
    }

    export() {
        return JSON.stringify(this);
    }

    save() {
        StorageService.saveAccount(this);
    }

    async exportJsonWallet(password) {
        let wallet = new bcbjs.Wallet(this.privateKey, this.network);
        return wallet.encrypt(password);
    }

    async signMessage(message) {
        let wallet = new bcbjs.Wallet(this.privateKey, this.network);
        let pubkey = wallet.publicKey;
        let signature = await wallet.signMessage(message);
        return { signature, pubkey };
    }

    async signTransaction(transaction) {
        let wallet = new bcbjs.Wallet(this.privateKey, this.network);
        if (typeof transaction.network === 'undefined') {
            transaction.network = this.network;
        }
        return wallet.sign(transaction);
    }
}

export default Account;
