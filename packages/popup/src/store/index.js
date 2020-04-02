import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    accounts: [], //钱包列表
    account: {}, //我的钱包信息
    appState: -1, //流程状态
    myAddress: "", //主界面显示使用address
    hostname: "",
    fromCreatePage: false
  },
  mutations: {
    SET_HOSTNAME: (state, name) => {
      state.hostname = name;
    },
    SET_FROMCREATESTATE: (state, isTrue) => {
      state.fromCreatePage = isTrue;
    }
  },
  actions: {}
});
