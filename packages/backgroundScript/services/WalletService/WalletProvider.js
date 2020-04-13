import Logger from '@bcblink/lib/logger';
import axios from 'axios';
import StorageService from '../StorageService';
import { ERRORS, ErrorHandler } from '@bcblink/lib/errors';

const logger = new Logger('WalletProvider');

const providedNetworks = {
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

const walletAppId = '100';

class WalletProvider {

    constructor(network, chain) {
        logger.info('New WalletProvider', network, chain);
        if (network in providedNetworks) {
            this.network = network;
            this.provider = providedNetworks[this.network];
            this.chain = chain;
        } else {
            ErrorHandler.throwError(ERRORS.WRONG_NETWORK_ID);
        }
    }

    static supports(network, chain) {
        return (network in providedNetworks);
    }

    getMainToken() {
        return providedNetworks[this.network].token;
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
                    reject({ code: SERVER_ERROR, data: `HTTP response ${result.status} -- ${url}` })
                }
            }).catch (err => {
                logger.info(`Wallet provider request error: ${err}`);
                reject({ code: ERRORS.NETWORK_ERROR, data: err });
            });
        });
    }

    _checkResultThrowsError(result) {
        if (result.code != 0) {
            ErrorHandler.throwError({ code: result.code, message: result.message, data: result, source: 'provider' });
        }
        if (!result.result) {
            ErrorHandler.throwError({ code: ERRORS.SERVER_ERROR, data: result });
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

    async getAccountAssets(address) {
        logger.info('WalletProvider: Get account assets');

        let currency = StorageService.getCurrency();
        if (!currency) {
            currency = 'USD';
        }
        let url = this.isSideChain ? `${this.provider.url}/${this.chain}` : this.provider.url;
        let coinType = this.provider.coinType;
        let result = await this._request(
            `${url}/api/v2/addrs/balance/${coinType}/${address}/${currency}?appId=${walletAppId}`
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

    async getBalance(address, tokenAddress) {
        logger.info('WalletProvider: Get balance', address, tokenAddress);

        let url = this.isSideChain ? `${this.provider.url}/${this.chain}` : this.provider.url;
        let coinType = this.provider.coinType;
        let result = await this._request(
            `${url}/api/v1/addrs/token_balance/single/${coinType}/${tokenAddress}/${address}?appId=${walletAppId}`
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

