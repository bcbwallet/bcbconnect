<template>
    <Popup
        class="common-modal network-modal"
        v-model="isShow"
        :closeOnClickModal="false"
    >
        <header class="common-modal-header">
            <h1>{{ $t('lang.network.customNetwork') }}</h1>
            <i @click.stop="close">&times;</i>
        </header>
        <div class="common-modal-body">
            <ul>
                <li>
                    <label for="name">{{
                        $t('lang.network.networkName')
                    }}</label>
                    <input
                        id="name"
                        type="text"
                        v-model="name"
                        :placeholder="$t('lang.network.enterNetworkName')"
                    />
                </li>
                <li>
                    <label for="url">{{ $t('lang.network.nodeUrl') }}</label>
                    <input
                        id="url"
                        type="text"
                        v-model="url"
                        :placeholder="$t('lang.network.enterNodeUrl')"
                    />
                </li>
                <li>
                    <label for="chainId">{{
                        $t('lang.network.chainId')
                    }}</label>
                    <input
                        id="chainId"
                        type="text"
                        v-model="chainId"
                        :placeholder="$t('lang.network.enterChainId')"
                    />
                </li>
            </ul>
        </div>
        <footer class="common-modal-footer">
            <button class="btn-cancel" @click.stop="close">
                {{ $t('lang.network.cancel') }}
            </button>
            <button class="btn-submit" @click.stop="submit">
                {{ $t('lang.network.save') }}
            </button>
        </footer>
        <Loading :is-loading="isLoading" />
    </Popup>
</template>

<style src="./network-modal.styl" lang="stylus" scoped />

<script src="./network-modal.js" />
