<template>
    <div ref="network">
        <div v-if="isShow" :class="['network-tree', `mode${networkMode}`]">
            <h1 class="network-title">{{ $t('lang.network.network') }}</h1>

            <ul v-if="networks" class="network-list">
                <li
                    class="network-item"
                    v-for="(network, id, index) in networks"
                    :key="index"
                >
                    <div
                        class="network-name"
                        :class="{
                            active:
                                activeNetwork && activeNetwork.network === id
                        }"
                        @click.stop="chooseNetwork(id)"
                    >
                        <i></i>
                        <span>{{ id }}</span>
                    </div>

                    <ol
                        v-if="networkMode === 2 && network.toggle"
                        class="network-chains"
                    >
                        <li class="network-chain first">{{ $t('lang.network.chain') }}</li>
                        <li
                            class="network-chain"
                            :class="{
                                active:
                                    activeNetwork &&
                                    activeNetwork.chain === chain
                            }"
                            v-for="(chain, cindex) in network.chains"
                            :key="cindex"
                            @click.stop="chooseChain(id, chain)"
                        >
                            {{ chain }}
                        </li>
                    </ol>
                </li>
                <li class="network-item">
                    <div class="network-name" @click.stop="openModal">
                        {{ $t('lang.network.customNetwork') }}
                    </div>
                </li>
            </ul>
        </div>

        <NetworkModal v-model="isModalShow" @submit="handleModalSubmit" />

        <Loading :is-loading="isLoading" />
    </div>
</template>

<style src="./network-tree.styl" lang="stylus" scoped />

<script src="./network-tree.js" />
