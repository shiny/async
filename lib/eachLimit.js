import eachOfLimit from './internal/eachOfLimit';
import withoutIndex from './internal/withoutIndex';
import wrapAsync from './internal/wrapAsync';
import awaitify from './internal/awaitify'

/**
 * 和 [`each`]{@link module:Collections.each} 一样，但限定了同时最多执行 `limit` 数的异步操作
 *
 * @name eachLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.each]{@link module:Collections.each}
 * @alias forEachLimit
 * @category Collection
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要迭代的集合
 * @param {number} limit - 同时最多操作的数量
 * @param {AsyncFunction} iteratee - 异步函数，应用到 `coll` 里的每一项。
 * 用法：(item, callback)。
 * 数组索引（index）不会传入 iteratee。
 * 如果需要索引（index），可以使用 `eachOf`。
 * @param {Function} [callback] - 当所有项目都用 `iteratee` 处理完时，调用此 callback，
 * 或在出错时，调用的是(err)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 */
function eachLimit(coll, limit, iteratee, callback) {
    return eachOfLimit(limit)(coll, withoutIndex(wrapAsync(iteratee)), callback);
}
export default awaitify(eachLimit, 4)
