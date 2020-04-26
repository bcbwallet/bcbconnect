let url = (function() {
  // let url = process.env.VUE_APP_LOCAL_BASE_URL;
  url = ""; //
  return {
    assets: url + "/api/v1/assets", //获取可配置币种资产表（获取系统里面所有可以配置的公共币种，可以做添加操作用）
    addrBalance: url + "/api/v2/addrs/balance", // 获取指定地址全部资产余额（用于首页的资产表）
    addrTransaction: url + "/api/v1/addrs/transactions", //本接口实现获取指定地址的历史交易记录。
    getFee: url + "/api/v1/addrs/token_balance/single" //获取手续费
  };
})();

export default url;
