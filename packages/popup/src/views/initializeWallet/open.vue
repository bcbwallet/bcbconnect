<template>
  <div class="open pos-r">
    <div class="lang-set pos-a flex flex-ai-c" >
      <div class="flex flex-ai-c" @click.stop="langEv">
        <div class="flex flex-ai-c cur-p">
          <span class="fs12 color000">{{$i18n.locale=='zh-CN' ? '中文' : 'English'}}</span>
          <span></span>
        </div>
      </div>
      <div class="pos-a pop-lang" v-if="langPopShow" v-click-outside="onClickoutside">
        <ul>
          <li @click="selLangEv('en-US')"><span>English</span></li>
          <li @click="selLangEv('zh-CN')"><span>中文</span></li>
        </ul>
      </div>
    </div>
    <div class="pos-a host-name" v-if="hostname">
      <p>{{ $t("lang.open.confirmRequest") }}</p>
      <p>{{ $t("lang.open.website") }}{{ hostname }}{{ $t("lang.open.requestWalletSign") }}</p>
    </div>
    <div class="new-open pos-r" v-if="!ifHasLogin">
      <img src="../../assets/images/open/open_icon.png" class="db m-auto" />
      <h2 class="fs22 m-auto tac bold">{{ $t("lang.open.brand") }}</h2>
      <div
        class="open-next m-auto flex flex-ai-c flex-jc-c pos-a cur-p"
        @click="gotoNewWallet"
      >
        <span class="fs18 colorfff">{{ $t("lang.open.open") }}</span>
        <img src="../../assets/images/open/next.png" />
      </div>
    </div>
    <div class="go-login bgfff" v-if="ifHasLogin">
      <img
        src="../../assets/images/open/open_icon.png"
        class="db m-auto hasLogin_img"
      />
      <h2 class="color444 fs20 m-auto tac color000">{{ $t("lang.open.brand") }}</h2>
      <div class="input-line flex flex-ai-c m-auto">
        <input
          type="password"
          name=""
          :placeholder="$t('lang.open.enterPwd')"
          v-model="psd"
          @keyup.enter="gotoLogin"
        />
      </div>
      <div
        class="login m-auto colorfff tac cur-p threeBlueBtn flex flex-ai-c flex-jc-c"
        @click="gotoLogin"
      >
        <span v-if="isProcessing">{{ $t("lang.open.loggingIn") }}</span>
        <span v-if="!isProcessing">{{ $t("lang.open.login") }}</span>
        <mt-spinner
          type="snake"
          v-if="isProcessing"
          style="margin-left:10px"
        ></mt-spinner>
      </div>
      <div class="flex flex-jc-b color999 btn-all m-auto">
        <span class="cur-p" @click="selActive = true">{{ $t("lang.open.createWallet") }}</span>
        <span class="cur-p" @click="importActive = true">{{ $t("lang.open.importWallet") }}</span>
      </div>
    </div>
    <mt-popup v-model="selActive" position="bottom" style="height: initial;">
      <div>
        <div class="pop-head bold tac fs16 color000">
          {{ $t("lang.open.reCreateText") }}
        </div>
        <div class="pop-body m-auto">
          <div class="p-body-1 flex flex-ai-c" @click="agree">
            <span class="no-agree" v-if="!isActive"></span>
            <span class="active flex" v-if="isActive">
              <span></span>
            </span>
            <span>{{ $t("lang.open.agreeCreateText") }}</span>
          </div>
          <div
            class="tac cur-p fs16 btn-create"
            :class="{ 'know-active': isActive }"
            @click="gotoCreate"
          >
            {{ $t("lang.open.create") }}
          </div>
          <div class="re-think flex flex-ai-c flex-jc-c cur-p">
            <span></span>
            <span @click="reThink">{{ $t("lang.open.reThink") }}</span>
            <span></span>
          </div>
        </div>
      </div>
    </mt-popup>
    <mt-popup v-model="importActive" position="bottom" style="height: initial;">
      <div>
        <div class="pop-head bold tac fs16 color000">
          {{ $t("lang.open.reImportText") }}
        </div>
        <div class="pop-body m-auto">
          <div class="p-body-1 flex flex-ai-c" @click="agree">
            <span class="no-agree" v-if="!isActive"></span>
            <span class="active flex" v-if="isActive">
              <span></span>
            </span>
            <span>{{ $t("lang.open.agreeCreateText") }}</span>
          </div>
          <div
            class="tac cur-p fs16 btn-create"
            :class="{ 'know-active': isActive }"
            @click="gotoImport"
          >
            {{ $t("lang.open.importWallet") }}
          </div>
          <div class="re-think flex flex-ai-c flex-jc-c cur-p">
            <span></span>
            <span @click="reThink">{{ $t("lang.open.reThink") }}</span>
            <span></span>
          </div>
        </div>
      </div>
    </mt-popup>
  </div>
</template>

