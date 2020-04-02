import { Popup, MessageBox } from 'mint-ui';
import { PopupAPI } from '@bcblink/lib/api';

export default {
    name: 'AssetModal',
    components: { Popup },
    model: {
        prop: 'value',
        event: 'close'
    },
    props: {
        value: Boolean
    },
    data() {
        return {
            isShow: this.value,
            symbol: ''
        };
    },
    methods: {
        // 关闭模态框
        close() {
            this.isShow = false;
            this.$emit('close', false);
        },
        // 提交数据
        async submit() {
            let symbol = this.symbol;
            if (!symbol) return MessageBox.alert('Empty token symbol');

            try {
                let result = await PopupAPI.addAsset(symbol);
                // console.log('addAsset result:', result);
                if (!result) MessageBox.alert('Add token failed');
                else {
                    MessageBox.alert('Add token successfully');
                    this.$emit('close', false);
                    this.$emit('submit');
                }
            } catch (error) {
                console.log('addAsset error:', error);
                MessageBox.alert(error);
            }
        }
    },
    watch: {
        value(value) {
            this.isShow = value;
        }
    }
};
