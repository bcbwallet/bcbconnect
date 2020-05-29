import crypto from 'crypto';
import pbkdf2 from 'pbkdf2';
import aesjs from "aes-js";

const encryptKey = (password, salt) => {
    return pbkdf2.pbkdf2Sync(password, salt, 1, 256 / 8, 'sha512');
};

const Utils = {
    encryptionAlgorithm: 'aes-256-ctr',
    hashAlgorithm: 'sha256',

    hash(string) {
        return crypto
            .createHash(this.hashAlgorithm)
            .update(string)
            .digest('hex');
    },

    encrypt(data, key) {
        const encoded = JSON.stringify(data);
        const cipher = crypto.createCipher(this.encryptionAlgorithm, key);

        let crypted = cipher.update(encoded, 'utf8', 'hex');
        crypted += cipher.final('hex');

        return crypted;
    },

    decrypt(data, key) {
        const decipher = crypto.createDecipher(this.encryptionAlgorithm, key);

        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    },

    isFunction(obj) {
        return typeof obj === 'function';
    },

    dataLetterSort (data, field, field2) {
        let needArray = [];
        let list = {};
        let LetterArray = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9'];
        for (let i = 0; i < data.length; i++) {
            const d = data[i][field] || data[i][field2] || data[i]['name'];
            let letter =  d.split('').filter(v=> v.match(/[a-zA-Z0-9]/)).join('').substring(0, 1).toUpperCase();
            if(!list[letter]) {
                list[letter] = [];
            }
            list[letter].push(data[i]);
        }
        LetterArray.forEach( v => {
            if(list[v]) {
                needArray = needArray.concat(list[v])
            }
        });
        return needArray;
    },

    validatInteger(str) { // integer
        const reg = /^\+?[1-9][0-9]*$/;
        return reg.test(str);
    },

    timetransTime(date) {
        const newDate = new Date(date * 1000);
        const timeY = newDate.getFullYear();
        const timeM = (newDate.getMonth() + 1 < 10 ? `0${newDate.getMonth() + 1}` : newDate.getMonth() + 1);
        const timeD = (newDate.getDate() < 10 ? `0${newDate.getDate()}` : newDate.getDate());
        const timeh = (newDate.getHours() < 10 ? `0${newDate.getHours()}` : newDate.getHours());
        const timem = (newDate.getMinutes() < 10 ? `0${newDate.getMinutes()}` : newDate.getMinutes());
        return `${timeY}.${timeM}.${timeD} ${timeh}:${timem}`;
    },

    timeFormatTime(date) {
        const newDate = new Date(date * 1000);
        const timeY = newDate.getFullYear();
        const timeM = (newDate.getMonth() + 1 < 10 ? `0${newDate.getMonth() + 1}` : newDate.getMonth() + 1);
        const timeD = (newDate.getDate() < 10 ? `0${newDate.getDate()}` : newDate.getDate());
        const timeh = (newDate.getHours() < 10 ? `0${newDate.getHours()}` : newDate.getHours());
        const timem = (newDate.getMinutes() < 10 ? `0${newDate.getMinutes()}` : newDate.getMinutes());
        return `${timeY}/${timeM}/${timeD} ${timeh}:${timem}`;
    },

    readFileContentsFromEvent(ev) {
      return new Promise(resolve => {
        const files = ev.target.files;
        const reader = new FileReader();
        reader.onload = (file) => {
          const contents = file.target.result;
          resolve(contents);
        };

        reader.readAsText(files[0]);
      });
    },

    decryptString(password, salt, hexString) {
      const key = encryptKey(password, salt);
      const encryptedBytes = aesjs.utils.hex.toBytes(hexString);
      const aesCtr = new aesjs.ModeOfOperation.ctr(key);
      const decryptedBytes = aesCtr.decrypt(encryptedBytes);
      return aesjs.utils.utf8.fromBytes(decryptedBytes);
    },

    delay(timeout){
        return new Promise(resolve => {
            setTimeout(resolve, timeout);
        });
    },

    getDefaultCurrency(lang) {
        switch (lang) {
            case 'en-US':
                return 'USD';
            case 'zh-CN':
                return 'CNY';
            default:
                return 'USD';
        }
    }
};

export default Utils;
