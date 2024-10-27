---
permalink: /js/chapter27/
title: 第27章 worker
createTime: 2024/10/18 16:28:56
---
# 第27章 worker

“JavaScript是单线程的”这句话实际上是前端开发社区的口头禅。这个断言虽然做了一些简化的假设，但有效地描述了 JavaScript 环境在浏览器中的一般行为。因此，它作为帮助 Web 开发人员理解 JavaScript 的教学工具非常有用。

这种单线程范式本质上是有限制性的，因为它约束了将工作委派给单独线程或进程的能力。JavaScript 绑定到这种单线程范式，以保持与必须交互的各种浏览器 API 的兼容性。如果通过多个 JavaScript 线程进行并发操作，诸如文档对象模型之类的结构会遇到问题。因此，传统的并发构造，例如 POSIX 线程或 Java 的 Thread 类，对于增强 JavaScript 来说并非首选。

这就是 Worker 的核心价值主张：允许主执行线程将工作委托给单独的实体，而无需更改现有的单线程模型。尽管本章中介绍的各种 Worker 类型都有不同的形式和功能，但它们在与主要 JavaScript 环境的分离方面是统一的。

## Worker 介绍

单个 JavaScript 环境本质上是在主机操作系统内部运行的虚拟化环境。浏览器中的每个打开页面都分配有自己的环境。这为每个页面提供了自己的内存、事件循环、DOM 等。每个页面或多或少都经过沙盒处理，不会干扰其他页面。浏览器一次管理多个环境是微不足道的——所有这些都是并行执行的。

使用 Worker，浏览器能够分配与原始页面环境完全分离的第二个子环境。该子环境无法与依赖于单线程的构造（例如 DOM）交互，但可以自由地与父环境并行执行代码。

## 比较 Worker 和 Thread

介绍性资源通常会在 Worker 线程和执行线程之间进行比较。在许多方面，这是一个恰当的比较，因为 Worker 和线程确实具有许多共同特征:

+ Worker 被实现为实际的线程。例如，Blink 浏览器引擎使用与底层平台线程对应的 WorkerThread 来实现 Worker。
+ Worker 并行执行。尽管页面和 Worker 都实现了单线程 JavaScript 环境，但每个环境中的指令都可以并行执行。
+ Worker 可以共享一些内存。Worker 能够使用 SharedArrayBuffer 在多个环境之间共享内存。线程将使用锁来实现并发控制，而 JavaScript 使用 Atomics 接口来实现并发控制。

Worker 和线程有很多重叠，但它们之间有一些重要的区别:

+ Worker 不共享所有内存。在传统的线程模型中，多个线程具有读写共享内存空间的能力。除了 SharedArrayBuffer 之外，将数据移入和移出 Worker 需要对其进行复制或传输。
+ Worker 线程不一定是同一进程的一部分。通常，单个进程能够在其中生成多个线程。根据浏览器引擎的实现，Worker 线程可能是也可能不是与页面相同的进程的一部分。例如，Chrome 的 Blink 引擎为共享 Worker 线程和服务worker线程使用单独的进程。
+ Worker 线程的创建成本更高。Worker 线程包括它们自己独立的事件循环、全局对象、事件处理程序和其他作为 JavaScript 环境一部分的特征。创建这些的计算成本不应被忽视。

在形式和功能上，Worker 都不是线程的替代品。HTML Web Worker 规范说明如下：Worker 相对较重，不打算大量使用。例如，为四百万像素图像的每个像素启动一个 Worker 是不合适的。Worker 适合寿命长，启动性能成本高，每个实例内存成本高的情况。

## Worker 类型

Web Worker 规范中定义了三种主要类型的 worker 线程：专用 Web Worker 线程、共享 Web Worker 线程和服务worker线程。这些在现代 Web 浏览器中广泛使用。

### 专用 Web Worker

专用 Web Worker，通常简称为专用 worker、Web Worker 或仅称为 worker，是一种基本实用的程序，它允许脚本生成单独的 JavaScript 线程并将任务委托给它。顾名思义，一个专用的 worker 只能被生成它的页面访问。

### 共享 Web Worker

共享 Web Worker 的行为很像专用 worker。主要区别在于可以跨多个环境访问共享工作程序，包括不同的页面。在与最初生成共享 worker 的脚本相同的源上执行的任何脚本都可以向共享 worker 发送和接收消息。

### 服务 Worker

服务worker与专用或共享的 worker 完全不同。它的主要目的是充当网络请求仲裁者，能够拦截、重定向和修改页面调度的请求。

### WorkerGlobalScope

在网页上，window 对象向其中运行的脚本公开了一组广泛的全局变量。在 worker 内部，“window”的概念没有意义，因此其全局对象是一个 WorkerGlobalScope 实例。这个全局对象可以通过 self 关键字访问，而不是 window。

#### WorkerGlobalScope 属性和方法

self 上可用的属性是 window 上可用属性的严格子集。一些属性返回对象的 worker 风格版本：

- navigator 返回与此 worker 关联的 WorkerNavigator。
- self 返回 WorkerGlobalScope 对象。
- location 返回与此 worker 关联的 WorkerLocation。
- performance 返回一个 Performance 对象（具有一组简化的属性和方法）。
- console 返回与此 worker 关联的 Console 对象。对 API 没有限制。
- caches 返回与此 worker 关联的 CacheStorage 对象。对 API 没有限制。
- indexedDB 返回一个 IDBFactory 对象。
- isSecureContext 返回一个布尔值，指示 worker 的环境是否安全。
- origin 返回 WorkerGlobalScope 对象的源。

类似地，self 上可用的一些方法是 window 上可用方法的子集。self 上的方法与 window 上的方法相同：

- atob() 用于解码使用 base-64 编码的字符串。
- btoa() 用于 base-64 编码。
- clearInterval()
- clearTimeout()
- createImageBitmap()
- fetch()
- setInterval()
- setTimeout()

WorkerGlobalScope 还引入了一个新的全局方法 importScripts()，该方法仅在 worker 内部可用。

#### WorkerGlobalScope 的子类

WorkerGlobalScope 实际上并未在所有地方实现。每种类型的 worker 都使用自己的全局对象风格，它继承自 WorkerGlobalScope：

- 专用 worker 使用 DedicatedWorkerGlobalScope。
- 共享 worker 使用 SharedWorkerGlobalScope。
- 服务worker使用 ServiceWorkerGlobalScope。

## 专用 Worker

专用 Worker 是最简单的 Web Worker 类型。专用 Worker 由网页创建，以在页面的执行线程之外执行脚本。这些 Worker 能够与父页面交换信息、发送网络请求、执行文件 I/O、进行密集计算、批量处理数据或执行任何其他数量的不适合在页面执行线程中进行的计算任务（它们会引入延迟问题）。

注意：在处理 Worker 时，脚本在何处执行以及从何处加载是重要的概念。除非另有说明，否则在本章中都假设 `main.js` 是从 `https://example.com` 域的根路径加载并在其上执行的顶级脚本。

### 专用 Worker 基础

专用 Worker 可以被恰当地描述为后台脚本。JavaScript Worker 的特性，包括生命周期管理、代码路径以及输入/输出，由初始化 Worker 时提供的单一脚本控制。这个脚本可能会反过来请求额外的脚本，但一个 Worker 程序总是从一个脚本源开始。

#### 创建一个专用 Worker

创建专用 Worker 的最常见方法是通过加载 JavaScript 文件。文件路径提供给 Worker 构造函数，后者依次在后台异步加载脚本并实例化 Worker。构造函数需要一个文件路径，尽管该路径可以采用几种不同的形式。以下简单示例创建了一个空的专用 Worker 线程:

 **emptyWorker.js** 

```javascript
// empty JS Worker file
```

 **main.js** 

```javascript
console.log(location.href); // "https://example.com/"
const worker = new Worker(location.href + 'emptyWorker.js');
console.log(worker); // Worker {}
```

这个演示是微不足道的，但它涉及几个基本概念:
- emptyWorker.js 文件是从绝对路径加载的。根据应用程序的结构，使用绝对 URL 通常是多余的。
- 这个文件是在后台加载的，Worker 初始化发生在一个与 main.js 完全不同的线程上。
- Worker 本身存在于单独的 JavaScript 环境中，因此 main.js 必须使用 Worker 对象作为代理与该 Worker 通信。在上面的例子中，这个对象被分配给了 worker 变量。
- 尽管 Worker 本身可能还不存在，但是这个 Worker 对象在原始环境中立即可用。

执行:

可以将前面的示例更改为使用相对路径；但是，这要求 main.js 在可以加载 emptyWorker.js 的同一路径上。

```javascript
const worker = new Worker('./emptyWorker.js');
console.log(worker); // Worker {}
```

#### Worker 安全限制

Worker 脚本文件只能从与父页面相同的源加载。尝试从远程源加载 Worker 脚本文件将在尝试构造 Worker 时抛出错误，如下所示:

```javascript
// 尝试从 https://example.com/worker.js 构建 Worker
const sameOriginWorker = new Worker('./worker.js');
// 尝试从 https://untrusted.com/worker.js 构建 Worker
const remoteOriginWorker = new Worker('https://untrusted.com/worker.js');
// Error: Uncaught DOMException: Failed to construct 'Worker':
// Script at https://untrusted.com/main.js cannot be accessed
// from origin https://example.com
```

 **注意:** Worker 源限制不会阻止从远程源执行代码。这可以通过在 Worker 内部使用 `importScripts()` 完成。从加载的脚本创建的 Worker 不受文档内容安全策略的约束，因为 Worker 在与父文档不同的环境中执行。但是，如果从具有全局唯一标识符的脚本加载 Worker（例如从 Blob 加载 Worker 的情况），它将受父文档的内容安全策略的约束。

#### 使用 Worker 对象

从 `Worker()` 构造函数返回的 Worker 对象用作与新创建的专用 Worker 的单点通信。它可用于在 Worker 和父环境之间传输信息，以及捕获从专用 Worker 发出的事件。

 **注意:** 仔细跟踪创建的每个 Worker 对象的引用。在 Worker 终止之前，它不能被垃圾收集，并且没有可用于重新获得对 Worker 对象的引用的编程工具。

Worker 对象支持以下事件处理程序属性:
- `onerror` 可以分配一个事件处理程序，每当 Worker 发生 ErrorEvent 类型的错误时都会调用该处理程序。当在 Worker 内部抛出错误时会发生此事件。这个事件也可以使用 `worker.addEventListener('error', handler)` 来处理。
- `onmessage` 可以分配一个事件处理程序，每当 Worker 发生 MessageEvent 类型的错误时将调用该处理程序。当 Worker 脚本将消息事件发送回父环境时，会发生此事件。此事件也可以使用 `worker.addEventListener('message', handler)` 来处理。
- `onmessageerror` 可以分配一个事件处理程序，每当 Worker 发生 MessageEvent 类型的错误时将调用该处理程序。当收到无法反序列化的消息时，会发生此事件。此事件也可以使用 `worker.addEventListener('messageerror', handler)` 来处理。

Worker 对象还支持以下方法:
- `postMessage()` 用于通过异步消息事件向 Worker 发送信息。
- `terminate()` 用于立即终止 Worker 线程。Worker 没有机会进行清理，脚本突然结束。

#### DedicatedWorkerGlobalScope

在专用 worker 内部，全局作用域是 DedicatedWorkerGlobalScope 的一个实例。它继承自 WorkerGlobalScope，因此包括其所有属性和方法。worker 可以通过 self 访问这个全局作用域：

 **GLOBALSCOPEWORKER.JS** 

```javascript
console.log('inside worker:', self);
```

 **MAIN.JS** 

```javascript
const worker = new Worker('./globalScopeWorker.js');
console.log('created worker:', worker);
// created worker: Worker {}
// inside worker: DedicatedWorkerGlobalScope {}
```

如这里所示，顶层脚本和 worker 线程中的 console 对象都会写入浏览器控制台，这对调试很有用。因为 web worker 有一个不可忽略的启动延迟，即使 Worker 对象存在，worker 的日志消息也会打印在主线程的日志消息之后。

 **注意：** 这里有两个独立的 JavaScript 线程将消息发送到单个 console 对象，该对象随后序列化消息并在浏览器控制台中打印它们。浏览器从两个不同的 JavaScript 线程接收消息，并负责在它认为合适的时候交叉存取（interleaving）它们。因此，应谨慎使用来自多个线程的日志消息来确定操作顺序。

DedicatedWorkerGlobalScope 使用以下属性和方法扩展了 WorkerGlobalScope：
- `name`: 可以提供给 Worker 构造函数的可选字符串标识符。
- `postMessage()`: 对应于 worker.postMessage()。它用于将消息从 worker 发送回父环境。
- `close()`: 对应于 worker.terminate()。它用于立即终止 worker 线程。worker 没有清理的机会；脚本戛然而止。
- `importScripts()`: 用于将任意数量的脚本导入到 worker 中。



#### 专用Worker和隐式MessagePort

专用Worker对象和DedicatedWorkerGlobalScope对象共享一些接口处理程序和方法：onmessage、onmessageerror、close()和postMessage()。这并非偶然：专用Worker隐式地使用MessagePort在环境之间进行通信。这种实现使得父环境中的对象和DedicatedWorkerGlobalScope有效地吸收MessagePort，并将其处理程序和方法公开为它们自己的接口的一部分。换句话说，仍然通过MessagePort发送消息，只是无权访问端口本身。存在一些不一致之处，例如start()和close()的约定。专用Worker端口将自动开始发送排队消息，因此不需要start()。此外，在专用Worker的环境中，close()方法没有意义，因为关闭端口会有效地孤立Worker。因此，从Worker内部调用close()（或从外部调用terminate()）不仅会关闭端口，还会关闭Worker。

#### 理解专用Worker的生命周期

