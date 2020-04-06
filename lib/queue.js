import queue from './internal/queue';
import wrapAsync from './internal/wrapAsync';

/**
 * 任务队列，通过 worker 函数处理完成
 * @typedef {Iterable} QueueObject
 * @memberOf module:ControlFlow
 * @property {Function} length - 返回等待处理项目的数量的函数。
 * 通过 `queue.length()` 调用。
 * @property {boolean} started - boolean 值，是否有任务已经推入队列或已被处理过。
 * @property {Function} running - 函数，返回当前正在处理的任务数量。
 * 用法：`queue.running()`。
 * @property {Function} workersList - 函数，返回当前正在处理的任务数组。
 * 用法：`queue.workersList()`。
 * @property {Function} idle - 函数，当有任务等待处理时，返回 false；否则返回 true。
 * 用法：`queue.idle()`。
 * @property {number} concurrency - 整型值，决定了多少 `worker` 函数可以并发运行。
 * `queue` 创建后，在运行中也可以修改此属性。
 * @property {number} payload - integer 值，指定了每次传给 work 函数的任务数量。
 * 仅在 [cargo]{@link module:ControlFlow.cargo} 对象中生效。
 * @property {AsyncFunction} push - 添加新任务到 `queue`。 `worker` 处理完任务后，会调用 `callback`。
 * 不仅可以传入单个任务，还可以提交 `tasks` 数组。
 * 队列中每个任务结束后都会调用 callback。
 * 用法：`queue.push(task, [callback])`。
 * @property {AsyncFunction} unshift - 在 `queue` 前端推入任务。
 * 用法：`queue.unshift(task, [callback])`。
 * @property {AsyncFunction} pushAsync - 和 `q.push` 一样，除了它会返回 Promise 对象，
 * 并在出错时产生 reject。
 * @property {AsyncFunction} unshirtAsync - 和 `q.unshift` 一样，除了它会返回 Promise 对象，
 * 并在出错时产生 reject。
 * @property {Function} remove - 使用测试函数检测，如果匹配则会移除任务。
 * 如果是 [priorityQueue]{@link module:ControlFlow.priorityQueue} 对象，
 * test 函数会传入一个具有 `data` 和 `priority` 属性的 object。
 * 用法：`queue.remove(testFn)`，其中 `testFn` 的形式是：
 * `function ({data, priority}) {}`，并需要返回 Boolean。
 * @property {Function} saturated - 饱和。函数设置了一个callback，当运行的 worker 数量
 * 遇到 `concurrency` 限制、更多任务将会排队时触发。
 * 如果省略了 callback，`q.saturated()` 会返回一个 Promise 用于下次事件的发生。
 * @property {Function} unsaturated - 不饱和。函数设置了一个callback，当运行的 worker 数量
 * 少于 `concurrency` 和 `buffer` 限制，不会再有任务排队时触发。
 * 如果省略了 callback，`q.unsaturated()` 会返回一个 Promise 用于下次事件的发生。
 * @property {number} buffer - 认定 `queue` 为不饱和（`unsaturated`）的最小缓冲阈值
 * @property {Function} empty - 当队列中最后一项任务从 `queue` 分配到 `worker` 时触发设置的回调函数。
 * 如果省略了 callback，`q.empty()` 会返回一个 Promise 用于下次事件的发生。
 * @property {Function} drain - 当队列中最后一项任务从 `worker` 返回时触发设置的回调函数。
 * 如果省略了 callback，`q.drain()` 会返回一个 Promise 用于下次事件的发生。
 * @property {Function} error - 设置单个任务出错时的回调函数。
 * 函数签名：`function(error, task)`。
 * 如果省略了 callback，`error()` 会返回一个 Promise，并在下次出错时 reject。
 * @property {boolean} paused - 指示队列是否处于暂停状态的 boolean 值
 * @property {Function} pause - 使队列暂停，直至调用 `resume()` 后继续。
 * 用法：`queue.pause()`。
 * @property {Function} resume - 继续运行暂停中的队列。
 * 用法：`queue.resume()`。
 * @property {Function} kill - 该函数移除所有 `drain` 回调函数，清空任务，强制队列进入
 * 闲置模式。调用此函数后，不应再把任务推入队列。 用法：`queue.kill()`。
 *
 * @example
 * const q = async.queue(worker, 2)
 * q.push(item1)
 * q.push(item2)
 * q.push(item3)
 * // queue 是可迭代的，展开成 array 后检测
 * const items = [...q] // [item1, item2, item3]
 * // 或使用 for of
 * for (let item of q) {
 *     console.log(item)
 * }
 *
 * q.drain(() => {
 *     console.log('all done')
 * })
 * // 或
 * await q.drain()
 */

/**
 * 使用指定的并发数设置 `concurrency` 创建 `queue` 对象。
 * 添加进 `queue` 的任务会并行处理（上限为 `concurrency` 数值）。
 * 如果所有的 `worker` 都在处理中，任务将会排队等候。
 * 一旦有 `worker` 完成了一个 `task`，将调用 `task` 的回调函数（callback）。
 *
 * @name queue
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {AsyncFunction} worker - 处理队列任务的异步函数。
 * 如果想要处理单独的任务中的错误，为 `q.push()` 传入 callback。
 * 调用参数是 (task, callback)。
 * @param {number} [concurrency=1] - `integer` 值，决定了
 * `worker` 函数并发运行的数量。 省略时，默认值为 `1`。
 * 如果设置为 `0`，将抛出错误。
 * @returns {module:ControlFlow.QueueObject} 用来管理任务的 queue 对象。
 * 可附加回调函数到某些属性上，并监听队列生命周期的一些事件。
 * @example
 *
 * // 以并发数 2 创建队列对象
 * var q = async.queue(function(task, callback) {
 *     console.log('hello ' + task.name);
 *     callback();
 * }, 2);
 *
 * // 指定 callback
 * q.drain(function() {
 *     console.log('all items have been processed');
 * });
 * // 或 await 至结束
 * await q.drain()
 *
 * // 设置 error callback
 * q.error(function(err, task) {
 *     console.error('task experienced an error');
 * });
 *
 * // 为队列添加任务
 * q.push({name: 'foo'}, function(err) {
 *     console.log('finished processing foo');
 * });
 * // callback 可忽略
 * q.push({name: 'bar'});
 *
 * // 批量添加任务到队列
 * q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {
 *     console.log('finished processing item');
 * });
 *
 * // 添加任务至队列的前排
 * q.unshift({name: 'bar'}, function (err) {
 *     console.log('finished processing bar');
 * });
 */
export default function (worker, concurrency) {
    var _worker = wrapAsync(worker);
    return queue((items, cb) => {
        _worker(items[0], cb);
    }, concurrency, 1);
}
