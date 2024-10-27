---
permalink: /js/chapter11/
title: 第11章 Promise和异步函数
createTime: 2024/10/18 16:28:56
---
# 第11章 Promise和异步函数

 ES6开始了对异步的支持，Promise引用类型允许优雅的定义和组织异步行为。更高版本还使用async和await关键字扩展了该语言以支持异步功能。

>注意:在本章中,示例广泛使用异步日志记录setTimeout(console.log, 0, ...params) 来演示操作顺序和其他异步行为特征。日志输出将显示为好像是同步打印的,而实际上是异步打印的。这样做是为了允许诸如promise之类的值呈现其最终状态。此外,浏览器的控制台输出通常会打印有关JavaScript运行时无法使用的对象的信息(例如promise的状态)。本章中的示例中广泛使用了此功能,以帮助拓宽读者的理解。

## 异步编程介绍

 同步与异步行为是计算机科学中的基本概念，尤其是在单线程事件循环模型（如JavaScript）中。面对高延迟操作，异步行为不需要针对更高的计算吞吐量进行优化。如果在计算的同时仍然可以运行其他指令并保持稳定的系统，那么这样做是实用的。

 重要的是，异步操作不一定是计算密集型操作或高延迟操作。它可以在任何地方使用，为了等待异步行为发生而阻塞线程没有任何意义。

## Javascript中的同步与异步

 同步行为类似于内存中连续的处理器指令，每条指令严格按照出现的顺序执行，并且每个指令能够立即获取系统本地存储的信息（如在处理器寄存器或系统内存中），故很容易推断出代码中任何给定点的程序状态（例如，变量的值）。

 异步行为类似于，当前进程的外部实体能够触发代码执行。通常需要异步操作，因为不能强制进程等待需要长时间才能完成的操作。如代码访问高延迟资源，发送请求到远程服务器并等待回应。

```js
let x = 3;
setTimeout(() => x = x + 6, 1000);
```



## Promise

## Promise基础

 从ES6开始，将支持Promise引用类型并可使用new实例化。这需要传递一个执行者函数作为参数，若不提供将报错。

```js
let p = new Promise(() => {});
setTimeout(console.log, 0, p);//Promise {<pending>}
```



## Promise状态机

 当传递promise实例到console.log时，控制台输出显示该实例的状态为pending。promise是一个有状态的对象， 三种状态分别为：

-  pending

-  fulfilled(有时也指resolved)

-  rejected


 pending是promise的初始状态。pending转换到fulfilled表示成功，转换到rejected表示失败。转换不可逆。

 promise的状态是私有的，不能被JavaScript检查。

### 解决值 拒绝原因 和Promise的用途

 Promise很有用的两个原因，一是抽象的表示一个异步执行块，promise的状态显示其是否执行完成，pending表示执行还没开始或仍在进程中。fulfilled表示完全成功，rejected表示未成功完成。

 另外，promise包装的异步执行实际上产生一个值，当promise状态改变时，程序流期望此值可用。当promise拒绝时，程序流期望获得拒绝的原因。

### 使用执行者（Executor)控制Promise状态

 因为promise的状态是私有的，只能由内部执行者函数操作。

 执行者函数有两个职责：初始化promise的异步行为，和控制最终的状态转换。控制状态转换是通过调用执行者函数的两个形参（resolve和reject）之一完成的：

```js
let p1 = new Promise((resolve, reject) => resolve());
setTimeout(console.log, 0, p1); // Promise <resolved>
let p2 = new Promise((resolve, reject) => reject());
setTimeout(console.log, 0, p2); // Promise <rejected>
// Uncaught error (in promise) p2行
```

 这个例子没有异步行为发生，因为执行者函数退出时promise状态已经改变。重要的是，执行者函数是同步执行的，其充当初始化器。执行顺序演示如下：

```js
new Promise(() => setTimeout(console.log, 0, 'executor'));
setTimeout(console.log, 0, 'promise initialized');
//executor
//promise initialized
```

 可通过添加setTimeout延迟状态转换：

```js
let p = new Promise((resolve, reject) => setTimeout(resolve, 1000,666));
// 当下列这行执行时,执行者的timeout回调还没有执行
setTimeout(console.log, 0, p); // Promise <pending>
setTimeout(console.log,2000,p);//2秒后 Promise {<fulfilled>: 666}
```

 一旦resolve或reject调用后，状态转换就无法撤销，试图进一步改变状态将被忽略。

```js
let p = new Promise((resolve, reject) => {
    resolve();
    reject(); // 无效果
});
setTimeout(console.log, 0, p); // Promise {<fulfilled>: undefined}
```

 可通过添加定时退出行为来避免promise卡在pending状态：

```js
let p = new Promise((resolve, reject) => {
    setTimeout(reject, 10000); // 10s后调用reject()。
    // 其他执行者代码
});
setTimeout(console.log, 0, p); // Promise <pending>
setTimeout(console.log, 11000, p); // 11s后检查状态。
// (10s后) Uncaught error.
// (11s后) Promise <rejected>.
```

### Promise.resolve()转换状态

 使用Promise.resolve()实例化promise为resolved状态，下面两种方法效果相同：

```js
let p1 = new Promise((resolve, reject) => resolve());
let p2 = Promise.resolve();
```

 传递给Promise.resolve()的第一个实参将成为promise的resolved值：

```js
setTimeout(console.log, 0, Promise.resolve());
// Promise {<fulfilled>: undefined}
setTimeout(console.log, 0, Promise.resolve(3));
// Promise <fulfilled>: 3
// 多余的参数将被忽略
setTimeout(console.log, 0, Promise.resolve(4, 5, 6));
// Promise <fulfilled>: 4
```

 当实参是promise时：

```js
let p = Promise.resolve(7);
setTimeout(console.log, 0, p === Promise.resolve(p));
// true
setTimeout(console.log, 0, p === Promise.resolve(Promise.resolve(p)));
// true
let p1 = new Promise(() => {});
setTimeout(console.log, 0, p1); // Promise <pending>
setTimeout(console.log, 0, Promise.resolve(p1)); // Promise <pending>
setTimeout(console.log, 0, p === Promise.resolve(p1)); // true
```



### Promise.reject()

 Promise.reject()实例化一个rejected promise并抛出一个异步异常（不能被try/catch捕获），下例两行效果相同：

```js
let p1 = new Promise((resolve, reject) => reject());
let p2 = Promise.reject();
```

 传递给Promise.reject()的第一个实参是该promise的拒绝原因：

```js
let p = Promise.reject(3);
setTimeout(console.log, 0, p); // Promise <rejected>: 3
p.then(null, (e) => setTimeout(console.log, 0, e)); // 3
```

 Promise.reject()没有Promise.resolve()的幂等操作：

```js
setTimeout(console.log, 0, Promise.reject(Promise.resolve()));
//Uncaught (in promise) Promise {<fulfilled>: undefined}
//Promise {<rejected>: Promise}
```

### 同步/异步执行

 Promise结构的大部分设计都是为了在JavaScript中产生一种完全独立的计算模式，其抛出异常的方式不同：

```js
try {
    throw new Error('foo');
} catch (e) {
    console.log(e); // Error: foo
}
try {
    Promise.reject(new Error('bar'));
} catch (e) {
    console.log(e);
}
// Uncaught (in promise) Error: bar
```

 上例rejected promise的异常未发生在同步线程，而是在浏览器的异步执行消息队列中。因此try/catch无法捕获此异常。一旦代码执行到异步模式，唯一的交互方式是使用promise方法。

