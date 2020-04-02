import Logger from '@bcblink/lib/logger';
import StorageService from '../StorageService';
import randomUUID from 'uuid/v4';
import axios from 'axios';

const logger = new Logger('NodeService');

const defaultNetworks = {
    'bcb': {
        name: 'Mainnet',
        chains: ['bcb'],
        default: true,
        urls: [
            'https://earth.bcbchain.io'
        ]
    },
    'bcbt': {
        name: 'Testnet',
        chains: ['bcbt'],
        default: true,
        urls: [
            'https://test-earth.bcbchain.io'
        ]
    }
};

const NodeService = {
    reset() {
        this.networks = {};
        this.network = false;
        this.chain = false;

        // nodes of current chain and all custom nodes
        console.log('clear #1')
        this.nodes = {};
        this.selectedNode = false;
        this.updating = false;
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
        this.networks = Object.keys(networks).length ? networks : defaultNetworks;

        let chainOpts = StorageService.getSelectedChain();
        // migrating from pre-2.0 version
        if (typeof chainOpts === 'string') {
            chainOpts = { network: 'bcb', chain: chainOpts };
        }
        let { network, chain } = chainOpts;
        if (network) {
            this.network = network;
            this.chain = chain;
        }

        const nodes = StorageService.getNodes();
        if (Object.keys(nodes).length) {
            Object.entries(nodes).forEach(([ nodeId, node ]) => {
                let url = node.url || node.host; // old data has host
                if (url) {
                    nodes[nodeId].url = url;
                }
                if (typeof node.chainId === 'undefined') {
                    nodes[nodeId].chainId = this.getChainId();
                }
                if (typeof node.source === 'undefined') {
                    nodes[nodeId].source = 'network';
                }
            });
            console.log('clear #2')
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

    init() {
        logger.info('init');

        if (!this.ready) {
            this.reset();
            this._read();

            this.ready = true;
        }
    },

    purge() {
        logger.info('purge');
        this.reset();
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
        throw new Error(`Invalid chain id: ${chainId}`);
    },

    async _updateChainsOfNetwork(network) {
        logger.info(`update chains of network ${network}`);

        if (!(network in this.networks)) {
            return Promise.reject(`Unknown network ${network}`);
        }

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
        if (chains.length > 0) {
            // remove jiujiu chain
            let pos = chains.indexOf('jiujiu');
            if (pos >= 0) {
                chains.splice(pos, 1);
            }
            this.networks[network].chains = chains;
            this.saveNetworks();
        }
    },

    async _updateNodes() {
        logger.info(`Update nodes for ${this.network}[${this.chain}]`);

        this.updating = true;
        try {
            let nodeUrl = await this.getSeedNodeUrl(this.network).catch(err => {
                this.updating = false;
                return Promise.reject(err);
            });
            let chainId = this.getChainId();
            let urls = await this.getNodeUrls(nodeUrl, chainId).catch(err => {
                this.updating = false;
                return Promise.reject(err);
            });
            if (!Array.isArray(urls)) {
                this.updating = false;
                return Promise.reject(`Got no node for ${chainId}`);
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
                await this._autoSelectNode().catch(err => {
                    this.updating = false;
                    return Promise.reject(err);
                });
            }

            this.updating = false;
        } catch (err) {
            this.updating = false;
            return Promise.reject(err);
        }
    },

    async _autoSelectNode() {
        logger.info('Auto select node');

        // let keys = Object.keys(this.nodes);
        // if (keys.length > 0) {
        //     this.selectNode(keys[0]);
        //     // this.selectNode(keys[ keys.length * Math.random() << 0]);
        // }

        let chainId = this.getChainId();
        let nodeIds = Object.keys(this.nodes);
        for (let i = 0; i < nodeIds.length; i++) {
            let nodeId = nodeIds[i];
            if (this.nodes[nodeId].chainId === chainId) {
                return this.selectNode(nodeId);
            }
        }
    },

    _switchNode() {
        logger.info('Switch node in', this.nodes);

        if (this.updating) {
            return;
        }
        if (!this.nodes) {
            return false;
        }
        if (!this.selectedNode) {
            return this._autoSelectNode();
        }
        let keys = Object.keys(this.nodes);
        for (let i = 0; i < keys.length; i++) {
            if (this.selectedNode == nodeId) {
                let next = (i == keys.length - 1) ? 0 : i + 1;
                // let nextNode = this.nodes[keys[next]];
                // let nodeInfo = await this.getNodeInfo(nextNode.url);
                return this.selectNode(keys[next]);
            }
        }
    },

    getDefaultChain() {
        let keys = Object.keys(defaultNetworks);
        let network = keys[0];
        let chain = defaultNetworks[network].chains[0];
        return { network, chain };
    },

    async addNetwork(networkInfo) {
        logger.info('Add network', networkInfo); 

        let { name, url, chainId } = networkInfo;
        if (!name) {
            return Promise.reject('Empty network name');
        }
        if (!url) {
            return Promise.reject('Empty node url');
        }
        let nodeInfo = await this.getNodeInfo(url);
        logger.info('Node info:', nodeInfo);
        if (chainId && chainId != nodeInfo.chainId) {
            return Promise.reject('Chain id mismatch');
        }
        let { network, chain } = this._splitChainId(nodeInfo.chainId);
        logger.info(`network: ${network}, chain: ${chain}`);

        if (nodeInfo.isSideChain) {
            url = nodeInfo.mainUrls[0];
        }
        // Allow overide ?
        if (this.networks && this.networks.hasOwnProperty(network)) {
            return Promise.reject(`Network ${network} exists`);
        }
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
            return Promise.reject(err);
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
            this.networks = defaultNetworks;
        }

        let networks = {};
        Object.entries(this.networks).forEach(([ networkId, network ]) => {
            let { name, chains } = network;
            networks[networkId] = { name, chains, default: network.default };
        });
        return networks;
    },

    async getChainsOfNetwork(network) {
        logger.info(`Get chains of network ${network}`);

        if (!(network in this.networks)) {
            return Promise.reject(`Unknown network ${network}`);
        }
        await this._updateChainsOfNetwork(network).catch(err => {
            logger.error(`Failed to update chains of network ${network}: ${err}`);
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
        const nodeId = randomUUID();
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
        //     return Promise.reject('Chain id mismatch');
        // }
        node = { ...node, chainId, source: 'user' };
        this._saveNode(node);
    },

    deleteNode(nodeId) {
        if (nodeId === this.selectedNode)
            throw new Error('Cannot delete selected node')
        delete this.nodes[ nodeId ];
        this.saveNodes();
        return true;
    },

    getMainChainId(network) {
        return network;
    },

    getDefaultNodeUrl(networkId) {
        if (! networkId in defaultNetworks) {
            throw new Error(`No default node for ${networkId}`);
        }
        return defaultNetworks[networkId].urls[0];
    },

    async getSeedNodeUrl(network) {
        logger.info('Get seed node for ', this.getChainId());
        logger.info('networks:', this.networks);

        let url;
        let keys = Object.keys(this.networks);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (key === network) {
                url = this.networks[key].urls[0];
                if (!this._isSideChain()) {
                    return url;
                } else {
                    let urls = await this.getNodeUrls(url, this.getChainId());
                    let nodeInfo = await this.getNodeInfo(urls[0]);
                    if (!nodeInfo.mainUrls || !nodeInfo.mainUrls.length) {
                        return Promise.reject('No mainUrls');
                    }
                    return nodeInfo.mainUrls[0];
                }
            }
        }

        url = this.getDefaultNodeUrl(this.network);
        if (url) {
            return url;
        } else {
            return Promise.reject(`No default node for network: ${this.network}`);
        }
    },

    fallbackToDefaultNodes() {
        logger.info('Fallback to default nodes');

        let chainId = this.getChainId();
        let url = this.getDefaultNodeUrl(chainId);
        if (url) {
            let nodeId = randomUUID();
            // nodes cleared
            console.log('clear #3')
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

    _nodeErrorToString(error) {
        let errMsg = '';
        if (typeof error.code !== 'undefined') {
            errMsg += '[' + error.code + ']';
        }
        if (error.message) {
            errMsg += error.message;
        }
        if (error.data) {
            errMsg += ' -- ' + error.data;
        }
        return errMsg;
    },

    _nodeTxErrorToString(error) {
        let errMsg = '';
        if (typeof error.code !== 'undefined') {
            errMsg += '[' + error.code + ']';
        }
        if (error.log) {
            errMsg += error.log;
        }
        return errMsg;
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

    async _nodeRequest(url, data = false) {
        // logger.info(`request ${url}`);
        return new Promise((resolve, reject) => {
            let axioMethod = data ? axios.post : axios.get;
            axioMethod(url, data).then(result => {
                if (result.status == 200) {
                    resolve(result.data);
                } else {
                    logger.info(`HTTP response ${result.status} -- ${url}`);
                    return reject('Server error');
                }
            }).catch (err => {
                logger.info(`Node request error: ${err}`);
                reject('Network error');
            });
        });
    },

    async nodeRequest(url, data = false) {
        let start = Date.now();
        let result = await this._nodeRequest(url, data).catch(err => {
            Promise.reject(err);

            let failure = this._getNodeStats(url, 'failure');
            if (!failure) failure = 0;
            failure++;
            this._setNodeStats(url, 'failure', failure);
            if (failure >= 3) {
                this._switchNode();
            }
        });
        this._setNodeStats(url, 'latency', Date.now() - start);
        return result;
    },

    async getNodeInfo(nodeUrl) {
        logger.info(`Get node info of ${nodeUrl}`);

        // let nodeInfo = this._getNodeCache('nodeInfo');
        // if (nodeInfo) {
        //     return nodeInfo;
        // }
        let result = await this._nodeRequest(
            nodeUrl + '/genesis'
        );
        if (result.error) {
            return Promise.reject(this._nodeErrorToString(result.error));
        }
        if (!result.result || !result.result.genesis
            || !result.result.genesis.app_state.token) {
            return Promise.reject('Node genesis query error');
        }
        let nodeInfo = {
            chainId: result.result.genesis.chain_id,
            token: result.result.genesis.app_state.token
        };
        let mainUrls;
        if (result.result.genesis.app_state.mainChain) {
            mainUrls = result.result.genesis.app_state.mainChain.openUrls;
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
            return Promise.reject(`Unknown network ${network}`);
        }
        let nodeUrl = this.networks[network].urls[0];
        let nodeInfo = await this.getNodeInfo(nodeUrl);
        return nodeInfo.token;
    },

    async getChainIds(nodeUrl) {
        let result = await this._nodeRequest(
            nodeUrl + '/abci_query?path="/sidechain/chainid/all"'
        );
        if (result.error) {
            return Promise.reject(this._nodeErrorToString(result.error));
        }
        if (!result.result || !result.result.response || result.result.response.code != 200) {
            return Promise.reject('Node abci query error');
        }
        let response = result.result.response;
        if (response.hasOwnProperty('value')) {
            let value = Base64.decode(response.value);
            let result = JSON.parse(value);
            // console.log(result)
            return result;
        }
    },

    async getNodeUrls(nodeUrl, chainId) {
        let result = await this._nodeRequest(
            nodeUrl + '/abci_query?path="/sidechain/' + chainId + '/openurls"'
        );
        if (result.error) {
            return Promise.reject(this._nodeErrorToString(result.error));
        }
        if (!result.result || !result.result.response || result.result.response.code != 200) {
            return Promise.reject('Node abci query error');
        }
        let response = result.result.response;
        if (response.hasOwnProperty('value')) {
            let value = Base64.decode(response.value);
            let result = JSON.parse(value);
            // console.log(result)
            return result;
        }
    },

    async getTransactionCount(address) {
        if (!address) {
            return Promise.reject('No address provided');
        }
        if (!this.selectedNode) {
            return Promise.reject('No node selected');
        }
        let result = await this.nodeRequest(
            this.nodes[this.selectedNode].url + '/abci_query?path="/account/ex/' + address + '/account"'
        );
        if (result.error) {
            return Promise.reject(this._nodeErrorToString(result.error));
        }
        if (!result.result || !result.result.response || result.result.response.code != 200) {
            return Promise.reject('Node abci query error');
        }
        let response = result.result.response;
        let nonce = 0;
        if (response.hasOwnProperty('value')) {
            let value = Base64.decode(response.value);
            let result = JSON.parse(value);
            nonce = result.Nonce;
        }
        // console.log(nonce)
        return nonce;
    },

    async getBalance(address, tokenAddress) {
        if (!address) {
            return Promise.reject('No address provided');
        }
        if (!tokenAddress) {
            return Promise.reject('No token address provided');
        }
        if (!this.selectedNode) {
            return Promise.reject('No node selected');
        }
        let result = await this.nodeRequest(
            this.nodes[this.selectedNode].url + '/abci_query?path="/account/ex/' + address + '/token/' + tokenAddress + '"'
        );
        if (result.error) {
            return Promise.reject(this._nodeErrorToString(result.error));
        }
        if (!result.result || !result.result.response || result.result.response.code != 200) {
            return Promise.reject('Node abci query error');
        }
        let response = result.result.response;
        let balance = 0;
        if (response.hasOwnProperty('value')) {
            let value = Base64.decode(response.value);
            let result = JSON.parse(value);
            balance = result.balance;
        }
        // console.log(balance)
        return balance;
    },

    async getTokenAddressBySymbol(symbol) {
        if (!symbol) {
            return Promise.reject('No symbol provided');
        }
        if (!this.selectedNode) {
            return Promise.reject('No node selected');
        }
        symbol = symbol.toLowerCase();
        let tokenAddress = this._getTokenAddressCache(symbol);
        if (tokenAddress) {
            return tokenAddress;
        }
        let result = await this.nodeRequest(
            this.nodes[this.selectedNode].url + '/abci_query?path="/token/symbol/' + symbol + '"'
        );
        if (result.error) {
            return Promise.reject(this._nodeErrorToString(result.error));
        }
        if (!result.result || !result.result.response || result.result.response.code != 200) {
            return Promise.reject('Node abci query error');
        }
        let response = result.result.response;
        if (response.hasOwnProperty('value')) {
            let value = Base64.decode(response.value);
            tokenAddress = JSON.parse(value);
            // console.log(tokenAddress)
            this._saveTokenAddressCache(symbol, tokenAddress);
            return tokenAddress;
        } else {
            return Promise.reject('No value in response');
        }
    },

    async getTokenSymbolByAddress(tokenAddress) {
        if (!tokenAddress) {
            return Promise.reject('No token address provided');
        }
        if (!this.selectedNode) {
            return Promise.reject('No node selected');
        }
        let tokenSymbol = this._getTokenSymbolCache(tokenAddress);
        if (tokenSymbol) {
            return tokenSymbol;
        }
        let result = await this.nodeRequest(
            this.nodes[this.selectedNode].url + '/abci_query?path="/token/' + tokenAddress + '"'
        );
        if (result.error) {
            return Promise.reject(this._nodeErrorToString(result.error));
        }
        if (!result.result || !result.result.response || result.result.response.code != 200) {
            return Promise.reject('Node abci query error');
        }
        let response = result.result.response;
        if (response.hasOwnProperty('value')) {
            let value = Base64.decode(response.value);
            let result = JSON.parse(value);
            tokenSymbol = result.symbol;
            this._saveTokenSymbolCache(tokenAddress, tokenSymbol)
            return tokenSymbol;
        } else {
            return Promise.reject('No value in response');
        }

    },

    async broadcastTransaction(signedTx) {
        if (!signedTx) {
            return Promise.reject('No signed transaction provided');
        }
        if (!this.selectedNode) {
            return Promise.reject('No node selected');
        }
        let result = await this.nodeRequest(
            this.nodes[this.selectedNode].url + '/broadcast_tx_commit?tx="' + signedTx + '"'
        );
        if (result.error) {
            return Promise.reject(this._nodeErrorToString(result.error));
        }
        if (!result.result) {
            return Promise.reject('No result in response');
        }
        let response = result.result;
        if (response.check_tx && response.check_tx.code != 200) {
            return Promise.reject(this._nodeTxErrorToString(response.check_tx));
        }
        if (response.deliver_tx) {
            if (response.deliver_tx.code != 200) {
                return Promise.reject(this._nodeTxErrorToString(response.deliver_tx));
            }
            return response.deliver_tx.tx_hash;
        }
        return Promise.reject('No tx status in response');
    },

    async getTransactionCost(calls) {
        if (!this.selectedNode) {
            return Promise.reject('No node selected');
        }
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