Worker()构造函数标志着专用Worker生命周期的开始。一旦被调用，它会发起一个对Worker脚本的请求，并将一个Worker对象返回给父环境。尽管Worker对象可以立即在父环境中使用，但由于Worker脚本的网络延迟或初始化延迟，相关的Worker可能尚未创建。一般来说，专用Worker可以非正式地表示存在于三种状态之一：initializing、active和terminated。专用Worker的状态对于任何其他环境都是不透明的。尽管Worker对象可能存在于父环境中，但无法确定专用Worker是否正在初始化、活动或终止。换句话说，与活动的专用Worker相关联的Worker对象与与终止的专用Worker相关联的Worker对象无法区分。在初始化时，虽然Worker脚本尚未开始执行，但可以为Worker排队消息。这些消息将等待Worker线程变为活动状态并随后被添加到其消息队列中：

```javascript
// INITIALIZINGWORKER.JS
self.addEventListener('message', ({data}) => console.log(data));

// MAIN.JS
const worker = new Worker('./initializingWorker.js');
// Worker may still be initializing,
// yet postMessage data is handled correctly.
worker.postMessage('foo');
worker.postMessage('bar');
worker.postMessage('baz');
// foo
// bar
// baz
```

一旦创建，除非通过自我终止（self.close()）或外部终止（worker.terminate()）显式终止，专用Worker将持续到页面的生命周期结束。即使Worker脚本已经运行完成，Worker环境也会持续存在。只要Worker一直存在，与之关联的Worker对象不会被垃圾回收。

终止：
自我终止和外部终止最终执行相同的Worker终止例程。考虑以下示例，其中Worker在调度消息之间自行：

```javascript
// CLOSEWORKER.JS
self.postMessage('foo');
self.close();
self.postMessage('bar');
setTimeout(() => self.postMessage('baz'), 0);

// MAIN.JS
const worker = new Worker('./worker.js');
worker.onmessage = ({data}) => console.log(data);
// foo
// bar
```

尽管调用了close()，但显然不会立即终止Worker的执行。close()仅指示Worker丢弃事件循环中的所有任务并防止添加更多任务。这就是为什么“baz”从不打印的原因。它不要求同步执行停止，因此仍然打印“bar”，因为它是在父环境的事件循环中处理的。

现在，考虑以下外部终端示例：

```javascript
// TERMINATEWORKER.JS
self.onmessage = ({data}) => console.log(data);

// MAIN.JS
const worker = new Worker('./worker.js');
// Allow 1000ms for worker to initialize
setTimeout(() => {
    worker.postMessage('foo');
    worker.terminate();
    worker.postMessage('bar');
    setTimeout(() => worker.postMessage('baz'), 0);
}, 1000);
// foo
```

在这里，Worker首先被发送一个带有“foo”的postMessage，它能够在外部终止之前处理。一旦调用了terminate()，Worker的消息队列就会被排空并被锁定——这就是为什么只打印“foo”的原因。

注意：close()和terminate()都是幂等操作；它们可以被多次调用而不会造成伤害。这些方法仅用于标记要拆卸的Worker，因此多次调用它们不会产生不良影响。

在其生命周期中，一个专用Worker只与一个网页相关联（在Web Worker规范中称为文档）。除非明确终止，否则只要相关文档存在，一个专用Worker就会一直存在。如果浏览器离开页面（可能通过导航或关闭选项卡或窗口），浏览器将标记与该文档关联的Worker并终止，并且它们的执行将立即停止。

### 配置 Worker 选项

`Worker()` 构造函数允许将可选的配置对象作为第二个参数。配置对象支持以下属性：

- `name`：可以通过 `self.name` 从 worker 内部读取的字符串标识符。
- `type`：指定加载的脚本应该如何运行，`classic` 或 `module`。`classic` 将脚本作为普通脚本执行；`module` 将脚本作为模块执行。
- `credentials`：当 `type` 设置为 `"module"` 时，指定应如何获取 worker 模块脚本以传输证书数据。可为 `omit`、`same-origin` 或 `include`。这些选项的操作与 `fetch()` 证书选项相同。当 `type` 设置为 `classic` 时，默认为 `omit`。

注意：一些现代浏览器仍然不完全支持模块 worker，或者可能需要使用标志来启用它们的支持。

从内联 JavaScript 创建 Worker

需要从脚本文件创建 worker，但这并不意味着必须从远程资源加载脚本。还可以通过 blob 对象 URL 从内联脚本创建专用 worker。由于消除了往返网络延迟，这允许更快的 worker 初始化。

以下示例从内联脚本创建一个 worker：

```javascript
// Create string of JavaScript code to execute
const workerScript = `self.onmessage = ({data}) => console.log(data);`;
// Generate a blob instance from the script string
const workerScriptBlob = new Blob([workerScript]);
// Create an object URL for the blob instance
const workerScriptBlobUrl = URL.createObjectURL(workerScriptBlob);
// Create a dedicated worker from the blob
const worker = new Worker(workerScriptBlobUrl);
worker.postMessage('blob worker script');
// blob worker script
```

在此示例中，脚本字符串被传递到 blob 实例，然后为该实例分配一个对象 URL，然后将其传递给 `Worker()` 构造函数。构造函数像往常一样愉快地创建了专用 worker。

简而言之，这个相同的例子可能如下所示：

```javascript
const worker = new Worker(URL.createObjectURL(new Blob([`self.onmessage = ({data}) => console.log(data);`])));
worker.postMessage('blob worker script');
// blob worker script
```

Worker 还可以利用带有内联脚本初始化的函数序列化。因为函数的 `toString()` 方法返回实际的函数代码，所以函数可以在父环境中定义但在子环境中执行：

```javascript
function fibonacci(n) {
    return n < 1 ? 0 :
        n <= 2 ? 1 :
            fibonacci(n - 1) + fibonacci(n - 2);
}
const workerScript = `self.postMessage((${fibonacci.toString()})(9));`;
const worker = new Worker(URL.createObjectURL(new Blob([workerScript])));
worker.onmessage = ({data}) => console.log(data);
// 34
```

在这里，斐波那契数列的这种故意昂贵的实现被序列化并传递给一个 worker。它作为立即调用函数表达式 (IIFE) 被调用并传递一个参数，并将结果发送回主线程。尽管这里的斐波那契计算非常昂贵，但所有计算都委托给了 worker，因此不会损害父环境的性能。

注意：这个函数序列化方法要求传入的函数不使用任何通过闭包获得的引用，包括像 `window` 这样的全局变量，因为这些在 worker 内部执行时会中断。

#### Worker内部的动态脚本执行

Worker脚本不必是完整的实体。可以使用`importScripts()`方法以编程方式加载和执行任意数量的脚本，该方法可在全局`worker`对象上使用。此方法将加载脚本并按顺序同步执行它们。以下示例加载并执行两个脚本:

 **MAIN.JS** 
```javascript
const worker = new Worker('./worker.js');
// importing scripts
// scriptA executes
// scriptB executes
// scripts imported
```

 **SCRIPTA.JS** 
```javascript
console.log('scriptA executes');
```

 **SCRIPTB.JS** 
```javascript
console.log('scriptB executes');
```

 **WORKER.JS** 
```javascript
console.log('importing scripts');
importScripts('./scriptA.js');
importScripts('./scriptB.js');
console.log('scripts imported');
```

`importScripts()`接受任意数量的脚本参数。浏览器可以按任意顺序下载，但脚本会严格按照参数顺序执行。因此，以下worker脚本是等效的:
```javascript
console.log('importing scripts');
importScripts('./scriptA.js', './scriptB.js');
console.log('scripts imported');
```

脚本加载受正常CORS限制的约束，但除此之外，worker可以自由地从其他源请求脚本。这种导入策略类似于通过 `<script>` 标签产生的动态脚本加载。本着这种精神，作用域与导入的脚本共享。此处演示了这种行为:

 **MAIN.JS** 
```javascript
const worker = new Worker('./worker.js', {name: 'foo'});
// importing scripts in foo with bar
// scriptA executes in foo with bar
// scriptB executes in foo with bar
// scripts imported
```

 **SCRIPTA.JS** 
```javascript
console.log(`scriptA executes in ${self.name} with ${globalToken}`);
```

 **SCRIPTB.JS** 
```javascript
console.log(`scriptB executes in ${self.name} with ${globalToken}`);
```

 **WORKER.JS** 
```javascript
const globalToken = 'bar';
console.log(`importing scripts in ${self.name} with ${globalToken}`);
importScripts('./scriptA.js', './scriptB.js');
console.log('scripts imported');
```

### 将任务委派给子worker

可能会发现worker需要产生自己的“子worker”。这在有多个CPU内核可用于并行计算的情况下非常有用。选择使用subworker模型应该只在仔细的设计考虑之后进行：运行多个web worker可能会产生相当大的计算开销，并且只有在并行化的收益超过成本时才应该这样做。除了路径解析之外，子worker的创建与普通worker的创建几乎相同：子worker脚本路径将根据其父worker而不是主页面进行解析。这个演示如下（注意添加了脚本目录）：

 **MAIN.JS** 
```javascript
const worker = new Worker('./js/worker.js');
```

 **JS/WORKER.JS** 
```javascript
console.log('worker');
const worker = new Worker('./subworker.js');
```

 **JS/SUBWORKER.JS** 
```javascript
console.log('subworker');
```

注意：顶级worker脚本和子worker脚本都必须从与主页相同的源加载。

处理worker错误：如果在worker脚本中抛出错误，worker的沙盒将用于防止它中断父线程的执行。此处演示了这一点，其中封闭的try/catch块不会捕获抛出的错误：

 **MAIN.JS** 
```javascript
try {
    const worker = new Worker('./worker.js');
    console.log('no error');
} catch(e) {
    console.log('caught error');
}
// no error
```

 **WORKER.JS** 
```javascript
throw Error('foo');
```

但是，此事件仍会冒泡到全局worker环境，并且可以通过在Worker对象上设置错误事件侦听器来访问：

 **MAIN.JS** 
```javascript
const worker = new Worker('./worker.js');
worker.onerror = console.log;
// ErrorEvent {message: "Uncaught Error: foo"}
```

 **WORKER.JS** 
```javascript
throw Error('foo');
```

域专用worker通信：与worker之间的所有通信都是通过异步消息发生的，但这些消息可以采用几种不同的形式。

#### 使用postMessage()通信

最简单和最常见的形式是使用 `postMessage()` 来在主线程和 Worker 线程之间传递序列化消息。下面展示了一个简单的阶乘示例:

 **factorialWorker.js** 
```javascript
function factorial(n) {
  let result = 1;
  while (n) {
    result *= n--;
  }
  return result;
}

self.onmessage = ({data}) => {
  self.postMessage(`${data}! = ${factorial(data)}`);
};
```

 **main.js** 
```javascript
const factorialWorker = new Worker('./factorialWorker.js');
factorialWorker.onmessage = ({data}) => console.log(data);
factorialWorker.postMessage(5);
factorialWorker.postMessage(7);
factorialWorker.postMessage(10);
// 5! = 120
// 7! = 5040
// 10! = 3628800
```

对于简单的消息传递，使用 `postMessage()` 在 window 和 worker 之间进行通信非常类似于两个窗口之间的消息传递。主要区别在于没有 `targetOrigin` 限制的概念，它存在于 `Window.prototype.postMessage` 而不是 `WorkerGlobalScope.prototype.postMessage` 或 `Worker.prototype.postMessage`。这种约定的原因很简单：worker 脚本源仅限于主页源，因此没有使用过滤机制。

#### 使用 `MessageChannel` 进行通信

对于主线程和 worker 线程，通过 `postMessage()` 进行通信涉及调用全局对象上的方法并在其中定义临时传输协议。这可以由 Channel Messaging API 代替，它允许在两个环境之间创建显式通信通道。

 **worker.js** 
```javascript
// Store messagePort globally inside listener
let messagePort = null;

function factorial(n) {
  let result = 1;
  while (n) {
    result *= n--;
  }
  return result;
}

// Set message handler on global object
self.onmessage = ({ports}) => {
  // Only set the port a single time
  if (!messagePort) {
    // Initial message sends the port,
    // assign to variable and unset listener
    messagePort = ports[0];
    self.onmessage = null;
    // Set message handler on global object
    messagePort.onmessage = ({data}) => {
      // Subsequent messages send data
      messagePort.postMessage(`${data}! = ${factorial(data)}`);
    };
  }
};
```

 **main.js** 
```javascript
const channel = new MessageChannel();
const factorialWorker = new Worker('./worker.js');

// Send the MessagePort object to the worker.
// Worker is responsible for handling this correctly
factorialWorker.postMessage(null, [channel.port1]);

// Send the actual message on the channel
channel.port2.onmessage = ({data}) => console.log(data);
channel.port2.postMessage(5);
// // 5! = 120
```

在这个例子中，父页面通过 `postMessage` 与一个 worker 共享一个 `MessagePort`。数组表示法是在环境之间传递可传输对象。本章稍后将介绍这个概念。worker 维护对此端口的引用，并使用它来传输消息，而不是通过全局对象传输它们。当然，这种格式仍然使用了一种 ad-hoc 协议：worker 被写入期望第一条消息发送端口和后续消息发送数据。

使用 `MessageChannel` 实例与父页面通信在很大程度上是多余的，因为全局 `postMessage` 功能本质上执行与 `channel.postMessage` 相同的任务（不包括 `MessageChannel` 接口的附加功能）。

在两个 worker 希望彼此直接通信的情况下，`MessageChannel` 真正变得有用。这可以通过将一个端口传递给每个 worker 来实现。考虑以下示例，其中先将数组传递给第一个 worker 程序，再传递给第二个 worker 程序，然后传递回主页:

 **main.js** 
```javascript
const channel = new MessageChannel();
const workerA = new Worker('./worker.js');
const workerB = new Worker('./worker.js');

workerA.postMessage('workerA', [channel.port1]);
workerB.postMessage('workerB', [channel.port2]);

workerA.onmessage = ({data}) => console.log(data);
workerB.onmessage = ({data}) => console.log(data);

workerA.postMessage(['page']);
// ['page', 'workerA', 'workerB']

workerB.postMessage(['page'])
// ['page', 'workerB', 'workerA']
```

 **worker.js** 
