import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import $url from "./utils/url.js";
import "mint-ui/lib/style.css";
import "./assets/css/reset.css";
import "./assets/css/common.styl";

import { PopupAPI } from "@bcbconnect/lib/api";
import MessageDuplex from "@bcbconnect/lib/MessageDuplex";
import { APP_STATE } from "@bcbconnect/lib/constants";

import VueI18n from "vue-i18n";

let duplex = new MessageDuplex.Popup();
PopupAPI.init(duplex);

Vue.prototype.PopupAPI = PopupAPI;
Vue.prototype.$http = axios;
Vue.prototype.$url = $url;

Vue.prototype.Base64 = require("js-base64").Base64;

Promise.all([
  PopupAPI.requestState(),
  PopupAPI.getLanguage()
]).then(res => {
  let appState = res[0];
  let locale = res[1];

  console.log('app state: ', appState);
  console.log('locale', locale);

  store.state.appState = appState;
  onNewState(appState);

  if (!locale) {
    locale = ["en-US", "zh-CN"].includes(window.navigator.language) ?
      window.navigator.language : 'en-US';
  }

  Vue.use(VueI18n);

  const i18n = new VueI18n({
    locale,
    messages: {
      "en-US": require("./lang/en"),
      "zh-CN": require("./lang/cn")
    }
  });
  Vue.config.productionTip = false;
  
  new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount("#app");

  duplex.on("setState", appState => {
    console.log('new state: ', appState);
    onNewState(appState);
    store.state.appState = appState;
  });

  duplex.on("setAccount", account => {
    console.log('account: ', account);
    store.state.account = account;
  });

  duplex.on("setAccounts", accounts => {
    console.log('accounts: ', accounts);
    let arr = [];
    for (let key in accounts) {
      let param = {};
      param.walletAddr = key;
      param.walletName = accounts[key].name;
      param.type = accounts[key].type;
      arr.push(param);
    }
    store.state.accounts = arr;
  });

  duplex.on("setConfirmation", confirmation => {});

  duplex.on("setSetting", setting => {});

});

function onNewState(appState) {
  switch (appState) {
    case APP_STATE.UNINITIALISED: // [x] First user creates password
      if (router.currentRoute.path == "/open/begin") {
        router.push({ path: "/open/begin" });
      }
      break;
    case APP_STATE.PASSWORD_SET: // [x] Password is set, but the wallet is locked. Next step is UNLOCKED
      if (router.currentRoute.path != "/open/fromMain") {
        router.push({ path: "/open/fromMain" });
      }
      break;
    case APP_STATE.UNLOCKED: // [x] User is given two options - restore account or create new account
      break;
    case APP_STATE.READY: // [x] User is logged in (and at least 1 account exists)
      if (store.state.fromCreatePage) {
        router.push({ name: "backupMnemonic", params: { type: 0 } });
      } else {
        // TODO?
        if (router.currentRoute.path != "/main") {
          router.push({ path: "/main" });
        }
      }
      break;
    case APP_STATE.REQUESTING_CONFIRMATION:
      if (router.currentRoute.path != "/connect") {
        router.push({ path: "/connect" });
      }
      break;
    default:
      break;
  }
}

