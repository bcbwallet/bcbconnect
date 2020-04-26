<template>
    <Popup
        class="common-modal asset-modal"
        v-model="isShow"
        :closeOnClickModal="false"
    >
        <header class="common-modal-header">
            <h1>{{ $t('lang.main.addToken') }}</h1>
            <i @click.stop="close">&times;</i>
        </header>
        <div class="common-modal-body">
            <ul>
                <li>
                    <label for="symbol">{{
                        $t('lang.main.tokenSymbol')
                    }}</label>
                    <input
                        id="symbol"
                        type="text"
                        v-model="symbol"
                        :placeholder="$t('lang.main.enterTokenSymbol')"
                    />
                </li>
            </ul>
        </div>
        <footer class="common-modal-footer">
            <button class="btn-cancel" @click.stop="close">
                {{ $t('lang.main.cancel') }}
            </button>
            <button class="btn-submit" @click.stop="submit">
                {{ $t('lang.main.save') }}
            </button>
        </footer>
    </Popup>
</template>

<style src="./asset-modal.styl" lang="stylus" scoped />

<script src="./asset-modal.js" />