```javascript
let messagePort = null;
let contextIdentifier = null;

function addContextAndSend(data, destination) {
  // Add identifier to show when it reached this worker
  data.push(contextIdentifier);
  // Send data to next destination
  destination.postMessage(data);
}

self.onmessage = ({data, ports}) => {
  // If ports exist in the message,
  // set up the worker
  if (ports.length) {
    // Record the identifier
    contextIdentifier = data;
    // Capture the MessagePort
    messagePort = ports[0];
    // Add a handler to send the received data
    // back up to the parent
    messagePort.onmessage = ({data}) => {
      addContextAndSend(data, self);
    }
  } else {
    addContextAndSend(data, messagePort);
  }
};
```

在这个例子中，数组旅程的每个部分都会在数组中添加一个字符串来标记它何时到达。该数组从父页面传递到一个 worker 程序，它添加了它的环境标识符。然后它传递给另一个 worker，这会添加第二个环境标识符。然后它被传递回主页面，在那里记录数组。请注意在此示例中，由于两个 worker 共享一个公共脚本，该数组传递方案可双向工作。

#### 使用BroadcastChannel通信

在同一源上运行的脚本能够在共享的`BroadcastChannel`上发送和接收确认消息。这种通道类型设置起来更简单，并且不需要`MessageChannel`所需的端口传递。这可以按如下方式完成：

 **MAIN.JS** 

```javascript
const channel = new BroadcastChannel('worker_channel');
const worker = new Worker('./worker.js');
channel.onmessage = ({ data }) => {
  console.log(`heard ${data} on page`);
};
setTimeout(() => channel.postMessage('foo'), 1000);
// heard foo in worker
// heard bar on page
```

 **WORKER.JS** 

```javascript
const channel = new BroadcastChannel('worker_channel');
channel.onmessage = ({ data }) => {
  console.log(`heard ${data} in worker`);
  channel.postMessage('bar');
};
```

请注意，页面在`BroadcastChannel`上发送初始消息之前等待1,000毫秒。因为这种类型的通道没有端口所有权的概念，如果没有其他实体在该通道上侦听，则不会处理广播的消息。在这种情况下，如果没有 `setTimeout`，worker 初始化的延迟将导致在实际消息发送前阻止 worker 的消息处理程序设置。

### worker数据传输

Worker通常需要以某种形式提供数据有效负载。由于Worker在单独的环境中运行，因此从一个环境获取另一个环境的数据会产生开销。在支持传统多线程模型的语言中，可以使用诸如锁（lock）、互斥量（mutexes）和易变变量（volatile variables）等概念。在JavaScript中，有三种在环境之间移动信息的方式：结构化克隆算法（structured clone algorithm）、可传输对象（transferable objects）和共享数组缓冲区（shared array buffers）。

#### 结构化克隆算法

结构化克隆算法可用于在两个独立的执行环境之间共享一段数据。该算法由浏览器在后台实现，但不能显式调用。当一个对象被传递给`postMessage()`时，浏览器遍历该对象并在目标环境中创建一个副本。结构化克隆算法完全支持以下类型：

- 除Symbol之外的所有原始类型
- Boolean对象
- String对象
- Date
- RegExp
- Blob
- File
- FileList
- ArrayBuffer
- ArrayBufferView
- ImageData
- Array
- Object
- Map
- Set

关于结构化克隆算法行为的一些注意事项：

- 复制后，对源环境中对象的更改将不会传播到目标环境对象。
- 结构化克隆算法会识别对象何时包含循环，并且不会无限遍历该对象。
- 尝试克隆Error对象、Function对象或DOM节点将引发错误。
- 结构化克隆算法并不总是创建一个精确的副本。
- 对象属性描述符、getter和setter不会被克隆，并将在适用的情况下恢复为默认值。
- 原型链不会被克隆。
- `RegExp.prototype.lastIndex`属性不会被克隆。

注意：当被复制的对象很大时，结构化克隆算法的计算成本可能很高。尽可能避免大量或过度复制。

#### 可传输对象

可以使用可传输对象将所有权从一个环境转移到另一个环境。在环境之间复制大量数据不切实际的情况下，这尤其有用。只有少数类型是可转移的：

- ArrayBuffer
- MessagePort
- ImageBitmap
- OffscreenCanvas

`postMessage()`的第二个可选参数是一个数组，指定应将哪些对象传输到目标环境。当遍历消息有效负载对象时，浏览器将根据传输对象数组检查对象引用，并对这些对象执行传输而不是复制它们。这意味着传输的对象可以在本身被复制的消息有效负载中发送，例如对象或数组。

以下示例演示了ArrayBuffer到Worker程序的正常结构化克隆。在这个例子中没有发生对象传输：

 **MAIN.JS** 
```javascript
const worker = new Worker('./worker.js');
// Create 32 byte buffer
const arrayBuffer = new ArrayBuffer(32);
console.log(`page's buffer size: ${arrayBuffer.byteLength}`); // 32
worker.postMessage(arrayBuffer);
console.log(`page's buffer size: ${arrayBuffer.byteLength}`); // 32
```

 **WORKER.JS** 
```javascript
self.onmessage = ({data}) => {
  console.log(`worker's buffer size: ${data.byteLength}`); // 32
};
```

当ArrayBuffer被指定为可传输对象时，对缓冲区内存的引用在父环境中被清除并分配给Worker环境。此处演示了这一点，其中从父环境中删除了在ArrayBuffer内分配的内存：

 **MAIN.JS** 
```javascript
const worker = new Worker('./worker.js');
// Create 32 byte buffer
const arrayBuffer = new ArrayBuffer(32);
console.log(`page's buffer size: ${arrayBuffer.byteLength}`); // 32
worker.postMessage(arrayBuffer, [arrayBuffer]);
console.log(`page's buffer size: ${arrayBuffer.byteLength}`); // 0
```

 **WORKER.JS** 
```javascript
self.onmessage = ({data}) => {
  console.log(`worker's buffer size: ${data.byteLength}`); // 32
};
```

将可传输对象嵌套在其他对象类型中是完全可以的。包含对象将被复制，嵌套对象将被传输：

 **MAIN.JS** 
```javascript
const worker = new Worker('./worker.js');
// Create 32 byte buffer
const arrayBuffer = new ArrayBuffer(32);
console.log(`page's buffer size: ${arrayBuffer.byteLength}`); // 32
worker.postMessage({foo: {bar: arrayBuffer}}, [arrayBuffer]);
console.log(`page's buffer size: ${arrayBuffer.byteLength}`); // 0
```

 **WORKER.JS** 
```javascript
self.onmessage = ({data}) => {
  console.log(`worker's buffer size: ${data.foo.bar.byteLength}`); // 32
};
```

#### SharedArrayBuffer

SharedArrayBuffer不是被克隆或传输，而是在浏览器环境之间共享的ArrayBuffer。在`postMessage()`中传递SharedArrayBuffer时，浏览器将只传递对原始缓冲区的引用。因此，两个不同的JavaScript环境将各自维护对同一内存块的引用。每个环境都可以像使用普通ArrayBuffer一样自由修改缓冲区：

 **MAIN.JS** 
```javascript
const worker = new Worker('./worker.js');
// Create 1 byte buffer
const sharedArrayBuffer = new SharedArrayBuffer(1);
// Create view onto 1 byte buffer
const view = new Uint8Array(sharedArrayBuffer);
// Parent context assigns value of 1
view[0] = 1;
worker.onmessage = () => {
  console.log(`buffer value after worker modification: ${view[0]}`);
};
// Send reference to sharedArrayBuffer
worker.postMessage(sharedArrayBuffer);
// buffer value before worker modification: 1
// buffer value after worker modification: 2
```

 **WORKER.JS** 
```javascript
self.onmessage = ({data}) => {
  const view = new Uint8Array(data);
  console.log(`buffer value before worker modification: ${view[0]}`);
  // Worker assigns new value to shared buffer
  view[0] += 1;
  // Send back empty postMessage to signal assignment is complete
  self.postMessage(null);
};
```

当然，在两个并行线程之间共享内存块会带来竞争条件（race conditions）的风险。换句话说，SharedArrayBuffer实例实际上被视为不稳定内存。下面的示例演示了此问题：

 **MAIN.JS** 
```javascript
// Create worker pool of size 4
const workers = [];
for (let i = 0; i < 4; ++i) {
  workers.push(new Worker('./worker.js'));
}
// Log the final value after the last worker completes
let responseCount = 0;
for (const worker of workers) {
  worker.onmessage = () => {
    if (++responseCount == workers.length) {
      console.log(`Final buffer value: ${view[0]}`);
    }
  };
}
// Initialize the SharedArrayBuffer
const sharedArrayBuffer = new SharedArrayBuffer(4);
const view = new Uint32Array(sharedArrayBuffer);
view[0] = 1;
// Send the SharedArrayBuffer to each worker
for (const worker of workers) {
  worker.postMessage(sharedArrayBuffer);
}
// (Expected result is 4000001. Actual output will be something like:)
// Final buffer value: 2145106
```

 **WORKER.JS** 
```javascript
self.onmessage = ({data}) => {
  const view = new Uint32Array(data);
  // Perform 1000000 add operations
  for (let i = 0; i < 1E6; ++i) {
    view[0] += 1;
  }
  self.postMessage(null);
};
```

在这里，每个worker正在执行1,000,000次顺序操作，这些操作从共享数组索引中读取，执行添加，然后将该值写回到数组索引中。当worker读/写操作交错时会发生竞争条件。为了解决这个问题，Atomics全局对象允许worker有效地获得对SharedArrayBuffer实例的锁定，并在允许其他worker执行任何操作之前执行整个读/添加/写序列。将`Atomics.add()`合并到这个例子中会产生一个正确的最终值：

 **MAIN.JS** 
```javascript
// Create worker pool of size 4
const workers = [];
for (let i = 0; i < 4; ++i) {
  workers.push(new Worker('./worker.js'));
}
// Log the final value after the last worker completes
let responseCount = 0;
for (const worker of workers) {
  worker.onmessage = () => {
    if (++responseCount == workers.length) {
      console.log(`Final buffer value: ${view[0]}`);
    }
  };
}
// Initialize the SharedArrayBuffer
const sharedArrayBuffer = new SharedArrayBuffer(4);
const view = new Uint32Array(sharedArrayBuffer);
view[0] = 1;
// Send the SharedArrayBuffer to each worker
for (const worker of workers) {
  worker.postMessage(sharedArrayBuffer);
}
// (Expected result is 4000001)
// Final buffer value: 4000001
```

 **WORKER.JS** 
```javascript
self.onmessage = ({data}) => {
  const view = new Uint32Array(data);
  // Perform 1000000 add operations
  for (let i = 0; i < 1E6; ++i) {
    Atomics.add(view, 0, 1);
  }
  self.postMessage(null);
};
```

注意：SharedArrayBuffer和Atomics API在“JavaScript APIs”一章中有完整的介绍。

### worker池

以下是经过校对后的关于JavaScript和与其相关的markdown内容：

因为启动一个worker非常昂贵，所以在某些情况下，让固定数量的worker保持活动状态，并在必要时向它们分派工作可能会更有效。当一个worker正在执行计算时，它被标记为忙碌，并且在它再次可用时通知池子，准备好接受另一个任务。这通常被称为“线程池”或“worker池”。

确定池子中理想的工作线程数量并不是一门精确的科学，但`navigator.hardwareConcurrency`属性将返回系统上可用的内核数量。由于可能无法确定每个内核的多线程能力，因此最好将此数字视为池子大小的上限。可能遇到的一个场景是池子中的一组固定worker，所有worker都执行由一小组输入参数控制的相同任务。通过使用特定于任务的worker池，可以分配固定数量的worker并按需为它们提供参数。worker将接受这些参数，执行长时间运行的计算，并将值返回到池子中。反过来，池子将向worker发送额外的工作来执行。此示例将构建一个相对简单的worker池，但它将涵盖此概念的所有基本要求。

首先定义一个`TaskWorker`，它扩展了`Worker`类。这个类有两个工作：跟踪它是否忙于执行工作，并管理进出worker的信息和事件。此外，传递给此worker的任务将包含在promise中，并将适当地解决/拒绝。该类可以定义如下：

```javascript
class TaskWorker extends Worker {
  constructor(notifyAvailable, ...workerArgs) {
    super(...workerArgs);
    // Initialize as unavailable
    this.available = false;
    this.resolve = null;
    this.reject = null;
    // Worker pool will pass a callback so that the
    // worker can signal it needs another task
    this.notifyAvailable = notifyAvailable;
    // Worker script will send a 'ready' postmessage
    // once fully initialized
    this.onmessage = () => this.setAvailable();
  }

  // Called by the worker pool to begin a new task
  dispatch({
    resolve,
    reject,
    postMessageArgs
  }) {
    this.available = false;
    this.onmessage = ({ data }) => {
      resolve(data);
      this.setAvailable();
    };
    this.onerror = (e) => {
      reject(e);
      this.setAvailable();
    };
    this.postMessage(...postMessageArgs);
  }

  setAvailable() {
    this.available = true;
    this.resolve = null;
    this.reject = null;
    this.notifyAvailable();
  }
}
```

接下来，`WorkerPool`类定义必须使用这个`TaskWorker`类。它还必须维护一个尚未分配给worker的任务队列。两个事件可以表示应该调度一个新任务：一个新任务被添加到队列中，或者一个worker程序完成一个任务并应该发送另一个。该类可以定义如下：

```javascript
class WorkerPool {
  constructor(poolSize, ...workerArgs) {
    this.taskQueue = [];
    this.workers = [];
    // Initialize the worker pool
    for (let i = 0; i < poolSize; ++i) {
      this.workers.push(
        new TaskWorker(() => this.dispatchIfAvailable(), ...workerArgs)
      );
    }
  }

  // Pushes a task onto the queue
  enqueue(...postMessageArgs) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        resolve,
        reject,
        postMessageArgs
      });
      this.dispatchIfAvailable();
    });
  }

  // Sends a task to the next available worker if there is one
  dispatchIfAvailable() {
    if (!this.taskQueue.length) {
      return;
    }
    for (const worker of this.workers) {
      if (worker.available) {
        let a = this.taskQueue.shift();
        worker.dispatch(a);
        break;
      }
    }
  }

  // Kills all the workers
  close() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}
