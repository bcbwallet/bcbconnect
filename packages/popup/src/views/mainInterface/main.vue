<template>
    <div
        class="main-all pos-r"
        :class="{ bgfff: tabIndex == 0 }"
        v-infinite-scroll="loadMore"
        infinite-scroll-disabled="loading"
        infinite-scroll-distance="pageSize"
    >
        <img
            src="../../assets/images/main/main_bg.png"
            class="pos-a main-bg"
            v-if="tabIndex == 0"
        />
        <div class="flex flex-jc-b">
            <div
                class="main-tab pos-r flex flex-jc-b"
                style="width: 232px"
                :class="{ mb23: tabIndex != 0 }"
            >
                <div
                    v-for="(item, index) in tabArr"
                    @click="clickTab(item, index)"
                    class="pos-r cur-p"
                >
                    <span
                        class="fs14 colorfff"
                        :class="{
                            bold: tabIndex == index,
                            color444: tabIndex != 0
                        }"
                        >{{ item }}</span
                    >
                    <div
                        v-if="tabIndex == index"
                        class="bgfff pos-a"
                        :class="{ bg0170FF: tabIndex != 0 }"
                    ></div>
                </div>
            </div>
            <div class="network-box pos-r" v-if="tabIndex == 0">
                <div class="flex flex-jc-c flex-ai-c" @click.stop="openNetwork">
                    <span v-if="selectedNetwork">{{
                        networkMode === 1
                            ? selectedNetwork.network
                            : selectedNetwork.network === selectedNetwork.chain
                            ? selectedNetwork.network
                            : selectedNetwork.network +
                                '.' + selectedNetwork.chain
                    }}</span>
                    <span></span>
                </div>
            </div>
        </div>

        <div v-if="tabIndex == 0" class="part-0">
            <div class="main-center pos-r m-auto bgfff">
                <h3 class="fs14 color444 tac">
                    {{
                        walletName.length > 12
                            ? walletName.slice(0, 4) +
                              '...' +
                              walletName.slice(-4)
                            : walletName
                    }}{{ $t('lang.main.assetsOf') }}({{ selCoin }})
                </h3>
                <div class="line"></div>
                <div
                    class="fs36 color444 tac main-digits pos-r"
                    @click="gotoDetail"
                >
                    <span :class="{ sx_ft: sxShow }"
                        >{{ balance.balance == null ? '*' : Number(parseFloat(balance.balance).toFixed(6))
                        }} </span
                    ><!-- <span class="fs16">{{selCoin}}</span> -->
                    <img
                        src="../../assets/images/main/arrow_right.png"
                        class="pos-a"
                    />
                </div>
                <div class="fs14 color999 tac">
                    {{ balance.fiatValue == null ? '*' : ((selCurrency === 'CNY' ? '¥' : '$')
                     + Number(parseFloat(balance.fiatValue).toFixed(6))) }}
                </div>
                <div class="main-btn flex flex-jc-b">
                    <div class="tac cur-p" @click="gotoTransfer">
                        {{ $t('lang.main.transfer') }}
                    </div>
                    <div class="colorfff tac cur-p" @click="gotoReceive">
                        {{ $t('lang.main.receive') }}
                    </div>
                </div>
            </div>
            <div class="trans-record m-auto">
                <h3 class="fs14 color444">
                    {{ $t('lang.main.transHistory') }}
                </h3>
                <div v-if="transRecords.length">
                    <div
                        v-for="(item, index) in transRecords"
                        :key="index"
                        class="trans-detail bgfff flex flex-ai-c cur-p"
                        @click="recordDetail(item, index)"
                    >
                        <img
                            src="../../assets/images/main/down.png"
                            v-if="item.from == walletAddr"
                        />
                        <img
                            src="../../assets/images/main/up.png"
                            v-if="item.from != walletAddr"
                        />
                        <div class="flex flex-jc-b trans-data-addr flex-ai-c">
                            <div>
                                <p class="color444">
                                    {{
                                        (item.from == walletAddr
                                            ? item.to
                                            : item.from
                                        ).slice(0, 6)
                                    }}...{{
                                        (item.from == walletAddr
                                            ? item.to
                                            : item.from
                                        ).slice(-6)
                                    }}
                                </p>
                                <p class="color999">
                                    {{ item.modifyTime.replace('T', ' ') }}
                                </p>
                            </div>
                            <span
                                class="color0170FF"
                                :class="{ colorFF6F6F: item.from == walletAddr }"
                                >{{ item.from == walletAddr ? '-' : '+'
                                }}{{ item.value + ' ' + item.valueName }}
                            </span>
                        </div>
                    </div>
                </div>
                <div v-if="transRecords.length == 0 && !loading" class="no-record tac color999">
                    {{ $t('lang.main.noTransHistory') }}
                </div>
                <div v-if="loading" class="flex flex-ai-c flex-jc-c">
                    <span style="margin-left:10px"
                        >{{ $t('lang.main.loading') }}...</span
                    >
                    <mt-spinner type="fading-circle"></mt-spinner>
                </div>
                <div
                    class="color999 tac"
                    v-if="transRecords.length != 0 && !loading && noMore"
                    style="margin-bottom:10px"
                >
                    {{ $t('lang.main.noMore') }}
                </div>
            </div>
        </div>
        <div v-if="tabIndex == 1" class="part-1 bgfff">
            <div class="wallet m-auto">
                <div
                    v-for="(item, index) in walletArr"
                    :key="index"
                    class="wallet-single flex flex-jc-b cur-p pos-r"
                    :class="{ selWallet: walletId == item.walletId }"
                    @click="selWallet(item, index)"
                >
                    <div>
                        <div class="wallet-name flex">
                            <h3 class="fs14 ell" style="width:220px">
                                {{ item.walletName }}
                            </h3>
                        </div>
                        <div class="flex">
                            <p>
                                {{ item.walletAddr.slice(0, 12) }}...{{
                                    item.walletAddr.slice(-8)
                                }}
                            </p>
                            <img
                                src="../../assets/images/main/copy.png"
                                @click.stop="copy(item.walletAddr)"
                            />
                        </div>
                    </div>
                    <img
                        src="../../assets/images/main/more.png"
                        class="copy"
                        @click.stop="gotoWalletDetail(item, index)"
                    />
                    <img
                        src="../../assets/images/main/select.png"
                        class="pos-a select"
                        v-if="walletId == item.walletId"
                    />
                </div>
            </div>
            <div class="m-auto">
                <div
                    class="threeBlueBtn create-wallet flex flex-ai-c flex-jc-c bold m-auto colorfff cur-p"
                    @click="gotoCreateWallet"
                >
                    <img src="../../assets/images/main/create.png" />
                    <span>{{ $t('lang.createWallet.createWallet') }}</span>
                </div>
                <div
                    class="threeBlueBtn import-wallet flex flex-ai-c flex-jc-c bold m-auto cur-p"
                    @click="gotoImportWallet"
                >
                    <img src="../../assets/images/main/import.png" />
                    <span>{{ $t('lang.createWallet.importWallet') }}</span>
                </div>
            </div>
        </div>
        <div v-if="tabIndex == 2" class="part-2 bgfff">
            <div class="m-auto">
                <div
                    v-for="(item, index) in setArr"
                    :key="index"
                    @click="toRightDetail(item, index)"
                >
                    <div class="flex flex-jc-b set-word cur-p">
                        <span>{{
                            index == 0
                                ? langSettingText
                                : index == 1
                                ? calculateCoinText
                                : index == 2
                                ? nodeSelectionText
                                : index == 3
                                ? autoSignText
                                : index == 4
                                ? changePwdText
                                : logoutText
                        }}</span>
                        <div class="set-right flex flex-ai-c">
                            <div v-if="index == 0" class="flex flex-ai-c">
                                <span>{{
                                    $i18n.locale == 'zh-CN' ? '中文' : 'English'
                                }}</span>
                            </div>
                            <!-- <div v-if="index==1">
                <mt-switch v-model="switchValue"></mt-switch>
              </div> -->
                            <div v-if="index == 1">{{ selCurrency }}</div>
                            <div v-if="index == 2">{{ selNode }}</div>
                            <div v-if="index == 3">{{ autoSign.label }}</div>
                            <div
                                class="to-right"
                                v-if="!(index == 5)"
                                :class="{ 'to-right-active': item.active }"
                            ></div>
                        </div>
                    </div>
                    <div
                        v-if="index == 0"
                        class="lang-all dn"
                        :class="{ db: item.active }"
                    >
                        <div
                            v-for="(item, index) in langArr"
                            :key="index"
                            class="flex flex-ai-c lang-single cur-p"
                            @click="setLanguage(item, index)"
                            :class="{ 'lang-active': langIdx == index }"
                        >
                            <span>{{ item.name }}</span>
                        </div>
                    </div>
                    <div
                        v-if="index == 1"
                        class="lang-all dn"
                        :class="{ db: item.active }"
                    >
                        <div
                            v-for="(item, index) in currencyArr"
                            :key="index"
                            class="flex flex-ai-c coin-single cur-p"
                            @click="setCurrency(item, index)"
                            :class="{ 'lang-active': currencyIdx == index }"
                        >
                            <span>{{ item.name }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="pop-modal pos-f" v-if="popupVisible">
            <div class="popBox pos-a bgfff fs12">
                <img
                    src="../../assets/images/main/close.png"
                    class="close pos-a cur-p"
                    @click="close"
                />
                <div class="popTitle fs16 tac bold">
                    {{ recordDetailData.from == walletAddr ? '-' : '+'
                    }}{{
                        recordDetailData.value +
                            ' ' +
                            recordDetailData.valueName
                    }}
                </div>
                <div class="popBody">
                    <div>
                        <span>{{ $t('lang.main.from') }}</span>
                        <span class="width200">{{
                            recordDetailData.from
                        }}</span>
                    </div>
                    <div>
                        <span>{{ $t('lang.main.to') }}</span>
                        <span class="width200">{{ recordDetailData.to }}</span>
                    </div>
                    <div>
                        <span>{{ $t('lang.main.netFee') }}</span>
                        <span>{{ recordDetailData.fee }} BCB</span>
                    </div>
                    <div>
                        <span>{{ $t('lang.main.memo') }}</span>
                        <span>{{ recordDetailData.memo }}</span>
                    </div>
                    <div class="line"></div>
                    <div>
                        <span>{{ $t('lang.main.transHash') }}</span>
                        <span class="width200">{{
                            recordDetailData.txHash
                        }}</span>
                    </div>
                    <div>
                        <span>{{ $t('lang.main.block') }}</span>
                        <span>{{ recordDetailData.blockN }}</span>
                    </div>
                    <div>
                        <span>{{ $t('lang.main.transTime') }}</span>
                        <span>{{
                            recordDetailData.modifyTime.replace('T', ' ')
                        }}</span>
                    </div>
                </div>

                <div
                    class="btn-go colorfff cur-p fs14 flex flex-jc-c flex-ai-c pos-a"
                    @click="
                        gotoBcbscan(
                            recordDetailData.bcbScanPath,
                            recordDetailData.txHash
                        )
                    "
                >
                    <span>bcbscan </span>
                    <img src="../../assets/images/main/jump.png" />
                </div>
            </div>
        </div>
        <mt-popup
            v-model="mnemNotice"
            position="bottom"
            style="height: initial;width: 330px;box-shadow: 0 0 6px 0 #E3E7F2;
      border-radius: 4px;margin-bottom:6px"
        >
            <div>
                <div class="pop-head bold fs16">
                    {{ $t('lang.main.safeNotice') }}
                </div>
                <div class="pop-body m-auto">
                    <div class="p-body-1 flex flex-ai-c">
                        {{ $t('lang.main.safeNoticeText') }}
                    </div>
                    <div class="p-body-btn flex flex-jc-b">
                        <div
                            class="colorfff bold cur-p"
                            @click="mnemNotice = false"
                        >
                            {{ $t('lang.main.remind') }}
                        </div>
                        <div class="colorfff bold cur-p" @click="gotoBackup">
                            {{ $t('lang.main.gotoBackup') }}
                        </div>
                    </div>
                </div>
            </div>
        </mt-popup>
        <div class="pop-modal pos-f" v-if="isLogoutBoxShow">
            <div class="logoutBox pos-a bgfff">
                <div class="tac">
                    {{ $t('lang.main.ifLoginOut') }}
                </div>
                <div class="flex flex-jc-c c-button">
                    <div @click="logoutCancel">
                        {{ $t('lang.walletDetail.cancel') }}
                    </div>
                    <div @click="logoutConfirm">
                        {{ $t('lang.walletDetail.confirm') }}
                    </div>
                </div>
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
// @ is an alias to /src
import { directive as clickOutside } from 'v-click-outside-x';
import Vue from 'vue';
import {
    Toast,
    InfiniteScroll,
    Spinner,
    Switch,
    Radio,
    MessageBox
} from 'mint-ui';
import VueClipboard from 'vue-clipboard2';
import NetworkTree from '../../components/network-tree';

Vue.use(VueClipboard);
Vue.use(InfiniteScroll);
Vue.component(Spinner.name, Spinner);
Vue.component(Switch.name, Switch);
Vue.component(Radio.name, Radio);
// Vue.component(Popup.name, Popup);
export default {
    name: 'mainPage',
    components: { NetworkTree },
    directives: { clickOutside },
    data() {
        return {
            tabIndex: '0',
            walletId: '',
            walletAddr: '',
            walletName: '',
            walletArr: [],
            selWalletIdx: '0',
            transRecords: [],
            recordDetailData: {},
            setArr: [
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false },
                { active: false }
            ],
            langArr: [
                { name: 'English', active: false, value: 'en-US' },
                { name: '中文', active: false, value: 'zh-CN' }
            ],
            currencyArr: [
                { name: 'USD', active: false, value: 'USD' },
                { name: 'CNY', active: false, value: 'CNY' }
            ],
            autoSign: {
                label: '',
                status: 0
            },
            langIdx: '0',
            currencyIdx: '0',
            selCurrency: 'USD',
            popupVisible: false,
            selCoin: '',
            page: 1,
            pageSize: 10,
            loading: true,
            noMore: false,
            mnemNotice: false,
            sxShow: false,
            switchValue: false,
            isLogoutBoxShow: false,
            selNode: '',

            // 新需求补充：网络设置功能
            isNetworkShow: false, // 是否显示网络树形结构组件
            networkMode: Number(process.env.VUE_APP_NETWORK_MODE), // 网络模式：1展示网络列表；2展示网络列表及链列表
            selectedNetwork: null // 已选择网络（{network: string, chain: string}）
        };
    },
    computed: {
        account() {
            return this.$store.state.account;
        },
        balance() {
            return this.$store.state.balance;
        },
        homeText() {
            return this.$t('lang.main.home');
        },
        accountsText() {
            return this.$t('lang.main.accounts');
        },
        settingText() {
            return this.$t('lang.main.settings');
        },
        langSettingText() {
            return this.$t('lang.main.langSetting');
        },
        calculateCoinText() {
            return this.$t('lang.main.calculateCoin');
        },
        nodeSelectionText() {
            return this.$t('lang.selectNode.nodeSelection');
        },
        autoSignText() {
            return this.$t('lang.main.autoSign');
        },
        changePwdText() {
            return this.$t('lang.setting.changePwd');
        },
        logoutText() {
            return this.$t('lang.main.logout');
        },
        tabArr() {
            return [this.homeText, this.accountsText, this.settingText];
        }
    },
    created() {
        let _this = this;
        console.log('i18n', this.$i18n.locale)
        _this.langIdx = this.$i18n.locale == 'en-US' ? '0' : '1';
    },
    mounted() {
        this.fetchData();
    },
    methods: {
        async initData() {
            this.staticData();
            await this.getSettings();
            if (this.tabIndex == 0) {
                await this.getAccountDetails();
                await this.getSelectedToken();
                await this.getBalance();
                await this.getAccountTransactions();
            } else if (this.tabIndex == 1) {
                await this.getAccounts();
            } else if (this.tabIndex == 2) {
                await this.getNodes();
            }

        },
        staticData() {
            this.tabIndex = sessionStorage.getItem('tabIndex') || '0';
            this.page = 1;
            this.pageSize = 10;
            this.loading = true;
            this.noMore = false;
        },
        async getSettings() {
            try {
                let currency = await this.PopupAPI.getCurrency();
                this.selCurrency = currency;
                this.currencyIdx = this.selCurrency == 'USD' ? '0' : '1';

                let settings = await this.PopupAPI.getSettings();
                console.log('setttings', settings)
                let mnemSaved = false;
                if (settings && settings.mnemSaved !== undefined) {
                    mnemSaved = settings.mnemSaved;
                }
                this.mnemNotice = (!mnemSaved && this.tabIndex == 0);

                await this.getAutoSignSettings();
            } catch (err) {
                Toast({
                    message: err.message
                });
            }
        },
        async getAutoSignSettings() {
            try {
                this.autoSign = await this.PopupAPI.getAutoSignSettings();
                this.autoSign.duration /= 3600000;
                this.autoSign.label =
                    this.autoSign.duration == 0
                    ? this.$t('lang.connect.noAutoSign')
                    : this.autoSign.duration == 0.5
                    ? this.$t('lang.connect.autoSignForThirtyMins')
                    : this.autoSign.duration == 1
                    ? this.$t('lang.connect.autoSignForOneHour')
                    : this.autoSign.duration == 24
                    ? this.$t('lang.connect.autoSignForOneDay')
                    : this.$t('lang.connect.noAutoSign');
            } catch (err) {
                Toast({
                    message: err.message
                });
            }
        },
        async getAccounts() {
            let accounts = await this.PopupAPI.getAccounts();
            let arr = [];
            Object.entries(accounts).forEach(([accountId, account]) => {
                let param = {};
                param.walletId = accountId;
                param.walletAddr = account.address;
                param.walletName = account.name;
                param.type = account.type;
                arr.push(param);    
            });
            this.walletArr = arr;
            this.$store.state.accounts = arr;

            let selected = await this.PopupAPI.getSelectedAccount();
            this.walletId = selected;
        },
        async getNodes() {
            let result = await this.PopupAPI.getNodes();
            console.log('nodes:', result);

            this.selNode = result.nodes[result.selected].url;
            console.log('selected', this.selNode);
        },
        async getAccountDetails() {
            let _this = this;
            if (this.account.hasOwnProperty('address')) {
                console.log('savedAccount:', this.account);
                this.walletAddr = this.account.address;
                this.walletName = this.account.name;
                // _this.checkAccount()
            } else {
                let result = await this.PopupAPI.getSelectedAccountDetails();
                console.log('selectedAccount:', result);
                this.walletAddr = result.address;
                this.walletName = result.name;

                this.$store.state.account = result;
                // this.checkAccount()
            }
        },
        async getSelectedToken() {
            let token = await this.PopupAPI.getSelectedToken();
            this.selCoin = token;
            this.$store.commit("SET_TOKEN", token);
        },
        async getBalance() {
            try {
                let result = await this.PopupAPI.getBalance();
                console.log('balance:', result);
                this.balance = result;
                this.$store.commit("SET_BALANCE", result);
            } catch (err) {
                console.log('get balance error', err);
            }

            this.sxShow =
                String(this.balance.balance).length > 9 ? true : false;
        },
        logoutCancel() {
            this.isLogoutBoxShow = false;
        },
        logoutConfirm() {
            let _this = this;
            _this.PopupAPI.lockWallet().then(res => {
                _this.isLogoutBoxShow = false;
                sessionStorage.removeItem('tabIndex');
            }).catch(err => {
                Toast({
                    message: err.message
                });
            });
        },
        gotoBackup() {
            let _this = this;
            _this.$router.push({ name: 'backupMnemonic', params: { type: 0 } });
        },
        async loadMore() {
            // console.log('load more?', !this.noMore);
            if (this.noMore) {
                return;
            }
            setTimeout(async () => {
                await this.getAccountTransactions();
            }, 200);
        },
        async clickTab(item, index) {
            this.tabIndex = index;
            sessionStorage.setItem('tabIndex', this.tabIndex);
            if (index == 0) {
                this.transRecords = [];
                // this.checkAccount();
                await this.initData();
            }
            if (index == 1) {
                await this.getAccounts();
            }
            if (index == 2) {
                await this.getSettings();
                await this.getNodes();
            }
        },
        async getAccountTransactions() {
            try {
                if (this.page == 1) {
                    this.transRecords = [];
                }

                this.loading = true;
                let result = await this.PopupAPI.getAccountTransactions({
                    page: this.page,
                    pageSize: this.pageSize
                });
                console.log('account transactions:', result);

                let records = [];
                if (result.result && result.result.records) {
                    records = result.result.records;
                }
                console.log('records length:', records.length);
                this.transRecords = this.transRecords.concat(records);
                this.loading = false;
                if (records.length < this.pageSize) {
                    this.noMore = true;
                    return;
                }
                this.page++;
                // await this.getAccountTransactions();
            } catch (err) {
                console.log('getAccountTransactions error:', err);
                this.loading = false;
                this.noMore = true;
            }
        },
        checkAccount() {
            let _this = this;
            if (_this.walletAddr === '') {
                Toast({
                    message: this.$t('lang.main.noAccount')
                });
                this.balance = { token: '', balance: 0, fiatValue: 0 };
                return;
            }
        },
        gotoWalletDetail(item, index) {
            this.$router.push({
                name: 'walletDetail',
                params: { walletInfo: item }
            });
        },
        gotoImportWallet() {
            this.$router.push('/importWallet/fromMain');
        },
        gotoCreateWallet() {
            this.$router.push('/createWallet/fromMain');
        },
        gotoBcbscan(url, tx) {
            window.open(url + '/0x' + tx.toLowerCase());
        },
        recordDetail(item, index) {
            this.popupVisible = true;
            this.recordDetailData = item;
        },
        close() {
            this.popupVisible = false;
        },
        gotoDetail() {
            this.$router.push('/assetsDetail');
            // sessionStorage.setItem('selChain', this.selChain);
        },
        gotoTransfer() {
            if (this.walletAddr === '') {
                Toast({
                    message: this.$t('lang.main.noAccount')
                });
                return;
            }
            this.$router.push({
                name: 'transfer'
                // params: { chainId: this.selChain }
            });
        },
        gotoReceive() {
            if (this.walletAddr === '') {
                Toast({
                    message: this.$t('lang.main.noAccount')
                });
                return;
            }
            this.$router.push('/receive');
        },
        async selWallet(item, index) {
            this.selWalletIdx = index;
            this.walletId = item.walletId;
            this.walletAddr = item.walletAddr;
            this.walletName = item.walletName;
            await this.PopupAPI.selectAccount(item.walletId);
        },
        copy(addr) {
            this.$copyText(addr).then(() => {
                Toast({
                    message: this.$t('lang.main.copySuccess'),
                    position: 'top',
                    iconClass: 'mintui mintui-success'
                });
            });
        },
        toRightDetail(item, index) {
            item.active = !item.active;
            this.setArr.splice(index, 1, item);
            index == 2
                ? this.$router.push('/selectNode')
                : index == 3
                ? this.$router.push('/autoSign')
                : index == 4
                ? this.$router.push('/changePwd')
                : index == 5
                ? (this.isLogoutBoxShow = true)
                : '';
        },
        async setLanguage(item, index) {
            this.langIdx = index;
            this.$i18n.locale = item.value;
            console.log('set lang', item.value);
            await this.PopupAPI.setLanguage(item.value);
            await this.getSettings();
        },
        async setCurrency(item, index) {
            this.currencyIdx = index;
            this.selCurrency = item.value;
            console.log('set currency', item.value);
            await this.PopupAPI.setCurrency(item.value);
        },

        async fetchData() {
            await this.getSelectedNetwork();
            this.initData();
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
            this.fetchData();
        }
    }
};
</script>
<style lang="stylus">
@import './../../assets/css/var.styl';

