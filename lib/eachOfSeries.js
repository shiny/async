import eachOfLimit from './eachOfLimit';
import awaitify from './internal/awaitify'

/**
 * 类似 [`eachOf`]{@link module:Collections.eachOf} 但只有单个异步操作顺序执行
 *
 * @name eachOfSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.eachOf]{@link module:Collections.eachOf}
 * @alias forEachOfSeries
 * @category Collection
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要遍历的集合
 * @param {AsyncFunction} iteratee - 异步函数，应用到 `coll` 里的每一项。
 * 这样调用：(item, key, callback)。
 * @param {Function} [callback] - 当所有项目都用 `iteratee` 处理完时，调用此 callback，
 * 或在出错时，调用的是(err)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 */
function eachOfSeries(coll, iteratee, callback) {
    return eachOfLimit(coll, 1, iteratee, callback)
}
export default awaitify(eachOfSeries, 3);
