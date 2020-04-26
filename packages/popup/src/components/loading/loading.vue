<template>
    <div class="common-load flex flex-ai-c flex-jc-c" v-if="isLoading">
        <div class="flex flex-ai-c flex-jc-c">
            <span class="text">{{ $t('lang.main.loading') }}</span>
            <mt-spinner type="triple-bounce"></mt-spinner>
        </div>
    </div>
</template>

<style src="./loading.styl" lang="stylus" scoped />

<script src="./loading.js" />