.color0170FF
	color:$color0170FF
.colorFF6F6F
	color:$colorFF6F6F
.width200
	width:200px
.bg0170FF
	background:$color0170FF!important
.orange
	border: 1px solid #FF9512;
	color: #FF9512;
.blue
	border: 1px solid $color0195FF;
	color: $color0195FF;
.main-all
	width:100%;
	height:100%;
	padding-top: 25px;
	overflow-y:auto
	.main-bg
		width:100%
		top:0
	.main-tab
	.main-center
		z-index:100
		&.main-tab
			padding-left:14px
			margin-bottom: 30px
			>div
				>span
					line-height:22px
				.bold
					font-weight:bold
					font-size:16px
				>div
					width: 18px
					border-radius: 2px
					height: 3px
					bottom: -8px
					left: 6px
		&.mb23
			margin-bottom:23px
		&.main-center
			box-shadow: 0 0 6px 0 #E6EDF2
			border-radius: 4px
			width: 330px
			height: 221px
			padding:21px 35px 25px
			margin-bottom:26px
			h3
				margin-bottom: 14px;
			.line
				width: 100%;
				height: 1px;
				background: #F1F4F7;
				margin-bottom: 22px;
			.main-digits
				margin-bottom:15px
				img
					right: 14px;
					top: 10px;
				cursor:pointer;
			.main-btn
				>div
					width:118px
					height:32px
					line-height:32px
					margin-top:24px
					font-size: 14px;
					&:first-child
						background: #D4E7FF;
						color: $color0170FF;
					&:last-child
						background: $color0170FF;
	.trans-record
		width:330px
		h3
			line-height:20px
			margin-bottom:5px
			font-weight:bold
		.trans-detail
			box-shadow: 0 0 6px 0 #E6EDF2
			border-radius: 6px
			height:68px
			padding:16px 10px 15px 13px
			margin-bottom:12px
			img
				width:33px
				height:33px
				margin-right:12px
		.trans-data-addr
			width: calc(100% - 45px);
			>div
				>p
					&:first-child
						line-height:20px
					&:last-child
						line-height:17px
	.no-record
		background:$colorf7f7f7
		height:68px
		line-height:68px
		border-radius: 4px;
		margin-bottom:10px
	.part-1
	.part-2
		box-shadow: 0 0 4px 0 #F7F8FA;
		border-radius: 14px 14px 0 0;
		border-radius: 14px 14px 0px 0px;
		height:526px;
		padding-top:34px
		&.part-1
			.wallet
				width:330px
				height:330px
				overflow:auto
				.wallet-single
					background: #F5F6F8
					border-radius: 6px
					height:91px
					width:100%
					padding:20px 15px 21px 14px
					margin-bottom:22px
					&:last-child
						margin-bottom:0
					&.selWallet
						background: #EDF3FF;
						border: 1px solid $color0195FF;
					.wallet-name
						>span
							width:46px
							height:20px
							line-height:20px
							border-radius:10px
					.copy
						width:26px
						height:17px
					h3
						font-weight:bold
						line-height:20px
						margin-bottom:10px
						margin-right:6px
					p
						color:#AEB2C2;
						margin-right:20px
					.select
						bottom:-1px
						right:0
			.create-wallet
				margin-bottom:18px
				margin-top:11px
			.import-wallet
				border:1px solid $color0195FF
				background:#fff
				color:$color0195FF
			.threeBlueBtn
				img
					width:18px
					height:18px
					margin-right:10px
		&.part-2
			padding-top:10px
			>div
				width:314px
				>div
					width:100%

					.set-word
						line-height:20px
						padding:24px 0 13px
						border-bottom: 1px solid #F2F2F2;
						.set-right
							>div
								span
									margin-left:14px
							img
								width:22px
								height:22px
							.to-right
								transform: rotate(45deg);
								border-top:1px solid $fontColor444;
								border-right:1px solid $fontColor444;
								width: 8px
								height:8px
								transition:all 0.3s
								margin-left:10px
							.to-right-active
								transform: rotate(135deg);
					.lang-all
						>div
							height:53px
							background:$mainBodyBgcolorGray
							&:last-child
								border-radius: 0 0 6px 6px;
							&.lang-active
								background: #E8E8E8;
						.lang-single
							padding-left:10px
						.coin-single
							padding-left:10px
						img
							width:22px
							height:22px
							margin-right:14px
							margin-left:9px
