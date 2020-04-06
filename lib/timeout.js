import initialParams from './internal/initialParams';
import wrapAsync from './internal/wrapAsync';

/**
 * 为异步函数设置时间限制。如果函数没有在设定的毫秒内调用 callback，
 * 将以 timeout 错误调用。
 * 错误对象的代码会是 `'ETIMEDOUT'`。
 *
 * @name timeout
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {AsyncFunction} asyncFn - 要限制时间的 async 函数。
 * @param {number} milliseconds - 设定的超时毫秒数。
 * @param {*} [info] - 附加到 timeout Error 上的额外信息变量(`string`、`object`等类型)
 * @returns {AsyncFunction} 返回包装好的函数，可用于控制流函数。
 * 以 `asyncFunc` 同样的参数调用此函数。
 * @example
 *
 * function myFunction(foo, callback) {
 *     doAsyncTask(foo, function(err, data) {
 *         // 处理错误
 *         if (err) return callback(err);
 *
 *         // 处理事项 ...
 *
 *         // return 处理后的数据
 *         return callback(null, data);
 *     });
 * }
 *
 * var wrapped = async.timeout(myFunction, 1000);
 *
 * // 以 `myFunction` 的同样方式调用 `wrapped`
 * wrapped({ bar: 'bar' }, function(err, data) {
 *     // 若 `myFunction` 执行耗时 < 1000 ms，`err`
 *     // 和 `data` 会以预期的值返回。
 *
 *     // 不然 `err` 会是代码 'ETIMEDOUT' 的 Error
 * });
 */
export default function timeout(asyncFn, milliseconds, info) {
    var fn = wrapAsync(asyncFn);

    return initialParams((args, callback) => {
        var timedOut = false;
        var timer;

        function timeoutCallback() {
            var name = asyncFn.name || 'anonymous';
            var error  = new Error('Callback function "' + name + '" timed out.');
            error.code = 'ETIMEDOUT';
            if (info) {
                error.info = info;
            }
            timedOut = true;
            callback(error);
        }

        args.push((...cbArgs) => {
            if (!timedOut) {
                callback(...cbArgs);
                clearTimeout(timer);
            }
        });

        // 设置 timer，调用原始函数
        timer = setTimeout(timeoutCallback, milliseconds);
        fn(...args);
    });
}
