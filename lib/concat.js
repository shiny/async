import concatLimit from './concatLimit';
import awaitify from './internal/awaitify'

/**
 * 为 `coll` 中的每一项应用 `iteratee`，并且合并结果。
 * 返回合并后的列表。
 * 以并发调用 `iteratee`，并且合并它们返回的结果。
 * 返回的结果数组顺序是传给 `iteratee` 的 `coll` 原始顺序。
 *
 * @name concat
 * @static
 * @memberOf module:Collections
 * @method
 * @category Collection
 * @alias flatMap
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要遍历的集合
 * @param {AsyncFunction} iteratee - 函数，应用到 `coll` 里的每一项，
 * 产生的结果将会放入数组。 以 (item, callback) 调用。
 * @param {Function} [callback] - 在所有 `iteratee` 函数都结束后被调用，或者产生一个错误。
 * 结果是 `iteratee` 函数产生的合并数组。调用：
 * (err, results)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 * @example
 *
 * async.concat(['dir1','dir2','dir3'], fs.readdir, function(err, files) {
 *     // 现在 files 是在 3 个目录中已存在的文件名
 * });
 */
function concat(coll, iteratee, callback) {
    return concatLimit(coll, Infinity, iteratee, callback)
}
export default awaitify(concat, 3);
