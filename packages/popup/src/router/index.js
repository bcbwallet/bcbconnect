import Vue from "vue";
import Router from "vue-router";
import Open from "./../views/initializeWallet/open.vue";
import Terms from "./../views/initializeWallet/terms.vue";
import CreateWallet from "./../views/initializeWallet/createWallet.vue";
import ImportWallet from "./../views/initializeWallet/importWallet.vue";
import BackupMnemonic from "./../views/initializeWallet/backupMnemonic.vue";
import BackupMnemonicWrite from "./../views/initializeWallet/backupMnemonicWrite.vue";

import Main from "./../views/mainInterface/main.vue";
import WalletDetail from "./../views/mainInterface/wallet/walletDetail.vue";
import AssetsDetail from "./../views/mainInterface/transaction/assetsDetail.vue";
import AddCoin from "./../views/mainInterface/transaction/addCoin.vue";
import Transfer from "./../views/mainInterface/transaction/transfer.vue";
import Receipt from "./../views/mainInterface/transaction/receipt.vue";
import ChangePwd from "./../views/mainInterface/setting/changePwd.vue";
import selectNode from "./../views/mainInterface/setting/selectNode.vue";
import autoSign from "./../views/mainInterface/setting/autoSign.vue";
import ConnectDetail from "./../views/mainInterface/connect/connectDetail.vue";
Vue.use(Router);

export default new Router({
  mode: "hash",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      redirect: "/open/begin"
    },
    {
      path: "/open/:type",
      name: "open",
      component: Open
    },
    {
      path: "/terms",
      name: "terms",
      component: Terms
    },
    {
      path: "/createWallet/:type",
      name: "createWallet",
      component: CreateWallet
    },
    {
      path: "/importWallet/:type",
      name: "importWallet",
      component: ImportWallet
    },
    {
      path: "/backupMnemonic",
      name: "backupMnemonic",
      component: BackupMnemonic
    },
    {
      path: "/backupMnemonicWrite",
      name: "backupMnemonicWrite",
      component: BackupMnemonicWrite
    },

    {
      path: "/main",
      name: "main",
      component: Main
    },
    {
      path: "/assetsDetail",
      name: "assetsDetail",
      component: AssetsDetail
    },
    {
      path: "/walletDetail",
      name: "walletDetail",
      component: WalletDetail
    },
    {
      path: "/addCoin",
      name: "addCoin",
      component: AddCoin
    },
    {
      path: "/transfer",
      name: "transfer",
      component: Transfer
    },
    {
      path: "/receipt",
      name: "receipt",
      component: Receipt
    },
    {
      path: "/changePwd",
      name: "changePwd",
      component: ChangePwd
    },
    {
      path: "/selectNode",
      name: "selectNode",
      component: selectNode
    },
    {
      path: "/autoSign",
      name: "autoSign",
      component: autoSign
    },
    {
      path: "/connect",
      name: "connect",
      component: ConnectDetail
    }
  ]
});