## Promise 实例方法

### 实现Thenable接口

 任何暴露then()方法的对象可认为是实现了Thenable接口。

 Promise.prototype.then()方法用于向promise实例添加handler。then()接受两个可选参数——

 onResolved handler和onRejected handler，当它们各自的promise状态到达'fulfilled'或'rejected'时执行：

```js
function onResolved(id) {
    setTimeout(console.log, 0, id, 'resolved');
}
function onRejected(id) {
    setTimeout(console.log, 0, id, 'rejected');
}
let p1 = new Promise((resolve, reject) => setTimeout(resolve, 3000));
let p2 = new Promise((resolve, reject) => setTimeout(reject, 3000));
p1.then(() => onResolved('p1'),
        () => onRejected('p1'));
p2.then(() => onResolved('p2'),
        () => onRejected('p2'));
//3秒后
// p1 resolved
// p2 rejected
```

 传递到then()的非函数参数将被忽略。

 **如果只提供onRejected handler，那么将onResolved参数设为undefined是公认的选择，这样避免了在内存中创建临时对象** ：

```js
function onResolved(id) {
    setTimeout(console.log, 0, id, 'resolved');
}
function onRejected(id) {
    setTimeout(console.log, 0, id, 'rejected');
}
let p1 = new Promise((resolve, reject) => setTimeout(resolve, 3000));
let p2 = new Promise((resolve, reject) => setTimeout(reject, 3000));
// 不推荐非函数形式的参数,会被静默忽略
p1.then('gobbeltygook');
// 显式跳过onResolved handler的经典方式
p2.then(null, () => onRejected('p2'));
// p2 rejected (3s后)
```

 Promise.prototype.then() 返回一个新promise实例 ：

```js
let p1 = new Promise(() => {});
let p2 = p1.then();
setTimeout(console.log, 0, p1); // Promise <pending>
setTimeout(console.log, 0, p2); // Promise <pending>
setTimeout(console.log, 0, p1 === p2); // false
```

 **这个新实例派生自onResolved handler的返回值。（handler的返回值包装在Promise.resolve（）中以生成新的promise） 。** 

 **如果没提供处理程序函数，then仅作为通道传递最初的promise的resolved值。** 

 **如果没有明确的返回语句，那么返回值是包装在Promise.resolve（）中的undefined** 。如下所示：

```js
let p1 = Promise.resolve('foo');
// 调用没有参数的then()仅充当一个通道
let p2 = p1.then();
setTimeout(console.log, 0, p2); // Promise <resolved>: foo
// 这些是相等的
let p3 = p1.then(() => undefined);
let p4 = p1.then(() => {});
let p5 = p1.then(() => Promise.resolve());
setTimeout(console.log, 0, p3); // Promise <resolved>: undefined
setTimeout(console.log, 0, p4); // Promise <resolved>: undefined
setTimeout(console.log, 0, p5); // Promise <resolved>: undefined
//显式返回值包装在Promise.resolve()中:
let p6 = p1.then(() => 'bar');
let p7 = p1.then(() => Promise.resolve('bar'));
setTimeout(console.log, 0, p6); // Promise <resolved>: bar
setTimeout(console.log, 0, p7); // Promise <resolved>: bar
// Promise.resolve()保护返回的promise
let p8 = p1.then(() => new Promise(() => {}));
let p9 = p1.then(() => Promise.reject());
// Uncaught (in promise): undefined
setTimeout(console.log, 0, p8); // Promise <pending>
setTimeout(console.log, 0, p9); // Promise <rejected>: undefined
//抛出异常将返回一个rejected promise
let p10 = p1.then(() => {
    throw 'baz';
});
// Uncaught (in promise) baz
setTimeout(console.log, 0, p10); // Promise <rejected> baz
//返回error则不触发rejected promise,并替换成包装在resolved promise中的error对象。
let p11 = p1.then(() => Error('qux'));
setTimeout(console.log, 0, p11); // Promise <resolved>: Error: qux
```

 onRejected handler有相同的行为——其返回值包装在Promise.resolve()中。onRejected handler的工作是捕获异步异常:

```js
let p1 = Promise.reject('foo');
//
调用没有参数的then()仅充当一个通道
let p2 = p1.then();
// Uncaught (in promise) foo
setTimeout(console.log, 0, p2); // Promise <rejected>: foo
// 这些是相等的
let p3 = p1.then(null, () => undefined);
let p4 = p1.then(null, () => {});
let p5 = p1.then(null, () => Promise.resolve());
setTimeout(console.log, 0, p3); // Promise {<fulfilled>: undefined}
setTimeout(console.log, 0, p4); //Promise {<fulfilled>: undefined}
setTimeout(console.log, 0, p5); // Promise {<fulfilled>: undefined}
// 这些也是相等的
let p6 = p1.then(null, () => 'bar');
let p7 = p1.then(null, () => Promise.resolve('bar'));
setTimeout(console.log, 0, p6); // Promise <resolved>: bar
setTimeout(console.log, 0, p7); // Promise <resolved>: bar
//Promise.resolve()保护返回的promise
let p8 = p1.then(null, () => new Promise(() => {}));
let p9 = p1.then(null, () => Promise.reject());
// Uncaught (in promise): undefined
setTimeout(console.log, 0, p8); // Promise <pending>
setTimeout(console.log, 0, p9); // Promise <rejected>: undefined
let p10 = p1.then(null, () => {
    throw 'baz';
});
// Uncaught (in promise) baz
setTimeout(console.log, 0, p10); // Promise <rejected>: baz
let p11 = p1.then(null, () => Error('qux'));
setTimeout(console.log, 0, p11); // Promise <resolved>: Error: qux
```



### Promise.prototype.catch()

 此方法只添加reject handler到promise。只需要一个参数：onRejected handler；这与使用Promise.prototype.then(null, onRejected)一样。

```js
let p = Promise.reject();
let onRejected = function(e) {
    setTimeout(console.log, 0, 'rejected');
};
// 这两个reject handler行为相同
p.then(null, onRejected); // rejected
p.catch(onRejected); // rejected
// Promise.prototype.catch()方法返回新的promise实例
let p1 = new Promise(() => {});
let p2 = p1.catch();
setTimeout(console.log, 0, p1); // Promise <pending>
setTimeout(console.log, 0, p2); // Promise <pending>
setTimeout(console.log, 0, p1 === p2); // false
```

### Promise.prototype.finally()

 此方法用于添加onFinally handler，当promise为resloved或rejected时执行：

```js
let p1 = Promise.resolve();
let p2 = Promise.reject();
let onFinally = function() {
    setTimeout(console.log, 0, 'Finally!')
}
p1.finally(onFinally); // Finally
p2.finally(onFinally); // Finally
// Promise.prototype.finally()方法返回新的promise实例:
let p1 = new Promise(() => {});
let p2 = p1.finally();
setTimeout(console.log, 0, p1); // Promise <pending>
setTimeout(console.log, 0, p2); // Promise <pending>
setTimeout(console.log, 0, p1 === p2); // false
```

 该新实例产生方式与then()或catch()不同，大多数形况下其行为更像父promise：

