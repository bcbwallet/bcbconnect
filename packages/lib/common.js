function requestHandler(target) {
    return new Proxy(target, {
        get(target, prop) {
            // First, check if the property exists on the target
            // If it doesn't, throw an error
            if(!Reflect.has(target, prop))
                throw new Error(`Object does not have property '${ prop }'`);

            // If the target is a variable or the internal 'on'
            // method, simply return the standard function call
            if(typeof target[ prop ] !== 'function' || prop === 'on')
                return Reflect.get(target, prop);

            // The 'req' object can be destructured into three components -
            // { resolve, reject and data }. Call the function (and resolve it)
            // so the result can then be passed back to the request.
            return (...args) => {
                if(!args.length)
                    args[ 0 ] = {};

                const [ firstArg ] = args;

                const {
                    resolve = () => {},
                    reject = ex => console.error(ex),
                    data
                } = firstArg;

                if(typeof firstArg !== 'object' || !('data' in firstArg))
                    return target[ prop ].call(target, ...args);

                Promise.resolve(target[ prop ].call(target, data))
                    .then(resolve)
                    .catch(reject);
            };
        }
    });
}

function injectPromise(func, ...args) {
    return new Promise((resolve, reject) => {
        func(...args, (err, res) => {
            if(err)
                reject(err);
            else resolve(res);
        });
    });
}

function deepCopy(obj) {
    let _obj = Array.isArray(obj) ? [] : {}
    for (let i in obj) {
      _obj[i] = typeof obj[i] === 'object' ? deepCopy(obj[i]) : obj[i]
    }
    return _obj
}

export { requestHandler, injectPromise, deepCopy };

