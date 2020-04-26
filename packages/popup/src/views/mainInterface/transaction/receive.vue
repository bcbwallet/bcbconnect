<template>
  <div class="receive pos-r">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../../assets/images/open/back.png" />
      <span class="color999">{{ $t('lang.createWallet.back') }}</span>
    </div>
    <div class="qrcode">
      <canvas id="canvas" class="canvas m-auto db"></canvas>
    </div>
    <div class="r-addr flex flex-ai-c bgfff m-auto cur-p" @click="doCopy">
      <p class="fs12">{{ walletAddr }}</p>
      <img src="../../../assets/images/main/copy.png" />
    </div>
    <div class="input-line flex flex-ai-c m-auto">
      <input
        type="text"
        name=""
        :placeholder="$t('lang.main.receiveValue')"
        v-model="value"
        style="flex:1"
      />
      <span class="token flex flex-ai-c m-auto">{{ token }}</span>
      <span @click="setValueEv" class="set-value">{{ $t('lang.main.setValue') }}</span>
    </div>
    <div
      class="threeBlueBtn colorfff tac cur-p fs16 m-auto"
      @click="gotoBcbscan"
    >
      {{ $t('lang.main.gotoBcbscan') }}
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
  name: "receive",
  data() {
    return {
      walletAddr: "",
      token:"",
      value: "",
      BCBSCAN: process.env.VUE_APP_BCBSCAN
    };
  },
  created() {
    this.walletAddr = this.$store.state.account.address;
    if (this.walletAddr === "") {
      this.walletAddr = this.$t('lang.main.noAccount');
    }
    this.token = this.$store.state.token;
    // this.qrcode(this.walletAddr);
  },
  mounted() {
    this.qrcode(this.populateText());
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
      this.$copyText(this.walletAddr).then(() => {
        Toast({
          message: this.$t('lang.main.copySuccess'),
          position: "top",
          iconClass: "mintui mintui-success"
        });
      });
    },
    populateText() {
      let text = 'bcbpay://' + this.token + '/' + this.walletAddr + '/';
      if (this.value === "") {
        text += '*'
      } else {
        text += this.value;
      }
      return text
    },
    setValueEv() {
      console.log('set value', this.value)
      let trimNum = String(this.value);
      if (trimNum.indexOf(".") > -1) {
        if (trimNum.substring(trimNum.indexOf(".") + 1).length > 6) {
          Toast({
            message: this.$t('lang.main.atMostSix')
          });
          return;
        }
      }
      this.qrcode(this.populateText());
    },
    gotoBcbscan() {
      window.open(this.BCBSCAN);
    }
  }
};
</script>
<style lang="stylus">
.receive
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
		margin-bottom:20px
		>p
			margin-right:17px
	.input-line
		height: 43px;
		padding:0px 13px 0px 11px;
		margin-bottom:40px
	.token
		padding:0px 13px 0px 11px;
	.set-value
		color:#1166ff;
		cursor:pointer;
</style>
