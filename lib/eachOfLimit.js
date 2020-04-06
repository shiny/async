import _eachOfLimit from './internal/eachOfLimit';
import wrapAsync from './internal/wrapAsync';
import awaitify from './internal/awaitify'

/**
 * 类似 [`eachOf`]{@link module:Collections.eachOf}，但限制了同时最多有 `limit` 个异步操作
 *
 * @name eachOfLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.eachOf]{@link module:Collections.eachOf}
 * @alias forEachOfLimit
 * @category Collection
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要遍历的集合
 * @param {number} limit - 同时最多的异步操作数量
 * @param {AsyncFunction} iteratee - 异步函数，应用到 `coll` 里的每一项。
 * `key` 是每一项的 key；如果是个数组，则是索引（index）
 * 这样调用：(item, key, callback)。
 * @param {Function} [callback] - 当所有项目都用 `iteratee` 处理完时，调用此 callback，
 * 或在出错时，调用的是(err)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 */
function eachOfLimit(coll, limit, iteratee, callback) {
    return _eachOfLimit(limit)(coll, wrapAsync(iteratee), callback);
}

export default awaitify(eachOfLimit, 4)
