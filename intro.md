![Async Logo](https://raw.githubusercontent.com/caolan/async/master/logo/async-logo_readme.jpg)

[![Build Status via Travis CI](https://travis-ci.org/caolan/async.svg?branch=master)](https://travis-ci.org/caolan/async)
[![NPM version](https://img.shields.io/npm/v/async.svg)](https://www.npmjs.com/package/async)
[![Coverage Status](https://coveralls.io/repos/caolan/async/badge.svg?branch=master)](https://coveralls.io/r/caolan/async?branch=master)
[![Join the chat at https://gitter.im/caolan/async](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/caolan/async?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

*Async v1.5.x 英文文档， [点击此处](https://github.com/caolan/async/blob/v1.5.2/README.md)*

Async 是一个直截了当、强大的[异步 JavaScript](http://caolan.github.io/async/v3/global.html) 实用工具模块。
尽管最初是设计用于 [Node.js](https://nodejs.org/)，可通过 `npm i async` 安装，但它也可以直接用于浏览器。

Async 也可以这样安装：

- [yarn](https://yarnpkg.com/en/): `yarn add async`


Async 提供了约 70 种函数，包括常见的泛函（`map`、`reduce`、`filter`、`each`…）， 
同时也提供了几种常见的异步流控制模式 （`parallel`、`series`、`waterfall`等）。

所有以上函数都假设你会遵循 Node.js 回调函数默认约定：
提供一个回调函数为异步函数的最后一个参数；
回调函数第一个参数必须是错误信息（Error）；
每个回调函数只调用一次。


同时也可以传入 `async` 函数，而不是回调函数。关于此信息，更多可参见 [AsyncFunction](global.html#AsyncFunction)


## 快速示例

```js
async.map(['file1','file2','file3'], fs.stat, function(err, results) {
    // 现在 results 是包含每个文件状态的数组
});

async.filter(['file1','file2','file3'], function(filePath, callback) {
  fs.access(filePath, function(err) {
    callback(null, !err)
  });
}, function(err, results) {
    // 现在 results 等于包含存在文件的数组
});

async.parallel([
    function(callback) { ... },
    function(callback) { ... }
], function(err, results) {
    // 可选的 callback
});

async.series([
    function(callback) { ... },
    function(callback) { ... }
]);
```

此外还有很多可用的函数，完整列表请看文档。此模块致力于适用广泛场景，如果你觉得有缺失，请创建 Github issue。

## 常见的坑 [(Stack溢出)](http://stackoverflow.com/questions/tagged/async.js)

### 同步的迭代函数

使用 async 时如果遇到类似  `RangeError: Maximum call stack size exceeded.` 的错误，或其他 stack 溢出错误，很可能是因为你使用了同步的迭代函数。
*同步* 的含义是：函数在同一次 javascript 事件循环里（same tick）调用回调函数，且没有 I/O 操作、定时器的使用。
反复调用大量这类回调函数，将快速导致 stack 溢出。

假设你遇到此问题，只需使用 `async.setImmediate` 延后回调函数，在下一次事件循环里开始新的调用栈。
如果在某些例子中过早回调，也会遇到这些意外：

```js
async.eachSeries(hugeArray, function iteratee(item, callback) {
    if (inCache(item)) {
        callback(null, cache[item]); // 如果缓存了太多 item，将遇到溢出（overflow）
    } else {
        doSomeIO(item, callback);
    }
}, function done() {
    //...
});
```

可修改为：

```js
async.eachSeries(hugeArray, function iteratee(item, callback) {
    if (inCache(item)) {
        async.setImmediate(function() {
            callback(null, cache[item]);
        });
    } else {
        doSomeIO(item, callback);
        //...
    }
});
```

由于性能原因的考虑，Async 不会去检测阻止同步的迭代器。 
如果还跑出 stack 溢出，可以按推荐的方式延后，或用 [`async.ensureAsync`](#ensureAsync) 包含同步函数，使它不存在这样的问题，并且不需要额外延后 callback。

如果对 JavaScript 的事件循环概念比较模糊，阅读[此文章](http://blog.carbonfive.com/2013/10/27/the-javascript-event-loop-explained/)或[此讨论](http://2014.jsconf.eu/speakers/philip-roberts-what-the-heck-is-the-event-loop-anyway.html)查看运作原理。

### 多个回调函数（callback）

如果提前调用回调函数，请确保及时 `return`，否则可能会多次调用 callback，后果无法预料。

```js
async.waterfall([
    function(callback) {
        getSomething(options, function (err, result) {
            if (err) {
                callback(new Error("failed getting something:" + err.message));
                // 应该在这里 return
            }
            // 由于没有 return，还是调用了下面的 callback
            // `processData` 将会调用两次
            callback(null, result);
        });
    },
    processData
], done)
```

如果调用 callback不是函数的最后一个语句，最佳实践是 `return callback(err, result)`。

### 使用 ES2017 `async` 函数

只要 Async 库里能接受 Node 风格 callback 的函数，也可以接受 `async` 函数。
只不过，不把它们作为回调传入，而是以值返回，也可以处理 Promise.reject 或抛出错误。

```js
async.mapLimit(files, 10, async file => { // <- 没有 callback！
    const text = await util.promisify(fs.readFile)(dir + file, 'utf8')
    const body = JSON.parse(text) // <- 自动产生 parse 错误
    if (!(await checkValidity(body))) {
        throw new Error(`${file} has invalid contents`) // <- 此错误会被捕捉
    }
    return body // <- 返回 value!
}, (err, contents) => {
    if (err) throw err
    console.log(contents)
})
```

我们仅支持原生（native）`async` 函数，不支持编译后的版本（例如 Babel 编译）。不然的话，只能使用 `async.asyncify()` 包下 `async` 函数。

### 为迭代器绑定上下文（context）

本章节不讨论 Async，而真的是绑定（`bind`）。
若要 Async 以指定的上下文（context）执行迭代，
或者因为其他方法、其他库不能作为迭代运行而感到疑惑，可以学习这个例子：

```js
// 这是个带有多余又不够直接的 square 方法的简单 Object
var AsyncSquaringLibrary = {
    squareExponent: 2,
    square: function(number, callback){
        var result = Math.pow(number, this.squareExponent);
        setTimeout(function(){
            callback(null, result);
        }, 200);
    }
};

async.map([1, 2, 3], AsyncSquaringLibrary.square, function(err, result) {
    // result 是 [NaN, NaN, NaN]
    // 失败的原因是：在 square 方法里，`this.squareExponent` 表达式
    // 关联的上下文（Context）不是 AsyncSquaringLibrary，而是 undefined
});

async.map([1, 2, 3], AsyncSquaringLibrary.square.bind(AsyncSquaringLibrary), function(err, result) {
    // result 是 [1, 4, 9]
    // 由于 bind 的作用，把迭代器传给 Async 前附加了 Context。
    // 现在 square 函数会以它自身的 AsyncSquaringLibrary 上下文执行
    // 因此会得到正确的 `this.squareExponent`
});
```

### 难以察觉的内存泄漏

有时在另一个异步函数里调用 Async 方法时要提前退出 async 流：

```javascript
function myFunction (args, outerCallback) {
    async.waterfall([
        //...
        function (arg, next) {
            if (someImportantCondition()) {
                return outerCallback(null)
            }
        },
        function (arg, next) {/*...*/}
    ], function done (err) {
        //...
    })
}
```

瀑布流（waterfall）里发生什么事，需要跳出瀑布流，跳过剩余的执行时，调用了一个外部（outer）callback。
但是，还是会等待内部 `next` callback 调用，留下分配的闭包作用域。

从版本 3.0 开始，可以传入 `false` 到 `error` 参数，阻止 Async 调用其他 callback。

```javascript
        function (arg, next) {
            if (someImportantCondition()) {
                outerCallback(null)
                return next(false) // ← 标示调用了外层 callback
            }
        },
```

### 处理集合时的同时修改集合

传入 array 到集合方法（例如 `each`、`mapLimit`、`filterSeries`），并且尝试 `push`、`pop` 或 `splice` 额外项目到 array 时，可能会导致意外。
Async 会迭代直至遇到 array 的原始 `length`，`pop()` 或 `splice()` 的项目可能已处理。
因此不推荐修改 Async 已经迭代过的 array。
若需要 `push`、`pop`、`splice`，使用 `queue` 替代。


## 下载
源码可以从
[GitHub](https://raw.githubusercontent.com/caolan/async/master/dist/async.min.js) 下载。
除此之外，也可以通过 npm 安装：

```bash
$ npm i async
```

可以和平时一样 `require()` async:

```js
var async = require("async");
```

也可以 require 一个单独的方法：

```js
var waterfall = require("async/waterfall");
var map = require("async/map");
```

__开发用：__ [async.js](https://raw.githubusercontent.com/caolan/async/master/dist/async.js) - 29.6kb 未压缩

### 在浏览器中使用

Async 可以在任何 ES2015 环境中运行（Node 6+ 和所有现代浏览器）。

想要在旧环境中使用 Async，(比如 Node 4、IE11) 必须先转码。

用法：

```html
<script type="text/javascript" src="async.js"></script>
<script type="text/javascript">

    async.map(data, asyncProcess, function(err, results) {
        alert(results);
    });

</script>
```

在 `/dist` 中包括 `async.js` 和 `async.min.js` 为无需安装的 Async 版本。
也能在 [jsDelivr CDN](http://www.jsdelivr.com/projects/async) 中找到 Async。

### ES 模块

Async 包含了 `.mjs` 版本，可自动用于兼容的打包工具，类似 Webpack、Rollup，用于 `package.json` 中的 `module` 字段。
我们也在 `async-es` npm 包中提供了纯 ES2015 模块的 Async。

```bash
$ npm install async-es
```

```js
import waterfall from 'async-es/waterfall';
import async from 'async-es';
```

### Typescript

Async 也有第三方的类型定义。

```
npm i -D @types/async
```

为了保留 `async` 函数，无需转码，建议 `tsconfig.json` 里 target 为 ES2017 或更高版本：

```json
{
  "compilerOptions": {
    "target": "es2017"
  }
}
```

## 其他库

* [`limiter`](https://www.npmjs.com/package/limiter) 频率限制包，基于每秒/小时的请求数。
* [`neo-async`](https://www.npmjs.com/package/neo-async) Async 替代品，专注于速度。
* [`co-async`](https://www.npmjs.com/package/co-async) 受 Async 启发的库，配合 [`co`](https://www.npmjs.com/package/co) 和 generator 函数使用。
*  [`promise-async`](https://www.npmjs.com/package/promise-async) 所有函数都 Promise 化的 Async 版本。

## 关于翻译
本文档基于 caolan/async master 分支进行翻译，起因为此库在克勤团队中大量用于后端队列的处理。 广告时间：招聘前端开发工程师，想要加入我们请邮件联系。

中文翻译文档 Github 地址 [https://github.com/shiny/async ](https://github.com/shiny/async ) 欢迎贡献 issue/pull request。

* 戴劼 <daijie@php.net>