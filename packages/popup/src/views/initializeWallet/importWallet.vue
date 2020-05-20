<template>
  <div class="importWallet pos-r">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../assets/images/open/back.png" />
      <span class="color999">{{ $t("lang.createWallet.back") }}</span>
    </div>
    <div class="iw-tab flex flex-ai-c flex-jc-b bgfff m-auto">
      <span
        v-for="(item, index) in tabArr"
        :key="index"
        class="tac cur-p"
        :class="{ active: tabActiveIdx == item }"
        @click="tabActive(item, index)"
        >{{ item }}</span
      >
    </div>

	<div v-if="tabActiveIdx == $t('lang.importWallet.mnemonic')"
        class="width314 m-auto network">
		<div
			@click.stop="openNetwork">
			<label>{{ $t('lang.createWallet.selectNetwork') }}</label>
			<span class="select-network" v-if="selectedNetwork">{{
				networkMode === 1
					? selectedNetwork.network
					: selectedNetwork.network === selectedNetwork.chain
					? selectedNetwork.network
					: selectedNetwork.network +
						'.' + selectedNetwork.chain
			}}</span>
		</div>
	</div>

    <div class="bgfff iw-body">
      <textarea
        v-if="tabActiveIdx == $t('lang.importWallet.privateKey')"
        :placeholder="$t('lang.importWallet.enterPrivateKey')"
        class="width314 m-auto db"
        v-model="form.textInput"
        spellcheck="false"
      ></textarea>
      <textarea
        v-if="tabActiveIdx == $t('lang.importWallet.keystore')"
        :placeholder="$t('lang.importWallet.enterKeystore')"
        class="width314 m-auto db"
        v-model="form.textInput"
        spellcheck="false"
      ></textarea>
      <textarea
        v-if="tabActiveIdx == $t('lang.importWallet.mnemonic')"
        :placeholder="$t('lang.importWallet.enterMnemonic')"
        class="width314 m-auto db"
        v-model="form.textInput"
        spellcheck="false"
      ></textarea>
      <div
        class="input-line flex flex-ai-c m-auto width314"
        v-if="tabActiveIdx == $t('lang.importWallet.keystore')"
      >
        <input
          type="password"
          name=""
          :placeholder="$t('lang.importWallet.enterKeystorePwd')"
          v-model="form.pwd"
        />
      </div>
      <div class="input-line flex flex-ai-c width314 m-auto">
        <input
          type="text"
          name=""
          :placeholder="this.$t('lang.importWallet.enterNewWalletName')"
          v-model="form.walletName"
        />
      </div>
      <div class="pos-r m-auto width314" v-if="tabActiveIdx == $t('lang.importWallet.mnemonic')">
        <div class="input-line flex flex-ai-c width314">
          <input
            type="password"
            name=""
            :placeholder="$t('lang.importWallet.enterNewPwd')"
            v-model="form.newPwd"
          />
        </div>
        <div class="pos-a flex flex-ai-c fs12 rightTip">
          <img src="../../assets/images/open/right.png" />
          <span>{{ $t('lang.createWallet.enterRules') }}</span>
        </div>
      </div>

      <div class="pos-r m-auto width314" v-if="tabActiveIdx == $t('lang.importWallet.mnemonic')">
        <div class="input-line flex flex-ai-c width314">
          <input
            type="password"
            name=""
            :placeholder="$t('lang.importWallet.confirmPwd')"
            v-model="form.rePwd"
          />
        </div>
        <div class="pos-a flex flex-ai-c wrongTip fs12" v-show="isError">
          <img src="../../assets/images/open/wrong.png" />
          <span>{{ $t('lang.createWallet.pwdNotSame') }}</span>
        </div>
      </div>

      <div
        class="threeBlueBtn colorfff tac cur-p fs16 m-auto flex flex-ai-c flex-jc-c"
        @click="sure"
      >
        <span v-if="langArr">{{ $t('lang.importWallet.importing') }}</span>
        <span v-if="!langArr">{{ $t('lang.importWallet.import') }}</span>
        <mt-spinner
          type="snake"
          v-if="langArr"
          style="margin-left:10px"
        ></mt-spinner>
      </div>
    </div>

    <NetworkTree
        v-model="isNetworkShow"
        :network-mode="networkMode"
        :selected-network="selectedNetwork"
        @change="handleNetworkChange"
    />
  </div>
</template>

<script>
import Vue from 'vue';
import { Toast, Spinner, MessageBox } from 'mint-ui';
import { directive as clickOutside } from 'v-click-outside-x';
import Utils from '../../utils/utils.js';

