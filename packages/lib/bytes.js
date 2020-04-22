const HexCharacters = '0123456789abcdef';

function stringToByte(str) {
    var bytes = new Array();
    var len, c;
    len = str.length;
    for(var i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if(c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0);
            bytes.push(((c >> 12) & 0x3F) | 0x80);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if(c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if(c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0);
            bytes.push((c & 0x3F) | 0x80);
        } else {
            bytes.push(c & 0xFF);
        }
    }
    return bytes;
}

function byteToString(arr) {
    if(typeof arr === 'string') {
        return arr;
    }
    var str = '',
        _arr = arr;
    for(var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if(v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for(var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
}

function addSlice(array) {
    if (array.slice) { return array; }

    array.slice = function() {
        var args = Array.prototype.slice.call(arguments);
        return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
    }

    return array;
}

function isArrayish(value) {
    if (!value || parseInt(String(value.length)) != value.length || typeof value === 'string') {
        return false;
    }

    for (var i = 0; i < value.length; i++) {
        var v = value[i];
        if (v < 0 || v >= 256 || parseInt(String(v)) != v) {
            return false;
        }
    }

    return true;
}

function hexlify(value) {
    var result = [];
    for (var i = 0; i < value.length; i++) {
         var v = value[i];
         result.push(HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f]);
    }
    return '0x' + result.join('');
}

function arrayify(value) {
    if (typeof value === 'string') {
        let match = value.match(/^(0x)?[0-9a-fA-F]*$/);

        if (!match) {
            throw new Error('invalid hexidecimal string');
        }

        if (match[1] !== '0x') {
            // throw new Error('hex string must have 0x prefix');
        } else {
            value = value.substring(2);
        }
        if (value.length % 2) { value = '0' + value; }

        var result = [];
        for (var i = 0; i < value.length; i += 2) {
            result.push(parseInt(value.substring(i, i + 2), 16));
        }

        return addSlice(new Uint8Array(result));
    }

    if (isArrayish(value)) {
        return addSlice(new Uint8Array(value));
    }

    throw new Error('invalid arrayify value');
}

function concat(objects) {
    var arrays = [];
    var length = 0;
    for (var i = 0; i < objects.length; i++) {
        var object = arrayify(objects[i])
        arrays.push(object);
        length += object.length;
    }

    var result = new Uint8Array(length);
    var offset = 0;
    for (var i = 0; i < arrays.length; i++) {
        result.set(arrays[i], offset);
        offset += arrays[i].length;
    }

    return addSlice(result);
}

// http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
function toUtf8Bytes(str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);

        if (c < 0x80) {
            result.push(c);

        } else if (c < 0x800) {
            result.push((c >> 6) | 0xc0);
            result.push((c & 0x3f) | 0x80);

        } else if ((c & 0xfc00) == 0xd800) {
            i++;
            let c2 = str.charCodeAt(i);

            if (i >= str.length || (c2 & 0xfc00) !== 0xdc00) {
                throw new Error('invalid utf-8 string');
            }

            // Surrogate Pair
            c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
            result.push((c >> 18) | 0xf0);
            result.push(((c >> 12) & 0x3f) | 0x80);
            result.push(((c >> 6) & 0x3f) | 0x80);
            result.push((c & 0x3f) | 0x80);

        } else {
            result.push((c >> 12) | 0xe0);
            result.push(((c >> 6) & 0x3f) | 0x80);
            result.push((c & 0x3f) | 0x80);
        }
    }

    return result;
};


// http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
function toUtf8String(bytes, ignoreErrors = true) {
    let result = '';
    let i = 0;

    // Invalid bytes are ignored
    while(i < bytes.length) {

        var c = bytes[i++];
        // 0xxx xxxx
        if (c >> 7 === 0) {
            result += String.fromCharCode(c);
            continue;
        }

        // Multibyte; how many bytes left for this character?
        let extraLength = null;
        let overlongMask = null;

        // 110x xxxx 10xx xxxx
        if ((c & 0xe0) === 0xc0) {
            extraLength = 1;
            overlongMask = 0x7f;

        // 1110 xxxx 10xx xxxx 10xx xxxx
        } else if ((c & 0xf0) === 0xe0) {
            extraLength = 2;
            overlongMask = 0x7ff;

        // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
        } else if ((c & 0xf8) === 0xf0) {
            extraLength = 3;
            overlongMask = 0xffff;

        } else {
            if (!ignoreErrors) {
                if ((c & 0xc0) === 0x80) {
                    throw new Error('invalid utf8 byte sequence; unexpected continuation byte');
                }
                throw new Error('invalid utf8 byte sequence; invalid prefix');
            }
            continue;
        }

        // Do we have enough bytes in our data?
        if (i + extraLength > bytes.length) {
            if (!ignoreErrors) { throw new Error('invalid utf8 byte sequence; too short'); }

            // If there is an invalid unprocessed byte, skip continuation bytes
            for (; i < bytes.length; i++) {
                if (bytes[i] >> 6 !== 0x02) { break; }
            }

            continue;
        }

        // Remove the length prefix from the char
        let res = c & ((1 << (8 - extraLength - 1)) - 1);

        for (let j = 0; j < extraLength; j++) {
            var nextChar = bytes[i];

            // Invalid continuation byte
            if ((nextChar & 0xc0) != 0x80) {
                res = null;
                break;
            };

            res = (res << 6) | (nextChar & 0x3f);
            i++;
        }

        if (res === null) {
            if (!ignoreErrors) { throw new Error('invalid utf8 byte sequence; invalid continuation byte'); }
            continue;
        }

        // Check for overlong seuences (more bytes than needed)
        if (res <= overlongMask) {
            if (!ignoreErrors) { throw new Error('invalid utf8 byte sequence; overlong'); }
            continue;
        }

        // Maximum code point
        if (res > 0x10ffff) {
            if (!ignoreErrors) { throw new Error('invalid utf8 byte sequence; out-of-range'); }
            continue;
        }

        // Reserved for UTF-16 surrogate halves
        if (res >= 0xd800 && res <= 0xdfff) {
            if (!ignoreErrors) { throw new Error('invalid utf8 byte sequence; utf-16 surrogate'); }
            continue;
        }

        if (res <= 0xffff) {
            result += String.fromCharCode(res);
            continue;
        }

        res -= 0x10000;
        result += String.fromCharCode(((res >> 10) & 0x3ff) + 0xd800, (res & 0x3ff) + 0xdc00);
    }

    return result;
}

export { toUtf8Bytes, toUtf8String, hexlify, arrayify, concat };