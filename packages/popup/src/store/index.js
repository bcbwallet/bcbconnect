import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    accounts: [], //钱包列表
    account: {}, //我的钱包信息
    appState: -1, //流程状态
    walletAddr: "", //主界面显示使用address
    hostname: "",
    fromCreatePage: false,
    token: "",
    balance: {}
  },
  mutations: {
    SET_HOSTNAME: (state, name) => {
      state.hostname = name;
    },
    SET_FROMCREATESTATE: (state, isTrue) => {
      state.fromCreatePage = isTrue;
    },
    SET_TOKEN: (state, token) => {
      state.token = token;
    },
    SET_BALANCE: (state, balance) => {
      state.balance = balance;
    }
  },
  actions: {}
});