import NetworkTree from '../../components/network-tree';

Vue.component(Spinner.name, Spinner);

export default {
  name: "home",
  components: { NetworkTree },
  directives: { clickOutside },
  data() {
    return {
      tabArr: [],
      tabActiveIdx: "",
      form: {
        textInput: "",
        walletName: "",
        pwd: "",
        newPwd: "",
        rePwd: ""
      },
      type: "",
      isError: false,
      walletArr: [],
      importError: false,
      langArr: false,

      isNetworkShow: false, // 是否显示网络树形结构组件
      networkMode: Number(process.env.VUE_APP_NETWORK_MODE), // 网络模式：1展示网络列表；2展示网络列表及链列表
      selectedNetwork: null // 已选择网络（{network: string, chain: string}）
    };
  },
  created() {
    let _this = this;
    _this.type = _this.$route.params.type;
    if (_this.type == "fromMain") {
      _this.tabArr = [this.$t('lang.importWallet.privateKey'), this.$t('lang.importWallet.keystore')];
    } else {
      _this.tabArr = [this.$t('lang.importWallet.mnemonic')];
    }
    _this.tabActiveIdx = this.tabArr[0];
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
  mounted() {
    this.getSelectedNetwork();
  },
  computed: {
  },
  methods: {
    back() {
      this.$router.back();
    },
    tabActive(item, index) {
      this.tabActiveIdx = item;
    },
    async getSelectedNetwork() {
        // 接口返回类型：{network: string, chain: string}
		try {
			this.selectedNetwork = await this.PopupAPI.getSelectedChain();
		} catch (error) {
			MessageBox.alert(error.message);
		}
    },
    // 打开网络树形结构组件
    openNetwork() {
        this.isNetworkShow = true;
    },
    // 处理网络树形结构组件change事件（data: {network: string, chain: string}）
    handleNetworkChange(data) {
        this.selectedNetwork = data;
    },
    sure() {
      let _this = this;
      if (_this.langArr == true) {
        Toast({
          message: this.$t("lang.importWallet.importingWait")
        });
        return;
      }

      if (_this.tabActiveIdx == this.$t("lang.importWallet.mnemonic")) {
        if (!_this.form.textInput) {
          Toast({
            message: this.$t("lang.importWallet.enterMnemonic")
          });
          return;
        }
        if (!_this.form.walletName) {
          Toast({
            message: this.$t("lang.importWallet.enterNewWalletName")
          });
          return;
        }
        if (!_this.form.newPwd) {
          Toast({
            message: this.$t("lang.importWallet.enterNewPwd")
          });
          return;
        }
        if (!_this.form.rePwd) {
          Toast({
            message: this.$t("lang.importWallet.enterConfirmPwd")
          });
          return;
        }
        if (_this.form.newPwd.length < 8) {
          Toast({
            message: this.$t("lang.createWallet.atLeastEight")
          });
          return;
        }
        let arr = [
          new RegExp("[0-9]"),
          new RegExp("[a-z]"),
          new RegExp("[A-Z]")
        ];
        let result = arr.reduce((total, _v) => {
          if (_v.test(_this.form.newPwd)) {
            total += 1;
          }
          return total;
        }, 0);
        if (result < 2) {
          Toast({
            message: this.$t("lang.createWallet.atLeastTwoType")
          });
          return false;
        }
        if (_this.form.newPwd !== _this.form.rePwd) {
          Toast({
            message: this.$t("lang.createWallet.pwdNotSame")
          });
          _this.isError = true;
          return;
        }
        _this.langArr = true;
        // console.log(_this.form.textInput);
        if (!_this.importError) {
          _this.PopupAPI.checkMnemonic(_this.form.textInput.trim()).then(res => {
            if (res) {
              _this.PopupAPI.setPassword(_this.form.newPwd).then(res => {
                _this.PopupAPI.importMnemonic(
                  _this.form.textInput.trim(),
                  _this.form.walletName
                ).then(res => {
                  _this.PopupAPI.setSettings({ mnemSaved: true }).then(res => {});
                    _this.langArr = false;
                }).catch(err => {
				          console.log('importMnemonic error:', err);
                  Toast({
                    message: err.message
                  });
                });
              }).catch(err => {
				        console.log('setPassword error:', err);
                _this.langArr = false;
                Toast({
                  message: err.message
                });
              });
            } else {
              _this.importError = true;
              _this.langArr = false;
              Toast({
                message: this.$t('lang.importWallet.mnemonicError')
              });
            }
          }).catch(err => {
            Toast({
              message: err.message
            });
          });
        } else {
          _this.PopupAPI.checkMnemonic(_this.form.textInput.trim()).then(res => {
            if (res) {
              _this.PopupAPI.importMnemonic(
                _this.form.textInput.trim(),
                _this.form.walletName
              ).then(res => {
                  _this.langArr = false;
                  _this.PopupAPI.setSettings({ mnemSaved: true }).then(res => {});
              }).catch(err => {
                Toast({
                  message: err.message
                });
              });
            } else {
              this.importError = true;
              _this.langArr = false;
              Toast({
                message: this.$t('lang.importWallet.mnemonicError')
              });
            }
          });
        }
      } else if (_this.tabActiveIdx == this.$t('lang.importWallet.privateKey')) {
        if (!_this.form.textInput) {
          Toast({
            message: this.$t('lang.importWallet.enterPrivateKey')
          });
          return;
        }
        if (!_this.form.walletName) {
          Toast({
            message: this.$t('lang.importWallet.enterNewWalletName')
          });
          return;
        }
        for (let i = 0; i < _this.walletArr.length; i++) {
          if (_this.walletArr[i].walletName == _this.form.walletName) {
            Toast({
              message: this.$t('lang.createWallet.walletNameExist')
            });
            return;
          }
        }
        _this.langArr = true;
        _this.PopupAPI.importAccount(
          _this.form.textInput.trim(),
          _this.form.walletName
        ).then(res => {
          Toast({
            message: this.$t('lang.importWallet.importPrivateKeySuccess'),
            position: "top",
            iconClass: "mintui mintui-success"
          });
          _this.langArr = false;
          _this.$router.push("/main");
        }).catch(err => {
          _this.langArr = false;
          // Toast({
          //   message: this.$t('lang.importWallet.privateKeyError')
          // });
          Toast({ message: err.message });
        });
      } else {
        if (!_this.form.textInput) {
          Toast({
            message: this.$t('lang.importWallet.enterKeystore')
          });
          return;
        }
        if (!_this.form.walletName) {
          Toast({
            message: this.$t('lang.importWallet.enterNewWalletName')
          });
          return;
        }
        if (!_this.form.pwd) {
          Toast({
            message: this.$t('lang.importWallet.enterKeystorePwd')
          });
          return;
        }
        for (let i = 0; i < _this.walletArr.length; i++) {
          if (_this.walletArr[i].walletName == _this.form.walletName) {
            Toast({
              message: this.$t('lang.createWallet.walletNameExist')
            });
            return;
          }
        }
        _this.langArr = true;
        _this.PopupAPI.importJsonWallet(
          _this.form.textInput,
          _this.form.pwd,
          _this.form.walletName
        ).then(res => {
          Toast({
            message: this.$t('lang.importWallet.importKeystoreSuccess'),
            position: "top",
            iconClass: "mintui mintui-success"
          });
          _this.langArr = false;
          _this.$router.push("/main");
        }).catch(err => {
          _this.langArr = false;
          // Toast({
          //   message: this.$t('lang.importWallet.keystoreOrPwdError')
          // });
          Toast({ message: err.message });
        });
      }
    }
  }
};
</script>
<style lang="stylus">
@import './../../assets/css/var.styl';

.importWallet
	width:100%
	height:100%
	padding-top: 49px
	.iw-tab
		width: fit-content;
		height: 36px;
		border-radius: 11px;
		margin-bottom:20px
		padding:0 2px
		span
			width:90px
			height:32px
			line-height:32px
			&.active
				background: #006FFF;
				border-radius: 11px;
				color: #fff;
	.network
		margin-bottom:10px
		label
			padding-right:12px
	.iw-body
		padding-top:24px
		height: 400px;
		textarea
			background: #f7f7f7;
			border: 1px solid #EDEDED;
			border-radius: 4px;
			height: 100px;
			padding-top: 15px;
			padding-left: 16px;
			margin-bottom:15px
		.input-line
			margin-bottom:28px
		.threeBlueBtn
			margin-top:55px

	.select-network
		position: relative;
		display: inline-block;
		padding: 6px 30px 6px 8px;
		border: 1px solid lightgray;
		border-radius: 4px;
		cursor: pointer;
		opacity: 1;

		&:after
			position: absolute;
			top: 6px;
			right: 8px;
			display: block;
			width: 8px;
			height: 8px;
			content: '';
			border-right: 2px solid gray;
			border-bottom: 2px solid gray;
			-webkit-transform: rotate(45deg);
			-moz-transform: rotate(45deg);
			-ms-transform: rotate(45deg);
			-o-transform: rotate(45deg);
			transform: rotate(45deg);

		&:hover
			opacity: 0.8;
</style>
