<template>
  <div class="changePwd pos-r">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../../assets/images/open/back.png" />
      <span class="color999">{{ $t('lang.createWallet.back') }}</span>
    </div>
    <div class="changePwd-cont m-auto">
      <h2 class="fs24 color000">{{ $t('lang.setting.changePwd') }}</h2>
      <div class="input-line flex flex-ai-c m-auto">
        <input
          type="password"
          name=""
          :placeholder="$t('lang.setting.enterOldPwd')"
          v-model="form.oldPwd"
        />
      </div>
      <div class="pos-r">
        <div class="input-line flex flex-ai-c m-auto">
          <input
            type="password"
            name=""
            :placeholder="$t('lang.importWallet.enterNewPwd')"
            @focus="psdFocus"
            v-model="form.newPwd"
          />
        </div>
        <div class="pos-a flex flex-ai-c fs12 rightTip">
          <img src="../../../assets/images/open/right.png" />
          <span>{{ $t('lang.createWallet.enterRules') }}</span>
        </div>
      </div>
      <div class="pos-r">
        <div class="input-line flex flex-ai-c m-auto">
          <input
            type="password"
            name=""
            :placeholder="$t('lang.setting.enterRepeatPwd')"
            @focus="psdFocus"
            v-model="form.rePwd"
          />
        </div>
        <div class="pos-a flex flex-ai-c wrongTip fs12" v-show="isError">
          <img src="../../../assets/images/open/wrong.png" />
          <span>{{ $t('lang.createWallet.pwdNotSame') }}</span>
        </div>
      </div>
    </div>
    <div class="threeBlueBtn colorfff tac cur-p fs16 m-auto" @click="confirm">
      {{ $t('lang.setting.save') }}
    </div>
  </div>
</template>

<script>
import { Toast } from "mint-ui";
export default {
  name: "changePwd",
  data() {
    return {
      isError: false,
      type: "",
      form: {
        oldPwd: "",
        newPwd: "",
        rePwd: ""
      }
    };
  },
  mounted() {
    this.type = this.$route.params.type;
  },
  methods: {
    back() {
      this.$router.back();
    },
    psdFocus() {
      this.isError = false;
    },
    confirm() {
      let _this = this;
      if (!(_this.form.newPwd && _this.form.rePwd && _this.form.oldPwd)) {
        Toast({
          message: this.$t('lang.setting.notEmpty')
        });
        return;
      }
      if (_this.form.newPwd.length < 8) {
        Toast({
          message: this.$t('lang.createWallet.atLeastEight')
        });
        return;
      }
      let arr = [new RegExp("[0-9]"), new RegExp("[a-z]"), new RegExp("[A-Z]")];
      let result = arr.reduce((total, _v) => {
        if (_v.test(_this.form.newPwd)) {
          total += 1;
        }
        return total;
      }, 0);
      if (result < 2) {
        Toast({
          message: this.$t('lang.createWallet.atLeastTwoType')
        });
        return;
      }
      if (_this.form.newPwd != _this.form.rePwd) {
        this.isError = true;
        Toast({
          message: this.$t('lang.createWallet.pwdNotSame')
        });
        return;
      }
      let message = this.$t('lang.setting.changePwdSuccess');
      _this.PopupAPI.changePassword(_this.form.oldPwd, _this.form.newPwd).then(res => {
        Toast({
          message,
          position: "top",
          iconClass: "mintui mintui-success"
        });
        _this.form.oldPwd = "";
        _this.form.rePwd = "";
        _this.form.newPwd = "";
        _this.$router.push("/open/fromMain");
      }).catch(err => {
        console.log('changePwd err', err)
        Toast({
          message: err
        });
      });
    }
  }
};
</script>
<style lang="stylus">
@import './../../../assets/css/var.styl';
.changePwd
	width:100%
	height:100%
	padding-top:90px
	.changePwd-cont
		width:300px
		h2
			line-height:33px
			margin-bottom:35px
		>div
			margin-bottom:28px
	.threeBlueBtn
		margin-bottom: 38px;
		margin-top: 59px;
</style>