```

定义了这两个类后，现在将任务分派到工作池并在worker可用时执行它们就变得很简单了。在此示例中，假设想对1000万个浮点数求和。为了节省传输成本，这将使用`SharedArrayBuffer`。worker定义可能如下所示：

```javascript
self.onmessage = ({ data }) => {
  let sum = 0;
  let view = new Float32Array(data.arrayBuffer);
  // Perform sum
  for (let i = data.startIdx; i < data.endIdx; ++i) {
    // No need for Atomics since only performing reads
    sum += view[i];
  }
  // Send the result to the worker
  self.postMessage(sum);
};

// Send message to TaskWorker to signal worker is
// ready to receive tasks.
self.postMessage('ready');
```

有了这一切，利用工作池的代码可能如下所示：

```javascript
const totalFloats = 1E8;
const numTasks = 20;
const floatsPerTask = totalFloats / numTasks;
const numWorkers = 4;

// Create pool
const pool = new WorkerPool(numWorkers, './worker.js');

// Fill array of floats
let arrayBuffer = new SharedArrayBuffer(4 * totalFloats);
let view = new Float32Array(arrayBuffer);
for (let i = 0; i < totalFloats; ++i) {
  view[i] = Math.random();
}

let partialSumPromises = [];
for (let i = 0; i < totalFloats; i += floatsPerTask) {
  partialSumPromises.push(
    pool.enqueue({
      startIdx: i,
      endIdx: i + floatsPerTask,
      arrayBuffer: arrayBuffer
    })
  );
}

// Wait for all promises to complete, then sum
Promise.all(partialSumPromises)
  .then((partialSums) => partialSums.reduce((x, y) => x + y))
  .then(console.log);
// (In this example, sum should be roughly 1E8/2)
// 49997075.47203197
```

注意：盲目引入并行化并不是一刀切的升级。工作池的性能调优将因任务计算涉及的内容和系统硬件而异。

## 共享 Worker

共享 Web Worker 或共享 Worker 的行为类似于专用 Worker，但可跨多个受信任的执行环境访问。例如，同源的两个不同选项卡将能够访问单个 Web Worker。SharedWorker 和 Worker 在外部和内部具有略微不同的消息传递接口。

在开发人员希望通过允许多个执行环境共享一个 Worker 来减少计算开销的情况下，共享 Worker 很有价值。这方面的一个例子可能是管理一个 websocket 的单个共享 Worker，以发送和接收多个同源页面的消息。当同源环境希望通过共享 Worker 进行通信时，共享 Worker 也很有用。

### 共享 Worker 基础

从行为上讲，共享 Worker 可以被认为是专用 Worker 的延伸。Worker 创建、Worker 选项、安全限制和 importScripts() 都以相同的方式运行。与专用 Worker 线程的情况一样，共享 Worker 线程也在单独的执行环境中运行，并且只能与其他环境异步通信。

#### 创建一个共享 Worker

与专用 Worker 一样，创建共享 Worker 的最常见方法是通过加载的 JavaScript 文件。文件路径提供给 SharedWorker 构造函数，后者反过来在后台异步加载脚本并实例化 Worker 线程。

以下简单示例从绝对路径创建一个空的共享 Worker:

EMPTYSHAREDWORKER.JS

```javascript
// empty JS worker file
```

MAIN.JS

```javascript
console.log(location.href); // "https://example.com/"
const sharedWorker = new SharedWorker(location.href + 'emptySharedWorker.js');
console.log(sharedWorker); // SharedWorker {}
```

可以将前面的示例更改为使用相对路径；但是，这要求 main.js 在可以加载 emptySharedWorker.js 的同一路径上执行:

```javascript
const worker = new Worker('./emptyWorker.js');
console.log(worker); // Worker {}
```

也可以从内联脚本创建共享 Worker，但这样做没有什么意义：从内联脚本字符串创建的每个 blob 都分配有自己唯一的浏览器内 (in-browser) URL，因此从内联脚本创建的共享 Worker 将始终是唯一的，其原因将在下一节中介绍。

#### SharedWorker 身份和单人入住

共享 Worker 和专用 Worker 之间的一个重要区别在于，Worker() 构造函数始终创建一个新的 Worker 实例，而 SharedWorker() 构造函数仅在具有相同身份的实例尚不存在时才会创建一个新的 Worker 实例。如果确实存在与该身份匹配的共享 Worker，则会与现有共享 Worker 形成新连接。

共享 Worker 身份源自解析的脚本 URL、Worker 名和文档源。例如，以下脚本将实例化单个共享 Worker 并添加两个后续连接:

```javascript
// Instantiates single shared worker
// - Constructors called all on same origin
// - All scripts resolve to same URL
// - All workers have the same name
new SharedWorker('./sharedWorker.js');
new SharedWorker('./sharedWorker.js');
new SharedWorker('./sharedWorker.js');
```

类似地，由于以下三个脚本字符串都解析为相同的 URL，因此只会创建一个共享 Worker 程序:

```javascript
// Instantiates single shared worker
// - Constructors called all on the same origin
// - All scripts resolve to the same URL
// - All workers have the same name
new SharedWorker('./sharedWorker.js');
new SharedWorker('sharedWorker.js');
new SharedWorker('https://www.example.com/sharedWorker.js');
```

因为可选的 Worker 名称是共享 Worker 身份的一部分，所以使用不同的 Worker 名称会强制浏览器创建多个共享 Worker —— 一个名为“foo”，一个名为“bar” —— 即使它们具有相同的源和脚本 URL:

```javascript
// Instantiates two shared workers
// - Constructors called all on the same origin
// - All scripts resolve to the same URL
// - One shared worker has the name 'foo', one has the name 'bar'
new SharedWorker('./sharedWorker.js', {name: 'foo'});
new SharedWorker('./sharedWorker.js', {name: 'foo'});
new SharedWorker('./sharedWorker.js', {name: 'bar'});
```

顾名思义，共享 Worker 是跨选项卡、窗口、iframe 或在同一源上运行的其他 Worker 所共享的。因此，在多个选项卡上运行的以下脚本只会在第一次执行时创建一个 Worker，并且每次连续运行都将连接到同一个 Worker:

```javascript
// Instantiates single shared worker
// - Constructors called all on the same origin
// - All scripts resolve to the same URL
// - All workers have the same name
new SharedWorker('./sharedWorker.js');
```

共享 Worker 的身份仅限于 URL，因此即使加载了相同的脚本，以下内容也会创建两个共享 Worker：

```javascript
// 实例化两个共享 Worker
// - 所有构造函数都在同一来源上调用
// - '?' 标记区分 URL
// - 所有 Worker 都有相同的名称
new SharedWorker('./sharedWorker.js');
new SharedWorker('./sharedWorker.js?');
```

如果此脚本在两个不同的选项卡中运行，总共只会创建两个共享 Worker。每个构造函数都会检查匹配的共享 Worker，如果存在，则仅连接到它。

#### 使用 SharedWorker 对象

从 `SharedWorker()` 构造函数返回的 `SharedWorker` 对象用作与新创建的专用 Worker 的单点通信。它可用于通过 `MessagePort` 在 Worker 和父环境之间传输信息，以及捕获从专用 Worker 发出的错误事件。

`SharedWorker` 对象支持以下属性：

- `onerror`：可以分配一个事件处理程序，只要从 Worker 程序中冒出 `ErrorEvent` 错误类型就会调用该处理程序。当在 Worker 内部抛出错误时会发生此事件。此事件也可以使用 `sharedWorker.addEventListener('error', handler)` 来处理。
- `port`：用于与共享 Worker 通信的专用 `MessagePort`。

#### `SharedWorkerGlobalScope`

在共享 Worker 内部，全局作用域是 `SharedWorkerGlobalScope` 的一个实例。它继承自 `WorkerGlobalScope`，因此包括其所有属性和方法。与专用 Worker 一样，共享 Worker 能够通过 `self` 访问这个全局作用域。

`SharedWorkerGlobalScope` 使用以下属性和方法扩展了 `WorkerGlobalScope`：

- `name`：一个可选的字符串标识符，可以提供给 `SharedWorker` 构造函数。
- `importScripts()`：用于将任意数量的脚本导入到 Worker 中。
- `clone()`：对应于 `worker.terminate()`。它用于立即终止 Worker 线程。Worker 没有清理的机会；脚本突然中断。
- `onconnect`：应设置为与共享 Worker 建立新连接时的处理程序。`connect` 事件包括 `MessagePort` 实例的 `ports` 数组，可用于将消息发送回父环境。当通过 `worker.port.onmessage` 或 `worker.port.start()` 与共享 Worker 建立连接时，会发生 `connect` 事件。此事件也可以使用 `sharedWorker.addEventListener('connect', handler)` 来处理。

注意：根据浏览器的实现，可能不会在默认浏览器控制台视图中打印到 `SharedWorker` 内部控制台的日志。

### 了解共享worker生命周期

共享 Worker 的生命周期与专用 Worker 具有相同的阶段和功能。不同之处在于，虽然专用 Worker 与单个页面密不可分，但只要环境保持连接，共享 Worker 就会持续存在。

考虑以下脚本，它在每次执行时都会创建一个专用 Worker：

```javascript
new Worker('./worker.js');
```

下表详细说明了按顺序打开和关闭时生成 Worker 的三个选项卡时会发生什么：

| 事件              | 结果               | 事件过后 Worker 数量 |
| ----------------- | ------------------ | -------------------- |
| tab1 执行 main.js | 专用 Worker 1 产生 | 1                    |
| tab2 执行 main.js | 专用 Worker 2 产生 | 2                    |
| tab2 执行 main.js | 专用 Worker 3 产生 | 3                    |
| 关闭 tab1         | 专用 Worker 1 终结 | 2                    |
| 关闭 tab2         | 专用 Worker 2 终结 | 1                    |
| 关闭 tab3         | 专用 Worker 3 终结 | 0                    |

如表所示，脚本执行次数、打开的选项卡数量和正在运行的 Worker 线程数量之间存在关系。接下来，考虑以下简单的脚本，它在每次执行时创建或连接到一个共享 Worker：

```javascript
new SharedWorker('./sharedWorker.js');
```

下表详细说明了按顺序打开和关闭三个选项卡时会发生什么：

| 事件              | 结果                                                 | 事件过后 Worker 数量 |
| ----------------- | ---------------------------------------------------- | -------------------- |
| tab1 执行 main.js | 共享 Worker 1 产生                                   | 1                    |
| tab2 执行 main.js | 连接到共享 Worker 1                                  | 1                    |
| tab3 执行 main.js | 连接到共享 Worker 1                                  | 1                    |
| 关闭 tab1         | 从 Worker 1 断开                                     | 1                    |
| 关闭 tab2         | 从 Worker 1 断开                                     | 1                    |
| 关闭 tab3         | 从 Worker 1 断开，没有连接保留，因此 Worker 1 被终止 | 0                    |

没有办法以编程方式终止共享 Worker。因为 SharedWorker 对象中没有 `terminate()` 方法。此外，在共享 Worker 端口（本章稍后讨论）上调用 `close()` 不会触发 Worker 的终止，即使只有一个端口连接到 Worker。

SharedWorker “连接”与关联的 MessagePort 或 MessageChannel 的连接状态无关。一旦与共享 Worker 建立连接，浏览器就会负责管理该连接。已建立的连接将在页面的整个生命周期内持续存在，并且只有当页面被卸载并且没有与共享 Worker 的进一步连接时，浏览器才会选择终止该 Worker。

### 连接到 SharedWorker

每次调用 SharedWorker 构造函数时，都会在共享 worker 内部触发连接事件，无论是否创建了 worker。
下面的示例演示了这一点，其中在循环内调用构造函数：

 **sharedWorker.js** 
```javascript
let i = 0;
self.onconnect = () => console.log(`connected ${++i} times`);
```

 **main.js** 
```javascript
for (let i = 0; i < 5; ++i) {
    new SharedWorker('./sharedWorker.js');
}
// connected 1 times
// connected 2 times
// connected 3 times
// connected 4 times
// connected 5 times
```

在发生 connect 事件时，SharedWorker 构造函数隐式地创建一个 MessageChannel 并传递对该 SharedWorker 实例唯一拥有所有权的 MessagePort。此 MessagePort 在 connect 事件对象内可用作 ports 数组。因为一个连接事件只会代表一个连接，所以可以安全地假设 ports 数组的长度正好是 1。

下面演示了访问事件的 ports 数组。这里使用了一个 Set 来确保只跟踪唯一的对象实例：

 **sharedWorker.js** 
```javascript
const connectedPorts = new Set();
self.onconnect = ({ports}) => {
    connectedPorts.add(ports[0]);
    console.log(`${connectedPorts.size} unique connected ports`);
};
```

 **main.js** 
```javascript
for (let i = 0; i < 5; ++i) {
    new SharedWorker('./sharedWorker.js');
}
// 1 unique connected ports
// 2 unique connected ports
// 3 unique connected ports
// 4 unique connected ports
// 5 unique connected ports
```

重要的是，共享 worker 在设置和拆卸方面的行为不对称。每个新的 SharedWorker 连接都会触发一个事件，但是当 SharedWorker 实例断开连接时（例如页面关闭时），没有相应的事件。

在前面的示例中，当页面连接和断开到同一个共享 worker 时，connectedPorts 集合将被死端口污染，无法识别它们。这个问题的一个解决方案是在页面即将在 beforeunload 事件中被销毁时发送一个明确的拆卸消息，并允许共享 worker 进行清理。

## 服务worker

服务worker是一种 Web Worker，其行为类似于浏览器中的代理服务器。服务worker允许拦截传出的请求并缓存响应。这允许网页在没有网络连接的情况下工作，因为可以从服务worker缓存中提供部分或全部页面。服务worker还可以使用 Notifications API、Push API、Background Sync API 和 Channel Messaging API。与共享 Worker 一样，单个域上的多个页面都将与单个服务worker实例交互。然而，为了启用推送 API 等功能，服务worker还可以在关联的选项卡或浏览器关闭的情况下继续存在，并等待传入的推送事件。

最终，大多数开发人员会发现服务worker对两个主要任务最有用：充当网络请求的缓存层，以及启用推送通知。从这个意义上说，服务worker是一种工具，旨在使网页能够像本地应用程序一样运行。

注意：服务worker是一个非常广泛的主题，几乎可以写一整本书。为了在本章之外扩展理解，请考虑参加 Udacity 课程“离线 Web 应用程序”（[链接](https://www.udacity.com/course/offline-web-applications--ud899)）。此外，Mozilla 维护着一个服务worker手册站点（[链接](https://serviceworke.rs/)），这是一个通用服务worker模式的极好参考。

注意：服务worker的生命周期在很大程度上取决于同一源（称为“客户端”）上打开的选项卡的数量、页面是否经历了导航事件以及服务worker脚本是否已更改（以及许多其他因素）。

如果对服务worker生命周期没有很好的理解，“服务worker”部分中的一些示例可能不会按预期运行。“了解服务worker生命周期”一节阐明了幕后发生的事情。此外，在与服务worker打交道时要小心使用浏览器的硬刷新功能（Ctrl+Shift+R）。硬刷新将强制浏览器忽略所有网络缓存，大多数主流浏览器都将服务worker视为网络缓存。

### 服务worker基础

作为一类网络 Worker，服务worker表现出许多与专用或共享 Worker 的相同之处。它存在于一个完全独立的执行环境中，只能通过异步消息进行交互。然而，服务worker和专用/共享 Worker 之间存在许多根本区别。

#### ServiceWorkerContainer

服务worker与专用和共享 Worker 的不同之处在于它们没有全局构造函数。相反，服务worker通过 ServiceWorkerContainer 进行管理，可通过 `navigator.serviceWorker` 获得。这个对象是顶级接口，它允许你指导浏览器创建、更新、销毁或与服务worker交互。

```javascript
console.log(navigator.serviceWorker);
// ServiceWorkerContainer { ... }
```

#### 创建服务worker

服务worker与共享 Worker 的相似之处在于，如果它尚不存在，则会生成一个新的；否则将获得与现有服务worker的连接。ServiceWorkerContainer 没有通过全局构造函数创建，而是公开了一个 `register()` 方法，该方法以与 Worker 或 SharedWorker 构造函数相同的方式传递一个脚本 URL：

 **emptyServiceWorker.js** 

```javascript
// empty 服务worker script
```

 **main.js** 

```javascript
navigator.serviceWorker.register('./emptyServiceWorker.js');
```

`register()` 方法返回一个 promise，它解决为 ServiceWorkerRegistration 对象，如果注册失败则为拒绝。

 **emptyServiceWorker.js** 

```javascript
// empty 服务worker script
```

 **main.js** 

```javascript
// Successfully registers a 服务worker, resolves
navigator.serviceWorker.register('./emptyServiceWorker.js')
  .then(console.log, console.error);
