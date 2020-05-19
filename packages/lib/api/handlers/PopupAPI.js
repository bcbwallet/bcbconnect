export default {
    init(duplex) {
        this.duplex = duplex;
    },

    //Data refresh

    refresh() {
        return this.duplex.send('refresh');
    },

    // Data requesting

    requestState() {
        return this.duplex.send('requestState');
    },

    changeState(appState) {
        return this.duplex.send('changeState', appState);
    },

    resetState() {
        return this.duplex.send('resetState');
    },

    // Confirmation actions

    getConfirmations() {
        return this.duplex.send('getConfirmations');
    },

    acceptConfirmation(whitelistDuration) {
        return this.duplex.send('acceptConfirmation', whitelistDuration, false);
    },

    rejectConfirmation(message) {
        return this.duplex.send('rejectConfirmation', message, false);
    },

    // Transaction handling

    sendTransaction(transaction) {
        return this.duplex.send('sendTransaction', transaction);
    },

    transfer(token, to, value, note, history = true) {
        return this.duplex.send('transfer', { token, to, value, note, history });
    },

    // Account control

    importAccount(privateKey, name) {
        return this.duplex.send('importAccount', { privateKey, name });
    },

    checkMnemonic(mnemonic) {
        return this.duplex.send('checkMnemonic', mnemonic);
    },

    importMnemonic(mnemonic, name) {
        return this.duplex.send('importMnemonic', { mnemonic, name });
    },

    importJsonWallet(json, password, name) {
        return this.duplex.send('importJsonWallet', { json, password, name });
    },

    addAccount(name) {
        return this.duplex.send('addAccount', name);
    },

    setAccountName(accountId, name) {
        return this.duplex.send('setAccountName', { accountId, name });
    },

    selectAccount(accountId) {
        return this.duplex.send('selectAccount', accountId);
    },

    deleteAccount(accountId) {
        return this.duplex.send('deleteAccount', accountId);
    },

    getAccounts() {
        return this.duplex.send('getAccounts');
    },

    exportAccount() {
        return this.duplex.send('exportAccount');
    },

    exportMnemonic() {
        return this.duplex.send('exportMnemonic');
    },

    exportJsonWallet() {
        return this.duplex.send('exportJsonWallet');
    },

    getSelectedAccount() {
        return this.duplex.send('getSelectedAccount');
    },

    getAccountDetails(accountId) {
        return this.duplex.send('getAccountDetails', accountId);
    },

    getSelectedAccountDetails() {
        return this.duplex.send('getSelectedAccountDetails');
    },

    getRecentRecipients() {
        return this.duplex.send('getRecentRecipients');
    },

    clearRecentRecipients() {
        return this.duplex.send('clearRecentRecipients');
    },

    // Network

    selectChain(chainOpts) {
        return this.duplex.send('selectChain', chainOpts);
    },

    getSelectedChain() {
        return this.duplex.send('getSelectedChain');
    },

    // Node control

    getNetworks() {
        return this.duplex.send('getNetworks');
    },

    addNetwork(networkInfo) {
        return this.duplex.send('addNetwork', networkInfo);
    },

    deleteNetwork(network) {
        return this.duplex.send('deleteNetwork', network);
    },

    getChainsOfNetwork(network) {
        return this.duplex.send('getChainsOfNetwork', network);
    },

    getNodes() {
        return this.duplex.send('getNodes');
    },

    getNodeInfo(url) {
        return this.duplex.send('getNodeInfo', url);
    },

    addNode(node) {
        return this.duplex.send('addNode', node);
    },

    deleteNode() {
        return this.duplex.send('deleteNode');
    },

    resetNodes() {
        return this.duplex.send('resetNodes');
    },

    selectNode(nodeId) {
        return this.duplex.send('selectNode', nodeId);
    },

    getSelectedNode() {
        return this.duplex.send('getSelectedNode');
    },

    getTokenAddress(symbol) {
        return this.duplex.send('getTokenAddress', symbol);
    },

    // Wallet authentication

    setPassword(password) {
        return this.duplex.send('setPassword', password);
    },

    changePassword(oldPassword, newPassword) {
        return this.duplex.send('changePassword', { oldPassword, newPassword });
    },

    unlockWallet(password) {
        return this.duplex.send('unlockWallet', password);
    },

    lockWallet() {
        return this.duplex.send('lockWallet');
    },

    purgeData(password) {
        return this.duplex.send('purgeData', password);
    },

    // Assets

    async getBalance(token) {
        return this.duplex.send('getBalance', token);
    },

    async getFees(token) {
        return this.duplex.send('getFees', token);
    },

    getNetworkAssets() {
        return this.duplex.send('getNetworkAssets');
    },

    enableAssets(assets) {
        return this.duplex.send('enableAssets', assets);
    },

    async addAsset(symbol) {
        return this.duplex.send('addAsset', symbol);
    },

    async getAccountAssets() {
        return this.duplex.send('getAccountAssets');
    },

    getAccountTransactions(opts) {
        return this.duplex.send('getAccountTransactions', opts);
    },

    selectToken(symbol) {
        return this.duplex.send('selectToken', symbol);
    },

    getSelectedToken() {
        return this.duplex.send('getSelectedToken');
    },

    setCurrency(currency) {
        return this.duplex.send('setCurrency', currency);
    },

    getCurrency() {
        return this.duplex.send('getCurrency');
    },

    // Settings

    getLanguage() {
        return this.duplex.send('getLanguage');
    },

    setLanguage(language) {
        return this.duplex.send('setLanguage', language);
    },

    getAutoSignSettings() {
        return this.duplex.send('getAutoSignSettings');
    },

    setAutoSignSettings(settings) {
        return this.duplex.send('setAutoSignSettings', settings);
    },

    getSettings() {
        return this.duplex.send('getSettings');
    },

    setSettings(settings) {
        return this.duplex.send('setSettings', settings);
    }

}
