import isArrayLike from './internal/isArrayLike';
import breakLoop from './internal/breakLoop';
import eachOfLimit from './eachOfLimit';
import once from './internal/once';
import onlyOnce from './internal/onlyOnce';
import wrapAsync from './internal/wrapAsync';
import awaitify from './internal/awaitify'

// eachOf implementation optimized for array-likes
function eachOfArrayLike(coll, iteratee, callback) {
    callback = once(callback);
    var index = 0,
        completed = 0,
        {length} = coll,
        canceled = false;
    if (length === 0) {
        callback(null);
    }

    function iteratorCallback(err, value) {
        if (err === false) {
            canceled = true
        }
        if (canceled === true) return
        if (err) {
            callback(err);
        } else if ((++completed === length) || value === breakLoop) {
            callback(null);
        }
    }

    for (; index < length; index++) {
        iteratee(coll[index], index, onlyOnce(iteratorCallback));
    }
}

// a generic version of eachOf which can handle array, object, and iterator cases.
function eachOfGeneric (coll, iteratee, callback) {
    return eachOfLimit(coll, Infinity, iteratee, callback);
}

/**
 * 类似 [`each`]{@link module:Collections.each}，但它会把 key (或 index) 作为第二个参数传给迭代器
 *
 * @name eachOf
 * @static
 * @memberOf module:Collections
 * @method
 * @alias forEachOf
 * @category Collection
 * @see [async.each]{@link module:Collections.each}
 * @param {Array|Iterable|AsyncIterable|Object} coll - 需要遍历的集合
 * @param {AsyncFunction} iteratee - 异步函数，应用到 `coll` 里的每一项。
 * `key` 是每一项的 key；如果是个数组，则是索引（index）
 * 这样调用：(item, key, callback)。
 * @param {Function} [callback] - 当所有项目都用 `iteratee` 处理完时，调用此 callback，
 * 或在出错时，调用的是(err)。
 * @returns {Promise} 忽略 callback 时，会返回一个 promise
 * @example
 *
 * var obj = {dev: "/dev.json", test: "/test.json", prod: "/prod.json"};
 * var configs = {};
 *
 * async.forEachOf(obj, function (value, key, callback) {
 *     fs.readFile(__dirname + value, "utf8", function (err, data) {
 *         if (err) return callback(err);
 *         try {
 *             configs[key] = JSON.parse(data);
 *         } catch (e) {
 *             return callback(e);
 *         }
 *         callback();
 *     });
 * }, function (err) {
 *     if (err) console.error(err.message);
 *     // configs 现在是 JSON 数据的映射
 *     doSomethingWith(configs);
 * });
 */
function eachOf(coll, iteratee, callback) {
    var eachOfImplementation = isArrayLike(coll) ? eachOfArrayLike : eachOfGeneric;
    return eachOfImplementation(coll, wrapAsync(iteratee), callback);
}

export default awaitify(eachOf, 3)
