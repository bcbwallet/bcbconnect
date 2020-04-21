<template>
  <div class="transfer bgfff pos-r">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../../assets/images/open/back.png" />
      <span class="color999">{{ $t('lang.createWallet.back') }}</span>
    </div>
    <div class="transfer-cont m-auto">
      <div>
        <h2 class="color000">{{ $t('lang.main.selectCoin') }}</h2>
        <div
          class="input-line flex flex-jc-b flex-ai-c pos-r cur-p"
          @click="selActive = !selActive"
          v-click-outside="onClickoutside"
        >
          <span>{{ selCoin }}</span>
          <img
            src="../../../assets/images/main/down_select.png"
            :class="{ 'select-active': selActive }"
          />
          <!--  -->
        </div>
        <div class="color1166ff">
          {{ $t('lang.main.balance') }}<span class="bold">{{ selAsset.balance === undefined ? '' : Number(selAsset.balance).toFixed(6) }}</span>
        </div>
      </div>
      <div>
        <h2 class="color000">{{ $t('lang.main.recipient') }}</h2>
        <div
          class="input-line flex flex-ai-c m-auto pos-r"
          v-click-outside="onClickoutside1"
        >
          <input
            type="text"
            name=""
            :placeholder="$t('lang.main.enterTransferAddr')"
            v-model="form.addr"
            @focus="focusAddrAllEv"
            @blur="blurAddrCheckEv"
            style="font-size:12px"
            spellcheck="false"
          />
          <div class="pos-a focus-box" v-show="focusShow">
            <div
              v-for="(item, index) in toAddrArr"
              :key="index"
              @click="focusSingle(item)"
            >
              {{ item }}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 class="color000" style="margin-top:18px">{{ $t('lang.main.value') }}</h2>
        <div class="input-line flex flex-ai-c m-auto">
          <input
            type="text"
            name=""
            :placeholder="$t('lang.main.enterTransferValue')"
            v-model="form.value"
            style="flex:1"
          />
          <span @click="transferAllEv" class="transfer-all">{{ $t('lang.main.transferAll') }}</span>
        </div>
        <div class="colorF9794D">
          {{ $t('lang.main.networkFee') }}<span v-show="feeShow">{{ fee }} {{ feeCoin }}</span>
        </div>
      </div>
      <div>
        <h2 class="color000">{{ $t('lang.main.memo') }}</h2>
        <div class="input-line flex flex-ai-c m-auto">
          <input type="text" name="" :placeholder="$t('lang.main.optional')" v-model="form.note" />
        </div>
      </div>
      <div
        class="threeBlueBtn colorfff tac cur-p fs16 btn-transfer"
        style="width:320px"
        @click="transferEv"
      >
        {{ $t('lang.main.transfer') }}
      </div>
    </div>
    <mt-popup v-model="selActive" position="bottom" style="height: initial;">
      <div>
        <div class="pop-head bold tac fs16">{{ $t('lang.main.selectCoin') }}</div>
        <img
          src="../../../assets/images/main/close.png"
          class="close pos-a cur-p"
          @click="close"
        />
        <div class="pop-body m-auto">
          <div
            v-for="(item, index) in coinArr"
            :key="index"
            :class="{ 'select-coin': selCoin == item.symbol }"
            @click="selCoinEv(item)"
            class="coinAll" style="width: auto !important;"
          >
            <div class="flex flex-ai-c coinAll-e">
              <img :src="item.icon || defaultCoinIcon" style="width:34px;height:34px" />
              <div class="item-coin">{{ item.symbol }}</div>
              <div class="flex flex-jc-b flex-ai-c c-right">
                <div>{{ item.balance }}</div>
                <img
                  src="../../../assets/images/main/coin_active.png"
                  v-if="selCoin == item.symbol"
                  class="selRight"
                />
              </div>
            </div>
            <div class="line" v-if="index != coinArr - 1"></div>
          </div>
        </div>
      </div>
    </mt-popup>
    <mt-popup v-model="popupVisible" position="bottom">
      <!-- TODO: ? -->
      <div>
        <div class="pop-head bold tac fs16">A</div>
        <img
          src="../../../assets/images/main/close.png"
          class="close pos-a cur-p"
          @click="close"
        />
        <div class="pop-body m-auto">
          <div class="line"></div>
          <div class="num bold tac">1BCB</div>
          <div class="cont tac color999 fs12">B</div>
          <div class="threeBlueBtn colorfff tac cur-p fs16 bold">Pay</div>
        </div>
      </div>
    </mt-popup>
    <mt-popup v-model="popupVisible1" position="bottom" style="height:324px">
      <div>
        <div class="pop-head bold tac fs16">{{ $t('lang.main.transferConfirm') }}</div>
        <img
          src="../../../assets/images/main/close.png"
          class="close pos-a cur-p"
          @click="close"
        />
        <div class="pop-body m-auto">
          <div class="line"></div>
          <div class="pop-tran">
            <span>{{ $t('lang.main.recipient') }}</span>
            <span style="font-size:12px;width: 232px;" class="ell">{{
              form.addr
            }}</span>
          </div>
          <div class="line"></div>
          <div class="pop-tran">
            <span>{{ $t('lang.main.value') }}</span>
            <span>{{ form.value }} {{ selCoin }}</span>
          </div>
          <div class="line" v-show="feeShow"></div>
          <div class="pop-tran" style="margin-bottom:20px">
            <span>{{ $t('lang.main.fee') }}</span>
            <span v-show="feeShow">{{ fee }} {{ feeCoin }}</span>
          </div>
          <div
            class="threeBlueBtn colorfff tac cur-p fs16 bold flex flex-ai-c flex-jc-c"
            @click="gotoPay"
          >
            <span v-if="isProcessing">{{ $t('lang.main.paying') }}</span>
            <span v-if="!isProcessing">{{ $t('lang.main.payImmediately') }}</span>
            <mt-spinner
              type="snake"
              v-if="isProcessing"
              style="margin-left:10px"
            ></mt-spinner>
          </div>
        </div>
      </div>
    </mt-popup>
    <mt-popup v-model="popupVisible2" position="bottom">
      <div>
        <div class="pop-head bold tac fs16">{{ popupTitle }}</div>
        <img
          src="../../../assets/images/main/close.png"
          class="close pos-a cur-p"
          @click="close"
        />
        <div class="pop-body m-auto">
          <div class="line"></div>
          <div class="input-line flex flex-ai-c m-auto">
            <input type="password" name="" placeholder="Enter password" />
          </div>
          <div class="threeBlueBtn colorfff tac cur-p fs16 bold">OK</div>
        </div>
      </div>
    </mt-popup>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from "@/components/HelloWorld.vue";
