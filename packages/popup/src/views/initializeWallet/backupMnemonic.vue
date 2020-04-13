<template>
  <div class="backupMnemonic bgfff pos-r">
    <div
      class="back pos-a flex flex-ai-c cur-p"
      @click="back"
      v-if="fromWalletDetailShow"
    >
      <img src="../../assets/images/open/back.png" />
      <span class="color999">{{ $t("lang.createWallet.back") }}</span>
    </div>
    <div
      class="pos-a jump-over flex flex-ai-c cur-p"
      @click="jumpToMain"
      v-if="!fromWalletDetailShow"
    >
      <span class="color444 fs12">{{ $t("lang.backupMnemonic.skip") }}</span>
      <img src="../../assets/images/open/skip.png" />
    </div>
    <div class="backupMnemonic-cont m-auto">
      <h2 class="fs24 color000">{{ $t("lang.backupMnemonic.backupMnemonic") }}</h2>
      <div class="fs14 txt-1 color444">
        {{ $t("lang.backupMnemonic.noteText") }}
      </div>
      <div class="flex flex-w-w wordAll">
        <span
          v-for="(item, index) in ciArr"
          :key="index"
          class="tac color444"
          >{{ item }}</span
        >
      </div>
    </div>
    <div class="threeBlueBtn colorfff tac cur-p m-auto fs16" @click="gotoNext">
      {{ $t("lang.backupMnemonic.next") }}
    </div>
  </div>
</template>

<script>
export default {
  name: "backupMnemonic",
  data() {
    return {
      ciArr: [],
      fromWalletDetailShow: false
    };
  },
  created() {
    let _this = this;
    _this.PopupAPI.exportMnemonic()
      .then(res => {
        // console.log(res);
        _this.initMenic = res.mnemonic;
        _this.ciArr = res.mnemonic.split(" ");
      })
      .catch(err => {
        Toast({
          message: err.message
        });
      });
    _this.fromWalletDetailShow = _this.$route.params.type == 1 ? true : false;
  },
  methods: {
    back() {
      this.$router.back();
    },
    jumpToMain() {
      this.$router.push("/main");
    },
    gotoNext() {
      this.$router.push({
        name: "backupMnemonicWriting",
        params: { type: this.$route.params.type, mnemonic: this.initMenic }
      });
    }
  }
};
</script>
<style lang="stylus">
@import './../../assets/css/var.styl';
.backupMnemonic
	width:100%
	height:100%
	padding-top:90px
	.backupMnemonic-cont
		width:314px
		margin-bottom:59px
		h2
			margin-bottom:22px
			line-height:33px
		.txt-1
			line-height:20px
			margin-bottom:36px
		.wordAll
			>span
				width:68px
				height:32px
				line-height:32px
				border-radius: 4px
				background: $colorf7f7f7
				border: 1px solid $colorEDEDED
				margin-right:14px
				margin-bottom:16px
				&:nth-child(4)
				&:nth-child(8)
				&:nth-child(12)
					margin-right:0
</style>
