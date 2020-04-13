import Events from 'jts-events';
import { MessageBox } from 'mint-ui';
import { PopupAPI } from '@bcblink/lib/api';
import Utils from '../../utils/utils.js';

import Loading from '../../components/loading';
import NetworkModal from '../../components/network-modal';

export default {
    name: 'NetworkTree',
    components: { Loading, NetworkModal },
    model: {
        prop: 'value',
        event: 'close'
    },
    props: {
        value: Boolean,
        networkMode: Number, // 网络模式：1展示网络列表；2展示网络列表及链列表
        selectedNetwork: Object // 已选择网络（{network: string, chain: string}）
    },
    data() {
        return {
            isLoading: false,
            isShow: this.value,
            isModalShow: false,
            networks: null,
            activeNetwork: {}
        };
    },
    methods: {
        // 获取网络列表
        async getNetworks() {
            try {
                this.activeNetwork = this.selectedNetwork;
                if (!this.networks) {
                    let networks = await PopupAPI.getNetworks();
                    for (let key in networks) {
                        let value = networks[key] || {};
                        value['chains'] = [];
                        delete value.default;
                    }
                    this.networks = networks;
                }
            } catch (error) {
                console.log('getNetworks error:', error);
            }
        },
        // 根据网络编号获取链列表
        async getChainsByNetwork(id) {
            if (!id) return Promise.reject('No network selected');

            try {
                // console.log('1 id:', id);
                let chains = await PopupAPI.getChainsOfNetwork(id),
                    networks = Utils.duplicate(this.networks);
                // console.log('2 chains:', chains, this.activeNetwork);
                for (const key in networks) {
                    let value = networks[key];
                    if (key === id) {
                        value['chains'] = chains;
                        value['toggle'] = true;
                    } else {
                        value['toggle'] = false;
                    }
                }
                this.networks = networks;

                let selectedNetwork = this.selectedNetwork;
                if (id === selectedNetwork.network) {
                    this.activeNetwork = selectedNetwork;
                } else {
                    this.activeNetwork = { network: id };
                }
            } catch (error) {
                console.log('getChainsOfNetwork error:', error);
            }
        },
        // 获取数据
        async fetchData() {
            await this.getNetworks();
            let { networkMode, activeNetwork } = this;
            if (networkMode === 2 && activeNetwork) {
                let id = activeNetwork.network;
                await this.getChainsByNetwork(id);
            }
        },
        // 设置链数据
        async setChain(data) {
            try {
                this.isLoading = true;
                this.closePanel();
                await PopupAPI.selectChain(data);
                this.isLoading = false;
                this.$emit('change', data);
            } catch (error) {
                console.log('selectChain error:', error);
                MessageBox.alert(error);
                this.isLoading = false;
            }
        },

        // 关闭组件处理器
        closeHandler(event) {
            let $network = this.$refs.network;
            if ($network) {
                if (!$network.contains(event.target)) {
                    this.closePanel();
                }
            }
        },
        // 打开面板
        openPanel() {
            Events.addEvent(document, 'click', this.closeHandler);
            this.fetchData();
        },
        // 关闭面板
        closePanel() {
            this.isShow = false;
            this.$emit('close', false);
            Events.removeEvent(document, 'click', this.closeHandler);
        },

        // 选择网络
        async chooseNetwork(id) {
            let networkMode = this.networkMode;
            if (networkMode === 1) {
                this.activeNetwork = { network: id };
                await this.setChain({ network: id });
            } else if (networkMode === 2) {
                await this.getChainsByNetwork(id);
            }
        },
        // 选择链
        async chooseChain(id, chain) {
            await this.setChain({
                network: id,
                chain: chain
            });
        },
        // 打开网络模态框
        openModal() {
            this.isModalShow = true;
        },
        // 处理网络模态框submit事件
        async handleModalSubmit(data) {
            let { network, chain } = data,
                networks = this.networks;
            networks[network] = {
                name: '',
                chains: [chain]
            };
            await this.setChain(data);
        }
    },
    mounted() {
        this.fetchData();
    },
    watch: {
        value(value) {
            this.isShow = value;
            if (this.isShow) {
                this.openPanel();
            }
        }
    }
};
