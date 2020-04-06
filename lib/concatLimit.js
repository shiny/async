import wrapAsync from './internal/wrapAsync';
import mapLimit from './mapLimit';
import awaitify from './internal/awaitify'

/**
 * 类似 [`concat`]{@link module:Collections.concat}，但限制了同时最多为 `limit` 的异步操作数量。
 *
 * @name concatLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.concat]{@link module:Collections.concat}
 * @category Collection
 * @alias flatMapLimit
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要遍历的集合
 * @param {number} limit - 同时最多为 `limit` 的异步操作数量。
 * @param {AsyncFunction} iteratee - 函数，应用到 `coll` 里的每一项，
 * 产生的结果将会放入数组。 以 (item, callback) 调用。
 * @param {Function} [callback] - 在所有 `iteratee` 函数都结束后被调用，或者产生一个错误。
 * 结果是 `iteratee` 函数产生的合并数组。调用：
 * (err, results)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 * @returns A Promise, if no callback is passed
 */
function concatLimit(coll, limit, iteratee, callback) {
    var _iteratee = wrapAsync(iteratee);
    return mapLimit(coll, limit, (val, iterCb) => {
        _iteratee(val, (err, ...args) => {
            if (err) return iterCb(err);
            return iterCb(err, args);
        });
    }, (err, mapResults) => {
        var result = [];
        for (var i = 0; i < mapResults.length; i++) {
            if (mapResults[i]) {
                result = result.concat(...mapResults[i]);
            }
        }

        return callback(err, result);
    });
}
export default awaitify(concatLimit, 4)
