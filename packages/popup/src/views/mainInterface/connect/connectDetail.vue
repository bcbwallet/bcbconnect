<template>
  <div class="connect-all">
    <div class="connectDetail" v-if="message.type === CONFIRMATION_TYPE.TRANSACTION">
      <div class="c-tilte">
        <h2 class="tac">{{ $t("lang.open.confirmRequest") }}</h2>
        <p class="tac">{{ $t("lang.open.website") }}{{ message.hostname }}{{ $t("lang.open.requestWalletSign") }}</p>
      </div>
      <div class="bgfff c-body">
        <div class="c-account">
          <div class="flex flex-ai-c flex-jc-b">
            <span>{{ $t("lang.connect.walletAccount") }}</span>
            <span>{{ message.account }}</span>
          </div>
          <div class="flex flex-ai-c flex-jc-b">
            <span>{{ $t("lang.connect.pay") }}</span>
            <span class="flex flex-ai-c">
              <span>{{ pay }}</span>
            </span>
          </div>
        </div>
        <div class="c-tab flex flex-jc-b flex-ai-c">
          <span
            :class="{ active: item == selTabName }"
            v-for="(item, index) in tabArr"
            :key="index"
            @click="tabClick(item)"
            >{{ item }}</span
          >
        </div>
        <div class="c-fun" v-if="selTabName == $t('lang.connect.details')">
          <div v-for="(item, index) in funArr" :key="index">
            <div style="font-size:12px">{{ item.contract }}</div>
            <div
              class="flex flex-ai-c flex-jc-b cur-p"
              @click.stop="singleClick(item, index)"
            >
              <span>Function</span>
              <span class="flex flex-ai-c">
                <span>{{ item.funName }}</span>
                <span class="triggle"></span>
              </span>
            </div>
            <div
              class="c-pop-box"
              v-if="item.active"
              v-click-outside="onClickoutside"
            >
              {{ item.json }}
            </div>
          </div>
        </div>
        <div
          class="c-fun"
          v-else
          style="padding:11px 15px;line-height: 20px;overflow-y:auto;word-break:break-all"
        >
          {{ message.result }}
        </div>
        <div class="c-signa">
          <h2>{{ $t('lang.connect.autoSignTitle') }}</h2>
          <div>
            <div class="flex flex-ai-c flex-jc-b" @click.stop="selectClick">
              <span>{{ selOption.label }}</span>
              <span></span>
            </div>
            <div
              class="select-pop"
              :class="{ active: popShow }"
              v-click-outside="onClickoutside1"
            >
              <span
                v-for="(item, index) in optionArr"
                :key="index"
                @click="autoSignSelect(item)"
                >{{ item.label }}</span
              >
            </div>
          </div>
        </div>
        <div class="c-button flex flex-jc-b">
          <div @click="reject">{{ $t('lang.connect.reject') }}</div>
          <div @click="accept">{{ $t('lang.connect.accept') }}</div>
        </div>
      </div>
    </div>
    <div class="connect" v-if="message.type === CONFIRMATION_TYPE.STRING">
      <div class="c-tilte">
        <h2 class="tac">{{ $t('lang.open.confirmRequest') }}</h2>
        <p class="tac">{{ $t('lang.open.website') }}{{ message.hostname }}{{ $t('lang.open.requestWalletSign') }}</p>
      </div>
      <div class="bgfff c-body">
        <div class="c-account flex flex flex-ai-c flex-jc-b">
          <span>{{ $t('lang.connect.walletAccount') }}</span>
          <span>{{ message.account }}</span>
        </div>
        <div class="c-sign">
          <h3>{{ $t('lang.connect.dataToSign') }}</h3>
          <div>
            {{ message.input }}
          </div>
        </div>
        <div class="c-signa">
          <h2>{{ $t('lang.connect.autoSignTitle') }}</h2>
          <!-- <p>允许BCB钱包代表您自动签名交易</p> -->
          <div>
            <div class="flex flex-ai-c flex-jc-b" @click.stop="selectClick">
              <span>{{ selOption.label }}</span>
              <span></span>
            </div>
            <div
              class="select-pop"
              :class="{ active: popShow }"
              v-click-outside="onClickoutside1"
            >
              <span
                v-for="(item, index) in optionArr"
                :key="index"
                @click="autoSignSelect(item)"
                class="cur-p"
                >{{ item.label }}</span
              >
            </div>
          </div>
        </div>
        <div class="c-button flex flex-jc-b">
          <div @click="reject">{{ $t('lang.connect.reject') }}</div>
          <div @click="accept">{{ $t('lang.connect.accept') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { CONFIRMATION_TYPE } from "@bcblink/lib/constants";
import { directive as clickOutside } from "v-click-outside-x";
export default {
  directives: { clickOutside },
  data() {
    let _this = this;
    return {
      tabArr: [this.$t('lang.connect.details'), this.$t('lang.connect.signedData')],
      selTabName: this.$t('lang.connect.details'),
      funArr: [],
      message: {
        type: null,
        result: "",
        hostname: "",
        account: ""
	  },
	  CONFIRMATION_TYPE,
      pay: 0,
      selOption: {
        label: this.$t('lang.connect.noAutoSign'),
        status: 0
      },
      optionArr: [
        { label: this.$t('lang.connect.noAutoSign'), status: 0 },
        { label: this.$t('lang.connect.autoSignForThirtyMins'), status: 0.5 },
        { label: this.$t('lang.connect.autoSignForOneHour'), status: 1 },
        { label: this.$t('lang.connect.autoSignForOneDay'), status: 24 }
      ],
      popShow: false
    };
  },
  created() {
    this.initData();
  },
  methods: {
    autoSignSelect(item) {
      this.selOption = item;
      this.popShow = false;
    },
    selectClick() {
      this.popShow = !this.popShow;
    },
    async initData() {
      let messages = await this.PopupAPI.getConfirmations();
      if (!Array.isArray(messages)) return;
      this.message = messages[messages.length - 1].confirmation;
      if (this.message.type === CONFIRMATION_TYPE.TRANSACTION) {
        let arrPay = [];
        this.message.input.cost.forEach((item, index) => {
          if (item.value && item.symbol) {
            arrPay.push(this.scientificToNumber(item.value, 9) + ' ' + item.symbol);
          }
        });
        this.pay = arrPay.join(", ");
        let calls = this.message.input.calls;
        calls.forEach((item, index) => {
          let params = {};
          params.funName = item.method;
          params.contract = item.contract;
          params.json = JSON.stringify(item.params);
          params.active = false;
          this.funArr.push(params);
        });
      }
    },

    scientificToNumber(num, digits) {
      // 正则匹配小数科学记数法
      if (/^(\d+(?:\.\d+)?)(e)([\-]?\d+)$/.test(num)) {
        // 正则匹配小数点最末尾的0
        var temp = /^(\d{1,}(?:,\d{3})*\.(?:0*[1-9]+)?)(0*)?$/.exec(
          num.toFixed(digits)
        );
        if (temp) {
          return temp[1];
        } else {
          return num.toFixed(digits);
        }
      } else {
        return "" + num;
      }
    },
    reject() {
      this.PopupAPI.rejectConfirmation();
    },
    accept() {
      this.PopupAPI.setAutoSignSettings({
          fromTime: Date.now(),
          duration: this.selOption.status * 60 * 60 * 1000 // ms
      });
      this.PopupAPI.acceptConfirmation();
    },
    tabClick(item) {
      this.selTabName = item;
    },
    singleClick(item, index) {
      // this.funArr.forEach((sitem,sindex) =>{
      // 	sitem.active =false
      // })
      this.funArr[index].active = !this.funArr[index].active;
    },
    onClickoutside() {
      this.funArr.forEach((sitem, sindex) => {
        sitem.active = false;
      });
    },
    onClickoutside1() {
      this.popShow = false;
    }
  }
};
</script>
<style lang="stylus">
.connect-all
	width:100%
	height:100%
	.connectDetail
		width:100%;
		height:100%;
		overflow:hidden;
		.c-tilte
			h2
				font-size: 20px;
				color: #545A6D;
				font-weight:bold;
				line-height:28px;
				margin-top:16px;
			p
				color: #7C8297;
				line-height:20px;
		.c-body
			height: calc(100% - 75px);
		.c-account
			background: #F0F0F0;
			border-radius: 0 0 14px 14px;
			height:100px;
			padding:7px 43px 0 46px;
			margin-bottom:12px;
			margin-top:10px;
			>div
				border-bottom:1px solid #D5DBE6;
				height:45px;
				span
					&:first-child
						color: #545A6D;
						font-weight: bold;
					&:last-child
						color: #444;
				img
					width:11px;
					height:12px;
					margin-right:5px;
				&:last-child
					border-bottom:none

		.c-tab
			width:208px;
			height:36px;
			background: #F7F8FA;
			border-radius: 11px;
			padding:0 3px;
			margin:0 auto 12px;
			span
				width:90px;
				height:32px;
				line-height:32px;
				text-align:center;
				color: #444444;
				border-radius: 11px;
				&.active
					background: #006FFF;
					color:#fff;
		.c-fun
			background: #F7F8FA;
			border-radius: 6px;
			width:336px;
			height:120px;
			padding:0 16px 0 14px;
			margin:0 auto 5px;
			>div
				border-bottom:1px solid #D5DBE6;
				// line-height:30px;
				position:relative;

				>div
					&:first-child
						border-bottom:1px solid #fff
						line-height:30px
					&:nth-child(2)
						font-size:12px
						line-height:30px
				&:last-child
					border-bottom:none
				.c-pop-box
					position:absolute;
					top:58px;
					padding:12px;
					background: #F1F1F1;
					border: 1px solid #E3E3E3;
					border-radius: 0 0 6px 6px;
					word-break:break-all;
					overflow-y:auto;
					z-index:2;
					line-height:17px;
					width:306px;
					height:70px;
		.c-button
			width:299px;
			margin:0 auto;
			div
				border-radius: 4px;
				width:128px;
				height:48px;
				line-height:48px;
				font-size: 16px;
				font-weight:bold;
				text-align:center;
				cursor:pointer;
				&:first-child
					background:#fff;
					border:1px solid #0195FF;
					color: #0195FF;
				&:last-child
					background: #0195FF;
					color:#fff
		.triggle
			border-right: 1px solid #444;
			border-bottom: 1px solid #444;
			width: 8px;
			height: 8px;
			transform: rotate(45deg);
			margin-bottom: 5px;
			margin-left:10px;
	.connect
		width:100%;
		height:100%;
		overflow:hidden;
		.c-tilte
			h2
				font-size: 20px;
				color: #545A6D;
				font-weight:bold;
				line-height:28px;
				margin-top:16px;
			p
				color: #7C8297;
				line-height:20px;
		.c-body
			height: calc(100% - 80px);
		.c-account
			background: #F0F0F0;
			border-radius: 0 0 14px 14px;
			height:55px;
			padding:0 43px 0 46px;
			margin-bottom:20px;
			margin-top:15px;
			span
				&:first-child
					color: #545A6D;
					font-weight:bold;
				&:last-child
					color: #444;
		.c-sign
			margin:0 auto 20px;
			h3
				font-size: 16px;
				color: #545A6D;
				line-height:22px;
				margin-left:18px;
				font-weight:bold;
				margin-bottom:15px;
			div
				width:336px;
				height:114px;
				padding:19px 13px 0 18px
				background: #F7F8FA;
				border: 1px solid #EDEDED;
				border-radius: 6px;
				word-break: break-all;
				color: #545A6D;
				margin:0 auto;
				overflow-y:auto;
		.c-button
			width:299px;
			margin:0 auto;
			div
				border-radius: 4px;
				width:128px;
				height:48px;
				line-height:48px;
				font-size: 16px;
				font-weight:bold;
				text-align:center;
				cursor:pointer;
				&:first-child
					background:#fff;
					border:1px solid #0195FF;
					color: #0195FF;
				&:last-child
					background: #0195FF;
					color:#fff
	.c-signa
		background: #F7F8FA;
		width: 336px;
		height: 90px;
		margin: 0 auto;
		padding: 11px 15px;
		margin-bottom: 70px;
		h2
			color: #545A6D;
			font-weight: bold;
			line-height: 20px;
			margin-bottom:12px;
		p
			color:#240000;
			line-height:20px;
			margin-bottom:12px;
		>div
			position:relative;
			>div
				&:first-child
					width:306px;
					height:36px;
					background: #FFFFFF;
					border: 1px solid #D3D1D1;
					border-radius: 4px;
					padding:0 8px;
					>span
						&:first-child
							color: #545A6D;
						&:last-child
							border-top:8px solid #D8D8D8;
							border-bottom:8px solid transparent;
							border-left:6px solid transparent
							border-right:6px solid transparent
							margin-top: 5px;
				&:last-child
					background: #FFFFFF;
					border: 1px solid #D3D1D1;
					box-shadow: 0 2px 4px 0 rgba(235,235,235,0.50);
					border-radius: 4px;
					color: #545A6D;
					z-index:2;
					transition:all 0.3s;
					display:none;
					position:absolute;
					width:100%;
					&.active
						display:block;
					>span
						display:block;
						height:36px;
						line-height:36px;
						border-bottom: 1px solid #D3D1D1;
						padding:0 8px;
						color: #7C8297;
						&:last-child
							border-bottom: none;
</style>