.pop-modal
	background:rgba(0,0,0,0.5)
	width: 357px;
	height: 596px;
	z-index:2002
	left:0
	right:0
	bottom:0
	top:0
	.popBox
		width: 290px
		height: 450px
		left:0
		right:0
		bottom:0
		top:0
		margin: 77px auto 0
		border-radius: 11px
		padding:0 19px
		.close
			right:17px
			top:13px
		.popTitle
			line-height:20px
			margin:18px 0 18px
		.popBody
			margin-bottom:9px
			overflow: hidden;
			>div
				display:flex
				margin-bottom:16px
				>span
					line-height: 17px;
					&:first-child
						font-weight:bold
						margin-right:16px
					&:last-child
						color:$color999
						word-break: break-all;
		.btn-go
			width:246px;
			height:36px;
			line-height:36px;
			background:$color0195FF
			border-radius: 8px;
			bottom: 15px;
			img
				width:14px
				height:14px
				margin-left:16px
.pop-head
	color: #545A6D;
	text-align: left;
	width: 306px;
	margin: 15px auto 8px;
.p-body-1
	color: #7C8297;
	line-height: 20px;
.p-body-btn
	margin:11px auto 21px
	>div
		border-radius: 4px;
		width:136px
		height:34px
		line-height:34px
		text-align:center
		&:first-child
			background: #A7B0CD;
		&:last-child
			background: #0170FF;