```js
//父promise p1
let p1 = Promise.resolve('foo');
// 这些都扮演一个通道
let p2 = p1.finally();
let p3 = p1.finally(() => undefined);
let p4 = p1.finally(() => {});
let p5 = p1.finally(() => Promise.resolve());
let p6 = p1.finally(() => 'bar');
let p7 = p1.finally(() => Promise.resolve('bar'));
let p8 = p1.finally(() => Error('qux'));
setTimeout(console.log, 0, p2); // Promise {<fulfilled>: "foo"}
setTimeout(console.log, 0, p3); // Promise {<fulfilled>: "foo"}
setTimeout(console.log, 0, p4); // Promise {<fulfilled>: "foo"}
setTimeout(console.log, 0, p5); // Promise {<fulfilled>: "foo"}
setTimeout(console.log, 0, p6); // Promise {<fulfilled>: "foo"}
setTimeout(console.log, 0, p7); // Promise {<fulfilled>: "foo"}
setTimeout(console.log, 0, p8); // Promise {<fulfilled>: "foo"}
// 唯一的例外是返回pending promise,或抛出异常(显示抛出或返回一个rejected promise)。
// Promise.resolve() 保护返回的promise
let p9 = p1.finally(() => new Promise(() => {}));
let p10 = p1.finally(() => Promise.reject());
// Uncaught (in promise): undefined
setTimeout(console.log, 0, p9); // Promise <pending>
setTimeout(console.log, 0, p10); // Promise <rejected>: undefined
let p11 = p1.finally(() => {
    throw 'baz';
});
// Uncaught (in promise) baz
setTimeout(console.log, 0, p11); // Promise <rejected>: baz
```

 返回一个pending promise是特例,因为一旦promise状态转换成resolved，p2行为和最初的p1一样：

```js
let p1 = Promise.resolve('foo');
// resolved值被忽略
let p2 = p1.finally(
    () => new Promise((resolve, reject) => setTimeout(() => resolve('bar'), 1000)));
setTimeout(console.log, 0, p2); // Promise <pending>
setTimeout(() => setTimeout(console.log, 0, p2), 2000);
// 2s后:
// Promise {<fulfilled>: "foo"}
setTimeout(console.log,3000,p2 === p1);//false
```

### Non-Reentrant(非重入) Promise方法

 当promise到达稳定状态时，与该状态关联的handler的执行仅是调度的，而不是立即执行。

 **在handler调用前，跟在handler后面的同步代码执行先于附加到handler上的代码** 。这种特性叫做非重入：

```js
// 创建一个resolved promise
let p = Promise.resolve();
// 直觉上感觉这会立即执行,因为p已经是resolved状态了:
p.then(() => console.log('onResolved handler'));
// 指示then()返回的同步输出:
console.log('then() returns');
// 实际输出是这样的:
// then() returns
// onResolved handler
```

 在上例中，p上调用then()将把onResolved handler推到消息队列，在当前线程执行完毕后，出列执行。因此跟在then()后面的同步代码先于handler执行。

 如果handler已经添加到了promise，而promise随后同步的改变状态，则handler执行在状态改变时是非重入的。如下列所示，即使onResolved handler已经添加，同步调用resolve（）仍将显示非重入行为：

```js
let synchronousResolve;
// 创建一个promise并将resolve函数放在一个变量中:
let p = new Promise((resolve) => {
    synchronousResolve = function() {
        console.log('1: invoking resolve()');
        resolve();
        console.log('2: resolve() returns');
    };
});
p.then(() => console.log('4: then() handler executes'));
synchronousResolve();
console.log('3: synchronousResolve() returns');
// 实际输出:
// 1: invoking resolve()
// 2: resolve() returns
// 3: synchronousResolve() returns
// 4: then() handler executes
```

 在此例中，handler的执行仍需等到从运行时消息队列出列。

 onResolved和onRejected,catch(),finally()的handler都能保证非重入：

```js
let p1 = Promise.resolve();
p1.then(() => console.log('p1.then() onResolved'));
console.log('p1.then() returns');
let p2 = Promise.reject();
p2.then(null, () => console.log('p2.then() onRejected'));
console.log('p2.then() returns');
let p3 = Promise.reject();
p3.catch(() => console.log('p3.catch() onRejected'));
console.log('p3.catch() returns');
let p4 = Promise.resolve();
p4.finally(() => console.log('p4.finally() onFinally'));
console.log('p4.finally() returns');
// p1.then() returns
// p2.then() returns
// p3.catch() returns
// p4.finally() returns
// p1.then() onResolved
// p2.then() onRejected
// p3.catch() onRejected
// p4.finally() onFinally
```

### 同胞hander执行顺序

 如果一个promise附加了多个handler，当promise的状态稳定时，与之关联的handler将按照添加顺序依次执行。then(),catch(),finally()也是如此：

```js
let p1 = Promise.resolve();
let p2 = Promise.reject();
p1.then(() => setTimeout(console.log, 0, 1));
p1.then(() => setTimeout(console.log, 0, 2));
// 1
// 2
p2.then(null, () => setTimeout(console.log, 0, 3));
p2.then(null, () => setTimeout(console.log, 0, 4));
// 3
// 4
p2.catch(() => setTimeout(console.log, 0, 5));
p2.catch(() => setTimeout(console.log, 0, 6));
// 5
// 6
p1.finally(() => setTimeout(console.log, 0, 7));
p1.finally(() => setTimeout(console.log, 0, 8));
// 7
// 8
```



### 传递resolved值和rejected原因

 当到达稳定状态时，promise将提供resolved值(fulfilled状态)和rejection原因（rejected状态）到附加到此状态的任何handler：

```js
let p1 = new Promise((resolve, reject) => resolve('foo'));
p1.then((value) => console.log(value)); // foo
let p2 = new Promise((resolve, reject) => reject('bar'));
p2.catch((reason) => console.log(reason)); // bar
let p3 = Promise.resolve('foo');
p1.then((value) => console.log(value)); // foo
let p4 = Promise.reject('bar');
p2.catch((reason) => console.log(reason)); // bar
```

### Rejecting Promise和Rejection Error处理

 拒绝promise与throw表达式类似，都代表程序状态，应强制中止任何后续操作。

 在promise的执行者函数或handler中抛出错误将导致其状态变成拒绝，相应的Error对象将成为拒绝原因：

```js
let p1 = new Promise((resolve, reject) => reject(Error('foo')));
let p2 = new Promise((resolve, reject) => {
    throw Error('foo');
});
let p3 = Promise.resolve().then(() => {
    throw Error('foo');
});
let p4 = Promise.reject(Error('foo'));
setTimeout(console.log, 0, p1); // Promise <rejected>: Error: foo
setTimeout(console.log, 0, p2); // Promise <rejected>: Error: foo
setTimeout(console.log, 0, p3); // Promise <rejected>: Error: foo
setTimeout(console.log, 0, p4); // Promise <rejected>: Error: foo
```

 当任何值包含undefined时promise将为rejected，但还是强烈推荐使用Error对象。主要原因是构造Error对象允许浏览器在Error对象中捕获堆栈踪迹，这非常有利于bug调式。如之前的代码：

