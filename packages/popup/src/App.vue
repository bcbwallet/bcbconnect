<template>
  <div id="app" class="m-auto">
    <router-view />
  </div>
</template>
<script type="text/javascript">
	export default {
		created(){
			// this.$i18n.locale = 'en-US'
		}
	}
</script>
<style lang="stylus">
#app
  width:100%
  height:100%
  overflow:auto
</style>
