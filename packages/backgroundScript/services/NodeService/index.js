import Logger from '@bcbconnect/lib/logger';
import StorageService from '../StorageService';
import UUID from 'uuid/v4';
import { Base64 } from 'js-base64';
import { sha3_256 } from 'js-sha3';
import axios from 'axios';

import { hexlify, arrayify, concat } from '@bcbconnect/lib/bytes';
import { deepCopy, sleep } from '@bcbconnect/lib/common';
import { ERRORS, ErrorHandler } from '@bcbconnect/lib/errors';
import * as Settings from '@bcbconnect/lib/settings';

const logger = new Logger('NodeService');

const NodeService = {
    // keep on reset
    networks: {},

    init() {
        logger.info('init');

        if (!this.ready) {
            this.reset();
            this._read();

            this.ready = true;
        }
    },

    reset() {
        logger.info('reset');

        this.network = false;
        this.chain = false;

        // nodes of current chain and all custom nodes
        this.nodes = {};
        this.selectedNode = false;
        this.updatingNode = false;
        this.nodeStats = {};

        this._resetCache();
        this._resetNodeCache();
    },

    _resetCache() {
        logger.info('reset cache');

        this.cache = {
            tokenAddress: {},
            tokenSymbol: {}
        };
    },

    _read() {
        logger.info('Reading from storage');

        if (!StorageService.ready) {
            logger.error('Storage is not ready');
            return;
        }

        const networks = StorageService.getNetworks();
        console.log('networks from storage', networks)
        this.networks = Object.keys(networks).length ? networks : deepCopy(Settings.PUBLIC_NETWORKS);

        let chainOpts = StorageService.getSelectedChain();
        // migrating data from version 1.0
        if (typeof chainOpts === 'string') {
            chainOpts = { network: 'bcb', chain: chainOpts };
        }
        let { network, chain } = chainOpts;
        if (network) {
            this.network = network;
            this.chain = chain;
        }

        const nodes = StorageService.getNodes();
        // migrating data from version 1.0
        if (Object.keys(nodes).length) {
            Object.entries(nodes).forEach(([ nodeId, node ]) => {
                let url = node.url || node.host; 
                if (url) {
                    nodes[nodeId].url = url;
                }
                if (node.chainId === undefined) {
                    nodes[nodeId].chainId = this.getChainId();
                }
                if (node.source === undefined) {
                    nodes[nodeId].source = 'network';
                }
            });
            this.nodes = nodes;
        }

        const selectedNode = StorageService.getSelectedNode();
        if (selectedNode) {
            this.selectedNode = selectedNode;
        }

        if (this.network && !this.chain && !this.selectedNode) {
            this.fallbackToDefaultNodes();
        }
    },

    _saveTokenAddressCache(key, value) {
        this.cache.tokenAddress[key] = value;
    },

    _getTokenAddressCache(key) {
        if (this.cache.tokenAddress && this.cache.tokenAddress.hasOwnProperty(key)) {
            return this.cache.tokenAddress[key];
        }
    },

    _saveTokenSymbolCache(key, value) {
        this.cache.tokenSymbol[key] = value;
    },

    _getTokenSymbolCache(key) {
        if (this.cache.tokenSymbol && this.cache.tokenSymbol.hasOwnProperty(key)) {
            return this.cache.tokenSymbol[key];
        }
    },

    _resetNodeCache() {
        this.nodeCache = {};
    },

    _saveNodeCache(key, value) {
        this.nodeCache[key] = value;
    },

    _getNodeCache(key) {
        if (this.nodeCache && this.nodeCache.hasOwnProperty(key)) {
            return this.nodeCache[key];
        }
    },

    getChainId() {
        let chainId = this.network;
        if (this.chain && this.chain != this.network) {
            chainId += '[' + this.chain + ']';
        }
        return chainId;
    },

    _isSideChain() {
        return (this.network && this.chain && this.network !== this.chain);
    },

    _splitChainId(chainId) {
        if (chainId) {
            let splits = chainId.split(/[\[\]]/);
            if (splits.length >= 2) {
                return { network: splits[0], chain: splits[1] };
            } else {
                return { network: splits[0], chain: splits[0] };
            }
        }
        ErrorHandler.throwError({ id: ERRORS.WRONG_CHAIN_ID, data: chainId });
    },

    async _updateChainsOfNetwork(network) {
        logger.info(`update chains of network ${network}`);

        let nodeUrl = this.networks[network].urls[0];
        let chainIds = await this.getChainIds(nodeUrl);
        let chains = [];

        chainIds.forEach((chainId, index) => {
            let { network, chain } = this._splitChainId(chainId);
            if (index === 0) {
                chains.push(network);
            }
            chains.push(chain);
        });
        logger.info(`chains: ${chains}`);
        chains = chains.filter(chain => !(Settings.DISABLED_CHAINS.includes(chain)));
        if (chains.length > 0) {
            this.networks[network].chains = chains;
            this.saveNetworks();
        }
    },

    async _updateNodes() {
        logger.info(`Update nodes for ${this.network}[${this.chain}]`);

        if (this.updatingNode) {
            return;
        }
        this.updatingNode = true;
        try {
            let nodeUrl = await this.getSeedNodeUrl(this.network);
            let chainId = this.getChainId();
            let urls = await this.getNodeUrls(nodeUrl, chainId);
            if (!Array.isArray(urls)) {
                ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: `Got no node for ${chainId}` });
            }

            let keepSelected = false;
            Object.entries(this.nodes).forEach(([ nodeId, node ]) => {
                // keep selected, overide default source
                if (node.chainId === chainId && nodeId === this.selectedNode) {
                    keepSelected = true;
                    if (node.source === 'default') {
                        this.nodes[nodeId].source = 'network';
                    }
                }
                // keep user nodes
                if (node.chainId !== chainId && node.source !== 'user') {
                    delete this.nodes[nodeId];
                }
            });
            // remove duplicated
            if (keepSelected) {
                let index = urls.indexOf(this.nodes[this.selectedNode].url);
                if (index >= 0) {
                    urls.splice(index, 1);
                }
            }
            urls.forEach((url) => {
                this._addNode({ url, chainId: this.getChainId(), source: 'network' });
            });
            this.saveNodes();

            if (!keepSelected) {
                await this._autoSelectNode();
            }

            this.updatingNode = false;
        } catch (err) {
            this.updatingNode = false;
            throw err;
        }
    },

    async _autoSelectNode() {
        logger.info('Auto select node');

        let chainId = this.getChainId();
        for (const id in this.nodes) {
            if (this.nodes[id].chainId === chainId) {
                return this.selectNode(id);
            }
        }
    },

    _switchNode() {
        logger.info('Switch node in', this.nodes);

        if (this.updatingNode) {
            return;
        }
        if (!this.nodes) {
            return false;
        }
        if (!this.selectedNode) {
            return this._autoSelectNode();
        }
        const ids = Object.keys(this.nodes);
        for (let i = 0; i < ids.length; i++) {
            if (this.selectedNode == ids[i]) {
                let next = (i == ids.length - 1) ? 0 : i + 1;
                return this.selectNode(ids[next]);
            }
        }
    },

    getDefaultChain() {
        let keys = Object.keys(Settings.PUBLIC_NETWORKS);
        let network = keys[0];
        let chain = Settings.PUBLIC_NETWORKS[network].chains[0];
        return { network, chain };
    },

    isPublicNetwork(network) {
        return (network in Settings.PUBLIC_NETWORKS);
    },

    async addNetwork(networkInfo) {
        logger.info('Add network', networkInfo); 

        let { name, url, chainId } = networkInfo;
        if (!name || !url) {
            ErrorHandler.throwError({ id: ERRORS.INVALID_PARAMS, data: networkInfo });
        }
        let nodeInfo = await this.getNodeInfo(url);
        logger.info('Node info:', nodeInfo);
        if (chainId && chainId != nodeInfo.chainId) {
            ErrorHandler.throwError(ERRORS.WRONG_CHAIN_ID);
        }
        let { network, chain } = this._splitChainId(nodeInfo.chainId);
        logger.info(`network: ${network}, chain: ${chain}`);

        if (nodeInfo.isSideChain) {
            url = nodeInfo.mainUrls[0];
        }
        // Allow override, server ip/domain may change. In this case users must re-add network
        // if (this.networks && this.networks.hasOwnProperty(network)) {
        //     ErrorHandler.throwError(ERRORS.NETWORK_EXISTS);
        // }
        this.networks[network] = { name, urls: [ url ] };

        this.saveNetworks();
        
        return { network, chain };
    },

    deleteNetwork(networkId) {
        delete this.networks[networkId];
        this.saveNetworks();
    },

    async selectChain({ network, chain }) {
        logger.info(`Select chain ${network}[${chain}]`);

        if (this.network !== network || this.chain !== chain) {
            this.network = network;
            this.chain = chain;
            StorageService.saveSelectedChain({ network, chain });

            this._resetCache();
        }

        await this._updateNodes().catch(err => {
            if (chain == this.getMainChainId(this.network)) {
                return this.fallbackToDefaultNodes();
            }
            throw err;
        });
    },

    getSelectedChain() {
        return { network: this.network, chain: this.chain };
    },

    saveNetworks() {
        StorageService.saveNetworks(this.networks);
    },

    getNetworks() {
        // return Object.keys(this.networks);
        logger.info('networks:', this.networks);

        if (!this.networks || !Object.keys(this.networks).length) {
            this.networks = deepCopy(Settings.PUBLIC_NETWORKS);
        }

        let networks = {};
        Object.entries(this.networks).forEach(([ networkId, network ]) => {
            let { name, chains } = network;
            networks[networkId] = { name, chains, public: network.public };
        });
        return networks;
    },

    async getChainsOfNetwork(network) {
        logger.info(`Get chains of network ${network}`);

        if (!(network in this.networks)) {
            ErrorHandler.throwError({ id: ERRORS.WRONG_NETWORK_ID, data: `Unknown network ${network}` });
        }
        await this._updateChainsOfNetwork(network).catch(err => {
            logger.error(`Failed to update chains of network ${network}:`, err);
        });

        return this.networks[network].chains;
    },

    saveNodes() {
        let nodes = this.nodes;
        Object.entries(nodes).forEach(([ nodeId, node ]) => {
            let { url, chainId, source } = node;
            nodes[nodeId] = { url, chainId, source };
        });
        StorageService.saveNodes(nodes);
    },

    getNodes() {
        let chainId = this.getChainId();
        let nodes = {};
        Object.entries(this.nodes).forEach(([ nodeId, node ]) => {
            if (node.chainId === chainId) {
                nodes[nodeId] = node;
            }
        });
        let result = {
            nodes,
            selected: this.selectedNode
        };
        logger.info('getNodes', result);
        return result;
    },

    selectNode(nodeId) {
        logger.info(`Select node: ${nodeId}`);

        this._resetNodeCache();

        if (this.nodes.hasOwnProperty(nodeId)) {
            this.selectedNode = nodeId;

            StorageService.saveSelectedNode(this.selectedNode);
            return true;
        }
        return false;
    },

    getSelectedNode() {
        if (this.selectedNode) {
            return this.nodes[ this.selectedNode ];
        }
    },

    _addNode(node) {
        const nodeId = UUID();
        this.nodes[ nodeId ] = {
            ...node
        };
        return nodeId;
    },

    _saveNode(node) {
        let nodeId = this._addNode(node);
        this.saveNodes();
        return nodeId;
    },

    async addNode(node) {
        if (!this.network) {
            return this._saveNode(node);
        }
        let chainId = this.getChainId();
        // let nodeInfo = await this.getNodeInfo(node.url);
        // if (chainId !== nodeInfo.chainId) {
        //     ErrorHandler.throwError(ERRORS.WRONG_CHAIN_ID);
        // }
        node = { ...node, chainId, source: 'user' };
        this._saveNode(node);
    },

    deleteNode(nodeId) {
        if (nodeId === this.selectedNode) {
            ErrorHandler.throwError({ id: ERRORS.INVALID_PARAMS, data: 'Cannot delete selected node' });
        }
        delete this.nodes[ nodeId ];
        this.saveNodes();
        return true;
    },

    getMainChainId(network) {
        return network;
    },

    getDefaultNodeUrl(networkId) {
        if (!(networkId in Settings.PUBLIC_NETWORKS)) {
            ErrorHandler.throwError({ id: ERRORS.WRONG_NETWORK_ID, data: `No default node for ${networkId}` });
        }
        return Settings.PUBLIC_NETWORKS[networkId].urls[0];
    },

    async getSeedNodeUrl(network) {
        logger.info('Get seed node for network ', this.getChainId());

        if (network in this.networks) {
            let url = this.networks[network].urls[0];
            if (!this._isSideChain()) {
                return url;
            } else {
                let urls = await this.getNodeUrls(url, this.getChainId());
                let nodeInfo = await this.getNodeInfo(urls[0]);
                if (!nodeInfo.mainUrls || !nodeInfo.mainUrls.length) {
                    ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: 'No mainUrls' });
                }
                return nodeInfo.mainUrls[0];
            }
        }

        logger.info('networks:', this.networks);
        ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: `Out of band network: ${network}` });
    },

    fallbackToDefaultNodes() {
        logger.info('Fallback to default nodes');

        let chainId = this.getChainId();
        let url = this.getDefaultNodeUrl(chainId);
        if (url) {
            let nodeId = UUID();
            // nodes cleared
            this.nodes = {};
            this.nodes[nodeId] = {
                url,
                chainId,
                source: 'default'
            }
            this.saveNodes();
            this.selectNode(nodeId);
        } else {
            logger.warn(`No default node for network: ${this.network}`);
        }
    },

    _nodeError(error) {
        let { code, message, data } = error;
        return { code, message, data, source: 'node' };
    },

    _nodeTxError(error) {
        let { code, log } = error;
        return { code, message: log, data: error, source: 'node:tx' };
    },

    _checkResponseThrowsError(resp) {
        if (resp.error) {
            ErrorHandler.throwError(this._nodeError(resp.error));
        }
        if (!resp.result) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
    },

    _getSelectedNodeUrl() {
        if (!this.selectedNode) {
            ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: 'No node selected' });
        }
        if (!this.nodes[this.selectedNode] || !this.nodes[this.selectedNode].url) {
            ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: 'No node url' });
        }
        return this.nodes[this.selectedNode].url;
    },

    _setNodeStats(url, key, value) {
        if (this.nodeStats[url]) {
            this.nodeStats[url][key] = value;
        }
    },

    _getNodeStats(url, key) {
        if (this.nodeStats[url]) {
            return this.nodeStats[url][key];
        }
    },

    async _request(url, data = false) {
        // logger.info(`request ${url}`);
        return new Promise((resolve, reject) => {
            let axioMethod = data ? axios.post : axios.get;
            axioMethod(url, data).then(resp => {
                if (resp.status == 200) {
                    resolve(resp.data);
                } else {
                    logger.info(`HTTP response ${resp.status} -- ${url}`);
                    reject(ErrorHandler.newError({ id: ERRORS.SERVER_ERROR, data: `HTTP response ${resp.status} -- ${url}` }));
                }
            }).catch (err => {
                logger.info('Node request error:', err);
                reject(ErrorHandler.newError({ id: ERRORS.NETWORK_ERROR, data: err }));
            });
        });
    },

    async nodeRequest(path, data = false) {
        let nodeUrl = this._getSelectedNodeUrl();
        let start = Date.now();
        let resp = await this._request(nodeUrl + path, data).catch(err => {
            let failure = this._getNodeStats(nodeUrl, 'failure');
            if (!failure) failure = 0;
            failure++;
            this._setNodeStats(nodeUrl, 'failure', failure);
            if (failure >= 3) {
                this._switchNode();
            }
            ErrorHandler.throwError(err);
        });
        this._setNodeStats(nodeUrl, 'latency', Date.now() - start);
        if (!resp) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: 'No response from node' });
        }
        return resp;
    },

    async getNodeInfo(nodeUrl) {
        logger.info(`Get node info of ${nodeUrl}`);

        // let nodeInfo = this._getNodeCache('nodeInfo');
        // if (nodeInfo) {
        //     return nodeInfo;
        // }
        let resp = await this._request(
            nodeUrl + '/genesis'
        );
        this._checkResponseThrowsError(resp);

        let result = resp.result;
        if (!result.genesis
            || !result.genesis.app_state.token) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
        let nodeInfo = {
            chainId: result.genesis.chain_id,
            token: result.genesis.app_state.token
        };
        let mainUrls;
        if (result.genesis.app_state.mainChain) {
            mainUrls = result.genesis.app_state.mainChain.openUrls;
            nodeInfo.mainUrls = mainUrls;
            nodeInfo.isSideChain = true;
        }
        // this._saveNodeCache('nodeInfo', nodeInfo);
        logger.info('Node info:', nodeInfo);
        return nodeInfo;
    },

    async getTokenInfoOfNetwork(network) {
        logger.info(`Get token info of network ${network}`);

        if (!(network in this.networks)) {
            ErrorHandler.throwError({ id: ERRORS.INTERNEL_ERROR, data: `Unknown network ${network}` });
        }
        let nodeUrl = this.networks[network].urls[0];
        let nodeInfo = await this.getNodeInfo(nodeUrl);
        return nodeInfo.token;
    },

    async getChainIds(nodeUrl) {
        let resp = await this._request(
            nodeUrl + '/abci_query?path="/sidechain/chainid/all"'
        );
        this._checkResponseThrowsError(resp);

        let result = resp.result;
        if (!result.response
            || result.response.code != 200
            || result.response.value === undefined) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
        let value = Base64.decode(result.response.value);
        value = JSON.parse(value);
        // console.log(value)
        return value;
    },

    async getNodeUrls(nodeUrl, chainId) {
        let resp = await this._request(
            nodeUrl + '/abci_query?path="/sidechain/' + chainId + '/openurls"'
        );
        this._checkResponseThrowsError(resp);

        let result = resp.result;
        if (!result.response
            || result.response.code != 200
            || result.response.value === undefined) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
        let value = Base64.decode(result.response.value);
        value = JSON.parse(value);
        // console.log(value)
        return value;
    },

    async getTransactionCount(address) {
        if (!address) {
            ErrorHandler.throwError(ERRORS.INVALID_PARAMS);
        }

        let resp = await this.nodeRequest(
            '/abci_query?path="/account/ex/' + address + '/account"'
        );
        this._checkResponseThrowsError(resp);

        let result = resp.result;
        if (!result.response
            || result.response.code != 200) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
        if (result.response.value === undefined) {
            return 0;
        }
        let value = Base64.decode(result.response.value);
        value = JSON.parse(value);
        // console.log(value)
        return value.Nonce;
    },

    async getBalance(address, tokenAddress) {
        if (!address || !tokenAddress) {
            ErrorHandler.throwError(ERRORS.INVALID_PARAMS);
        }

        let resp = await this.nodeRequest(
            '/abci_query?path="/account/ex/' + address + '/token/' + tokenAddress + '"'
        );
        this._checkResponseThrowsError(resp);

        let result = resp.result;
        if (!result.response
            || result.response.code != 200) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
        if (result.response.value === undefined) {
            return 0;
        }
        let value = Base64.decode(result.response.value);
        value = JSON.parse(value);
        // console.log(value)
        return value.balance;
    },

    async getTokenAddressBySymbol(symbol) {
        if (!symbol) {
            ErrorHandler.throwError(ERRORS.INVALID_PARAMS);
        }

        symbol = symbol.toLowerCase();
        let tokenAddress = this._getTokenAddressCache(symbol);
        if (tokenAddress) {
            return tokenAddress;
        }
        let resp = await this.nodeRequest(
            '/abci_query?path="/token/symbol/' + symbol + '"'
        );
        this._checkResponseThrowsError(resp);

        let result = resp.result;
        if (!result.response
            || result.response.code != 200) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
        if (result.response.value === undefined) {
            ErrorHandler.throwError({ id: ERRORS.INVALID_TOKEN_SYMBOL, data: symbol });
        }

        let value = Base64.decode(result.response.value);
        value = JSON.parse(value);
        // console.log(value)
        this._saveTokenAddressCache(symbol, value);
        return value;
    },

    async getTokenSymbolByAddress(tokenAddress) {
        if (!tokenAddress) {
            ErrorHandler.throwError(ERRORS.INVALID_PARAMS);
        }

        let tokenSymbol = this._getTokenSymbolCache(tokenAddress);
        if (tokenSymbol) {
            return tokenSymbol;
        }
        let resp = await this.nodeRequest(
            '/abci_query?path="/token/' + tokenAddress + '"'
        );
        this._checkResponseThrowsError(resp);

        let result = resp.result;
        if (!result.response
            || result.response.code != 200) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
        if (result.response.value === undefined) {
            ErrorHandler.throwError({ id: ERRORS.INVALID_TOKEN_ADDRESS, data: tokenAddress });
        }

        let value = Base64.decode(result.response.value);
        value = JSON.parse(value);
        tokenSymbol = value.symbol;
        this._saveTokenSymbolCache(tokenAddress, tokenSymbol)
        return tokenSymbol;
    },

    async broadcastTransaction(signedTx) {
        if (!signedTx) {
            ErrorHandler.throwError(ERRORS.INVALID_PARAMS);
        }

        let resp = await this.nodeRequest(
            '/broadcast_tx_commit?tx="' + signedTx + '"'
        );
        this._checkResponseThrowsError(resp);

        let result = resp.result;
        if (result.check_tx && result.check_tx.code != 200) {
            ErrorHandler.throwError(this._nodeTxError(result.check_tx));
        }
        if (result.deliver_tx && result.deliver_tx.code == 200) {
            return result.deliver_tx.tx_hash;
        }
        let hash = hexlify(sha3_256.update(signedTx).digest());
        await sleep(1000);
        let success = await this.checkTransactionStatus(hash);
        if (success) {
            return hash.substring(2);
        }
    },

    async checkTransactionStatus(hash) {
        if (!hash) {
            ErrorHandler.throwError(ERRORS.INVALID_PARAMS);
        }
        hash = hash.toLowerCase();
        if (hash.substring(0, 2) == '0x') {
            hash = hash.substring(2);
        }

        let resp = await this.nodeRequest(
            '/tx?hash="' + hash + '"'
        );
        this._checkResponseThrowsError(resp);
    
        let result = resp.result;
        if (!result.deliver_tx) {
            ErrorHandler.throwError({ id: ERRORS.SERVER_ERROR, data: resp });
        }
        if (result.deliver_tx && result.deliver_tx.code == 200) {
            return true;
        }
        ErrorHandler.throwError(this._nodeTxError(result.deliver_tx));
    },

    async getTransactionCost(calls) {
        let cost = [];
        calls.forEach((call) => {
            if (call.type === 'standard') {
                if (call.method.includes('Transfer(types.Address,bn.Number-decimal)')) {
                    let value = parseFloat(call.params[1]);
                    cost.push({value, symbol: this.getTokenSymbolByAddress(call.contract)});
                }
                if (call.method.includes('Transfer(types.Address,bn.Number)')) {
                    let value = parseFloat(call.params[1]) / 1000000000;
                    cost.push({value, symbol: this.getTokenSymbolByAddress(call.contract)});
                }
            }
        });
        return Promise.all(cost.map(item => item.symbol.then(symbol => ({...item, symbol}))
                                                            // cannot get symbol, maybe not token
                                                        .catch(err => ({}))
                            ));
    }

};

export default NodeService;
