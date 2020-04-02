import hash from 'hash.js';

import { toUtf8Bytes, toUtf8String, hexlify, arrayify, concat } from './bytes';
import { Base58 } from './basex';

function getMainAddress(address, chainOpts) {
    if (!address) return;
    let pos = address.indexOf('0');
    if (pos > 0) {
        return address.slice(0, pos);
    }
    return address.replace(/\[(.*?)\]/, '');
}

function getChainAddress(address, chainOpts) {
    if (!address) return;
    let { network, chain } = chainOpts;
    if (network && chain && chain != network) {
        if (chain === 'yy' || chain === 'jiuj') {
            return network + '[' + chain + ']' + address.slice(network.length)
        }
        let chainIdBytes = toUtf8Bytes(chain);
        let b58 = Base58.encode(chainIdBytes);
        return address + '0' + b58;
    }
    return address;
}

function isSideChainAddress(address) {
    // TODO: more check?
    return address.indexOf('[') > 0 || address.indexOf('0') > 0;
}

function chainOfAddress(address) {
    let pos = address.indexOf('0');
    if (pos > 0) {
        let str = address.slice(pos + 1);
        return toUtf8String(Base58.decode(str));
    }
    pos = address.indexOf('[');
    if (pos > 0) {
        let pos2 = address.indexOf(']');
        if (pos2 > pos) {
            return address.slice(pos + 1, pos2);
        }
    }
}

function ethToBcbAddress(ethAddress, chainOpts) {
    let { network, chain } = chainOpts;
    if (network == null) {
        throw new Error('Invaid chain options');
    }
    let chainId = network;
    if (network !== chain && chain) {
        chainId += '[' + chain + ']';
    }

    let ethAddressBytes = arrayify(ethAddress);
    ethAddressBytes = ethAddressBytes.slice(-20);
  
    let t = hash.ripemd160().update(ethAddressBytes).digest();
    let checksum = arrayify(hash.utils.toHex(t));
    let comb = concat([ethAddressBytes, checksum.slice(0, 4)]);
    let b58 = Base58.encode(comb);
    return chainId + b58;
}

function bcbToEthAddress(address, chainOpts) {
    let { network, chain } = chainOpts;
    if (network == null) {
        throw new Error('Invaid chain options');
    }
    let chainId = network;
    if (network !== chain && chain) {
        chainId += '[' + chain + ']';
    }
    if(address.indexOf(chainId) !== 0) {
        throw new Error('Chain id mismatch');
    }

    let rawB58 = address.slice(chainId.length);
    let raw = Base58.decode(rawB58);
    return hexlify(raw.slice(0, 20));
}

export { getMainAddress, getChainAddress, isSideChainAddress, chainOfAddress, ethToBcbAddress, bcbToEthAddress };