.logoutBox{
  width:240px;
  height:160px;
  left:0
  right:0
  bottom:0
  top:0
  border-radius: 11px
  margin:200px auto 0
  >div{
    &:first-child{
      margin-top:50px
    }
  }
  .c-button{
    margin:30px auto 0;
    >div{
      border-radius: 4px;
      width:82px;
      height:36px;
      line-height:36px;
      text-align:center;
      cursor:pointer;
      &:first-child{
        background:#fff;
        border:1px solid #0195FF;
        color: #0195FF;
        margin-right:20px
      }
      &:last-child{
        background: #0195FF;
        color:#fff
      }
    }
  }
}
.network-box{
  z-index:102
  padding-right:12px;
  top:-6px;
  >div{
    &:first-child{
      background: 0170FF;
      border: 1px solid rgba(251,253,255,0.54);
      border-radius: 17px;
      width: 90px;
      height: 30px;
      font-weight:bold;
      color: #FFFFFF;
      >span{
        &:last-child{
          border: 1px solid #fff;
          width: 9px;
          height: 9px;
          border-left: none;
          border-top: none;
          transform: rotate(45deg);
          margin-bottom: 5px;
          margin-left: 6px;
        }
      }
    }
    &.pop-net{
      position: absolute;
      right: 12px;
      width: 200px;
      background: #FFFFFF;
      box-shadow: 0 0 4px 0 #B5C5D6;
      border-radius: 12px;
      top:38px;
      overflow: hidden;
      >h2{
        height: 34px;
        line-height: 34px;
        text-align: center;
        font-weight: bold;
        border-bottom: 1px solid #E8E8E8;
      }
      >p{
        font-size: 12px;
        color: #8D8E8F;
        line-height: 17px;
        margin: 3px 0 10px 12px;
      }
    }
  }

}
</style>
<style>
.sx_ft {
    font-size: 0.5em;
}
</style>
