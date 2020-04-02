<template>
  <div class="receipt pos-r">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../../assets/images/open/back.png" />
      <span class="color999">{{ $t('lang.createWallet.back') }}</span>
    </div>
    <div class="qrcode">
      <canvas id="canvas" class="canvas m-auto db"></canvas>
    </div>
    <div class="r-addr flex flex-ai-c bgfff m-auto cur-p" @click="doCopy">
      <p class="fs12">{{ myAddress }}</p>
      <img src="../../../assets/images/main/copy.png" />
    </div>
    <div
      class="threeBlueBtn colorfff tac cur-p fs16 m-auto"
      @click="gotoBcbscan"
    >
      {{ $t('lang.main.bcbscanLook') }}
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import Vue from "vue";
import QRCode from "qrcode";
import { Toast } from "mint-ui";
import VueClipboard from "vue-clipboard2";
Vue.use(VueClipboard);

export default {
  name: "receipt",
  data() {
    return {
      myAddress: "",
      BCBSCAN: process.env.VUE_APP_BCBSCAN
    };
  },
  created() {
    this.myAddress = this.$store.state.account.address;
    if (this.myAddress === "") {
      this.myAddress = this.$t('lang.main.noAddress');
    }
  },
  mounted() {
    this.qrcode(this.myAddress);
  },
  methods: {
    back() {
      this.$router.back();
    },
    qrcode(text) {
      QRCode.toCanvas(canvas, text, function(error) {
        if (error) console.error(error);
        console.log("success!");
      });
    },
    doCopy() {
      this.$copyText(this.myAddress).then(() => {
        Toast({
          message: this.$t('lang.main.copySuccess'),
          position: "top",
          iconClass: "mintui mintui-success"
        });
      });
    },
    gotoBcbscan() {
      window.open(this.BCBSCAN);
    }
  }
};
</script>
<style lang="stylus">
.receipt
	.qrcode
		padding-top: 89px
		margin-bottom:40px
		.canvas
			width:196px!important
			height:196px!important
	.r-addr
		width: fit-content;
		height: 43px;
		padding: 0 13px 0 11px;
		border-radius: 11px;
		margin-bottom:65px
		>p
			margin-right:17px
</style>