// ServiceWorkerRegistration { ... }

// Attempts to register 服务worker from nonexistent file, rejects
navigator.serviceWorker.register('./doesNotExist.js')
  .then(console.log, console.error);
// TypeError: Failed to register a ServiceWorker:
// A bad HTTP response code (404) was received when fetching the script.
```

服务worker的性质允许在选择何时开始注册方面具有一定的灵活性。在 `register()` 首次激活服务worker后，在同一页面上使用相同 URL 对 `register()` 的后续调用实际上是空操作。此外，即使浏览器不全局支持服务worker，服务worker也应该有效地对页面不可见，因为其类似代理的行为意味着原本会被处理的操作将仅被正常分派到网络。

由于上述属性，注册服务worker的一个非常常见的模式是将其置于功能检测和页面 load 事件之后。这经常表现为如下：

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./serviceWorker.js');
  });
}
```

如果没有 load 事件门控（gating），服务worker的注册将与页面资源的加载重叠，这可能会减慢初始页面渲染。除非服务worker负责管理缓存行为，这必须在页面设置过程中尽早发生（例如在使用 `clients.claim()` 时，将在本章后面讨论），等待 load 事件通常是明智的，仍然允许页面享受到使用服务worker的所有好处。

#### 使用ServiceWorkerContainer对象

ServiceWorkerContainer接口是浏览器Service Worker生态系统的顶级封装。它提供了用于管理Service Worker状态和生命周期的工具。

ServiceWorkerContainer始终可以在客户端环境中访问：
```javascript
console.log(navigator.serviceWorker);
// ServiceWorkerContainer { ... }
```

ServiceWorkerContainer支持以下事件处理程序：

- `oncontrollerchange`: 可以分配一个事件处理程序，当从ServiceWorkerContainer发出`controllerchange`事件时，会调用该处理程序。当获取新的激活的ServiceWorkerRegistration时，会发生此事件。此事件也可以使用`navigator.serviceWorker.addEventListener('controllerchange', handler)`来处理。

- `onerror`: 可以分配一个事件处理程序，每当从任何关联的Service Worker中发生`ErrorEvent`错误类型时都会调用该事件处理程序。当在任何关联的Service Worker中抛出错误时，会触发此事件。此事件也可以使用`navigator.serviceWorker.addEventListener('error', handler)`来处理。

- `onmessage`: 可以分配一个事件处理程序，每当从Service Worker发送`MessageEvent`类型的消息时都会调用该处理程序。当Service Worker脚本将消息事件发送回父环境时，会发生此事件。此事件也可以使用`navigator.serviceWorker.addEventListener('message', handler)`来处理。

ServiceWorkerContainer支持以下属性：

- `ready`: 返回一个Promise，它可能会解决为激活的ServiceWorkerRegistration对象。这个Promise永远不会被拒绝。

- `controller`: 返回与当前页面关联的激活的Service Worker对象，如果没有激活的Service Worker，则返回`null`。

ServiceWorkerContainer支持以下方法：

- `register()`: 使用提供的URL和option对象创建或更新ServiceWorkerRegistration。
- `getRegistration()`: 返回一个Promise，它将解决为与提供的作用域匹配的ServiceWorkerRegistration对象，如果没有匹配的Service Worker，则解决为`undefined`。
- `getRegistrations()`: 返回一个Promise，它将解决为与ServiceWorkerContainer关联的所有ServiceWorkerRegistration对象的数组，如果没有关联的Service Worker，则解决为一个空数组。
- `startMessage()`: 启动通过`Client.postMessage()`发送的消息的传输。

#### 使用 ServiceWorkerRegistration 对象

ServiceWorkerRegistration 对象表示服务worker的成功注册。该对象在从 `register()` 返回的已解决的 promise 处理程序中可用。这个对象允许通过几个属性来确定相关服务worker的生命周期状态。在调用 `navigator.serviceWorker.register()` 之后，注册对象在一个 promise 中提供。在同一页面上使用相同 URL 进行多次调用将返回相同的注册对象:

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
.then((registrationA) => {
  console.log(registrationA);
  navigator.serviceWorker.register('./serviceWorker2.js')
  .then((registrationB) => {
    console.log(registrationA === registrationB);
  });
});
```

ServiceWorkerRegistration 支持以下事件处理程序:

- `onupdatefound` 可以分配一个事件处理程序，每当服务worker触发 `updatefound` 类型的事件时都会调用该处理程序。当此服务worker的新版本开始安装时触发此事件，`ServiceWorkerRegistration.installing` 表示正在获取新的服务 worker。此事件也可以使用 `serviceWorkerRegistration.addEventListener('updatefound', handler)` 来处理。

ServiceWorkerRegistration 支持以下常规属性:

- `scope` 返回服务worker的 scope 的完整 URL 路径。该值源自获取服务worker脚本的路径或 `register()` 中提供的 scope。
- `navigationPreload` 返回与此注册对象关联的 `NavigationPreloadManager` 实例。
- `pushManager` 返回与此注册对象关联的 `PushManager` 实例。

ServiceWorkerRegistration 还支持以下属性，这些属性可用于检查服务worker在其生命周期的各个阶段:

- `installing` 返回处于安装状态的服务 worker，没有则返回 `null`。
- `waiting` 返回处于等待状态的服务 worker，没有则返回 `null`。
- `active` 返回处于激活或活动状态的 service worker，否则返回 `null`。

这些属性是服务worker状态的一次性快照。这些适用于大多数用例，因为活动的服务worker不会在页面的整个生命周期内更改状态，除非使用 `ServiceWorkerGlobalScope.skipWaiting()` 之类的方法强制这样做。

ServiceWorkerRegistration 支持以下方法:

- `getNotifications()` 返回一个 promise，它将解决为 `Notification` 对象的数组。
- `showNotifications()` 显示使用 `title` 和 `options` 参数配置的通知。
- `update()` 直接从服务器重新请求服务worker脚本，并在新脚本不同时启动全新安装。
- `unregister()` 将尝试注销服务worker注册。这允许在执行注销之前完成服务worker的执行。

#### 使用ServiceWorker对象

可以通过以下两种方式之一获取 Service Worker 对象：通过 Service Worker Controller 对象上的 `controller` 属性和 Service Worker Registration 对象上的 `active` 属性。这个对象继承自 Worker 原型，因此提供了它的所有属性和方法，但值得注意的是没有 `terminate()` 方法。

Service Worker 支持以下事件处理程序：
- `onstatechange`：可以分配一个事件处理程序，每当 Service Worker 发出 statechange 事件时都会调用该处理程序。当 `ServiceWorker.state` 更改时发生此事件。此事件也可以使用 `serviceWorker.addEventListener('statechange', handler)` 来处理。

Service Worker 支持以下属性：
- `scriptURL`：用于注册服务worker的已解析 URL。例如，如果服务worker是使用相对路径 `"./serviceWorker.js"` 创建的，那么如果它是在 `https://www.example.com` 上注册的，则 `scriptURL` 属性将返回 `https://www.example.com/serviceWorker.js`。
- `state`：返回标识服务worker状态的字符串。可能的状态如下：
  - `installing`
  - `installed`
  - `activating`
  - `activated`
  - `redundant`

#### 服务worker安全限制

作为一类 Web Worker，服务worker在加载脚本的源匹配方面受到正常限制（有关详细信息，请参阅本章前面的“worker 安全限制”部分）。此外，由于服务worker被授予几乎无限的权力来修改和重定向网络请求和加载的静态资源，因此服务workerAPI 仅在安全的 HTTPS 环境中可用；在 HTTP 环境中，`navigator.serviceWorker` 将是未定义的。为了便于开发，浏览器对通过 `localhost` 或 `127.0.0.1` 本地加载的页面的安全环境规则进行了豁免。注意：用于评估当前环境是否安全的一个方便的工具是 `window.isSecureContext`。

#### ServiceWorkerGlobalScope

在服务worker内部，全局作用域是 ServiceWorkerGlobalScope 的一个实例。它继承自 WorkerGlobalScope，因此包括其所有属性和方法。服务worker可以通过 `self` 访问这个全局作用域。

ServiceWorkerGlobalScope 使用以下属性和方法扩展了 WorkerGlobalScope：
- `caches`：返回服务worker的 CacheStorage 对象。
- `clients`：返回服务worker的 Clients 接口，用于访问底层 Client 对象。
- `registration`：返回服务worker的 ServiceWorkerRegistration 对象。
- `skipWaiting()`：强制服务worker进入活动状态。这与 `Clients.claim()` 结合使用。
- `fetch()`：从服务worker内部执行正常的 fetch。当服务worker确定应该发出实际的传出网络请求（而不是返回缓存值）时使用。

专用或共享 worker 只有一个 `message` 事件作为输入，而服务worker能够使用大量事件，这些事件由页面上的操作、通知操作或推送事件触发。注意：根据浏览器的实现，可能不会在默认浏览器控制台视图中打印 Shared Worker 内部控制台的日志。

服务worker的全局作用域可以侦听以下事件，这里按类别细分：
- 服务worker状态：
  - 当服务worker进入 `installing` 状态（在客户端通过 `ServiceWorkerRegistration.installing` 可见）时会触发 `install` 事件。还可以在 `self.oninstall` 上为此事件设置处理程序。这是服务worker收到的第一个事件，并在 Worker 执行开始后立即触发。每个服务worker只调用一次。
  - 当服务worker进入 `activating` 或 `activated` 状态（在客户端通过 `ServiceWorkerRegistration.active` 可见）时会触发 `activate` 事件。还可以在 `self.onactivate` 上为此事件设置处理程序。当服务worker准备好处理功能事件和控制客户端时会触发此事件。此事件并不意味着服务worker正在控制客户端，只是它已准备好这样做。
- Fetch API：
  - 当服务worker拦截主页面中调用的 `fetch()` 时，会触发 `fetch` 事件。服务worker的 `fetch` 事件处理程序可以访问 `FetchEvent` 并可以根据需要调整结果。还可以在 `self.onfetch` 上为此事件设置处理程序。
- 消息 API：
  - 当服务worker通过 `postMessage()` 接收数据时会触发 `message` 事件。还可以在 `self.onmessage` 上为此事件设置处理程序。
- 通知 API：
  - 当系统向浏览器报告 `ServiceWorkerRegistration.showNotification()` 产生的通知被点击时，会触发 `notificationclick` 事件。还可以在 `self.onnotificationclick` 上为此事件设置处理程序。
  - 当系统向浏览器报告 `ServiceWorkerRegistration.showNotification()` 产生的通知已关闭或解除时，会触发 `notificationclose` 事件。还可以在 `self.onnotificationclose` 上为此事件设置处理程序。
- 推送 API：
  - 当服务worker收到推送消息时会触发 `push` 事件。还可以在 `self.onpush` 上为此事件设置处理程序。
  - 当推送订阅状态发生变化而发生在应用程序控制之外（未在 JavaScript 中明确显示）时会触发 `pushsubscriptionchange` 事件。还可以在 `self.onpushsubscriptionchange` 上为此事件设置处理程序。

