import { APP_STATE } from '@bcbconnect/lib/constants';

export default {
    appReady: false,

    init(duplex) {
        this.duplex = duplex;
    },

    setLanguage(language) {
        this.duplex.send('tab', 'tunnel', {
            action: 'setLanguage',
            data: language
        }, false);
    },

    setState(appState) {
        this.duplex.send('popup', 'setState', appState, false);

        const ready = (appState !== APP_STATE.UNINITIALISED && appState !== APP_STATE.PASSWORD_SET);
        if (this.appReady === ready) {
            return;
        }
        this.duplex.send('tab', 'tunnel', {
            action: 'setState',
            data: ready
        }, false);
        this.appReady = ready;
    },

    setChain(chainOpts) {
        this.duplex.send('popup', 'setChain', chainOpts, false);

        const { network, chain } = chainOpts;
        this.duplex.send('tab', 'tunnel', {
            action: 'setChain',
            data: { network, chain }
        }, false);
    },

    setNode(node) {
        this.duplex.send('popup', 'setNode', node, false);

        this.duplex.send('tab', 'tunnel', {
            action: 'setNode',
            data: node
        }, false);
    },

    setAccount(account) {
        this.duplex.send('popup', 'setAccount', account, false);

        const { name, address } = account;
        this.duplex.send('tab', 'tunnel', {
            action: 'setAccount',
            data: { name, address }
        }, false);
    },

    setAccounts(accounts) {
        this.duplex.send('popup', 'setAccounts', accounts, false);
    },

    setConfirmations(confirmations) {
        this.duplex.send('popup', 'setConfirmations', confirmations, false);
    },

    setSetting(setting) {
        this.duplex.send('popup', 'setSetting', setting, false);
    },

    setBalance(balance) {
        this.duplex.send('popup', 'setBalance', balance, false);
    }

};
