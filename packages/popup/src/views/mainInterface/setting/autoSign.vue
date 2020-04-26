<template>
  <div class="autoSign pos-r bgfff">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../../assets/images/open/back.png" />
      <span class="color999">{{ $t('lang.createWallet.back') }}</span>
    </div>
    <div class="autoSign-cont m-auto">
      <div class="c-signa">
        <h2>{{ $t('lang.connect.autoSignTitle') }}</h2>
        <div>
          <div
            v-for="(item, index) in optionArr"
            :key="index"
            @click="autoSignSelect(item)"
            class="cur-p"
          >
            <p :class="{ active: selOption.status == item.status }">
              {{ item.label }}
            </p>
            <img
              src="../../../assets/images/main/select.png"
              class="pos-a select"
              v-if="selOption.status == item.status"
            />
          </div>
          <!-- <div class="flex flex-ai-c flex-jc-b" @click.stop="selectClick">
              <span>{{selOption.label}}</span>
              <span></span>
            </div>
            <div class="select-pop" :class="{'active':popShow}" v-click-outside="onClickoutside1">
              <span v-for="(item,index) in optionArr" :key="index" @click="autoSignSelect(item)" class="cur-p">{{item.label}}</span>
            </div> -->
        </div>
      </div>
    </div>
    <!-- <div class="threeBlueBtn colorfff tac cur-p fs16 m-auto" @click="confirm">确定</div> -->
  </div>
</template>

<script>
import { Toast } from "mint-ui";
import { directive as clickOutside } from "v-click-outside-x";
export default {
  name: "autoSign",
  directives: { clickOutside },
  data() {
    return {
      selOption: {
        label: this.$t('lang.connect.noAutoSign'),
        status: 0
      },
      optionArr: [
        { label: this.$t('lang.connect.noAutoSign'), status: 0 },
        { label: this.$t('lang.connect.autoSignForThirtyMins'), status: 0.5 },
        { label: this.$t('lang.connect.autoSignForOneHour'), status: 1 },
        { label: this.$t('lang.connect.autoSignForOneDay'), status: 24 }
      ],
      popShow: false,
      initDuration: 0
    };
  },
  created() {
    this.PopupAPI.getAutoSignSettings().then(res => {
      this.selOption.status = res.duration / 3600000;
      this.selOption.label =
        this.selOption.status == 0
          ? this.$t('lang.connect.noAutoSign')
          : this.selOption.status == 0.5
          ? this.$t('lang.connect.autoSignForThirtyMins')
          : this.selOption.status == 1
          ? this.$t('lang.connect.autoSignForOneHour')
          : this.selOption.status == 24
          ? this.$t('lang.connect.autoSignForOneDay')
          : this.$t('lang.connect.noAutoSign');
    }).catch(err => {
      Toast({
        message: err.message
      });
    });
  },
  methods: {
    back() {
      this.$router.back();
    },
    onClickoutside1() {
      this.popShow = false;
    },
    autoSignSelect(item) {
      this.selOption = item;
      this.popShow = false;
      this.PopupAPI.setAutoSignSettings({
          fromTime: Date.now(),
          duration: this.selOption.status * 60 * 60 * 1000 // 单位秒
      });
    },
    selectClick() {
      this.popShow = !this.popShow;
    }
  }
};
</script>
<style lang="stylus">
@import './../../../assets/css/var.styl';
.autoSign{
    width:100%
    height:100%
    padding-top:90px
    .autoSign-cont{
        width:314px;
        .c-signa{
          h2{
            font-size: 16px;
            color: #545A6D;
            font-weight:bold;
            line-height:22px;
            margin-bottom:11px;
          }
          >div{
            >div{
              background: #F7F8FA;
              border: 1px solid #0195FF;
              border-radius: 6px;
              width:314px;
              height:52px;
              position:relative;
              margin-bottom:6px;
              >p{
                line-height: 52px;
                padding-left: 25px;
                color: #7C8297;
                &.active{
                  color: #444444;
                  font-weight:bold
                }
              }
              .select{
                bottom:-1px
                right:0
              }
            }
          }
        }
    }
}
</style>
