<template>
  <div class="walletDetail pos-r">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../../assets/images/open/back.png" />
      <span class="color999">{{ $t('lang.createWallet.back') }}</span>
    </div>
    <div class="save pos-a cur-p" @click="save">{{ $t('lang.walletDetail.save') }}</div>
    <div class="bgfff wd-cont m-auto">
      <h2>{{ $t('lang.walletDetail.walletName') }}</h2>
      <div class="input-line flex flex-ai-c m-auto width314">
        <input
          type="text"
          name=""
          :placeholder="$t('lang.walletDetail.walletName')"
          v-model="walletName"
        />
      </div>
      <h2>{{ $t('lang.walletDetail.walletAddr') }}</h2>
      <p>{{ walletAddr }}</p>
      <div class="flex flex-jc-c tab-all">
        <div v-for="(item, index) in detailArr" :key="index" class="d-tab flex">
          <div class="cur-p" @click="clickEvery(item, index)">
            <!-- <img src="../../../assets/images/main/detail_0.png" v-if="index==0"> -->
            <img
              src="../../../assets/images/main/detail_1.png"
              v-if="index == 0"
            />
            <img
              src="../../../assets/images/main/detail_2.png"
              v-if="index == 1"
            />
            <p>{{ item }}</p>
          </div>
          <div class="wline" v-if="index != detailArr.length - 1"></div>
        </div>
      </div>
      <div
        class="threeBlueBtn colorfff tac cur-p fs16 m-auto"
        @click="deleteWallet"
      >
        {{ $t('lang.walletDetail.deleteWallet') }}
      </div>
    </div>
    <mt-popup v-model="popupKeyVisible" class="ex-keystore">
      <div>
        <div class="pop-head tac">{{ $t('lang.walletDetail.exportKeystore') }}</div>
        <img
          src="../../../assets/images/main/close.png"
          class="close pos-a cur-p"
          @click="close"
        />
        <div class="pop-body m-auto">
          <div class="line"></div>
          <div class="key color999 fs12">{{ keystore }}</div>
          <div
            class="threeBlueBtn colorfff tac cur-p bold"
            @click="doCopy(keystore)"
          >
            {{ $t('lang.walletDetail.copy') }}
          </div>
        </div>
      </div>
    </mt-popup>
    <mt-popup v-model="popupSyVisible" class="ex-keystore ex-sy">
      <div>
        <div class="pop-head tac">{{ $t('lang.walletDetail.exportPrKey') }}</div>
        <img
          src="../../../assets/images/main/close.png"
          class="close pos-a cur-p"
          @click="close"
        />
        <div class="pop-body m-auto">
          <div class="line"></div>
          <div class="notice color999 fs12">
            {{ $t('lang.walletDetail.exportNote') }}
          </div>
          <div class="key color999 fs12">{{ privateKey }}</div>
          <div
            class="threeBlueBtn colorfff tac cur-p bold"
            @click="doCopy(privateKey)"
          >
            {{ $t('lang.walletDetail.copy') }}
          </div>
        </div>
      </div>
    </mt-popup>
    <mt-popup v-model="deleteShow" class="ex-keystore delete-pop">
      <div>
        <div class="pop-head tac m-auto bold">
          {{ $t('lang.walletDetail.sureSave') }}
        </div>
        <div class="pop-body m-auto">
          <!-- <div class="line"></div> -->
          <div class="de-msg color999 tac">{{ $t('lang.walletDetail.deleteText') }}</div>
          <div class="del-btn flex flex-jc-b">
            <div class="tac cur-p" @click="confirmDel">{{ $t('lang.walletDetail.confirm') }}</div>
            <div class="tac cur-p" @click="cancelDel">{{ $t('lang.walletDetail.cancel') }}</div>
          </div>
        </div>
      </div>
    </mt-popup>
    <!-- <mt-popup
	  v-model="inputPsdShow" class="ex-keystore delete-pop input-pop">
	    <div>
	    	<div class="pop-head tac m-auto bold">确认密码</div>
	    	<div class="pop-body m-auto">
	    		<div class="input flex flex-ai-c m-auto">
	    			<input type="password" name="" placeholder="请输入密码" v-model="psd">
	    		</div>
	    		<div class="del-btn flex flex-jc-b m-auto">
	    			<div class="tac" @click="comfirmPsd">确认</div>
	    			<div class="tac" @click="cancelPsd">取消</div>
	    		</div>
	    	</div>
	    </div>
	</mt-popup> -->
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from "@/components/HelloWorld.vue";
// import { XDialog } from 'vux'
import Vue from "vue";
import { Toast } from "mint-ui";
import VueClipboard from "vue-clipboard2";
Vue.use(VueClipboard);
export default {
  name: "walletDetail",
  components: {
    // XDialog
  },
  data() {
    return {
      detailArr: [/*'备份助记词',*/ this.$t('lang.walletDetail.exportPrKey'), this.$t('lang.walletDetail.exportKeystore')],
      isShow: false,
      hideOnBlur: true,
      popupKeyVisible: false,
      popupSyVisible: false,
      deleteShow: false,
      inputPsdShow: false,
      psd: "",
      walletName: "",
      walletAddr: "",
      encPrivkey: "",
      keystore: "",
      privateKey: "",
      walletIndex: "",
      wallet_local: {},
      wallet_import: [],
      password: "",
      wallet: {}, //钱包对象
      walletArr: []
    };
  },
  created() {
    let _this = this;
    let info = _this.$route.params.walletInfo;
    _this.walletName = info.walletName;
    _this.walletAddr = info.walletAddr;
    _this.PopupAPI.getAccounts().then(accounts => {
      let arr = [];
      for (let key in accounts) {
        let param = {};
        param.walletAddr = key;
        param.walletName = accounts[key].name;
        param.type = accounts[key].type;
        arr.push(param);
      }
      _this.walletArr = arr;
    });
  },
  methods: {
    doCopy(text) {
      this.$copyText(text).then(() => {
        Toast({
          message: this.$t('lang.main.copySuccess'),
          position: "top",
          iconClass: "mintui mintui-success"
        });
      });
    },
    back() {
      this.$router.back();
    },
    clickEvery(item, index) {
      let _this = this,
        wallet;
      if (index == 0) {
        _this.popupSyVisible = true;
        this.PopupAPI.exportAccount().then(res => {
          _this.privateKey = res.privateKey;
        });
      } else {
        this.PopupAPI.exportJsonWallet().then(res => {
          _this.keystore = res;
        });
        _this.popupKeyVisible = true;
      }
    },
    save() {
      let _this = this;
      for (let i = 0; i < _this.walletArr.length; i++) {
        if (_this.walletArr[i].walletAddr != _this.walletAddr) {
          if (_this.walletArr[i].walletName == _this.walletName) {
            Toast({
              message: this.$t('lang.createWallet.walletNameExist')
            });
            return;
          }
        }
      }
      if (_this.walletName.trim() == "") {
        Toast({
          message: this.$t("lang.walletDetail.walletNameNotEmpty")
        });
        return;
      }
      this.PopupAPI.setAccountName(_this.walletAddr, _this.walletName).then(
        res => {
          Toast({
            message: this.$t("lang.walletDetail.saveSuccess"),
            position: "top",
            iconClass: "mintui mintui-success"
          });
          setTimeout(function() {
            _this.$router.push("/main");
          }, 1000);
        }
      );
    },
    deleteWallet() {
      if (this.walletArr.length == 1) {
        Toast({
          message: this.$t("lang.walletDetail.atLeastOneAddr")
        });
        return;
      }
      this.deleteShow = true;
    },
    close() {
      this.popupKeyVisible = false;
      this.popupSyVisible = false;
    },
    confirmDel() {
      let _this = this;
      _this.PopupAPI.deleteAccount(_this.walletAddr).then(res => {
        _this.deleteShow = false;
        Toast({
          message: this.$t("lang.walletDetail.deleteSuccess"),
          position: "top",
          iconClass: "mintui mintui-success"
        });
        setTimeout(function() {
          _this.$router.push("/main");
        }, 1000);
      });
    },
    cancelDel() {
      this.deleteShow = false;
    }
  }
};
</script>
<style lang="stylus">
.walletDetail
	width:100%
	height:100%
	padding-top:70px
	.save
		right:22px
		top:16px
	.wd-cont
		background: #FFFFFF;
		box-shadow: 0 0 4px 0 #F7F8FA;
		border-radius: 14px 14px 0 0;
		height:526px
		padding-top:26px
		>h2
			padding-left:23px
			margin-bottom:15px
		>p
			margin-bottom:62px
			font-size:12px
			padding-left:23px
			font-weight:bold
		.input-line
			padding-left:9px
			margin-bottom:35px
		.tab-all
			margin-bottom:121px
			.d-tab
				img
					display:block
					margin:0 auto
				&:first-child
				&:last-child
					img
						margin-bottom:13px
					&:first-child
						>div
							&:first-child
								// margin-left: 30px;
								margin-right: 58px;
					&:last-child
						>div
							&:first-child
								margin-left:40px
				&:nth-child(1)
					>div
						&:first-child
							margin-left:28px
							margin-right:26px
					img
						margin-bottom:9px
				p
					line-height:20px
				.wline
					width: 1px;
					height: 28px;
					background: #ECEEEF;
					margin-top: 9px;
	.ex-keystore
		background: #FFFFFF;
		border-radius: 11px;
		width:290px
		.pop-head
			line-height: 20px;
			margin-top: 11px;
			margin-bottom: 8px;
		.close
			right:17px
			top:13px
		.pop-body
			width:246px
			.notice
				line-height:17px
				margin-top:9px
				margin-bottom:7px
			.key
				background: #F7F7F7;
				border: 1px solid #EDEDED;
				border-radius: 4px;
				padding:9px
				line-height:17px
				margin-top:20px
				margin-bottom:20px
				word-break: break-all;
				height: 70px;
				overflow: auto;
			.threeBlueBtn
				width:100%
				height:36px
				line-height:36px
		&.ex-sy
			padding: 10px;
			.key
				margin-top:7px
				margin-bottom:25px
		&.delete-pop
		.input-pop
			padding: 10px;
			.pop-head
				width:196px
				line-height:20px
				word-break:break-all
				margin-top:16px
				margin-bottom:19px
			.pop-body
				width:224px
				.de-msg
					margin-bottom:31px
					line-height:20px
				.del-btn
					>div
						width:94px
						height:36px
						line-height:36px
						border-radius:8px
						&:first-child
							background: #0195FF;
							color: #fff;
						&:last-child
							background: #D4E7FF;
							color: #0195FF;
			&.input-pop
				.pop-body
					width:246px
				.input
					background: #F7F7F7;
					border: 1px solid #EDEDED;
					border-radius: 4px;
					padding-left:12px
					padding-right:12px
					width:100%
					height:42px
					margin-bottom:28px
					margin-top:22px
					input
						width:100%
				.del-btn
					width:224px
</style>