import Vue from "vue";
import { Popup, Toast, Spinner } from "mint-ui";
Vue.component(Popup.name, Popup);
Vue.component(Spinner.name, Spinner);
import { directive as clickOutside } from "v-click-outside-x";

import { isSideChainAddress, chainOfAddress } from "@bcblink/lib/address";

export default {
  name: "transfer",
  directives: { clickOutside },
  data() {
    return {
      selActive: false,
      isProcessing: false,
      coinArr: [],
      selCoin: "",
      popupVisible: false,
      popupVisible1: false,
      popupVisible2: false,
      popupTitle: "",
      clickNum: 0, //立即支付按钮
      walletAddr: "",
      form: {
        value: "",
        addr: "",
        note: ""
      },
      focusShow: false,
      toAddrArr: [],
      fee: 0,
      selChainId: "",
      feeShow: true,
      selAsset: {},
      feeCoin: "",
      defaultCoinIcon: require('../../../assets/images/main/coin.png')
    };
  },
  created() {
    this.selChainId = this.$route.params.chainId;
    this.walletAddr = this.$store.state.account.address;
    if (!this.walletAddr) {
      this.PopupAPI.getSelectedAccount().then(res => {
        this.walletAddr = res.address;
      });
    }
    this.PopupAPI.getCurrency().then(res => {
      this.selCurrency = res;
    });
    this.PopupAPI.getSelectedToken().then(res => {
      this.selCoin = res;
    });

    this.initData();
  },
  methods: {
    blurAddrCheckEv() {
      console.log('blurAddrCheck', this.form.addr)
      this.getBalanceAndFee();
    },
    transferAllEv() {
      console.log(`coin: ${this.selCoin}, fee: ${this.fee} ${this.feeCoin}`);
      if (this.selCoin == this.feeCoin) {
        if (Number(this.selAsset.balance) < Number(this.fee)) {
          Toast({
            message: this.$t('lang.main.feeNotEnough')
          });
          return;
        } else {
          let value = Number(this.selAsset.balance) - Number(this.fee);
          this.form.value = Math.floor(value * 1000000) / 1000000;
        }
      } else {
        this.form.value = this.selAsset.balance;
        for (let i = 0; i < this.coinArr.length; i++) {
          if (this.coinArr[i].symbol == this.feeCoin) {
            if (Number(this.coinArr[i].balance) < Number(this.fee)) {
              Toast({
                message: this.$t('lang.main.feeNotEnough')
              });
              return;
            }
          }
        }
      }
    },
    selCoinEv(item) {
      this.selAsset = item;
    },
    getBalanceAndFee() {
      this.PopupAPI.getSelectedAccountBalance(this.selCoin).then(async (res) => {
        console.log('balance for fee:', res);
        let { token, balance, fiatValue, fees, feeToken } = res;
        // this.selAsset = { token, balance, fiatValue, feeToken };
        this.selAsset.balance = balance;
        this.selAsset.fiatValue = fiatValue;
        this.feeCoin = feeToken;
        if (!Array.isArray(fees) || fees.length == 0) {
          return;
        }
        let chain;
        if (isSideChainAddress(this.form.addr)) {
          chain = chainOfAddress(this.form.addr);
        } else {
          let chainOpts = await this.PopupAPI.getSelectedChain();
          // mainChain id
          chain = chainOpts.network;
        }
        console.log('to chain:', chain)
        fees.forEach(info => {
          if (info.chainid == chain) {
            this.fee = info.bcbFee;
          }
        });
      }).catch(err => {
        console.log('get balance for fee error', err)
      });
    },
    focusSingle(item) {
      this.form.addr = item;
      this.focusShow = false;
    },
    transferEv() {
      if (!this.form.addr) {
        Toast({
          message: this.$t('lang.main.enterTransferAddr')
        });
        return;
      }
      if (!this.form.value) {
        Toast({
          message: this.$t('lang.main.enterValue')
        });
        return;
      }
      if (this.form.value == 0) {
        Toast({
          message: this.$t('lang.main.notZero')
        });
        return;
      }
      var patrn = /^\d+(\.\d+)?$/;
      if (!patrn.test(this.form.value)) {
        Toast({
          message: this.$t('lang.main.enterRightNum')
        });
        return;
      }
      var reg = /^\d+(?=\.{0,1}\d+$|$)/;
      if (!reg.test(this.form.value)) {
        Toast({
          message: this.$t('lang.main.enterRightValue')
        });
        return;
      }
      let trimNum = String(this.form.value);
      if (trimNum.indexOf(".") > -1) {
        if (trimNum.substring(trimNum.indexOf(".") + 1).length > 6) {
          Toast({
            message: this.$t('lang.main.atMostSix')
          });
          return;
        }
      }

      console.log(`coin: ${this.selCoin}, fee: ${this.fee} ${this.feeCoin}`);
      if (this.selCoin == this.feeCoin) {
        if (Number(this.selAsset.balance) < Number(this.fee)) {
          Toast({
            message: this.$t('lang.main.feeNotEnough')
          });
          return;
        } else if (Number(this.selAsset.balance) <
            Number(this.fee) + Number(this.form.value)
          ) {
          Toast({
            message: this.$t('lang.main.tooBig')
          });
          return;
        }
      } else {
        let feeBalance = 0;
        for (let i = 0; i < this.coinArr.length; i++) {
          if (this.coinArr[i].symbol == this.feeCoin) {
            feeBalance = this.coinArr[i].balance;
          }
        }
        if (Number(feeBalance) < Number(this.fee)) {
          Toast({
            message: this.$t('lang.main.feeNotEnough')
          });
          return;
        } else if (Number(this.selAsset.balance) < Number(this.form.value)) {
          Toast({
            message: this.$t('lang.main.valueTooBig')
          });
          return;
        }
      }
      this.popupVisible1 = true;
    },
    focusAddrAllEv() {
      this.focusShow = true;
      this.PopupAPI.getRecentRecipients().then(res => {
        console.log('recipients:', res)
        this.toAddrArr = res;
      });
    },
    onClickoutside1() {
      this.focusShow = false;
    },
    gotoPay() {
      if (this.isProcessing == true) {
        Toast({
          message: this.$t('lang.main.payingWait')
        });
        return;
      }
      this.isProcessing = true;

      console.log(this.form.note);
      this.PopupAPI.transfer(
        this.selCoin,
        this.form.addr,
        this.form.value,
        this.form.note
      ).then(result => {
        console.log('transfer result:', result);
        this.popupVisible1 = false;
        this.isProcessing = false;
        Toast({
          message: this.$t('lang.main.transferSuccess'),
          position: "top",
          iconClass: "mintui mintui-success"
        });
        // this.getBalanceAndFee();
      }).catch(err => {
        console.log('transfer error:', err)
        this.isProcessing = false;
        Toast({
          message: this.$t('lang.main.transferFail')
        });
      });
    },
    close() {
      this.popupVisible = false;
      this.popupVisible1 = false;
      this.popupVisible2 = false;
    },
    back() {
      this.$router.back();
    },
    onClickoutside() {
      this.selActive = false;
    },
    getAccountAssets() {
      this.PopupAPI.getSelectedAccountAssets().then(result => {
        console.log('account assets2:', result);
        this.coinArr = [];
        Object.entries(result).forEach(([symbol, info]) => {
          let item = {};
          item.symbol = symbol;
          item.icon = info.icon;
          item.balance = info.balance ? info.balance : 0;
          item.fiatValue = info.fiatValue ? info.fiatValue : 0;

          if (symbol === this.selCoin) {
            this.selAsset = item;
          }
          this.coinArr.push(item);
        });
        console.log('coinArr:', this.coinArr);
        console.log('selAsset', this.selAsset);
        this.loading = false;
      }).catch(err => {
        this.loading = false;
        Toast({
          message: err.message
        });
      });
    },
    initData() {
      this.getAccountAssets();
    }
  }
};
</script>
<style lang="stylus">
.close
	right:19px
	top:25px
