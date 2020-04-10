<template>
    <div class="createWallet bgfff pos-r">
        <div class="lang-set pos-a flex flex-ai-c">
            <div class="flex flex-ai-c" @click.stop="langEv">
                <div class="flex flex-ai-c cur-p">
                    <span class="fs12 color000">{{
                        $i18n.locale == 'zh-CN' ? '中文' : 'English'
                    }}</span>
                    <span></span>
                </div>
            </div>
            <div
                class="pos-a pop-lang"
                v-if="langPopShow"
                v-click-outside="onClickoutside"
            >
                <ul>
                    <li @click="selLangEv('en-US')"><span>English</span></li>
                    <li @click="selLangEv('zh-CN')"><span>中文</span></li>
                </ul>
            </div>
        </div>
        <div
            class="back pos-a flex flex-ai-c cur-p"
            @click="back"
            v-if="
                type == 'fromMain' ||
                    (type !== 'fromMain' && ifHasLogin == true)
            "
        >
            <img src="../../assets/images/open/back.png" />
            <span class="color999">{{ $t('lang.createWallet.back') }}</span>
        </div>
        <div class="createWallet-cont m-auto">
            <h2 class="fs24 color000">
                {{ $t('lang.createWallet.createWallet') }}
            </h2>

            <div v-if="type !== 'fromMain'" @click.stop="openNetwork">
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

            <div class="input-line flex flex-ai-c m-auto">
                <input
                    type="text"
                    name=""
                    :placeholder="$t('lang.createWallet.enterWalletName')"
                    v-model="formAll.walletName"
                    @keyup.enter="enterNameEv"
                />
            </div>
            <div class="pos-r" v-if="type !== 'fromMain'" style="margin-bottom: 42px;">
                <div class="input-line flex flex-ai-c m-auto">
                    <input
                        type="password"
                        name=""
                        :placeholder="$t('lang.createWallet.enterPwd')"
                        v-model="formAll.pwd"
                        @keyup.enter="agree"
                    />
                </div>
                <div class="pos-a flex flex-ai-c fs12 rightTip" style="bottom: -31px;">
                    <img src="../../assets/images/open/right.png" />
                    <span>{{ $t('lang.createWallet.enterRules') }}</span>
                </div>
            </div>
            <div class="pos-r" v-if="type !== 'fromMain'">
                <div class="input-line flex flex-ai-c m-auto">
                    <input
                        type="password"
                        name=""
                        :placeholder="$t('lang.createWallet.repeatPwd')"
                        v-model="formAll.rePwd"
                        @focus="pwdFocus"
                        @keyup.enter="agree"
                    />
                </div>
                <div
                    class="pos-a flex flex-ai-c wrongTip fs12"
                    v-show="isError"
                >
                    <img src="../../assets/images/open/wrong.png" />
                    <span>{{ $t('lang.createWallet.pwdNotSame') }}</span>
                </div>
            </div>
        </div>
        <div class="createWallet-foot m-auto">
            <div
                class="threeBlueBtn colorfff tac cur-p fs16"
                @click="create"
                v-if="type == 'fromMain'"
            >
                {{ $t('lang.createWallet.create') }}
            </div>
            <div
                class="threeBlueBtn colorfff tac cur-p fs16 flex flex-ai-c flex-jc-c"
                @click="agree"
                v-if="type !== 'fromMain'"
            >
                <span v-if="isProcessing">{{
                    $t('lang.createWallet.creating')
                }}</span>
                <span v-if="!isProcessing">{{
                    $t('lang.createWallet.create')
                }}</span>
                <mt-spinner
                    type="snake"
                    v-if="isProcessing"
                    style="margin-left:10px"
                ></mt-spinner>
            </div>
            <div
                class="flex flex-jc-b flex-ai-c import-wallet"
                @click="importWallet"
                v-if="type !== 'fromMain'"
            >
                <span></span>
                <span class="fs14 cur-p">{{
                    $t('lang.createWallet.importWallet')
                }}</span>
                <span></span>
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
    name: 'createWallet',
    components: { NetworkTree },
    directives: { clickOutside },
    data() {
        return {
            isError: false,
            type: '',
            formAll: {
                walletName: '',
                pwd: '',
                rePwd: ''
            },
            walletIndex: 0,
            wallet_local: {
                encMnemonicWords: '',
                nextIndex: 0,
                walletInfo: [],
                path: ''
            },
            WALLET_HAS_CREATED: false,
            ifHasLogin: false,
            walletArr: [],
            isProcessing: false,
            langPopShow: false,
            // WALLET_PATH_INDEX:0

            isNetworkShow: false, // 是否显示网络树形结构组件
            networkMode: Number(process.env.VUE_APP_NETWORK_MODE), // 网络模式：1展示网络列表；2展示网络列表及链列表
            selectedNetwork: null // 已选择网络（{network: string, chain: string}）
        };
    },
    created() {
        let _this = this;
        _this.type = this.$route.params.type;
        let state = _this.$store.state.appState;
        if (state == -1) {
            _this.PopupAPI.requestState().then(res => {
                if (res > 0) {
                    _this.ifHasLogin = true;
                }
            });
        } else {
            if (state > 0) {
                _this.ifHasLogin = true;
            }
        }
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
        hostname() {
            return this.$store.state.hostname;
        }
    },
    methods: {
        onClickoutside() {
            this.langPopShow = false;
        },
        langEv() {
            this.langPopShow = true;
        },
        selLangEv(lang) {
            let _this = this;
            _this.$i18n.locale = lang;
            _this.PopupAPI.setLanguage(lang).then(res => {});
            _this.langPopShow = false;
        },
        back() {
            this.$router.back();
        },
        pwdFocus() {
            this.isError = false;
        },
        checkInput() {
            let _this = this;
            if (!_this.formAll.walletName) {
                Toast({
                    message: this.$t('lang.createWallet.enterWalletName')
                });
                return false;
            }
            if (_this.formAll.pwd.length < 8) {
                Toast({
                    message: this.$t('lang.createWallet.atLeastEight')
                });
                return false;
            }
            let arr = [
                new RegExp('[0-9]'),
                new RegExp('[a-z]'),
                new RegExp('[A-Z]')
            ];
            let result = arr.reduce((total, _v) => {
                if (_v.test(_this.formAll.pwd)) {
                    total += 1;
                }
                return total;
            }, 0);
            if (result < 2) {
                Toast({
                    message: this.$t('lang.createWallet.atLeastTwoType')
                });
                return false;
            }
            if (_this.formAll.pwd !== _this.formAll.rePwd) {
                Toast({
                    message: this.$t('lang.createWallet.pwdNotSame')
                });
                _this.isError = true;
                return false;
            }
            return true;
        },
        enterNameEv() {
            this.type == 'fromMain' ? this.create() : this.agree();
        },
        agree() {
            let _this = this;
            if (!_this.checkInput()) {
                return;
            }
            if (_this.isProcessing == true) {
                Toast({
                    message: this.$t('lang.createWallet.creatingWait')
                });
                return;
            }

            _this.isProcessing = true;
            _this.PopupAPI.setPassword(_this.formAll.pwd).then(res => {
                _this.$store.commit('SET_FROMCREATESTATE', true);
                _this.PopupAPI.addAccount(_this.formAll.walletName).then(res => {
                    _this.isProcessing = false;
                }).catch(err => {
                    console.log('addAccount error:', err);
                    Toast({
                        message: err
                    });
                    _this.isProcessing = false;
                });
            }).catch(err => {
                console.log('setPassword error:', err);
                Toast({
                    message: err
                });
                _this.isProcessing = false;
            });
        },
        // todo: 处理网络字段
        create() {
            let _this = this;
            if (!_this.formAll.walletName) {
                Toast({
                    message: this.$t('lang.createWallet.enterWalletName')
                });
                return false;
            }
            for (let i = 0; i < _this.walletArr.length; i++) {
                if (_this.walletArr[i].walletName == _this.formAll.walletName) {
                    Toast({
                        message: this.$t('lang.createWallet.walletNameExist')
                    });
                    return;
                }
            }
            _this.PopupAPI.addAccount(_this.formAll.walletName).then(res => {
                Toast({
                    message: this.$t('lang.createWallet.createSuccess'),
                    position: 'top',
                    iconClass: 'mintui mintui-success'
                });
                _this.formAll.walletName = '';
                this.$router.push('/main');
            });
        },
        importWallet() {
            this.$router.push('/importWallet/fromTerms');
        },

        async getSelectedNetwork() {
            // 接口返回类型：{network: string, chain: string}
            try {
                this.selectedNetwork = await this.PopupAPI.getSelectedChain();
            } catch (error) {
                MessageBox.alert('Get selected chain error');
            }
        },
        // 打开网络树形结构组件
        openNetwork() {
            this.isNetworkShow = true;
        },
        // 处理网络树形结构组件change事件（data: {network: string, chain: string}）
        handleNetworkChange(data) {
            this.selectedNetwork = data;
        }
    }
};
</script>
<style lang="stylus">
@import './../../assets/css/var.styl';
.createWallet
	width:100%
	height:100%
	padding-top:90px
	.createWallet-cont
		width:300px
		h2
			line-height:33px
			margin-bottom:35px
		>div
			margin-bottom:28px
	.createWallet-foot
		width:300px
		overflow:hidden
		.threeBlueBtn
			margin-bottom: 24px;
			margin-top: 32px;
		.import-wallet
			>span
				&:first-child
				&:last-child
					width: 106px;
					height: 1px;
					background: #F1F6F8;
				&:nth-child(2)
					line-height: 20px;
					color:$color0195FF

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