注意：某些浏览器还支持 `sync` 事件，它是后台 Sync API 的一部分。此 API 未标准化，目前仅在 Chrome 和 Opera 上受支持。

### 服务worker的作用域限制

服务工作者（Service Worker）只会拦截来自其作用域内的客户端请求。作用域是相对于服务工作者脚本提供的路径定义的。如果未在 register() 中指定作用域，那么作用域将成为服务工作者脚本所在的路径。（为避免路径混淆，这些示例中的所有服务工作者注册都使用脚本的绝对 URL。）下面是几个示例：

第一个示例演示了从根路径提供的工作者脚本的默认根作用域：

```javascript
navigator.serviceWorker.register('/serviceWorker.js')
.then((serviceWorkerRegistration) => {
  console.log(serviceWorkerRegistration.scope);
  // https://example.com/
});
// 所有以下请求都会被拦截：
// fetch('/foo.js');
// fetch('/foo/fooScript.js');
// fetch('/baz/bazScript.js');
```

以下示例演示了从根路径提供工作者脚本的相同目录的作用域：

```javascript
navigator.serviceWorker.register('/serviceWorker.js', {
  scope: './'
})
.then((serviceWorkerRegistration) => {
  console.log(serviceWorkerRegistration.scope);
  // https://example.com/
});
// 所有以下请求都会被拦截：
// fetch('/foo.js');
// fetch('/foo/fooScript.js');
// fetch('/baz/bazScript.js');
```

以下示例演示了从根路径提供工作者脚本的受限作用域：

```javascript
navigator.serviceWorker.register('/serviceWorker.js', {
  scope: './foo'
})
.then((serviceWorkerRegistration) => {
  console.log(serviceWorkerRegistration.scope);
  // https://example.com/foo/
});
// 所有以下请求都会被拦截：
// fetch('/foo/fooScript.js');
// 所有以下请求都不会被拦截：
// fetch('/foo.js');
// fetch('/baz/bazScript.js');
```

以下示例演示了从嵌套路径提供工作者脚本的相同目录的作用域：

```javascript
navigator.serviceWorker.register('/foo/serviceWorker.js')
.then((serviceWorkerRegistration) => {
  console.log(serviceWorkerRegistration.scope);
  // https://example.com/foo/
});
// 所有以下请求都会被拦截：
// fetch('/foo/fooScript.js');
// 所有以下请求都不会被拦截：
// fetch('/foo.js');
// fetch('/baz/bazScript.js');
```

服务工作者的作用域有效地遵循目录权限模型，因为它只能相对于提供文件的位置减少服务工作者的作用域。尝试扩展作用域会导致错误：

```javascript
navigator.serviceWorker.register('/foo/serviceWorker.js', {scope: '/'});
// 错误：提供的作用域路径 'https://example.com/' 不在允许的最大作用域 'https://example.com/foo/' 内。
```

通常情况下，服务工作者的作用域会被定义为带有斜杠的绝对路径，如下所示：

```javascript
navigator.serviceWorker.register('/serviceWorker.js', {scope: '/foo/'})
```

这种风格的作用域路径定义完成了两个任务：它将脚本文件的相对路径与相对作用域路径解耦，并防止路径本身被包含在作用域中。例如，在前面的代码片段中，将 '/foo' 路径包含在服务工作者作用域内可能是不可取的；附加尾随斜杠将明确排除 '/foo' 路径。当然，这要求绝对作用域路径不能扩展到服务工作者路径之外。

如果您希望扩展服务工作者的作用域，有两种主要方法：

1. 从包含所需作用域的路径提供服务工作者脚本。
2. 将 "Service-Worker-Allowed" 头添加到服务工作者脚本响应中，并将其值设置为所需的作用域。此作用域值应与 register() 中的作用域值匹配。

### 服务工作器缓存

在服务工作器出现之前，网页缺乏用于缓存网络请求的强大机制。浏览器一直使用HTTP缓存，但它在JavaScript内部没有可用的编程接口，其行为在JavaScript运行时之外进行管理。可以开发一种临时缓存机制来缓存响应字符串或 blob，但这种策略很混乱且效率低下。

之前已经尝试过JavaScript缓存实现。MDN 文档奇妙地描述了它：
之前的尝试——AppCache——似乎是个好主意，因为它允许你非常轻松地指定要缓存的资源。然而，它对你想要做的事情做了很多假设，然后当你的应用程序没有完全遵循这些假设时就会崩溃。

服务工作器的主要特性之一是真正的网络请求缓存机制，可以以编程方式进行管理。与 HTTP 缓存或 CPU 缓存不同，服务工作器缓存相当原始：

- 服务工作器缓存不会自动缓存任何请求。必须明确添加所有缓存条目。
- 服务工作器缓存没有基于时间的过期概念。除非明确删除，否则缓存条目将保持缓存状态。
- 必须手动更新和删除服务工作器缓存条目。
- 缓存必须手动版本控制。每次服务工作器更新时，新的服务工作器负责提供一个新的缓存键来存储新的缓存条目。
- 唯一由浏览器强制执行的驱逐策略基于可供服务工作器缓存使用的存储空间。服务工作器负责管理其缓存使用的空间量。当缓存的大小超过浏览器限制时，浏览器将利用最近最少使用 (LRU) 驱逐策略为新的缓存条目腾出空间。

服务工作器缓存机制的核心是一个两层字典，其中顶层字典中的每个条目都映射到第二个嵌套字典。顶层字典是 CacheStorage 对象，它可以通过 caches 属性在服务工作器的全局作用域内使用。这个顶层字典中的每个值都是一个 Cache 对象，它是一个 Request 对象到 Response 对象映射的字典。

与 LocalStorage 一样，CacheStorage 中的 Cache 对象会无限期地持续存在，并且会在浏览器会话结束后继续存在。此外，缓存条目只能在每个源的基础上访问。

注意：尽管 CacheStorage 和 Cache 对象是在服务工作器规范中定义的，但它们可以被主页或其他类型的 Web Worker 使用。

#### CacheStorage 对象

CacheStorage 对象是字符串键到 Cache 对象映射的键值对存储。CacheStorage 对象具有类似于异步 Map 的 API。CacheStorage 接口可通过全局对象上的 caches 属性使用：

```javascript
console.log(caches); // CacheStorage {}
```

CacheStorage 中的各个缓存通过将它们的字符串键传递给 caches.open() 来获取。非字符串键被转换为字符串。如果缓存尚不存在，则会创建它。

Cache 对象在 promise 中返回：

```javascript
caches.open('v1').then(console.log);
// Cache {}
```

方法：
与 Map 类似，CacheStorage 具有 has()、delete() 和 keys() 方法。这些方法都类似于 Map 中基于 promise 的用法。

```javascript
// open a new v1 cache,
// check for the v1 cache,
// check for the nonexistent v2 cache
caches.open('v1')
.then(() => caches.has('v1'))
.then(console.log) // true
.then(() => caches.has('v2'))
.then(console.log); // false
```

```javascript
// open a new v1 cache,
// check for the v1 cache,
// delete the v1 cache,
// check again for the deleted v1 cache
caches.open('v1')
.then(() => caches.has('v1'))
.then(console.log) // true
.then(() => caches.delete('v1'))
.then(() => caches.has('v1'))
.then(console.log); // false
```

```javascript
// open a v1, v3, and v2 cache
// check keys of current caches
// NOTE: cache keys are printed in creation order
caches.open('v1')
.then(() => caches.open('v3'))
.then(() => caches.open('v2'))
.then(() => caches.keys())
.then(console.log); // ["v1", "v3", "v2"]
```

CacheStorage 接口还具有 match() 方法，可用于在 CacheStorage 中的所有 Cache 对象中检查 Request 对象。Cache 对象以 CacheStorage.keys() 的顺序检查，返回第一个匹配的响应：

```javascript
// Create one request key and two response values
const request = new Request('');
const response1 = new Response('v1');
const response2 = new Response('v2');
// Use same key in both caches. v1 is found first since it has
// caches.keys() order priority
caches.open('v1')
.then((v1cache) => v1cache.put(request, response1))
.then(() => caches.open('v2'))
.then((v2cache) => v2cache.put(request, response2))
.then(() => caches.match(request))
.then((response) => response.text())
.then(console.log); // v1
```

CacheStorage.match() 可以使用 options 对象进行配置。

#### Cache对象

CacheStorage将字符串映射到Cache对象。Cache对象的行为类似于CacheStorage，因为它们也类似于异步Map。Cache键可以是URL字符串或Request对象；这些键将映射到Response对象值。

Service Worker缓存旨在仅缓存GET HTTP请求。这是有道理的：这个HTTP方法意味着响应不会随着时间的推移而改变。另一方面，默认情况下，Cache不允许使用POST、PUT和DELETE等请求方法。它们意味着与服务器的动态交互，因此不适合由客户端缓存。

要填充缓存，可以使用三种方法：

- `put(request, response)`: 当已经拥有键（Request对象或URL字符串）值（Response对象）对并希望添加缓存条目时使用。此方法返回一个promise，在成功添加缓存条目时解析。

- `add(request)`: 当只有一个Request对象或URL时使用。`add()`将向网络发送一个`fetch()`请求并缓存响应。此方法返回一个promise，在成功添加缓存条目时解析。

- `addAll(requests)`: 当希望对缓存执行全有或全无（all-or-nothing）的批量添加时使用。例如，服务Worker初始化时缓存的初始填充。该方法接受一组URL或Request对象。`addAll()`对数组中的每个条目执行`add()`操作。此方法返回一个promise，在成功添加每一个缓存条目时解析。

与Map类似，Cache具有`delete()`和`keys()`方法。这些方法都类似于基于promise的Map方法：

```javascript
const request1 = new Request('https://www.foo.com');
const response1 = new Response('fooResponse');
caches.open('v1')
  .then((cache) => {
    cache.put(request1, response1)
      .then(() => cache.keys())
      .then(console.log) // [Request]
      .then(() => cache.delete(request1))
      .then(() => cache.keys())
      .then(console.log); // []
  });
```

要检查Cache，可以使用两种方法：

- `matchAll(request, options)`: 返回一个promise，它解析为匹配的缓存Response对象的数组。这在希望对组织良好的缓存条目执行批量操作的情况下很有用，例如删除/images目录中的所有缓存值。请求匹配模式可以通过options对象进行配置。

- `match(request, options)`: 返回一个promise，它解析为匹配的缓存Response对象，如果没有缓存命中则为undefined。这本质上等同于`matchAll(request, options)[0]`。请求匹配模式可以通过options对象进行配置。

缓存命中由匹配的URL字符串或请求URL确定。URL字符串和Request对象可以互换，因为匹配是通过提取Request对象的URL来确定的。下面是一个示例，展示了这种可互换性：

```javascript
const request1 = 'https://www.foo.com';
const request2 = new Request('https://www.bar.com');
const response1 = new Response('fooResponse');
const response2 = new Response('barResponse');
caches.open('v1').then((cache) => {
  cache.put(request1, response1)
    .then(() => cache.put(request2, response2))
    .then(() => cache.match(new Request('https://www.foo.com')))
    .then((response) => response.text())
    .then(console.log) // fooResponse
    .then(() => cache.match('https://www.bar.com'))
    .then((response) => response.text())
    .then(console.log); // barResponse
});
```

Cache对象利用Request和Response对象的`clone()`方法来创建重复项并将它们存储为键值对。下面是一个示例，其中获取到的实例与原始键值对不匹配：

```javascript
const request1 = new Request('https://www.foo.com');
const response1 = new Response('fooResponse');
caches.open('v1')
  .then((cache) => {
    cache.put(request1, response1)
      .then(() => cache.keys())
      .then((keys) => console.log(keys[0] === request1)) // false
      .then(() => cache.match(request1))
      .then((response) => console.log(response === response1)); // false
  });
```

`Cache.match()`、`Cache.matchAll()`和`CacheStorage.matchAll()`都支持可选的options对象，它允许通过设置以下属性来配置URL匹配的行为方式：

- `cacheName`: 仅`CacheStorage.matchAll()`支持。当设置为字符串时，它只会匹配由提供的字符串为键的Cache中的缓存值。

- `ignoreSearch`: 设置为true时，指示URL匹配器忽略请求查询和缓存键中的查询字符串。例如，https://example.com?foo=bar和https://example.com将匹配。

- `ignoreMethod`: 设置为true时，指示URL匹配器忽略请求查询的HTTP方法。考虑以下示例，其中POST请求可以与GET匹配：

```javascript
const request1 = new Request('https://www.foo.com');
const response1 = new Response('fooResponse');
const postRequest1 = new Request('https://www.foo.com', {
  method: 'POST'
});
caches.open('v1')
  .then((cache) => {
    cache.put(request1, response1)
      .then(() => cache.match(postRequest1))
      .then(console.log) // undefined
      .then(() => cache.match(postRequest1, {
        ignoreMethod: true
      }))
      .then(console.log); // Response {}
  });
```

- `ignoreVary`: 缓存匹配器涉及Vary HTTP头，它指定哪些请求头可能导致服务器做出不同响应。当`ignoreVary`设置为true时，这会指示URL匹配器在匹配时忽略Vary头：

```javascript
const request1 = new Request('https://www.foo.com');
const response1 = new Response('fooResponse', {
  headers: {
    'Vary': 'Accept'
  }
});
const acceptRequest1 = new Request('https://www.foo.com', {
  headers: {
    'Accept': 'text/json'
  }
});
caches.open('v1')
  .then((cache) => {
    cache.put(request1, response1)
      .then(() => cache.match(acceptRequest1))
      .then(console.log) // undefined
      .then(() => cache.match(acceptRequest1, {
        ignoreVary: true
      }))
      .then(console.log); // Response {}
  });
```

#### 最大缓存存储

浏览器需要限制任何给定缓存允许使用的存储量；否则，无限存储肯定会被滥用。此存储限制不遵循任何正式规范；它完全取决于各个浏览器供应商的偏好。

使用StorageEstimate API，可以确定大约有多少可用空间（以字节为单位）以及当前使用了多少空间。此方法仅在安全浏览器环境中可用：

