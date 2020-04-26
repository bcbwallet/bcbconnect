import { hexlify, arrayify, concat } from './bytes';

class BaseX {
    constructor(alphabet) {
        this.alphabet = alphabet;
        this.base = alphabet.length;
        this._alphabetMap = {};
        this._leader = alphabet.charAt(0);

        // pre-compute lookup table
        for (var i = 0; i < alphabet.length; i++) {
            this._alphabetMap[alphabet.charAt(i)] = i;
        }
    }

    encode(value) {
        var source = arrayify(value);
        if (source.length === 0) {
            return '';
        }
        var digits = [0];
        for (var i = 0; i < source.length; ++i) {
            var carry = source[i];
            for (var j = 0; j < digits.length; ++j) {
                carry += digits[j] << 8;
                digits[j] = carry % this.base;
                carry = (carry / this.base) | 0;
            }
            while (carry > 0) {
                digits.push(carry % this.base);
                carry = (carry / this.base) | 0;
            }
        }
        var string = '';
        // deal with leading zeros
        for (var k = 0; source[k] === 0 && k < source.length - 1; ++k) {
            string += this._leader;
        }
        // convert digits to a string
        for (var q = digits.length - 1; q >= 0; --q) {
            string += this.alphabet[digits[q]];
        }
        return string;
    }

    decode (value) {
        if (typeof (value) !== 'string') {
            throw new TypeError('Expected String');
        }
        var bytes = [];
        if (value.length === 0) {
            return new Uint8Array(bytes);
        }
        bytes.push(0);
        for (var i = 0; i < value.length; i++) {
            var byte = this._alphabetMap[value[i]];
            if (byte === undefined) {
                throw new Error('Non-base' + this.base + ' character');
            }
            var carry = byte;
            for (var j = 0; j < bytes.length; ++j) {
                carry += bytes[j] * this.base;
                bytes[j] = carry & 0xff;
                carry >>= 8;
            }
            while (carry > 0) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
        }
        // deal with leading zeros
        for (var k = 0; value[k] === this._leader && k < value.length - 1; ++k) {
            bytes.push(0);
        }
        return arrayify(new Uint8Array(bytes.reverse()));
    }
}

const Base32 = new BaseX("abcdefghijklmnopqrstuvwxyz234567");
const Base58 = new BaseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

export { Base32, Base58 };

