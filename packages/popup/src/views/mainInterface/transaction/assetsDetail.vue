<template>
  <div class="assetsDetail pos-r">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../../assets/images/open/back.png" />
      <span class="color999">{{ $t('lang.createWallet.back') }}</span>
    </div>
    <div class="coinAll m-auto" style="overflow-y: auto">
      <div
        v-for="(item, index) in coinArr"
        :key="index"
        class="coin-single flex flex-jc-b cur-p pos-r flex flex-ai-c"
        :class="{ onSelected: selAsset.symbol == item.symbol }"
        @click="selCoin(item, index)"
      >
        <div class="coin-left flex flex-ai-c">
          <img :src="item.icon || defaultCoinIcon" />
          <span class="bold">{{ item.symbol }}</span>
        </div>
        <div class="tar coin-right">
          <div class="bold">{{ item.balance }}</div>
          <div class="color999 fs12">
            ≈ {{ selCurrency == "CNY" ? "¥" : "$" }} {{ item.fiatValue }}
          </div>
        </div>
        <img
          src="../../../assets/images/main/top_active.png"
          class="pos-a selected"
          v-if="selAsset.symbol == item.symbol"
        />
      </div>
    </div>
    <div
      class="threeBlueBtn flex flex-ai-c flex-jc-c bold m-auto cur-p colorfff"
      @click="gotoAddCoin"
    >
      {{ $t('lang.main.pick') }}
    </div>
    <div class="common-load flex flex-ai-c flex-jc-c" v-if="loading">
      <div class="flex flex-ai-c flex-jc-c">
        <!-- <mt-spinner type="fading-circle"></mt-spinner> -->
        <span class="text">{{ $t('lang.main.loading') }}</span>
        <mt-spinner type="triple-bounce"></mt-spinner>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from "@/components/HelloWorld.vue";
import { Toast } from "mint-ui";
export default {
  name: "assetsDetail",
  data() {
    return {
      walletAddr: "",
      coinArr: [],
      selAsset: { symbol: "", balance: "0", fiatValue: "0" },
      selCurrency: "USD",
      selChainId: "",
      loading: true,
      callNum1: 0,
      defaultCoinIcon: require('../../../assets/images/main/coin.png')
    };
  },
  created() {
    this.walletAddr = this.$store.state.account.address;
    this.initData();
  },
  mounted() {},
  methods: {
    back() {
      this.$router.back();
    },
    async selCoin(item, index) {
      this.selAsset = item;
      await this.PopupAPI.selectToken(item.symbol);
    },
    gotoAddCoin() {
      this.$router.push("/addCoin");
    },
    async getCurrency() {
      this.selCurrency = await this.PopupAPI.getCurrency();
    },
    async getAccountAssets() {
      try {
        let token = await this.PopupAPI.getSelectedToken();
        console.log('selected token:', token);
        let result = await this.PopupAPI.getAccountAssets();
        console.log('account assets:', result);
        this.coinArr = [];
        Object.entries(result).forEach(([symbol, info]) => {
            let item = {};
            item.symbol = symbol;
            item.icon = info.icon;
            item.balance = typeof info.balance !== 'undefined' ? Number(parseFloat(info.balance).toFixed(6)) : '-';
            item.fiatValue = typeof info.fiatValue !== 'undefined' ? Number(parseFloat(info.fiatValue).toFixed(6)) : '-';

            if (symbol === token) {
              this.selAsset = item;
            }
            this.coinArr.push(item);
        });
        console.log('coinArr:', this.coinArr);
        console.log('selAsset', this.selAsset);
        this.loading = false;
      } catch (err) {
        this.loading = false;
        Toast({
          message: err.message
        });
      }
    },
    initData() {
      this.getCurrency();
      this.getAccountAssets();
    }
  }
};
</script>
<style type="text/css" lang="stylus">
@import './../../../assets/css/var.styl';
.assetsDetail
	padding-top:51px
	.coinAll
		width:330px
		height:430px
		margin-bottom:30px
		.coin-single
			background: #FFFFFF;
			box-shadow: 0 0 6px 0 #E6EDF2;
			border-radius: 6px;
			height:68px
			margin-bottom:18px
			padding:0 13px
			&.onSelected
				border: 1px solid $color0195FF;
			.coin-left
				>img
					width:33px
					height:33px
					margin-right:12px
			.coin-right
				>div
					&:first-child
						line-height:20px
					&:last-child
						line-height:17px
			.selected
				top:-1px
				right:0
</style>
