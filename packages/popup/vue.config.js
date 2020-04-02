module.exports = {
  lintOnSave: false,
  publicPath: "./",
  productionSourceMap: false,
  devServer: {
    port: 6688,
    host: "localhost",
    open: false,
    proxy: {
      "/api": {
        target: "https://testwallet.bcbchain.io",
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          "^/api": ""
        }
      }
    }
  }
};