.pop-head
	line-height: 22px;
	margin-top: 22px;
	margin-bottom: 15px;
.pop-body
	width:300px;
	max-height:400px;
	overflow-y:auto;
	.line
		width:100%
		height:1px
		background:#f1f4f7
	.num
		font-size: 20px;
		margin-top: 35px;
		line-height: 28px;
		margin-bottom: 28px;
	.cont
		margin-bottom:29px
	.input-line
		margin-top:36px
		margin-bottom:55px
	.pop-tran
		height:52px
		line-height:52px
		display:flex
		>span
			&:first-child
				margin-right:26px
				width: 42px;
				text-align:right
	.coinAll
		&.select-coin
			background: #E4EFFF

		.coinAll-e
			height:56px
			>img
				margin-right:19px
				margin-left:4px
			.item-coin
				width:80px;
				margin-right:10px
			.c-right
				width:calc(100% - 132px)
				.selRight
					margin-right:10px

.color1166ff
	color:#1166ff
	margin:8px 0 12px
	line-height:20px
.colorF9794D
	color:#ccc
	margin:8px 0 10px
	line-height:20px
.transfer
	width:100%
	height:100%
	.transfer-cont
		width:320px
		padding-top:100px
		h2
			line-height:20px
			margin-bottom:6px
		.input-line
			width:320px
			padding:0 10px
			.pop-coin
				width: 100%;
				box-shadow: 0 0 3px #ccc;
				border-radius: 5px;
				top: 46px;
				left: 0;

				height:0
				overflow:hidden
				transition:all 0.3s
				&.heightAll
					height:160px
				>div
					height: 40px;
					line-height: 40px;
					border-bottom: 1px solid #F2F2F2;
					padding: 0 16px;
					&.select-coin
						background:#F2F2F2
			img
				width:8px
				height:12px
				transform: rotate(90deg);
				transition:all 0.3s
			.select-active
				transform: rotate(270deg);
		.btn-transfer
			margin-top:24px
.focus-box
	background: #fff;
	left: 0;
	top: 46px;
	width: 320px;
	box-shadow: 0 0 5px #ccc;
	border-radius: 5px;
	max-height:120px;
	overflow-y:auto;
	>div
		font-size: 12px;
		height: 30px;
		line-height: 30px;
		padding-left:15px;
		cursor:pointer;
.transfer-all
	color:#1166ff;
	cursor:pointer;
</style>
<style>
.mint-spinner-snake {
  border-top-color: #fff !important;
  border-left-color: #fff !important;
  border-bottom-color: #fff !important;
}
</style>
