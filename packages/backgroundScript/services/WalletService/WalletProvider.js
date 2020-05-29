import Logger from '@bcbconnect/lib/logger';
import axios from 'axios';
import StorageService from '../StorageService';
import { ERRORS, ErrorHandler } from '@bcbconnect/lib/errors';
import * as Settings from '@bcbconnect/lib/settings';

const logger = new Logger('WalletProvider');

class WalletProvider {

    constructor(network, chain) {
        logger.info('New WalletProvider', network, chain);
        if (network in Settings.PROVIDER_NETWORKS) {
            this.network = network;
            this.provider = Settings.PROVIDER_NETWORKS[this.network];
            this.chain = chain;
        } else {
            ErrorHandler.throwError(ERRORS.WRONG_NETWORK_ID);
        }
    }

    static supports(network, chain) {
        return (network in Settings.PROVIDER_NETWORKS);
    }

    getMainToken() {
        return Settings.PROVIDER_NETWORKS[this.network].token;
    }

    get isMainNet() {
        return this.network === 'bcb';
    }

    get isSideChain() {
        return this.network !== this.chain;
    }

    async _request(url, data = false) {
        return new Promise((resolve, reject) => {
            let axioMethod = data ? axios.post : axios.get;
            axioMethod(url, data).then(result => {
                if (result.status == 200) {
                    resolve(result.data);
                } else {
                    logger.info(`HTTP response ${result.status} -- ${url}`);
                    reject(ErrorHandler.newError({ id: ERRORS.SERVER_ERROR, data: `HTTP response ${result.status} -- ${url}` }));
                }
            }).catch (err => {
                logger.info('Wallet provider request error:', err);
                reject(ErrorHandler.newError({ id: ERRORS.NETWORK_ERROR, data: err }));
            });
        });
    }

    _checkResultThrowsError(result) {
        if (result.code != 0) {
            ErrorHandler.throwError({ code: result.code, message: result.message, data: result, source: 'provider' });
        }
        if (!result.result) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: result });
        }
    }

    async getNetworkAssets() {
        logger.info('WalletProvider: Get network assets');

        let url = this.isSideChain ? `${this.provider.url}/${this.chain}` : this.provider.url;
        let coinType = this.provider.coinType;
        let result = await this._request(
            `${url}/api/v1/assets/${coinType}/0`
        );
        this._checkResultThrowsError(result);

        let assets = {};
        result.result.forEach(item => {
            assets[item.symbol] = {
                name: item.name,
                address: item.conAddr,
                icon: item.coinIcon
            };
        });
        return assets;
    }

    async getAccountAssets(address, currency) {
        logger.info('WalletProvider: Get account assets');

        let url = this.isSideChain ? `${this.provider.url}/${this.chain}` : this.provider.url;
        let coinType = this.provider.coinType;
        let result = await this._request(
            `${url}/api/v2/addrs/balance/${coinType}/${address}/${currency}?appId=${Settings.PROVIDER_APP_ID}`
        );
        this._checkResultThrowsError(result);

        let assets = {};
        result.result.forEach(item => {
            assets[item.symbol] = {
                name: item.name,
                address: item.conAddr,
                icon: item.coinIcon,
                balance: item.balance,
                fiatValue: item.legalValue
            };
        });
        return assets;
    }

    async getBalanceFees(address, tokenAddress, currency) {
        logger.info('WalletProvider: Get balance fees', address, tokenAddress);

        let url = this.isSideChain ? `${this.provider.url}/${this.chain}` : this.provider.url;
        let coinType = this.provider.coinType;
        let result = await this._request(
            `${url}/api/v1/addrs/token_balance/single/${coinType}/${tokenAddress}/${address}?legal=${currency}&appId=${Settings.PROVIDER_APP_ID}`
        );
        // console.log(result)
        this._checkResultThrowsError(result);

        let balance = {
            balance: result.result.balance,
            fiatValue: result.result.legalValue,
            fees: result.result.feeInfos
        }
        // console.log('balance:', balance)
        return balance;
    }

    async getAccountTransactions(address, tokenAddress, page, pageSize) {
        logger.info('WalletProvider: Get account transactions', address, tokenAddress);

        let url = this.isSideChain ? `${this.provider.url}/${this.chain}` : this.provider.url;
        let coinType = this.provider.coinType;
        let result = await this._request(
            `${url}/api/v1/addrs/transactions/${coinType}/${address}?conAddr=${tokenAddress}&page=${page}&count=${pageSize}`
        );
        this._checkResultThrowsError(result);

        return result;
    }
};

export default WalletProvider;