```javascript
navigator.storage.estimate()
  .then(console.log);
// 输出将因浏览器而异：
// { quota: 2147483648, usage: 590845 }
```

根据Service Worker规范：

这些不是确切的数字；出于安全原因，在压缩、重复数据删除和模糊之间，它们将不准确。

### 服务工作器客户端

服务工作器（Service Worker）是用于跟踪与客户端对象相关联的窗口、工作器或服务工作器的一种特殊类型的工作器。服务工作器可以通过 Clients 接口访问这些客户端对象，而 self.clients 属性则可在全局对象中使用。

客户端对象具有以下属性和方法：
- id：返回此客户端的唯一标识符，例如 7e4248ec-b25e-4b33-b15f-4af8bb0a3ac4。可通过 Clients.get() 方法使用此标识符获取对客户端的引用。
- type：以字符串形式返回客户端的类型。可能的值为 window、worker 或 sharedworker。
- url：返回客户端的 URL。
- postMessage()：允许向单个客户端发送有针对性的消息。

Clients 接口允许通过 get() 和 matchAll() 方法访问客户端对象，这两个方法都返回一个 Promise 对象。matchAll() 方法还可以传递一个 options 对象，该对象支持以下属性：
- includeUncontrolled：设置为 true 时，返回尚未由该服务工作器控制的客户端。默认为 false。
- type：当设置为 window、worker 或 sharedworker 时，将返回仅指定类型的客户端。默认为 all，返回所有类型的客户端。

Clients 接口还提供了两个方法：
- openWindow(url)：允许在指定的 URL 上打开一个新窗口，从而有效地向该服务工作器添加一个新客户端。新的 Client 对象将在 Promise 解析后返回。此方法在处理通知的点击事件时非常有用，服务工作器可以检测到点击事件并打开一个窗口以响应该事件。
- claim()：将强制设置此服务工作器以控制其作用域内的所有客户端。这在不希望等待服务工作器开始管理页面时重新加载页面的情况下非常有用。

### 服务工作器和一致性

要理解服务工作器的总体预期目的，需要将其视为使网页能够模拟原生应用程序行为的一种机制。服务工作器的行为应该像原生应用程序一样，并支持版本控制。

服务工作器的版本控制可确保同一源的两个网页在任何给定时间点的运行方式保持一致。这种一致性保证有两种主要形式：
1. 代码一致性：网页不是像原生应用程序那样从单个二进制文件创建，而是由许多 HTML、CSS、JavaScript、图像、JSON 以及可能加载的其他文件资源组成。网页通常会通过增量升级（版本）来添加或修改功能。如果一个网页总共加载了 100 个文件，并且这些文件是版本 1 和版本 2 的混合，那么其行为将是完全不可预测的，可能是不正确的。服务工作器提供了一种强制机制，以确保同一源上所有并发运行的页面始终是基于相同版本的资源构建的。
2. 数据一致性：网页不是封闭的应用程序，它们可以通过 LocalStorage 或 IndexedDB 等浏览器 API 在本地设备上读写数据，还可以与远程 API 进行数据的发送和接收。不同版本的网页可能使用不同的数据格式进行读取或写入。如果一个页面以版本 1 的格式写入数据，但另一个页面尝试以版本 2 的格式读取数据，那么其行为将是完全不可预测的，可能是不正确的。服务工作器的资源一致性机制还确保对同一源上所有并发运行的页面进行 I/O 时具有相同的行为。

为了保持一致性，服务工作器的生命周期会尽力避免达到可能危及一致性的状态。例如：
- 服务工作器的过早失败：在尝试安装服务工作器时，任何意外问题都会阻止服务工作器的安装。这包括无法加载服务工作器脚本、服务工作器脚本中的语法或运行时错误、无法通过 importScripts() 加载工作器依赖项，甚至无法加载单个缓存资源。
- 服务工作器的积极更新：当浏览器再次加载服务工作器脚本（通过手动调用 register() 或页面重新加载）时，如果服务工作器脚本或通过 importScripts() 加载的任何依赖项之间只存在一个字节的差异，浏览器将开始安装新的服务工作器版本。
- 未激活的服务工作器被动激活：当第一次在页面上调用 register() 时，服务工作器将被安装，但不会立即激活和开始控制页面，而是在导航事件之后才会激活。这是因为当前页面可能已经加载了资源，因此不应立即激活服务工作器并开始加载不一致的资源。
- 激活的服务工作器具有粘性：只要有一个客户端与活动的服务工作器相关联，浏览器就会继续在该源的所有页面上使用它。浏览器可以开始安装一个新的服务工作器实例来替换激活的工作器，但直到激活的工作器控制的客户端数量为 0（或者直到服务工作器被强制更新），浏览器不会切换到新的工作器。这种服务工作器的驱逐策略可以防止同一源上同时运行两个不同版本的服务工作器。

### 了解服务 worker的生命周期

服务 worker规范定义了服务 worker可能存在的六个离散状态：parsed、installing、installed、activating、activated和redundant。服务 worker的完整生命周期将始终按此顺序访问这些状态，尽管它可能不会访问每个状态。在安装或激活过程中遇到错误的服务 worker将跳到redundant状态。

每个状态更改都会在ServiceWorker对象上触发statechange事件。可以设置处理程序来侦听此事件，如下所示:

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
.then((registration) => {
  registration.installing.onstatechange = ({target: {state}}) => {
    console.log('state changed to', state);
  };
});
```

#### parsed状态

对navigator.serviceWorker.register()的调用将启动创建服务 worker实例的进程。parsed状态被分配给新创建的服务 worker。此状态没有与之关联的事件或ServiceWorker.state值。

注意: 尽管parsed是服务 worker规范中正式定义的状态，但ServiceWorker.prototype.state永远不会返回parsed。该属性可以返回的最早状态是installing。

浏览器获取脚本文件并执行一些初始任务以开始生命周期:

1. 确保服务 worker在同一个域上服务。
2. 确保服务 worker在安全环境中注册。
3. 确保服务 worker脚本可以被浏览器的JavaScript解释器成功解析而不会抛出任何错误。
4. 捕获服务 worker脚本的快照。下次浏览器下载服务 worker脚本时，它会将它与此快照进行比较，并使用它来决定是否应该更新服务 worker。

如果所有这些都成功，从register()返回的promise将解决为ServiceWorkerRegistration对象，并且新创建的服务 worker实例将进入installing状态。

#### installing状态

installing状态是所有服务 worker应该执行“设置”任务的地方。这包括在服务 worker控制页面之前的工作。

在客户端，可以通过检查ServiceWorkerRegistration.installing属性是否设置到ServiceWorker实例来识别此阶段:

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
.then((registration) => {
  if (registration.installing) {
    console.log('Service worker is in the installing state');
  }
});
```

每当服务 worker达到此状态时，关联的ServiceWorkerRegistration对象也会触发updatefound事件:

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
.then((registration) => {
  registration.onupdatefound = () => console.log('Service worker is in the installing state');
});
```

在服务 worker中，可以通过为install事件设置处理程序来识别此阶段:

```javascript
self.oninstall = (installEvent) => {
  console.log('Service worker is in the installing state');
};
```

installing状态经常用于填充服务 worker的缓存。可以指示服务 worker保持在安装状态，直到成功缓存一组资源。如果任何资源缓存失败，服务 worker将无法完成安装并被发送到redundant状态。

服务 worker可以通过ExtendableEvent保持在installing状态。InstallEvent继承自ExtendableEvent，因此公开了一个API，它允许延迟状态转换，直到promise解决。这是通过ExtendableEvent.waitUntil()方法完成的。此方法期望传递一个promise，该promise将延迟转换到下一个状态，直到该promise解决为止。例如，以下示例会将转换到installed状态的时间延迟5秒:

```javascript
self.oninstall = (installEvent) => {
  installEvent.waitUntil(
    new Promise((resolve, reject) => setTimeout(resolve, 5000))
  );
};
```

一种更实用的用法是通过Cache.addAll()缓存一组资源:

```javascript
const CACHE_KEY = 'v1';
self.oninstall = (installEvent) => {
  installEvent.waitUntil(
    caches.open(CACHE_KEY)
    .then((cache) => cache.addAll([
      'foo.js',
      'bar.html',
      'baz.css',
    ]))
  );
};
```

如果没有抛出错误或promise变为拒绝，服务 worker将进入installed状态。

#### Installed状态

installed状态，也称为waiting状态，表示服务 worker没有额外的设置任务要执行，并且一旦被允许，它就准备好接管客户端。如果没有活动的服务 worker，新安装的服务 worker将跳过此状态并直接进入activating状态，因为没有理由等待。

在客户端，可以通过检查ServiceWorkerRegistration.waiting属性是否设置为ServiceWorker实例来识别此阶段:

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
.then((registration) => {
  if (registration.waiting) {
    console.log('Service worker is in the installing/waiting state');
  }
});
```

如果已经有一个激活的服务 worker，installed状态可以是触发逻辑的适当时间，这将推动这个新的服务 worker到activating状态。这可以通过self.skipWaiting()强行提升此服务 worker。它也可能采取提示用户重新加载应用程序的形式，从而允许浏览器有组织地提升服务 worker。

#### activating状态

以下是经过校对的内容：

```
activating 状态表示服务worker已被浏览器选中成为应该控制页面的服务 worker。如果浏览器中没有现任激活的服务 worker，这个新的服务worker将自动进入 activating 状态。但是，如果存在现任激活的服务 worker，则这个新的替代服务worker可以通过以下方式达到 activating 状态：

- 由现任服务worker控制的客户端数量变为 0。这通常采用关闭所有受控浏览器选项卡的形式。在下一个导航事件中，新的服务worker将达到 activating 状态。
- 已安装的服务worker调用 self.skipWaiting()。这会立即生效，不需要等待导航事件。

在处于 activating 状态时，没有函数事件如 fetch 或 push 发送，直到服务worker到达 activated 状态。

在客户端，这个阶段可以通过检查 ServiceWorkerRegistration.active 属性是否设置为 ServiceWorker 来识别：

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
.then((registration) => {
  if (registration.active) {
    console.log('Service worker is in the activating/activated state');
  }
});
```

请注意，`ServiceWorkerRegistration.active` 属性表示服务工作者处于 activating 或 activated 状态。

在服务worker中，可以通过为 activate 事件设置处理程序来识别此阶段：

```javascript
self.oninstall = (activateEvent) => {
  console.log('Service worker is in the activating state');
};
```

activate 事件表示在旧的服务worker之后清理是安全的，这个事件经常用于清除旧的缓存数据和迁移数据库。例如，以下示例清除所有较旧的缓存版本：

```javascript
const CACHE_KEY = 'v3';
self.oninstall = (activateEvent) => {
  caches.keys()
  .then((keys) => keys.filter((key) => key != CACHE_KEY))
  .then((oldKeys) => oldKeys.forEach((oldKey) => caches.delete(oldKey)));
};
```

activate 事件也继承自 ExtendableEvent，因此也支持 waitUntil() 约定，用于延迟到 activated 状态的转换，或者在 promise 拒绝时转换到 redundant 状态。

注意：服务worker中的 active 事件并不意味着该服务worker正在控制客户端。

#### activated状态

activated 状态表示服务worker控制着一个或多个客户端。在这种状态下，服务worker将捕获其范围内的 fetch() 事件以及通知和推送事件。

在客户端，这个阶段可以通过检查 ServiceWorkerRegistration.active 属性是否设置为 ServiceWorker 实例来识别：

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
.then((registration) => {
  if (registration.active) {
    console.log('Service worker is in the activating/activated state');
  }
});
```

请注意，ServiceWorkerRegistration.active 属性表示服务worker处于 activating 或 activated 状态。服务worker处于激活状态的一个更好的指示是检查 ServiceWorkerRegistration 的 controller 属性。这将返回控制页面的激活的 ServiceWorker 实例：

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
.then((registration) => {
  if (registration.controller) {
    console.log('Service worker is in the activated state');
  }
});
```

当一个新的服务worker控制一个客户端时，该客户端中的 ServiceWorkerContainer 将触发一个 controllerchange 事件：

```javascript
navigator.serviceWorker.oncontrollerchange = () => {
  console.log('A new service worker is controlling this client');
};
```

也可以使用 ServiceWorkerContainer.ready promise 来检测激活的服务 worker。一旦当前页面有一个激活的服务 worker，这个 ready promise 就会解决：

```javascript
navigator.serviceWorker.ready.then(() => {
  console.log('A new service worker is controlling this client');
});
```

#### redundant 状态

redundant 状态是服务worker的墓地。不会有任何事件传递给它，浏览器可以自由地销毁它并释放其资源。

### 更新服务工作器

由于版本控制的概念已经融入服务工作器，因此期待定期更改它们。服务工作器具有稳健而复杂的更新过程，可以安全地替换过时的激活的服务工作器。

此更新过程从更新检查开始，浏览器会重新请求服务工作器脚本。更新检查可以由以下事件触发：

- 使用与当前激活的服务工作器不同的URL字符串调用`navigator.serviceWorker.register()`。
- 浏览器导航到服务工作器作用域内的页面。
- 发生函数事件，如`fetch`或`push`，但在24小时内未进行更新检查。
- 新获取的服务工作器脚本与现有服务工作器的脚本不同。如果它们不相同，浏览器会使用新脚本初始化一个新的服务工作器。更新后的服务工作器将继续其生命周期，直到达到`installed`状态。一旦达到`installed`状态，更新后的服务工作器将等待浏览器决定它可以安全地获得页面的控制权（或者直到用户强制它控制页面）。

重要的是，刷新页面将不允许更新的服务工作器激活和替换现有服务工作器。考虑这样一个场景，其中打开了一个页面，由一个现有服务工作器控制，一个更新的服务工作器在`installed`状态等待。客户端在页面刷新期间重叠，这意味着新页面在旧页面消失之前加载，因此现有服务工作器永远不会放弃控制，因为它仍然控制非零数量的客户端。因此，关闭所有受控页面是允许替换现有服务工作器的唯一方法。

### 控制反转和服务工作器持久化