<script>
import { Toast, Spinner } from "mint-ui";
import { directive as clickOutside } from "v-click-outside-x";
export default {
  name: "open",
  directives: { clickOutside },
  components: {
    "mt-spinner": Spinner
  },
  data() {
    return {
      ifHasLogin: false,
      checkValue: [],
      options: [0],
      selActive: false,
      importActive: false,
      isActive: false,
      psd: "",
      isProcessing: false,
      langPopShow:false,
    };
  },
  computed: {
    hostname() {
      return this.$store.state.hostname;
    },
    state() {
      return this.$store.state.appState;
    }
  },
  created() {
    let _this = this;
    let state = _this.state;
    console.log("open state: ", state);
    // if (state == -1) {
    //   _this.PopupAPI.requestState().then(appState => {
    //     _this.initState(appState);
    //   });
    // } else {
      _this.initState(state);
    // }
  },
  methods: {
    onClickoutside(){
      this.langPopShow = false
    },
    langEv(){
      this.langPopShow = true
    },
    selLangEv(lang){
      let _this = this;
      _this.$i18n.locale = lang
      _this.PopupAPI.setLanguage(lang).then(res => {});
      _this.langPopShow = false
    },
    initState(state) {
      let _this = this;
      if (state == 1) {
        _this.ifHasLogin = true;
      }
      // if (state == 5) {
      //   _this.$router.push("/main");
      // }
      // if ((state = 0)) {
      //   localStorage.clear();
      // } else {
      //   localStorage.removeItem("initCoinArr");
      //   localStorage.removeItem("initialized");
      // }
    },
    gotoNewWallet() {
      this.$router.push("/terms");
    },
    gotoLogin() {
      let _this = this;
      if (!_this.psd) {
        Toast({
          message: this.$t("lang.open.enterPwd")
        });
        return;
      }
      if (_this.isProcessing == true) {
        Toast({
          message: this.$t("lang.open.creatingWait")
        });
        return;
      }
      _this.isProcessing = true;
      _this.PopupAPI.unlockWallet(this.psd)
        .then(res => {
          // if(_this.hostname){
          // 	_this.PopupAPI.acceptConfirmation()
          // }
          _this.isProcessing = false;
          _this.$store.commit("SET_HOSTNAME", "");
          // _this.$router.push("/main");
        })
        .catch(err => {
          _this.isProcessing = false;
          Toast({
            message: err
          });
        });
    },
    gotoCreate() {
      if (!this.isActive) {
        Toast({
          message: this.$t("lang.open.checkRiskItem"),
          position: "top"
        });
        return;
      }
      this.PopupAPI.purgeData().then(res => {
        this.$router.push("/createWallet/fromOpen");
      });
    },
    gotoImport() {
      if (!this.isActive) {
        Toast({
          message: this.$t("lang.open.checkRiskItem"),
          position: "top"
        });
        return;
      }
      this.PopupAPI.purgeData().then(res => {
        this.$router.push("/importWallet/fromTerms");
      });
    },
    agree() {
      this.isActive = !this.isActive;
    },
    reThink() {
      this.selActive = false;
      this.importActive = false;
    }
  }
};
</script>
<style lang="stylus">
@import './../../assets/css/var.styl';
.open
	width:100%
	height:100%
	.new-open,.go-login
		width:100%
		height:100%
		>img
			padding-top:108px
			&.hasLogin_img
				padding-top:108px
		.open-next
			background:$color0195FF
			box-shadow:0 4px 6px 0 $colorC8D4DA
			border-radius:30px
			width:230px
			height:60px
			left:0
			right:0
			bottom:50px
			>span
				margin-right:18px
		&.new-open
			background:url(../../assets/images/open/open_bg.png) no-repeat
			background-size:cover
		&.go-login
			.input-line
				margin-top:67px
			.login
				margin-top:39px;
			.btn-all
				width:300px
				margin-top: 77px;
	.pop-head
		width:290px
		margin: 30px auto 25px;
		line-height:22px
	.pop-body
		.p-body-1
			margin-bottom: 31px;
			.no-agree
				border: 1px solid #8D8E8F;
				border-radius: 4px;
				width: 18px;
				height: 18px;
				margin-right: 12px;
				margin-left: 3px;
			.active
				background: #656C7D;
				border-radius: 4px;
				width: 18px;
				height: 18px;
				margin-right: 12px;
				margin-left: 3px;
				span
					width: 11px;
					height: 7px;
					border: 2px solid #fff;
					border-top: none;
					border-right: none;
					transform: rotate(-45deg);
					margin-left: 3px;
					margin-top: 3px;

		.btn-create
			border: 1px solid #999999;
			border-radius: 11px;
			color: #8D8E8F;
			width:300px;
			height:48px;
			line-height:48px
			margin-bottom:32px
			&.know-active
				border: 1px solid #0195FF;
				color: #0195FF;
		.re-think
			margin-bottom:34px
			>span
				&:first-child
				&:last-child
					width: 106px;
					height: 1px;
					background: #ccc;
				&:nth-child(2)
					margin:0 15px
.host-name
	top:10px
	z-index: 10;
	width: 100%;
	text-align: center;
	p
		font-size:16px;
		&:last-child
			color:#7c8297
			line-height:26px
		&:first-child
			color:#240000
			font-weight:bold
			line-height:26px
</style>