```js
index.html:2839 Uncaught (in promise) Error: foo
at index.html:2839
at new Promise (<anonymous>)
at index.html:2839
(anonymous) @ index.html:2839
(anonymous) @ index.html:2839
index.html:2841 Uncaught (in promise) Error: foo
at index.html:2841
at new Promise (<anonymous>)
at index.html:2840
(anonymous) @ index.html:2841
(anonymous) @ index.html:2840
index.html:2846 Uncaught (in promise) Error: foo
at index.html:2846
(anonymous) @ index.html:2846
index.html:2844 Uncaught (in promise) Error: foo
at index.html:2844
```

 所有错误都是异步抛出和未处理的，Error对象捕获的堆栈踪迹显示相应路径。需要注意的是Promise.resolve().then()错误在最后执行，是因为在运行时消息队列上需要额外的入口，因为它在最终引发未捕获的错误之前创建了另一个promise。

 这个例子有个有趣的副作用，通常，使用throw关键字抛出一个错误后，Javascript运行时错误处理机制将拒绝处理任何跟在throw语句后的指令：

```js
throw Error('foo');
console.log('bar'); // 这里绝不会输出
// Uncaught Error: foo
```

 然而，在promise中抛出错误时，因为错误是从消息队列中异步抛出的，故不会阻止运行时继续执行同步指令：

```js
Promise.reject(Error('foo'));
console.log('bar');
// bar
// Uncaught (in promise) Error: foo
```

 异步错误只能被异步的onRejection handler捕获：

```js
// 正确
Promise.reject(Error('foo')).catch((e) => {});
// 不正确
try {
    Promise.reject(Error('foo'));
} catch (e) {}
```



## Promise链和组成

### Promise链

 promise最强大的能力之一就是严格排序(strictly sequenced)。每个promise实例方法(then(),catch(),finally())返回单独的promise实例，可以接着调用新实例上的方法，这种连续调用的行为叫做promise chaining，如下所示：

```js
let p = new Promise((resolve, reject) => {
    console.log('first');
    resolve();
});
p.then(() => console.log('second'))
    .then(() => console.log('third'))
    .then(() => console.log('fourth'));
// first
// second
// third
// fourth
```

 这个实现最终是执行链式同步任务。因此，执行的工作不是很有用或有趣，因为它与依次连续调用四个函数大致相同：

```js
(() => console.log('first'))();
(() => console.log('second'))();
(() => console.log('third'))();
(() => console.log('fourth'))();
```

 要链接异步任务，可以重新调整此示例，以便每个执行者返回一个promise实例。由于每个连续的promise将等待其前辈变解决，这样的策略可用于序列化异步任务。如下所示：

```js
let p1 = new Promise((resolve, reject) => {
    console.log('p1 executor');
    setTimeout(resolve, 1000);
});
p1.then(() => new Promise((resolve, reject) => {
    console.log('p2 executor');
    setTimeout(resolve, 1000);
}))
    .then(() => new Promise((resolve, reject) => {
    console.log('p3 executor');
    setTimeout(resolve, 1000);
}))
    .then(() => new Promise((resolve, reject) => {
    console.log('p4 executor');
    setTimeout(resolve, 1000);
}));
// p1 executor (after 1s)
// p2 executor (after 2s)
// p3 executor (after 3s)
// p4 executor (after 4s)
```

 将promise生成组合到单个工厂函数中会产生以下结果：

```js
function delayedResolve(str) {
    return new Promise((resolve, reject) => {
        console.log(str);
        setTimeout(resolve, 1000);
    });
}
delayedResolve('p1 executor')
    .then(() => delayedResolve('p2 executor'))
    .then(() => delayedResolve('p3 executor'))
    .then(() => delayedResolve('p4 executor'))
// p1 executor (after 1s)
// p2 executor (after 2s)
// p3 executor (after 3s)
// p4 executor (after 4s)
```

 每个连续的处理程序等待其前辈变解决，实例化一个新的promise实例并返回。这样的结构能够巧妙地序列化异步代码，而无需强制使用回调。如果不使用promise，前面的代码看起来像这样：

```js
function delayedExecute(str, callback = null) {
    setTimeout(() => {
        console.log(str);
        callback && callback();
    }, 1000)
}
delayedExecute('p1 callback', () => {
    delayedExecute('p2 callback', () => {
        delayedExecute('p3 callback', () => {
            delayedExecute('p4 callback');
        });
    });
});
// p1 callback (after 1s)
// p2 callback (after 2s)
// p3 callback (after 3s)
// p4 callback (after 4s)
```

 因为then()、catch()和finally()都返回一个promise，将它们链接在一起很简单：

```js
let p = new Promise((resolve, reject) => {
    console.log('initial promise rejects');
    reject();
});
p.catch(() => console.log('reject handler'))
    .then(() => console.log('resolve handler'))
    .finally(() => console.log('finally handler'));
// initial promise rejects
// reject handler
// resolve handler
// finally handler
```

### Promise图

 由于单个promise可以附加任意数量的处理程序，因此可以使用链式promise组成有向无环图。每个promise都是图中的一个节点，使用实例方法附加处理程序会添加一个有向顶点。因为图中的每个节点都会等待其前辈节点建立，所以可以保证图顶点的方向将指示Promise执行的顺序。

 如下是一个Promise有向图示例，即二叉树：

```js
//		   A
//		  / \
//       B 	 C
//		/ \ / \
//	   D  E F  G
let A = new Promise((resolve, reject) => {
    console.log('A');
    resolve();
});
let B = A.then(() => console.log('B'));
let C = A.then(() => console.log('C'));
B.then(() => console.log('D'));
B.then(() => console.log('E'));
C.then(() => console.log('F'));
C.then(() => console.log('G'));
// A
// B
// C
// D
// E
// F
// G
```

 这里注意日志语句的顺序是这个二叉树的层序遍历（level-order traversal）。正如前面部分所讨论的，promise的处理程序应该按照它们被添加的顺序执行。由于promise的处理程序被急切地添加到消息队列中但懒散的执行，因此这种行为的结果是层序遍历。

### 使用Promise.all()和Promise.race() 的并行Promise组合

 Promise类提供了两个静态方法，允许将多个Promise实例组合成一个新的Promise实例。这个组合Promise的行为基于它内部的Promise的行为方式。

#### Promise.all()

 Promise.all()静态方法创建一个全有或全无的promise，该promise仅当promise集合中的每个promise都变解决才能变解决。静态方法接受一个可迭代对象并返回一个新的promise：

```js
let p1 = Promise.all([
    Promise.resolve(),
    Promise.resolve()
]);
// 将使用Promise.resolve()将可迭代对象中的元素强制转换为promise
let p2 = Promise.all([3, 4]);
// 空迭代对象等用于Promise.resolve()
let p3 = Promise.all([]);
// 无效的语法
let p4 = Promise.all();
// TypeError: cannot read Symbol.iterator of undefined
```

 组合的promise仅当包含的所有promise解决了才变解决：

```js
let p = Promise.all([
    Promise.resolve(),
    new Promise((resolve, reject) => setTimeout(resolve, 1000))
]);
setTimeout(console.log, 0, p); // Promise <pending>
p.then(() => setTimeout(console.log, 0, 'all() resolved!'));
// all() resolved! (After ~1000ms)
```

 如果包含的promise中有一个保持挂起，则组合promise也保持挂起；如果包含的promise中有一个拒绝，则组合promise将拒绝：