专用和共享工作器被设计为有状态的，而服务工作器被设计为无状态的。更具体地说，服务工作器遵循控制反转（IOC，Inversion of Control）模式并构建为事件驱动。

这样做的主要含义是服务工作器不应该依赖于工作器的全局状态。服务工作器中的几乎所有代码都应该在事件处理程序中定义，值得注意的例外是全局常量，如服务工作器版本。服务工作器脚本执行的次数变化很大，并且高度依赖于浏览器状态，因此服务工作器脚本的行为应该是幂等的。

服务工作器的生命周期与它所连接的客户端的生命周期无关，理解这一点很重要。大多数浏览器将服务工作器实现为一个单独的进程，这个进程由浏览器独立管理。如果浏览器检测到服务工作器空闲，它可以终止工作器并在需要时重新启动它。这意味着，虽然可以依赖服务工作器来处理激活的事件，但不能依赖服务工作器持久化全局状态。

### 使用`updateViaCache`管理服务工作器文件缓存

通常，浏览器加载的所有JavaScript资源都受制于浏览器的HTTP缓存，如其`Cache-Control`头所定义。因为服务工作器脚本没有得到优先处理，所以在缓存文件过期之前，浏览器不会收到更新的服务工作器脚本的更新。

为了尽快传播服务工作器更新，一个常见的解决方案是为服务工作器脚本提供`Cache-Control: max-age=0`头。这样，浏览器将始终获取最新的脚本文件。

这种即时到期的解决方案运作良好，但仅依靠HTTP头来指示服务工作器行为意味着只有服务器决定客户端应如何更新。为了允许客户端代理对其更新行为，存在`updateViaCache`属性以允许控制客户端应如何处理服务工作器脚本。这个属性可以在注册服务工作器时定义，它接受三个字符串值：

- `import`：默认值。顶级服务工作器脚本文件永远不会被缓存，但通过`importScripts()`导入服务工作器内部的文件仍将受HTTP缓存和`Cache-Control`头的约束。
- `all`：没有对服务工作器脚本进行特殊处理。所有文件都受制于HTTP缓存和`Cache-Control`头。
- `none`：顶级服务工作器脚本和通过`importScripts()`在服务工作器内部导入的文件都不会被缓存。

`updateViaCache`属性的用法如下：

```javascript
navigator.serviceWorker.register('/serviceWorker.js', { updateViaCache: 'none' });
```

浏览器仍处于支持此选项的过程中，因此强烈建议同时使用`updateViaCache`和`Cache-Control`头来指示客户端上的缓存行为。

### 强制服务工作器操作

在某些情况下，强制服务工作器尽快进入激活状态是有意义的，即使可能导致潜在的资源版本控制冲突。通常在安装事件中使用此方法，以缓存资源并强制激活服务工作器，然后由激活的服务工作器控制相关的客户端。

下面是一个基本的示例版本：

```javascript
const CACHE_KEY = 'v1';

self.oninstall = (installEvent) => {
  // 填充缓存，然后强制服务工作器进入激活状态。这会触发 'activate' 事件。
  installEvent.waitUntil(
    caches.open(CACHE_KEY)
      .then((cache) => cache.addAll([
        'foo.css',
        'bar.js',
      ]))
      .then(() => self.skipWaiting())
  );
};

// 强制服务工作器接管客户端。这会在每个客户端上触发 'controllerchange' 事件。
self.onactivate = (activateEvent) => clients.claim();
```

浏览器会在每个导航事件上检查新的服务工作器脚本，但这种情况并不常见。

ServiceWorkerRegistration 对象具有 `update()` 方法，可用于指示浏览器重新请求服务工作器脚本，将其与现有脚本进行比较，并在必要时开始安装更新的服务工作器。可以按照以下方式完成：

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
  .then((registration) => {
    // 每隔约 17 分钟检查更新一次
    setInterval(() => registration.update(), 1E6);
  });
```

### 服务工作器消息传递

与专用工作器和共享工作器一样，服务工作器可以使用 `postMessage()` 与客户端交换异步消息。其中一种最简单的方法是向激活的工作器发送消息，并使用事件对象发送回复。发送给服务工作器的消息可以在全局范围内处理，而发送回客户端的消息可以在 ServiceWorkerGlobalScope 对象上处理。

 **serviceWorker.js:** 

```javascript
self.onmessage = ({ data, source }) => {
  console.log('service worker heard:', data);
  source.postMessage('bar');
};
```

 **main.js:** 

```javascript
navigator.serviceWorker.onmessage = ({ data }) => {
  console.log('client heard:', data);
};

navigator.serviceWorker.register('./serviceWorker.js')
  .then((registration) => {
    if (registration.active) {
      registration.active.postMessage('foo');
    }
  });
```

输出结果：

```
// service worker heard: foo
// client heard: bar
```

这也可以通过使用 `serviceWorker.controller` 属性来轻松实现：

 **serviceWorker.js:** 

```javascript
self.onmessage = ({ data, source }) => {
  console.log('service worker heard:', data);
  source.postMessage('bar');
};
```

 **main.js:** 

```javascript
navigator.serviceWorker.onmessage = ({ data }) => {
  console.log('client heard:', data);
};

navigator.serviceWorker.register('./serviceWorker.js')
  .then(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('foo');
    }
  });
```

输出结果：

```
// service worker heard: foo
// client heard: bar
```

前面的示例在每次重新加载页面时都会起作用，因为服务工作器会回复来自客户端脚本的新消息。它也适用于每次在新选项卡中打开页面时。

如果服务工作器应该发起消息握手，可以通过以下方式获取对客户端的引用：

 **serviceWorker.js:** 

```javascript
self.onmessage = ({ data }) => {
  console.log('service worker heard:', data);
};

self.onactivate = () => {
  self.clients.matchAll({ includeUncontrolled: true })
    .then((clientMatches) => clientMatches[0].postMessage('foo'));
};
```

 **main.js:** 

```javascript
navigator.serviceWorker.onmessage = ({ data, source }) => {
  console.log('client heard:', data);
  source.postMessage('bar');
};

navigator.serviceWorker.register('./serviceWorker.js')
// client heard: foo
// service worker heard: bar
```

前面的示例只会工作一次，因为每个服务工作器只会触发一次 `activate` 事件。由于客户端和服务工作器可以互相发送消息，因此还可以设置 `MessageChannel` 或 `BroadcastChannel` 来交换消息。

## 拦截fetch事件

服务工作线程最重要的特性之一是它们能够拦截网络请求。在服务工作线程的作用域内，网络请求被注册为fetch事件。这种拦截能力不仅限于fetch()方法，还可以拦截对JavaScript、CSS、图像和HTML的请求，包括主要的HTML文档本身。这些请求可以来自JavaScript，也可以是由标签创建的请求，例如\<script\>、\<link\>或\<img\>标签。这是因为对于模拟离线Web应用程序的服务工作线程来说，它必须能够考虑页面正常运行所需的所有请求资源。

FetchEvent继承自ExtendableEvent。一个有价值的方法，允许服务工作线程决定如何处理fetch事件，是使用event.respondWith()方法。这个方法需要一个promise，它应该解析为一个Response对象。当然，服务工作线程可以决定这个Response对象实际上来自哪里，它可以来自网络、缓存或者是动态创建的。以下部分介绍了在服务工作线程中使用的一些网络/缓存策略。

### 从网络返回

这个策略是简单地将fetch事件传递出去。一个很好的用例可能是任何需要到达服务器的请求，例如POST请求。该策略可以按照以下方式实施：

```javascript
self.onfetch = (fetchEvent) => {
  fetchEvent.respondWith(fetch(fetchEvent.request));
};
```

注意：上述代码仅用于演示如何使用event.respondWith()。如果没有调用event.respondWith()，浏览器会将请求发送到网络。

### 从缓存返回

这个策略是一个简单的缓存检查，例如在安装阶段缓存的资源。

```javascript
self.onfetch = (fetchEvent) => {
  fetchEvent.respondWith(caches.match(fetchEvent.request));
};
```

### 使用缓存回退从网络返回

此策略优先考虑来自网络的最新响应，但仍会在缓存中返回值（如果存在）。一个很好的用例是当应用程序需要尽可能频繁地显示最新信息时，如应用程序处于离线状态但仍希望显示某些内容：

```javascript
self.onfetch = (fetchEvent) => {
  fetchEvent.respondWith(
    fetch(fetchEvent.request)
      .catch(() => caches.match(fetchEvent.request))
  );
};
```

### 使用网络回退从缓存返回

此策略优先考虑可以更快显示的响应，但如果某个值未缓存，它仍会从网络中获取。这是大多数渐进式Web应用程序的高级获取处理策略。

```javascript
self.onfetch = (fetchEvent) => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request)
      .then((response) => response || fetch(fetchEvent.request))
  );
};
```

### 通用回退

应用程序需要考虑缓存和网络都无法生成资源的情况。服务工作线程可以通过在安装时缓存回退资源，并在缓存和网络失败时返回它们来处理这个问题。

```javascript
self.onfetch = (fetchEvent) => {
  fetchEvent.respondWith(
    // Begin with 'Return from cache with network fallback' strategy
    caches.match(fetchEvent.request)
      .then((response) => response || fetch(fetchEvent.request))
      .catch(() => caches.match('/fallback.html'))
  );
};
```

可以扩展catch()子句以支持不同类型的回退，例如占位符图像、虚拟数据等。

注意：Google Developers站点有一篇关于网络/缓存策略的精彩文章：[https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook)。

## 推送通知

为了使Web应用程序能够正确模拟原生应用程序，它必须支持推送通知。这意味着网页必须能够接收来自服务器的推送事件并在设备上显示通知，即使应用程序没有运行。对于传统的网页来说，这是不可能的，但通过添加服务工作线程（Service Worker），现在可以支持这种行为。

要使推送通知在渐进式Web应用程序中工作，需要支持以下四个方面的行为：

1. 服务工作线程必须能够显示通知。
2. 服务工作线程必须能够处理与这些通知的交互。
3. 服务工作线程必须能够订阅服务器发送的推送通知。
4. 服务工作线程必须能够处理推送消息，即使应用程序不在前台或未打开。

### 显示通知

服务工作线程可以通过其注册对象访问Notification API。这是有充分理由的：与服务工作线程相关联的通知也会触发该服务工作线程内部的交互事件。

显示通知需要用户的明确许可。一旦获得权限，可以使用ServiceWorkerRegistration.showNotification()来显示通知，示例如下：

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
  .then((registration) => {
    Notification.requestPermission()
      .then((status) => {
        if (status === 'granted') {
          registration.showNotification('foo');
        }
      });
  });
```

类似地，也可以从服务工作线程内部使用全局registration属性触发通知：

```javascript
self.onactivate = () => self.registration.showNotification('bar');
```

在这些示例中，一旦授予通知权限，就会在浏览器中显示名为"foo"的通知。此通知在视觉上与使用new Notification()生成的通知没有区别。此外，它不需要服务工作线程为其的出现做任何工作。

### 处理通知事件

通过ServiceWorkerRegistration对象创建的通知将向服务工作线程发送notificationclick和notificationclose事件。假设前面示例中的服务工作线程脚本定义如下：

```javascript
self.onnotificationclick = ({ notification }) => {
  console.log('notification click', notification);
};

self.onnotificationclose = ({ notification }) => {
  console.log('notification close', notification);
};
```

在此示例中，服务工作线程注册了与通知的两种类型的交互。NotificationEvent公开了一个notification属性，其中包含生成事件的Notification对象。这些事件处理程序可以决定交互后要执行的操作。通常，单击通知意味着用户希望进入特定视图。在服务工作线程的处理程序中，可以通过clients.openWindow()实现，如下所示：

```javascript
self.onnotificationclick = ({ notification }) => {
  clients.openWindow('https://foo.com');
};
```

### 订阅推送事件

要将推送消息发送给服务工作线程，必须通过服务工作线程的PushManager进行订阅。这将允许服务工作线程在推送事件处理程序中处理推送消息。

可以使用ServiceWorkerRegistration.pushManager完成订阅，示例如下：

```javascript
navigator.serviceWorker.register('./serviceWorker.js')
  .then((registration) => {
    registration.pushManager.subscribe({
      applicationServerKey: key, // derived from server's public key
      userVisibleOnly: true
    });
  });
```

或者，服务工作线程可以使用全局registration属性订阅自己：

```javascript
self.onactivate = () => {
  self.registration.pushManager.subscribe({
    applicationServerKey: key, // derived from server's public key
    userVisibleOnly: true
  });
};
```

### 处理推送事件

订阅后，服务工作线程将在服务器每次推送消息时收到推送事件。可以按如下方式处理这些事件：

```javascript
self.onpush = (pushEvent) => {
  console.log('Service worker was pushed data:', pushEvent.data.text());
};
```

要实现真正的推送通知，此处理程序只需要通过registration对象创建通知。然而，一个行为良好的推送通知需要让产生它的服务工作线程保持足够长的时间来处理它的交互事件。

为了实现这一点，push事件继承自ExtendableEvent。showNotification()返回的promise可以传递给waitUntil()，这将使服务工作线程保持激活状态，直到通知的promise解决。

一个简单的推送通知实现如下：

 **MAIN.JS** 
```javascript
navigator.serviceWorker.register('./serviceWorker.js')
  .then((registration) => {
    // Request permission to show notifications
    Notification.requestPermission()
      .then((status) => {
        if (status === 'granted') {
          // Only subscribe to push messages if notification permission is granted
          registration.pushManager.subscribe({
            applicationServerKey: key, // derived from server's public key
            userVisibleOnly: true
          });
        }
      });
  });
```

 **SERVICEWORKER.JS** 
```javascript
// When a push event is received, display the data as text inside a notification.
self.onpush = (pushEvent) => {
  // Keep the service worker alive until notification promise resolves
  pushEvent.waitUntil(
    self.registration.showNotification(pushEvent.data.text())
  );
};

// When a notification is clicked, open relevant application page
self.onnotificationclick = ({ notification }) => {
  clients.openWindow('https://example.com/clicked-notification');
};
```

