import eachLimit from './eachLimit';
import awaitify from './internal/awaitify'

/**
 * 类似 [`each`]{@link module:Collections.each} 但只有单个异步操作顺序执行
 *
 * 注意，和 [`each`]{@link module:Collections.each} 不同的是，此函数会以串行，按顺序逐个应用每一项。

 * @name eachSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.each]{@link module:Collections.each}
 * @alias forEachSeries
 * @category Collection
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要遍历的集合
 * @param {AsyncFunction} iteratee - 异步函数，应用到 `coll` 里的每一项。
 * 用法：(item, callback)。
 * 数组索引（index）不会传入 iteratee。
 * 如果需要索引（index），可以使用 `eachOfSeries`。
 * @param {Function} [callback] - 当所有项目都用 `iteratee` 处理完时，调用此 callback，
 * 或在出错时，调用的是(err)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 */
function eachSeries(coll, iteratee, callback) {
    return eachLimit(coll, 1, iteratee, callback)
}
export default awaitify(eachSeries, 3);