```js
// 将一直保持挂起状态
let p1 = Promise.all([new Promise(() => {})]);
setTimeout(console.log, 0, p1); // Promise <pending>
// 单个拒绝将导致组合promise拒绝
let p2 = Promise.all([
    Promise.resolve(),
    Promise.reject(),
    Promise.resolve()
]);
setTimeout(console.log, 0, p2); // Promise <rejected>
// Uncaught (in promise) undefined
```

 如果所有的promise成功的解决，则组合promise的解决值将是包含的promise的解决值的按迭代器顺序的数组：

```js
let p = Promise.all([
    Promise.resolve(3),
    Promise.resolve(),
    Promise.resolve(4)
]);
p.then((values) => setTimeout(console.log, 0, values)); // [3, undefined, 4]
```

 如果其中一个promise拒绝，则首先拒绝的promise将为组合promise设置拒绝原因。后续拒绝不影响拒绝原因；但是，那些包含的promise实例的正常拒绝行为不受影响。重要的是，组合Promise将静默地处理对所有包含的Promise的拒绝，如下所示：

```js
let p = Promise.all([
    Promise.reject(3),
    new Promise((resolve, reject) => setTimeout(reject, 1000))
]);
p.catch((reason) => setTimeout(console.log, 0, reason)); // 3
// 没有未处理的错误
```

#### Promise.race()

 Promise.race() 静态方法创建一个promise，该promise将镜像promise集合中首先达到已解决或拒绝状态的任何promise。静态方法接受一个可迭代对象并返回一个新的promise：

```js
let p1 = Promise.race([
    Promise.resolve(),
    Promise.resolve()
]);
// 将使用Promise.resolve()将可迭代对象中的元素强制转换为promise
let p2 = Promise.race([3, 4]);
// 空迭代对象等同于new Promise(() => {})
let p3 = Promise.race([]);
// 无效的语法
let p4 = Promise.race();
// TypeError: cannot read Symbol.iterator of undefined
```

 Promise.race()方法不会优先处理已解决或拒绝的promise。组合promise将传递第一个到达解决/拒绝的promise的状态，如下所示：

```js
// Resolve先发生, 在timeout的reject被忽略
let p1 = Promise.race([
    Promise.resolve(3),
    new Promise((resolve, reject) => setTimeout(reject, 1000))
]);
setTimeout(console.log, 0, p1); // Promise <resolved>: 3
// Reject先发生, 在timeout中的resolve被忽略
let p2 = Promise.race([
    Promise.reject(4),
    new Promise((resolve, reject) => setTimeout(resolve, 1000))
]);
setTimeout(console.log, 0, p2); // Promise <rejected>: 4
// 迭代顺序决定最终状态
let p3 = Promise.race([
    Promise.resolve(5),
    Promise.resolve(6),
    Promise.resolve(7)
]);
setTimeout(console.log, 0, p3); // Promise <resolved>: 5
```

 如果其中一个promise拒绝，则首先拒绝的promise将为组合promise设置拒绝原因。后续拒绝不影响拒绝原因；但是，那些包含的promise实例的正常拒绝行为不受影响。就像Promise.all()的情况一样。组合promise将静默地处理对所有包含的promise的拒绝，如下所示：

```js
let p = Promise.race([
    Promise.reject(3),
    new Promise((resolve, reject) => setTimeout(reject, 1000))
]);
p.catch((reason) => setTimeout(console.log, 0, reason)); // 3
// 没有未处理的错误
```

### 串行promise组合

 迄今为止，对promise链的讨论主要集中在序列化执行上，而在很大程度上忽略了promise的一个核心功能——它们能够异步产生一个值并将其提供给处理程序。将每个promise链接在一起时，每个连续的promise可使用其前辈的值是promise的一个基本功能。这在很多方面类似于函数组合，其中多个函数组合成一个新函数，如下所示：

```js
function addTwo(x) {return x + 2;}
function addThree(x) {return x + 3;}
function addFive(x) {return x + 5;}
function addTen(x) {
    return addFive(addTwo(addThree(x)));
}
console.log(addTen(7)); // 17
```

 可以使用Array.prototype.reduce()将其塑造成更简洁的形式：

```js
function addTwo(x) {return x + 2;}
function addThree(x) {return x + 3;}
function addFive(x) {return x + 5;}
function addTen(x) {
    return [addTwo, addThree, addFive]
        .reduce((promise, fn) => promise.then(fn), Promise.resolve(x));
    // reduce参数:每一项都要调用的函数,和一个可选的初始值(返回值相关)。
}
addTen(8).then(console.log); // 18
```

 这种组合Promise的策略可以推广到一个函数中，该函数可以将任意数量的函数组合成一个值传递Promise链。这个组合函数可以实现如下：

```js
function addTwo(x) {return x + 2;}
function addThree(x) {return x + 3;}
function addFive(x) {return x + 5;}
function compose(...fns) {
    return (x) => fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(x))
}
let addTen = compose(addTwo, addThree, addFive);
addTen(8).then(console.log); // 18
```



## Promise扩展

 ES6的promise实现是健壮的，但与任何软件一样，都会有缺点。一些第三方promise实现中可用但缺乏正式ECMAScript规范的两种产品是promise取消（promise canceling）和进度跟踪(progress tracking)。

