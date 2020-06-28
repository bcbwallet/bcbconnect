// 简易的对象副本函数
function duplicate(data) {
    try {
        let sdata = JSON.stringify(data);
        return JSON.parse(sdata);
    } catch (e) {
        throw e;
    }
}

// 获取对象key集合
function getAllKeys(data) {
    data = data || {};
    let keys = [];
    for (const key in data) {
        keys.push(key);
    }
    return keys;
}

// 获取对象第一个key
function getFirstKey(data) {
    data = data || {};
    let firstKey = '';
    for (const key in data) {
        firstKey = key;
        break;
    }
    return firstKey;
}

// 获取对象第一个value
function getFirstValue(data) {
    data = data || {};
    let firstValue = '';
    for (const key in data) {
        firstValue = data[key];
        break;
    }
    return firstValue;
}

function getNetworkMode() {
    let mode = Number(process.env.VUE_APP_NETWORK_MODE);
    return isNaN(mode) ? 1 : mode;
}

const Utils = {
    duplicate,
    getAllKeys,
    getFirstKey,
    getFirstValue,
    getNetworkMode,
};

export default Utils;
