import concatLimit from './concatLimit';
import awaitify from './internal/awaitify'

/**
 * 类似 [`concat`]{@link module:Collections.concat}，但限制了同时只能有一个异步操作
 *
 * @name concatSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.concat]{@link module:Collections.concat}
 * @category Collection
 * @alias flatMapSeries
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要遍历的集合
 * @param {AsyncFunction} iteratee - 函数，应用到 `coll` 里的每一项，
 * 产生的结果将会放入数组。 以 (item, callback) 调用。
 * @param {Function} [callback] - 在所有 `iteratee` 函数都结束后被调用，或者产生一个错误。
 * 结果是 `iteratee` 函数产生的合并数组。调用：
 * (err, results)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 */
function concatSeries(coll, iteratee, callback) {
    return concatLimit(coll, 1, iteratee, callback)
}
export default awaitify(concatSeries, 3);