### promise取消

 通常，promise正在进行中，但程序将不再关心结果。在这种情况下，“取消”promise的能力会很有用。一些第三方Promise库（例如 Bluebird）提供了这样的功能，甚至ECMAScript也计划在最终撤回之前提供这样的功能（https://github.com/tc39/proposal-cancelable-promises）。因此，ES6的promise被认为是“急切的”：一旦promise封装的功能正在进行，就没有办法阻止这个过程完成。

 仍然可以实现作为原始设计的复制品的临时实现。这样的实现使用了“取消令牌”，这是凯文史密斯的设计草案 (https://github.com/zenparsing/es-cancel-token) 中充实的概念。生成的取消令牌（cancel token）提供了一个用于取消promise的接口，以及一个用于触发取消行为和评估取消状态的promise钩子。

 CancelToken类的基本实现可能如下所示：

```js
class CancelToken {
    constructor(cancelFn) {
        this.promise = new Promise((resolve, reject) => {
            cancelFn(resolve);
        });
    }
}
```

 这个类封装了一个promise，该promise将resolve方法暴露给cancelFn形参。然后，外部实体能够向构造函数提供一个函数，允许该实体准确控制何时取消令牌。此promise是令牌类的公共成员，因此可以向取消promise添加侦听器。

 此处显示了如何使用此类的粗略示例：

```html
<button id="start">Start</button>
<button id="cancel">Cancel</button>
<script>
    class CancelToken {
        constructor(cancelFn) {
            this.promise = new Promise((resolve, reject) => {
                cancelFn(() => {
                    setTimeout(console.log, 0, "delay cancelled");
                    resolve();
                });
            });
        }
    }
    const startButton = document.querySelector('#start');
    const cancelButton = document.querySelector('#cancel');
    function cancellableDelayedResolve(delay) {
        setTimeout(console.log, 0, "set delay");
        return new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                setTimeout(console.log, 0, "delayed resolve");
                resolve();
            }, delay);
            // cancelCallback即:() => {setTimeout(console.log, 0, "delay
            cancelled");resolve();}
            const cancelToken = new CancelToken((cancelCallback) =>
                                                cancelButton.addEventListener("click",cancelCallback));
            cancelToken.promise.then(() => clearTimeout(id));
        });
    }
    startButton.addEventListener("click", () =>
                                 cancellableDelayedResolve(5000));
</script>
```

 每次单击开始按钮都会开启timeout并实例化一个新的CancelToken实例。取消按钮配置为单击将触发令牌的promise为解决。解决后，最初由单击开始按钮设置的timeout将被取消。

### Promise进度通知

 一个进行中的promise可能有几个离散的“阶段”，在实际解决之前它将经历这些阶段。在某些情况下，允许程序监视到达这些检查点的promise会很有用。 ES6的promise不支持这个概念，但仍然可以通过扩展promise来模拟这种行为。

 一种可能的实现是使用notify()方法扩展Promise类，如下所示：

```js
class TrackablePromise extends Promise {
    constructor(executor) {
        const notifyHandlers = [];
        super((resolve, reject) => {
            return executor(resolve, reject, (status) => {
                notifyHandlers.map((handler) => handler(status));
            });
        });
        this.notifyHandlers = notifyHandlers;
    }
    // 添加到类原型上
    notify(notifyHandler) {
        this.notifyHandlers.push(notifyHandler);
        return this;
    }
}
```

 然后TrackablePromise将能够在执行程序中使用notify()函数。一个promise实例化可以使用这个函数如下：

```js
let p = new TrackablePromise((resolve, reject, notify) => {
    function countdown(x) {
        if (x > 0) {
            // 第一次执行时notifyHandlers为空,所以没有输出
            notify(`${20 * x}% remaining`);
            setTimeout(() => countdown(x - 1), 1000);
        } else {
            resolve();
        }
    }
    countdown(5);
});
```

 解决之前，这个promise将递归设置一个 1000 毫秒timeout五次。每个timeout处理程序会调用notify（），并传递一个状态。提供了一个通知处理程序可以做如下：

```js
p.notify((x) => setTimeout(console.log, 0, 'progress:', x));
p.then(() => setTimeout(console.log, 0, 'completed'));
// (after 1s) 80% remaining
// (after 2s) 60% remaining
// (after 3s) 40% remaining
// (after 4s) 20% remaining
// (after 5s) completed
```

 这个notify()方法被设计为通过返回自身进行链接，并且处理程序的执行将在每个通知的基础上保留，如下所示：

```js
p.notify((x) => setTimeout(console.log, 0, 'a:', x))
    .notify((x) => setTimeout(console.log, 0, 'b:', x));
p.then(() => setTimeout(console.log, 0, 'completed'));
// (after 1s) a: 80% remaining
// (after 1s) b: 80% remaining
// (after 2s) a: 60% remaining
// (after 2s) b: 60% remaining
// (after 3s) a: 40% remaining
// (after 3s) b: 40% remaining
// (after 4s) a: 20% remaining
// (after 4s) b: 20% remaining
// (after 5s) completed
```

 总的来说，这是一个相对粗略的实现，但它证明这样的通知功能是如何有用的。

## 异步函数

 异步函数，也指操作关键字对"async/await"，是ES6的promise范式对ECMAScript函数的应用。ES7规范中引入了对async/await的支持。它既是对规范的行为和句法增强，允许JavaScript代码以同步方式编写，但实际上能够异步执行。 最简单的示例从一个简单的promise开始，该promise在超时后解决为一个值：

```js
let p = new Promise((resolve, reject) => setTimeout(resolve, 1000, 3));
```

 这个promise将在1000ms后解决为值： 3 。一旦准备好了，程序的其他部分就可以访问该值，但需要在一个resolved handler中：

```js
let p = new Promise((resolve, reject) => setTimeout(resolve, 1000, 3));
p.then((x) => console.log(x)); // 3
```

 这是相当不方便的，因为程序的其余部分现在需要挤入到promise处理程序。可以将处理程序移动到函数定义中：

```js
function handler(x) { console.log(x); }
let p = new Promise((resolve, reject) => setTimeout(resolve, 1000, 3));
p.then(handler); // 3
```

 这并没有太大的改进。事实是，任何希望访问promise产生值的后续代码都需要通过处理程序输入该值，这意味着代码要加入到处理程序函数中。ES7提供async/await作为解决这个问题的优雅方案。

## 异步函数基础

 ES7的async/await旨在解决使用异步结构的代码组织问题。它通过引入两个新关键字async和await将异步行为的逻辑扩展引入JavaScript函数领域。

### async关键字

 异步函数可通过前置async关键字声明，此关键字可用在函数声明，函数表达式，箭头函数和方法中：

```js
async function foo() {}
let bar = async function() {};
let baz = async () => {};
class Qux {
    async qux() {}
}
```

 使用async关键字创建的函数具有一些异步特性，但仍是同步计算的。在其他方面如参数和闭包，和普通JavaScript函数没什么两样。如下所示，foo()仍在其后的指令之前计算：

```js
async function foo() {
    console.log(1);
}
foo();
console.log(2);
// 1
// 2
```

 在异步函数中，使用return关键字返回的值(没有return则为undefined)将通过Promise.resolve()转换成promise对象。

```js
async function foo() {
    console.log(1);
    return 3;
}
// 添加一个resolved handler到返回的promise.
foo().then(console.log);
console.log(2);
// 1
// 2
// 3
```

 返回一个promise对象会提供相同的行为：

```js
async function foo() {
    console.log(1);
    return Promise.resolve(3);
}
// 附加一个resolved handler到返回的promise
foo().then(console.log);
console.log(2);
// 1
// 2
// 3
```

 异步函数的返回值是可以预料的：thenable对象将通过提供给then()回调的第一个参数"解包"，非thenable对象将当作resolved promise一样传递:

```js
// 返回一个基本类型
async function foo() {
    return 'foo';
}
foo().then(console.log);
// foo
// 返回一个non-thenable对象:
async function bar() {
    return ['bar'];
}
bar().then(console.log);
// ['bar']
// 返回一个thenable但非promise对象:
async function baz() {
    const thenable = {
        // callback即console.log
        then(callback) {
            callback('baz');
        }
    };
    return thenable;
}
baz().then(console.log);
// baz
// 返回一个promise:
async function qux() {
    return Promise.resolve('qux');
}
qux().then(console.log);
// qux
```

 与promise处理程序函数一样，抛出错误值将替换为返回一个rejected promise：

```js
async function foo() {
    console.log(1);
    throw 3;
}
// 附加一个rejected handler到返回的promise
foo().catch(console.log);
console.log(2);
// 1
// 2
// 3
```

 然而，promise的拒绝错误不会被异步函数捕获：

```js
async function foo() {
    console.log(1);
    Promise.reject(3);
}
// 附加一个rejected handler到返回的promise
foo().catch(console.log);
console.log(2);
// 1
// 2
// Uncaught (in promise): 3
```



### await关键字

 使用await关键字暂停执行，直到promise resolved:

```js
let p = new Promise((resolve, reject) => setTimeout(resolve, 1000, 3));
p.then((x) => console.log(x)); // 3
//这可使用async/await重写:
async function foo() {
    let p = new Promise((resolve, reject) => setTimeout(resolve, 1000, 3));
    console.log(await p);
}
foo();
// 3
```

 await关键字将暂停执行异步函数，释放JavaScript运行时的执行线程。这种行为有点像生成器函数中的yeild关键字。 **await尝试‘打开’对象的值，将值传递给表达式** ，然后异步恢复异步函数的执行。

 await关键字的用法与JavaScript一元运算符的用法相同。可以单独使用，也可以在表达式内部使用：

```js
// 异步打印"foo":
async function foo() {
    console.log(await Promise.resolve('foo'));
}
foo();
// foo
// 异步打印"bar":
async function bar() {
    return await Promise.resolve('bar');
}
bar().then(console.log);
// bar
// 1s后异步打印"baz":
async function baz() {
    await new Promise((resolve, reject) => setTimeout(resolve, 1000));
    console.log('baz');
}
baz();
// baz
```

 一个thenable对象将被提供给then()回调的第一个参数“解包”，非thenable对象将当作已经解决的promise传递：

```js
// Await a primitive
async function foo() {
    console.log(await 'foo');
}
foo();
// foo
// Await a non-thenable object
async function bar() {
    console.log(await ['bar']);
}
bar();
// ['bar']
// Await a thenable non-promise object
async function baz() {
    const thenable = {
        then(callback) {
            callback('baz');
        }
    };
    console.log(await thenable);
}
baz();
// baz
// Await a promise
async function qux() {
    console.log(await Promise.resolve('qux'));
}
qux();
// qux
```

 等待一个抛出异常的同步操作将替换为返回一个拒绝promise：

```js
async function foo() {
    console.log(1);
    await (() => { throw 3; })();
}
// 附加一个rejected handler到返回的promise
foo().catch(console.log);
console.log(2);
// 1
// 2
// 3
```

 同之前一样，单独的Promise.reject()不会被异步函数捕获，只会抛出一个未处理的错误。然而，在拒绝promise上使用await将解包错误值：

```js
async function foo() {
    console.log(1);
    await Promise.reject(3);
    console.log(4); // never prints
}
// 附加一个rejected handler到返回的promise
foo().catch(console.log);
console.log(2);
// 1
// 2
// 3
```



### 使用await的限制

 await关键字必须在异步函数内使用，它不能用于顶级环境，例如脚本标签或模块。但是，没有什么可以阻止你立即调用异步函数。以下两个代码片段实际上是相同的：

```js
async function foo() {
    console.log(await Promise.resolve(3));
}
foo();
// 3
// 立即调用异步函数表达式
(async function() {
    console.log(await Promise.resolve(3));
})();
// 3
```

 此外，函数的异步性质不会扩展到嵌套函数。因此，await关键字也只能直接出现在异步函数定义中；尝试在同步函数中使用await将引发SyntaxError。

 下面是一些不被允许的示例：

```js
// Not allowed: 'await' inside arrow function
function foo() {
    const syncFn = () => {
        return await Promise.resolve('foo');
    };
}
console.log(syncFn());
// Not allowed: 'await' inside function declaration
function bar() {
    function syncFn() {
        return await Promise.resolve('bar');
    }
    console.log(syncFn());
}
// Not allowed: 'await' inside function expression
function baz() {
    const syncFn = function() {
        return await Promise.resolve('baz');
    };
    console.log(syncFn());
}
// Not allowed: IIFE using function expression or arrow function
function qux() {
    (function() {
        console.log(await Promise.resolve('qux'));
    })();
    (() => console.log(await Promise.resolve('qux')))();
}
```

### 停止和恢复执行

 使用 await 关键字的真正本质比它最初出现时要微妙得多。例如，考虑以下示例，其中三个函数按顺序调用，但它们的输出相反：

```js
async function foo() {
    console.log(await Promise.resolve('foo'));
}
async function bar() {
    console.log(await 'bar');
}
async function baz() {
    console.log('baz');
}
foo();
bar();
baz();
// chrome实测结果为baz foo bar
// baz
// bar
// foo
```

 在async/await范例中，主要由await关键字承担重任。在许多方面，async只是对JavaScript解释器的一个特殊指示器。毕竟，不包含await关键字的异步函数的执行与常规函数非常相似：

```js
async function foo() {
    console.log(2);
}
console.log(1);
foo();
console.log(3);
// 1
// 2
// 3
```

 完全理解await关键字的关键在于它不只是等待一个值变得可用。当遇到await关键字时，JavaScript运行时可以准确跟踪执行暂停的位置。当await右侧的值准备好时，JavaScript运行时将在消息队列上推送一个任务，该任务将异步恢复该函数的执行。

 因此，即使当await与立即可用的值配对时，函数的其余部分仍将被异步计算。下面的示例演示了这一点：

```js
async function foo() {
    console.log(2);
    await null;
    console.log(4);
}
console.log(1);
foo();
console.log(3);
// 1
// 2
// 3
// 4
```

 控制台读取的顺序是运行时如何处理这个例子的最好解释：

  1. 打印 1 。

  2. 调用异步函数foo。

  3. （foo内）打印 2 。

  4. （foo内）await关键字暂停执行并为立即可用的null值在消息队列上添加任务。

  5. foo退出。

  6. 打印 3 。

  7. 同步线程执行完毕。

  8. Javascript运行时将任务从消息队列中出队以恢复执行。

  9. （foo内）执行恢复，null值提供给await（此处null未被使用）。

  10. （foo内）打印 4 。

  11. foo返回。

 将await与promise一起使用会使这种情况变得更加复杂。在这种情况下，实际上会有两个单独的消息队列任务被异步计算以完成异步函数的执行。以下示例可能看起来完全违反直觉，但它演示了执行顺序：

```js
async function foo() {
    console.log(2);
    console.log(await Promise.resolve(8));
    console.log(9);
}
async function bar() {
    console.log(4);
    console.log(await 6);
    console.log(7);
}
console.log(1);
foo();
console.log(3);
bar();
console.log(5);
// chrome实测为123458967
// 1
// 2
// 3
// 4
// 5
// 6
// 7
// 8
// 9
```

 运行时执行此例顺序如下：

  1. 打印 1 。

  2. 执行异步函数foo。

  3. （foo内）打印 2 。

  4. （foo内）await关键字暂停执行，当promise完成时调度任务到消息队列。

  5. promise立即解决，提供解决值给await的任务添加到消息队列。

  6. foo退出。

  7. 打印 3 。

  8. 调用异步函数bar。

  9. （bar内）打印 4 。

  10. （bar内）await暂停执行并为立即可用的值 6 添加任务到消息队列。

  11. bar退出。

  12. 打印 5 。

  13. 顶层执行线程结束。

 （结果不一致，待定）

  14. JavaScript运行时出列解决的await promise处理程序，并提供解决值 8 给await。

  15. JavaScript运行时在消息队列上入队恢复foo执行的任务。

  16. JavaScript运行时从消息队列出队恢复bar执行和值 6 。

  17. （bar内）执行恢复，值 6 提供给await。

  18. （bar内）打印 6 。

  19. (bar内)打印 7 。

  20. bar返回。

  21. 异步任务完成，JavaScript出队恢复foo执行和值 8 的任务。

  22. （foo内）打印 8 。

  23. （foo内）打印 9 。

  24. foo返回。

## 异步函数的策略

 由于它们的便利性和实用性，异步函数越来越成为JavaScript代码库中无处不在的支柱。即便如此，在使用异步函数时，请记住某些注意事项。

### 实现sleep()

 当第一次学习JavaScript时，许多开发人员会找到类似于Java的Thread.sleep（）的结构，试图将非阻塞延迟引入他们的程序。

 使用异步函数，可以轻松的构建一个工具，允许一个函数sleep()一段提供的时间：

```js
async function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}
async function foo() {
    const t0 = Date.now();
    await sleep(1500); // sleep for ~1500ms
    console.log(Date.now() - t0);
}
foo();
// 1508
```

### 最大化并行化

 如果未仔细使用await关键字，程序可能会错过可能的并行化加速。考虑以下示例，它依次等待五个随机timeout：

```js
async function randomDelay(id) {
    // Delay between 0 and 1000 ms
    const delay = Math.random() * 1000;
    return new Promise((resolve) => setTimeout(() => {
        console.log(`${id} finished`);
        resolve();
    }, delay));
}
async function foo() {
    const t0 = Date.now();
    await randomDelay(0);
    await randomDelay(1);
    await randomDelay(2);
    await randomDelay(3);
    await randomDelay(4);
    console.log(`${Date.now() - t0}ms elapsed`);
}
foo();
// 0 finished
// 1 finished
// 2 finished
// 3 finished
// 4 finished
// 2219ms elapsed
```

 汇总到for循环会产生以下结果：

```js
async function randomDelay(id) {
    // Delay between 0 and 1000 ms
    const delay = Math.random() * 1000;
    return new Promise((resolve) => setTimeout(() => {
        console.log(`${id} finished`);
        resolve();
    }, delay));
}
async function foo() {
    const t0 = Date.now();
    for (let i = 0; i < 5; ++i) {
        await randomDelay(i);
    }
    console.log(`${Date.now() - t0}ms elapsed`);
}
foo();
// 0 finished
// 1 finished
// 2 finished
// 3 finished
// 4 finished
// 2219ms elapsed
```

 即使promise之间没有相互依赖，这个异步函数也会暂停并等待每个promise完成，然后再开始下一个。这样做可以保证按顺序执行，但以总执行时间为代价。

 如果不需要按顺序执行，最好一次初始化所有promise并在结果可用时等待结果。这可以按如下方式完成：

```js
async function randomDelay(id) {
    const delay = Math.random() * 1000;
    return new Promise((resolve) => setTimeout(() => {
        setTimeout(console.log, 0, `${id} finished`);
        resolve();
    }, delay));
}
async function foo() {
    const t0 = Date.now();
    const p0 = randomDelay(0);
    const p1 = randomDelay(1);
    const p2 = randomDelay(2);
    const p3 = randomDelay(3);
    const p4 = randomDelay(4);
    await p0;
    await p1;
    await p2;
    await p3;
    await p4;
    setTimeout(console.log, 0, `${Date.now() - t0}ms elapsed`);
}
foo();
// 1 finished
// 4 finished
// 3 finished
// 0 finished
// 2 finished
// 2219ms elapsed
```

 汇总到一个数组和for循环产生以下结果：

```js
async function randomDelay(id) {
    const delay = Math.random() * 1000;
    return new Promise((resolve) => setTimeout(() => {
        console.log(`${id} finished`);
        resolve();
    }, delay));
}
async function foo() {
    const t0 = Date.now();
    const promises = Array(5).fill(null).map((e, i) => randomDelay(i));
    //console.log(Array(5));//
    [empty × 5]
    for (const p of promises) {
        await p;
    }
    console.log(`${Date.now() - t0}ms elapsed`);
}
foo();
// 4 finished
// 2 finished
// 1 finished
// 0 finished
// 3 finished
// 877ms elapsed
```

 请注意，虽然promise的执行是乱序的，但是await语句会按顺序提供给已解决的值：

```js
async function randomDelay(id) {
    const delay = Math.random() * 1000;
    return new Promise((resolve) => setTimeout(() => {
        console.log(`${id} finished`);
        resolve(id);
    }, delay));
}
async function foo() {
    const t0 = Date.now();
    const promises = Array(5).fill(null).map((e, i) => randomDelay(i));
    for (const p of promises) {
        console.log(`awaited ${await p}`);
    }
    console.log(`${Date.now() - t0}ms elapsed`);
}
foo();
// 1 finished
// 2 finished
// 4 finished
// 3 finished
// 0 finished
// awaited 0
// awaited 1
// awaited 2
// awaited 3
// awaited 4
// 645ms elapsed
```



### 连续promise执行

 本章前面讨论了如何组合promise以连续执行并传递值给随后的promise。使用async/await，链接promise变得非常简单：

```js
function addTwo(x) {return x + 2;}
function addThree(x) {return x + 3;}
function addFive(x) {return x + 5;}
async function addTen(x) {
    for (const fn of [addTwo, addThree, addFive]) {
        x = await fn(x);
    }
    return x;
}
addTen(9).then(console.log); // 19
```

 这里，await直接传递每个函数的返回值且迭代导出结果。前面的示例实际上并没有用promise处理，但可以使用异步函数重新配置：

```js
async function addTwo(x) {return x + 2;}
async function addThree(x) {return x + 3;}
async function addFive(x) {return x + 5;}
async function addTen(x) {
    for (const fn of [addTwo, addThree, addFive]) {
        x = await fn(x);
    }
    return x;
}
addTen(9).then(console.log); // 19
```



### 堆栈跟踪和内存管理

 promise和异步函数在它们提供的功能方面有相当程度的重叠，但是当涉及到它们在内存中的表示方式时，它们有很大的不同。考虑以下示例，该示例显示了拒绝promise的堆栈跟踪读出（readout）：

```js
function fooPromiseExecutor(resolve, reject) {
    setTimeout(reject, 1000, 'bar');
}
function foo() {
    new Promise(fooPromiseExecutor);
}
foo();
// Uncaught (in promise) bar
// setTimeout
// setTimeout (async)
// fooPromiseExecutor
// foo
```

 根据你对promise的理解，这个堆栈跟踪读出应该会让你有点困惑。从字面上看，堆栈跟踪应该代表当前存在于JavaScript引擎内存堆栈中的函数调用的嵌套性质。当timeout处理程序执行并且promise拒绝时，显示的错误读出标识最初被调用以创建promise实例的嵌套函数。但是，众所周知，这些函数已经返回，因此不会在堆栈跟踪中找到。

 答案很简单，JavaScript引擎在创建promise结构时做了额外的工作来保留调用堆栈。当抛出错误时，此调用堆栈可由运行时的错误处理逻辑获取，因此可在堆栈跟踪中使用。当然，这意味着它必须在内存中保留堆栈跟踪，这会带来计算和存储成本。

 如果使用异步函数重新设计，请考虑前面的示例，如下所示：

```js
function fooPromiseExecutor(resolve, reject) {
    setTimeout(reject, 1000, 'bar');
}
async function foo() {
    await new Promise(fooPromiseExecutor);
}
foo();
// Uncaught (in promise) bar
// foo
// async function (async)
// foo
```

 使用这种结构，堆栈跟踪准确地表示当前调用堆栈，因为fooPromiseExecutor已经返回并且不再在堆栈上，但是foo被挂起并且尚未退出。JavaScript运行时只能存储从嵌套函数到包含其函数的指针，就像使用同步函数调用堆栈一样。该指针有效地存储在内存中，可用于在发生错误时生成堆栈跟踪。这种策略不会像前面的示例那样产生额外的开销，因此如果性能对你的应用程序至关重要，则应该首选这种策略。