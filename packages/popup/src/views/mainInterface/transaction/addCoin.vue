<template>
    <div class="assetsDetail pos-r">
        <span class="btn-add" @click.stop="openModal">{{
            $t('lang.main.add')
        }}</span>
        <div class="back pos-a flex flex-ai-c cur-p" @click="back">
            <img src="../../../assets/images/open/back.png" />
            <span class="color999">{{ $t('lang.createWallet.back') }}</span>
        </div>
        <div
            class="coinAll m-auto"
            style="max-height:500px;oveflow-y:auto"
            v-if="coinArr.length"
        >
            <div
                v-for="(item, index) in coinArr"
                :key="index"
                class="coin-single flex flex-jc-b cur-p pos-r flex flex-ai-c"
                @click="selCoin(item, index)"
            >
                <div class="coin-left flex flex-ai-c">
                    <img :src="item.icon || defaultCoinIcon" />
                    <span class="bold">{{ item.symbol }}</span>
                </div>
                <div class="tar coin-right">
                    <mt-switch
                        v-model="item.enabled"
                        @change="switchChange(item, index)"
                    ></mt-switch>
                </div>
            </div>
        </div>
        <div class="common-load flex flex-ai-c flex-jc-c" v-if="loading">
            <div class="flex flex-ai-c flex-jc-c">
                <!-- <mt-spinner type="fading-circle"></mt-spinner> -->
                <span class="text">{{ $t('lang.main.loading') }}</span>
                <mt-spinner type="triple-bounce"></mt-spinner>
            </div>
        </div>

        <AssetModal v-model="isModalShow" @submit="handleModalSubmit" />
    </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from "@/components/HelloWorld.vue";
import Vue from 'vue';
import { Toast, Switch } from 'mint-ui';
import AssetModal from '../../../components/asset-modal';

Vue.component(Switch.name, Switch);
export default {
    name: 'assetsDetail',
    components: { AssetModal },
    data() {
        return {
            BASE_URL: process.env.VUE_APP_LOCAL_BASE_URL,
            BCBID: process.env.VUE_APP_BCBID,
            CHAINID: process.env.VUE_APP_CHAINID,
            selChainId: '',
            coinArr: [],
            selCoinIdx: '0',
            initCoinArr: [],
            loading: true,
            selLegalCurrency: '',
            callNum: 0,
            callNum1: 0,

            isModalShow: false,
            defaultCoinIcon: require('../../../assets/images/main/coin.png')
        };
    },
    computed: {
        account() {
            return this.$store.state.account;
        }
    },
    created() {
        // this.initData();
    },
    mounted() {
        this.initData();
    },
    methods: {
        initData() {
            this.getNetworkAssets();
        },
        getNetworkAssets() {
            let _this = this;
            _this.PopupAPI.getNetworkAssets()
                .then(res => {
                    console.log('networkAssets:', res);
                    _this.loading = false;
                    _this.coinArr = [];
                    Object.entries(res).forEach(([symbol, info]) => {
                        let item = {};
                        item.symbol = symbol;
                        item.name = info.name;
                        item.address = info.address;
                        item.icon = info.icon;
                        item.enabled = info.enabled;
                        _this.coinArr.push(item);
                    });
                    console.log('netCoinArr:', _this.coinArr);
                    _this.loading = false;
                })
                .catch(error => {
                    _this.loading = false;
                    if (error == 'NO_WALLET_PROVIDER') {
                    }
                    Toast({
                        message: error
                    });
                });
        },
        switchChange(item, index) {
            // console.log('switched', item, index);
        },
        back() {
            let enabledList = [];
            this.coinArr.forEach(item => {
                if (item.enabled) {
                    enabledList.push(item.symbol);
                }
            });
            this.PopupAPI.enableAssets(enabledList).then(res => {
                console.log('enable assets', enabledList);
            });
            this.$router.back();
        },
        selCoin(item, index) {
            this.selCoinIdx = index;
        },

        // 打开资产模态框
        openModal() {
            this.isModalShow = true;
        },
        // 处理资产模态框submit事件
        handleModalSubmit() {
            this.initData();
        }
    }
};
</script>
<style type="text/css" lang="stylus">
@import './../../../assets/css/var.styl';
.assetsDetail
  position: relative;
  padding-top: 51px;
  .btn-add
    position: absolute;
    top: 12px;
    right: 26px;
    display: inline-block;
    height: 26px;
    font-size: 14px;
    line-height: 26px;
    cursor: pointer;
	.coinAll
		width:330px
		margin-bottom:30px
		.coin-single
			background: #FFFFFF;
			box-shadow: 0 0 6px 0 #E6EDF2;
			border-radius: 6px;
			height:68px
			margin-bottom:18px
			padding:0 13px
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
			.select
				top:-1px
				right:0
</style>
