import initialParams from './internal/initialParams';
import setImmediate from './internal/setImmediate';
import { isAsync } from './internal/wrapAsync'

/**
 * 将同步函数转为异步，将返回值传给 callback。
 * 帮助同步函数传入瀑布函数（waterfall）、串行函数（series）或其他 async 函数。
 * 除了最后一个 callback 参数外，所有传入的参数都会传给包装的函数。
 * 抛出的错误则会传给 callback。
 *
 * 如果传给 `asyncify` 的函数返回了一个 Promise，则回调函数会自动根据状态调用 resolved/rejected，
 * 而不是仅仅返回同步的值。
 *
 * 这样就意味着支持 ES2017 `async` 函数。
 *
 * @name asyncify
 * @static
 * @memberOf module:Utils
 * @method
 * @alias wrapSync
 * @category Util
 * @param {Function} func - 待转换成 {@link AsyncFunction} 的同步函数、返回 Promise 的函数。
 * @returns {AsyncFunction} `func` 的异步包装，
 * 会以 `(args..., callback)` 调用。
 * @example
 *
 * // 传入常规同步函数
 * async.waterfall([
 *     async.apply(fs.readFile, filename, "utf8"),
 *     async.asyncify(JSON.parse),
 *     function (data, next) {
 *         // data 是解析后的 text
 *         // 若出现错误，会被捕获。
 *     }
 * ], callback);
 *
 * // 传入返回 promise 的函数
 * async.waterfall([
 *     async.apply(fs.readFile, filename, "utf8"),
 *     async.asyncify(function (contents) {
 *         return db.model.create(contents);
 *     }),
 *     function (model, next) {
 *         // `model` 是 model 对象实例
 *         // 若出现错误，此函数会被跳过
 *     }
 * ], callback);
 *
 * // es2017 例子，当然如果 JS 环境支持 async 函数，就不需要 `asyncify` 化
 * var q = async.queue(async.asyncify(async function(file) {
 *     var intermediateStep = await processFile(file);
 *     return await somePromise(intermediateStep)
 * }));
 *
 * q.push(files);
 */
export default function asyncify(func) {
    if (isAsync(func)) {
        return function (...args/*, callback*/) {
            const callback = args.pop()
            const promise = func.apply(this, args)
            return handlePromise(promise, callback)
        }
    }

    return initialParams(function (args, callback) {
        var result;
        try {
            result = func.apply(this, args);
        } catch (e) {
            return callback(e);
        }
        // if result is Promise object
        if (result && typeof result.then === 'function') {
            return handlePromise(result, callback)
        } else {
            callback(null, result);
        }
    });
}

function handlePromise(promise, callback) {
    return promise.then(value => {
        invokeCallback(callback, null, value);
    }, err => {
        invokeCallback(callback, err && err.message ? err : new Error(err));
    });
}

function invokeCallback(callback, error, value) {
    try {
        callback(error, value);
    } catch (err) {
        setImmediate(e => { throw e }, err);
    }
}
