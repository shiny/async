import eachOf from './eachOf';
import withoutIndex from './internal/withoutIndex';
import wrapAsync from './internal/wrapAsync'
import awaitify from './internal/awaitify'

/**
 * 为 `coll` 内每一项并发地应用函数 `iteratee`。
 * 用列表中的每一项来调用 `iteratee`，并在完成后调用 callback。
 * 如果 `iteratee` 传递一个 error 给它的 `callback`，
 * 会以此 error 为参数，立即调用 `each` 函数的主回调函数。
 *
 * 注意：由于此函数会并发的应用 `iteratee`，所以不保证结束顺序。
 *
 * @name each
 * @static
 * @memberOf module:Collections
 * @method
 * @alias forEach
 * @category Collection
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要遍历的集合
 * @param {AsyncFunction} iteratee - 异步函数，应用到 `coll` 里的每一项。
 * 用法：(item, callback)。
 * 数组索引（index）不会传入 iteratee。
 * 如果需要索引（index），可以使用 `eachOf`。
 * @param {Function} [callback] - 当所有项目都用 `iteratee` 处理完时，调用此 callback，
 * 或在出错时，调用的是(err)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 * @example
 *
 * // 假设 openFiles 是文件名数组，saveFile 是保存文件修改内容的函数：
 *
 * async.each(openFiles, saveFile, function(err){
 *   // 如果任意一次保存产生一个 error，这个 err 等于那个 error
 * });
 *
 * // 假设 openFiles 是文件名数组
 * async.each(openFiles, function(file, callback) {
 *
 *     // 在此执行文件操作
 *     console.log('Processing file ' + file);
 *
 *     if( file.length > 32 ) {
 *       console.log('This file name is too long');
 *       callback('File name too long');
 *     } else {
 *       // 在此执行文件操作
 *       console.log('File processed');
 *       callback();
 *     }
 * }, function(err) {
 *     //  如果任意一次文件处理产生一个 error，这个 err 等于那个 error
 *     if( err ) {
 *       // 只要有一次迭代产生 error，
 *       // 所有的处理都会立即停止。
 *       console.log('A file failed to process');
 *     } else {
 *       console.log('All files have been processed successfully');
 *     }
 * });
 */
function eachLimit(coll, iteratee, callback) {
    return eachOf(coll, withoutIndex(wrapAsync(iteratee)), callback);
}

export default awaitify(eachLimit, 3)
