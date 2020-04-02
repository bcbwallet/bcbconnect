<template>
  <div class="selectNode pos-r bgfff">
    <div class="back pos-a flex flex-ai-c cur-p" @click="back">
      <img src="../../../assets/images/open/back.png" />
      <span class="color999">{{ $t('lang.createWallet.back') }}</span>
    </div>
    <div class="selectNode-cont">
      <h1>{{ $t('lang.selectNode.nodeSelection') }}</h1>
      <div>
        <div
          v-for="(item, index) in nodeArrAll"
          :key="index"
          class="pos-r cur-p"
          @click="selNodeEv(index)"
        >
          <img
            src="../../../assets/images/main/node_select.png"
            alt=""
            v-if="item.active"
            class="pos-a"
          />
          <div class="flex flex-jc-b">
            <span :class="{ bold: item.active }">{{ item.url }}</span>
            <!-- <span class="yellow" :class="{'green':item.ping<100,'red':item.ping>499}">{{ item.ping }}</span> -->
            <span class="green" v-if="item.color == 'green'">{{
              item.ping
            }}</span>
            <span class="yellow" v-if="item.color == 'yellow'">{{
              item.ping
            }}</span>
            <span class="red" v-if="item.color == 'red'">{{ item.ping }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="pos-a selectNode-foot flex flex-ai-c">
      <div>{{ $t('lang.main.network') }}</div>
      <div class="good">
        <span></span>
        <p>{{ $t('lang.selectNode.good') }}</p>
      </div>
      <div class="delayed">
        <span></span>
        <p>{{ $t('lang.selectNode.delayed') }}</p>
      </div>
      <div class="bad">
        <span></span>
        <p>{{ $t('lang.selectNode.bad') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import Ping from "ping.js";
import { Toast } from "mint-ui";
export default {
  name: "selectNode",
  data() {
    return {
      nodeArr: [],
      nodeArrAll: []
    };
  },
  created() {
    let _this = this;
    _this.nodeAllFunc();
    // setInterval(function(){
    //   _this.intervalNodeAllFunc(_this.initNodeArr)
    // },10000)
  },
  methods: {
    intervalNodeAllFunc(res) {
      let _this = this;
      _this.nodeArr = [];
      let nodes = res.nodes;
      for (let key in res.nodes) {
        let param = {};
        param.url = nodes[key].url;
        param.id = key;
        param.active = false;
        param.color = "green";
        if (res.selected == key) {
          param.active = true;
        }
        _this.nodeArr.push(param);
        // if(_this.nodeArr.length>0){
        //   for(let i = 0;i<_this.nodeArr.length;i++){
        //     if(_this.nodeArr[i].id == key){
        //       _this.nodeArr.splice(i,1,param)
        //     }
        //   }
        // }else{
        //   _this.nodeArr.push(param)
        // }

        _this.getping(param);
      }
      _this.nodeArrAll = _this.nodeArr;
    },
    nodeAllFunc() {
      let _this = this;
      _this.PopupAPI.getNodes().then(res => {
        _this.initNodeArr = res;
        _this.intervalNodeAllFunc(res);
      });
    },
    getping(param) {
      let _this = this;
      let p = new Ping();
      p.ping(param.url, function(err, data) {
        param.ping = data + "ms";
        param.color =
          data < 100 ? "green" : data > 99 && data < 500 ? "yellow" : "red";
        _this.nodeArr.forEach((item, index) => {
          if (param.url == item.url) {
            _this.nodeArr.splice(index, 1, param);
          }
        });
      });
    },
    back() {
      this.$router.back();
    },
    selNodeEv(index) {
      this.nodeArr.forEach((item, sindex) => {
        item.active = false;
      });
      this.nodeArr[index].active = true;
      console.log(this.nodeArr[index].id);
      this.PopupAPI.selectNode(this.nodeArr[index].id);
    }
  }
};
</script>
<style lang="stylus">
@import './../../../assets/css/var.styl';
.selectNode{
  width:100%
  height:100%
  padding-top:90px
  .selectNode-cont{
    >h1{
      font-size: 24px;
      color: #000000;
      letter-spacing: 0;
      line-height:33px;
      margin:0 0 18px 30px
    }
    >div{
      max-height:350px;
      overflow-y:auto;
      >div{
        height:50px;
        line-height:50px;
        width:323px;
        border-bottom:1px solid #F4F0F0;
        margin:0 auto;
        img{
          top:17px;
          left:6px;
        }
        >div{
          width:280px
          margin-left:30px;

        }
      }
    }

  }
  .selectNode-foot{
    background: #F7F8FA;
    border-radius: 8px;
    width:314px;
    height:52px;
    left:22px;
    bottom:11px;
    display:flex;
    align-items:center;
    justify-content: space-between;
    padding:0 19px;
    >div{
      display:flex;
      align-items:center;
      >span{
        width:8px;
        height:8px;
        border-radius:4px;
        margin-right:12px;
      }
      &.good{
        >span{
          background: #28CB45;
        }
      }
      &.delayed{
        >span{
          background: #FFA734
        }
      }
      &.bad{
        >span{
          background: #FF3439;
        }
      }
    }
  }
}


.green{
  color:#28CB45;
}
.yellow{
  color:#FFA734
}
.red{
  color:#FF3439
}
</style>
