---
permalink: /js/chapter20/
title: 第20章 JavaScript API
createTime: 2024/10/18 16:28:56
---
# 第20章 JavaScript API

>注意：Web API的数量之多令人难以置信（https://developer.mozilla.org/en-US/docs/Web/API）。本章的API覆盖范围仅限于与大多数开发人员相关的、由多个浏览器供应商支持的API，并且在本书的其他地方没有涉及。

## ATOMICS和SharedArrayBuffer

 当多个环境访问SharedArrayBuffer时，同时执行缓冲区上的操作时可能会发生资源竞争（race condition）。Atomics API通过强制缓冲区操作一次只发生一个读写，从而允许多个环境安全地读取和写入单个SharedArrayBuffer。 Atomics API是在ES2017规范中定义的。

 Atomics API在许多方面类似于精简指令集架构(ISA)，这绝非偶然。原子操作的性质排除了操作系统或计算机硬件通常会自动执行的一些优化（例如指令重新排序）。原子操作也使并发内存访问变得不可能，如果应用不当，这显然会减慢程序的执行速度。因此，Atomics API旨在使复杂的多线程JavaScript程序能够从最小但强大的原  子行为集合中构建出来。

## SharedArrayBuffer

 SharedArrayBuffer具有与ArrayBuffer相同的API。主要区别在于，对ArrayBuffer的引用必须在同一执行环境之间传递，而对SharedArrayBuffer的引用可以由任意数量的执行环境同时使用。

 在多个执行环境之间共享内存意味着并发线程操作成为可能。传统的JavaScript操作无法防止并发内存访问导致的资源竞争。以下示例演示了访问相同SharedArrayBuffer的四个专用worker之间的资源竞争：

```js
const workerScript =`
self.onmessage = ({
data
}) => {
const view = new Uint32Array(data);
// Perform 1000000 add operations
for (let i = 0; i < 1E6; ++i) {
// Thread-unsafe add operation introduces race condition
view[0] += 1;
}
self.postMessage(null);
};`;
const workerScriptBlobUrl = URL.createObjectURL(new Blob([workerScript]));
// 创建大小为4的worker池
const workers = [];
for (let i = 0; i < 4; ++i) {
    workers.push(new Worker(workerScriptBlobUrl));
}
//最后一个worker完成时输出最终值
let responseCount = 0;
for (const worker of workers) {
    worker.onmessage = () => {
        if (++responseCount == workers.length) {
            console.log(`Final buffer value: ${view[0]}`);
        }
    };
}
// 初始化SharedArrayBuffer
const sharedArrayBuffer = new SharedArrayBuffer(4);
const view = new Uint32Array(sharedArrayBuffer);
view[0] = 1;
// 发送SharedArrayBuffer给每一个worker
for (const worker of workers) {
    worker.postMessage(sharedArrayBuffer);
}
// (期待结果是4000001. 实际上是:2145106或类似结果)
```

 为了解决这个问题，引入了Atomics API以允许对SharedArrayBuffer进行线程安全的JavaScript操作。

### Atomics基础

 Atomics对象存在于所有全局环境中，它公开了一组用于执行线程安全操作的静态方法。这些方法中的大多数将TypedArray实例（引用SharedArrayBuffer）作为第一个参数，并将相关操作数作为后续参数。

#### Atomic算术和按位方法

 Atomics API提供了一套简单的方法来执行就地修改。在ECMA规范中，这些方法被定义为AtomicReadModifyWrite操作。在幕后，这些方法中的每一个都从SharedArrayBuffer中的一个位置执行读取、算术或按位运算以及对同一位置的写入。这些操作符的原子性意味着这三个操作将按顺序执行，不会被另一个线程中断。

 此处演示了所有算术方法：

```js
// 创建大小为1的缓冲区
let sharedArrayBuffer = new SharedArrayBuffer(1);
// 从缓冲区创建Uint8Array
let typedArray = new Uint8Array(sharedArrayBuffer);
// 所有的ArrayBuffers初始化为0
console.log(typedArray); // Uint8Array[0]
const index = 0;
const increment = 5;
// Atomic在索引0处的值加5
Atomics.add(typedArray, index, increment);
console.log(typedArray); // Uint8Array[5]
// Atomic在索引0处的值减5
Atomics.sub(typedArray, index, increment);
console.log(typedArray); // Uint8Array[0]
```

 按位方法：

```js
let sharedArrayBuffer = new SharedArrayBuffer(1);
let typedArray = new Uint8Array(sharedArrayBuffer);
console.log(typedArray); // Uint8Array[0]
const index = 0;
// Atomic将索引0处的值与0b1111执行“or”运算
Atomics.or(typedArray, index, 0b1111);
console.log(typedArray); // Uint8Array[15]
// Atomic将索引0处的值与0b1111执行“and”运算
Atomics.and(typedArray, index, 0b1100);
console.log(typedArray); // Uint8Array[12]
// Atomic将索引0处的值与0b1111执行“xor”运算
Atomics.xor(typedArray, index, 0b1111);
console.log(typedArray); // Uint8Array[3]
```

 前面的线程不安全示例可以按如下方式更正：

```js
const workerScript =`
self.onmessage = ({
data
}) => {
const view = new Uint32Array(data);
// Perform 1000000 add operations
for (let i = 0; i < 1E6; ++i) {
// Thread-safe add operation
Atomics.add(view, 0, 1);
}
self.postMessage(null);
};`;
const workerScriptBlobUrl = URL.createObjectURL(new Blob([workerScript]));
const workers = [];
for (let i = 0; i < 4; ++i) {
    workers.push(new Worker(workerScriptBlobUrl));
}
let responseCount = 0;
for (const worker of workers) {
    worker.onmessage = () => {
        if (++responseCount == workers.length) {
            console.log(`Final buffer value: ${view[0]}`);
        }
    };
}
const sharedArrayBuffer = new SharedArrayBuffer(4);
const view = new Uint32Array(sharedArrayBuffer);
view[0] = 1;
for (const worker of workers) {
    worker.postMessage(sharedArrayBuffer);
}
// (期待结果:4000001,与实际相符)
```
### Atomic读写

 浏览器的JavaScript编译器和CPU架构本身都被授予重新排序指令的许可，如果它们检测到指令会增加程序执行的整体吞吐量的话。通常，JavaScript的单线程特性意味着应该张开双臂欢迎这种优化。然而，跨多个线程的指令重新排序会产生极难调试的资源竞争。

 Atomics API通过两种主要方式解决了这个问题：

-  所有Atomics指令都不会相互重新排序。

-  使用Atomic读或Atomic写保证所有指令（Atomic和非Atomic）永远不会相对于Atomic读/写重新排序。这意味着Atomic读/写之前的所有指令都会在Atomic读/写发生之前完成，而Atomic读/写之后的所有指令都不会开始，直到Atomic读/写完成。


 除了在缓冲区中读取和写入值之外，Atomics.load()和Atomics.store()表现为“code fences”。JavaScript引擎保证，尽管非原子指令可以相对于load()或store()在本地重新排序，但重新排序永远不会违反原子读/写边界：

```js
const sharedArrayBuffer = new SharedArrayBuffer(4);
const view = new Uint32Array(sharedArrayBuffer);
// Perform non-Atomic write
view[0] = 1;
// Non-Atomic write is guaranteed to occur before this read,
// so this is guaranteed to read 1
console.log(Atomics.load(view, 0)); // 1
// Perform Atomic write
Atomics.store(view, 0, 2);
// Non-Atomic read is guaranteed to occur after Atomic write,
// so this is guaranteed to read 2
console.log(view[0]); // 2
```



### Atomic交换

 Atomics API提供了两种类型的方法来保证连续和不间断的读写：exchange()和compareExchange()。Atomics.exchange()执行一个简单的交换，保证没有其他线程会中断值交换：

```js
const sharedArrayBuffer = new SharedArrayBuffer(4);
const view = new Uint32Array(sharedArrayBuffer);
// Write 3 to 0-index
Atomics.store(view, 0, 3);
// Read value out of 0-index and then write 4 to 0-index
console.log(Atomics.exchange(view, 0, 4)); // 3
// Read value at 0-index
console.log(Atomics.load(view, 0)); // 4
```

 多线程程序中的一个线程可能希望仅当另一个线程自上次读取以来没有修改特定值时才对共享缓冲区执行写入操作。如果值没有改变，它可以安全地写入更新值。如果该值已更改，则执行写入将践踏由另一个线程计算的值。对于此任务，Atomics API 具有compareExchange()方法。此方法仅在预期索引处的值与预期值匹配时才执行写入：

```js
const sharedArrayBuffer = new SharedArrayBuffer(4);
const view = new Uint32Array(sharedArrayBuffer);
// Write 5 to 0-index
Atomics.store(view, 0, 5);
// Read the value out of the buffer
let initial = Atomics.load(view, 0);
// Perform a non-atomic operation on that value
let result = initial ** 2;
// Write that value back into the buffer only if the buffer has not changed
Atomics.compareExchange(view, 0, initial, result);
// Check that the write succeeded
console.log(Atomics.load(view, 0)); // 25
```

 如果值不匹配， compareExchange()调用将简单地表现为传递：

```js
const sharedArrayBuffer = new SharedArrayBuffer(4);
const view = new Uint32Array(sharedArrayBuffer);
// Write 5 to 0-index
Atomics.store(view, 0, 5);
// Read the value out of the buffer
let initial = Atomics.load(view, 0);
// Perform a non-atomic operation on that value
let result = initial ** 2;
// Write that value back into the buffer only if the buffer has not changed
Atomics.compareExchange(view, 0, -1, result);
// Check that the write failed
console.log(Atomics.load(view, 0)); // 5
```



### Atomics Futex操作和锁

>Futex由一块能够被多个进程共享的内存空间（一个对齐后的整型变量）组成；这个整型变量的值能够通过汇编语言调用
>CPU提供的原子操作指令来增加或减少，并且一个进程可以等待直到那个值变成正数。Futex的操作几乎全部在应用进程空
>间完成；只有当操作结果不一致从而需要仲裁时，才需要进入操作系统内核空间执行。这种机制允许使用futex的锁定原
>语有非常高的执行效率：由于绝大多数的操作并不需要在多个进程之间进行仲裁，所以绝大多数操作都可以在应用进程空
>间执行，而不需要使用（相对高代价的）内核系统调用。

 如果没有某种锁定结构，多线程程序将无济于事。为了满足这一需求，Atomics API提供了几种以Linuxfutex（快速用户空间互斥体的组合）为模型的方法。这些方法相当初级，但它们旨在用作更复杂的锁定构造 （locking constructs）的基础构建块（building block）。

> 注意:所有Atomics futex操作仅适用于Int32Array view。此外，它们只能在worker内部使用。

Atomics.wait()和Atomics.notify()最好通过示例来理解。以下基本示例生成四个worker以对长度为 1 的Int32Array进行操作。生成的worker将轮流获取锁并执行其add操作：

```js
const workerScript =`
self.onmessage = ({
data
}) => {
const view = new Int32Array(data);
console.log('Waiting to obtain lock');
// Halt when encountering the initial value, timeout at 10000ms
Atomics.wait(view, 0, 0, 1E5);
console.log('Obtained lock');
// Add 1 to data index
Atomics.add(view, 0, 1);
console.log('Releasing lock');
// Allow exactly one worker to continue execution
Atomics.notify(view, 0, 1);
self.postMessage(null);
};`;
const workerScriptBlobUrl = URL.createObjectURL(new Blob([workerScript]));
const workers = [];
for (let i = 0; i < 4; ++i) {
    workers.push(new Worker(workerScriptBlobUrl));
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
const sharedArrayBuffer = new SharedArrayBuffer(8);
const view = new Int32Array(sharedArrayBuffer);
// Send the SharedArrayBuffer to each worker
for (const worker of workers) {
    worker.postMessage(sharedArrayBuffer);
}
// Release first lock in 1000ms
setTimeout(() => Atomics.notify(view, 0, 1), 1000);
// Waiting to obtain lock
// Waiting to obtain lock
// Waiting to obtain lock
// Waiting to obtain lock
// Obtained lock
// Releasing lock
// Obtained lock
// Releasing lock
// Obtained lock
// Releasing lock
// Obtained lock
// Releasing lock
// Final buffer value: 4
```

 因为SharedArrayBuffer初始化为 0 ，所以每个worker都会到达Atomics.wait()并暂停执行。在暂停状态下，执行线程存在于wait queue中，在指定的定时时间过后或在该索引处调用Atomics.notify()之前将一直处于暂停状态。 1000 毫秒后，顶层执行环境将调用Atomics.notify()以准确释放一个等待线程。该线程将完成执行并再次调用Atomics.notify()，释放另一个线程。这一直持续到所有线程都完成了执行并传输它们最终的postMessage()。

 Atomics API还具有Atomics.isLockFree()方法。几乎可以肯定，永远不需要使用此方法，因为它是为高性能算法设计的，用于决定是否需要获取锁。该规范提供了以下描述：

>Atomics.isLockFree() 是一个优化原语(optimization primitive)。直觉是,如果在大小为n字节的数据上执行
>原子原语(compareExchange、load、store、add、sub、and、or、xor 或 exchange)的原子步骤,则调用代理
>不会在外部获取锁包含数据的n个字节,然后是Atomics.isLockFree(n)将返回true。高性能算法将使用
>Atomic.isLockFree来决定是否在临界区使用锁或原子操作。如果原子原语不是无锁的,那么算法提供自己的锁通常更
>有效。Atomics.isLockFree(4)总是返回true,因为所有已知的相关硬件都支持它。能够假设这通常会简化程序。

## 跨环境通信

 跨文档消息传递，有时缩写为XDM（cross-document messaging)，是在不同执行环境（例如 Web worker或来自不同源的页面）之间传递信息的能力。例如，www.wrox.com 上的一个页面想要与p2p.wrox.com上包含在iframe中的一个页面通信，在XDM之前，以安全的方式实现这种通信需要大量的工作。 XDM以一种既安全又易于使用的方式将该功能正式化。

 XDM的核心是postMessage()方法。除了XDM之外，此方法名称还用于HTML5的许多部分，并且始终用于相同的目的：将数据传递到另一个位置。

 postMessage()方法接受三个参数：消息、指示预期收件人源的字符串和可选的可传输对象数组（仅与web worker相关）。出于安全原因，第二个参数非常重要，并限制浏览器将消息传递到何处。如下所示：

```js
let iframeWindow = document.getElementById("myframe").contentWindow;
iframeWindow.postMessage("A secret", "http://www.wrox.com");
```

 最后一行尝试将消息发送到iframe并指定来源必须是“http://www.wrox.com”。如果源匹配，则消息将传递到iframe中；否则，postMessage()会默默地什么都不做。如果窗口的位置在你不知情的情况下发生变化，此限制可以保护你的信息。可以通过将“*”作为第二个参数传递给postMessage()来允许发布到任何源，但不建议这样做。

 当接收到XDM消息时，将在window上触发message事件。此消息是异步触发的，因此在发送消息的时间和在接收窗口中触发message事件的时间之间可能存在延迟。传递给onmessage事件处理程序的event对象具有三个重要的信息：

-  data 作为第一个参数传递给postMessage()的字符串数据。

-  origin 发送消息的文档的来源，例如“http://www.wrox.com”。

-  source 发送消息的文档的window对象的代理。该代理对象主要用于在发送最后一条消息的窗口上执行postMessage()方法。如果发送窗口具有相同的源，则这可能是实际的窗口对象。


 在接收消息时验证发送窗口的来源非常重要。正如为postMessage()指定第二个参数可确保数据不会无意中传递到未知页面一样，在onmessage期间检查来源可确保传递的数据来自正确的位置。基本模式如下：

```js
window.addEventListener("message", (event) => {
    // ensure the sender is expected
    if (event.origin == "http://www.wrox.com") {
        // do something with the data
        processMessage(event.data);
        // optional: send a message back to the original window
        event.source.postMessage("Received!", "http://p2p.wrox.com");
    }
});
```
 请记住，在大多数情况下event.source是窗口的代理，而不是实际的窗口对象，因此无法访问所有窗口信息。最好只使用postMessage()，它始终存在且始终可调用。

 XDM有一些怪癖。首先，postMessage()的第一个参数最初被实现为始终是一个字符串。第一个参数的定义更改为允许传入任何结构化数据；然而，并非所有浏览器都实现了这一改变。因此，使用postMessage()时最好始终传递字符串。如果需要传递结构化数据，那么最好的方法是对数据调用JSON.stringify()，将字符串传递给postMessage()，然后在onmessage事件处理程序中调用JSON.parse()。

 XDM在尝试使用iframe将内容沙箱到不同的域时非常有用。这种方法经常用于混搭和社交网络应用程序。通过XDM与嵌入式iframe通信，包含页面能够保护自身免受恶意内容的侵害。XDM也可以用于来自同一域的页面。

## 编码API

 Encoding API允许在字符串和定型数组之间进行转换。该规范引入了四个用于执行这些转换的全局类：TextEncoder、TextEncoderStream、TextDecoder和TextDecoderStream。

> 对流编码/解码的支持比批量编码/解码要窄得多:
>
> 1. **技术支持和兼容性**：流编码/解码通常指的是实时处理视频流的能力，这要求编解码器能够快速响应并处理连续的数据流。而批量编码/解码则是指对已经存在的视频文件进行编码或解码，这通常可以在没有严格时间限制的情况下进行。由于流编码/解码需要更高的实时性，因此对技术的要求更高，支持的设备和平台可能会更少。
> 2. **应用场景的广泛性**：批量编码/解码由于其非实时的特性，被广泛应用于视频后期处理、存储转换等多种场景。相比之下，流编码/解码主要应用于直播、视频会议等实时传输场景，这些场景的特殊性使得支持流编码/解码的技术和设备相对较少。

### 编码文本

 Encoding API提供了两种将字符串转换为其二进制等效的定型数组的方式：批量编码和流编码。从字符串到定型数组时，编码器将始终使用UTF-8。

#### 批量编码

 批量(bulk)意味着JavaScript引擎将同步编码整个字符串。对于很长的字符串，这可能是一项代价高昂的操作。批量编码是使用TextEncoder的实例完成的：

```js
const textEncoder = new TextEncoder();
```

 此实例公开了一个encode()方法，该方法接受一个字符串并返回包含每个字符的UTF-8编码的新建Uint8Array：

```js
const textEncoder = new TextEncoder();
const decodedText = 'foo';
const encodedText = textEncoder.encode(decodedText);
// f encoded in utf-8 is 0x66 (102 in decimal)
// o encoded in utf-8 is 0x6F (111 in decimal)
console.log(encodedText); // Uint8Array(3) [102, 111, 111]
```

 编码器用于处理字符，这些字符将在最终数组中占用多个索引，例如表情符号：

```js
const textEncoder = new TextEncoder();
const decodedText = '😀';
const encodedText = textEncoder.encode(decodedText);
// 😀encoded in UTF-8 is 0xF0 0x9F 0x98 0x8A (240, 159, 152, 128 in decimal)
console.log(encodedText); // Uint8Array(4) [240, 159, 152, 128]
```
 该实例还公开了一个encodeInto()方法，该方法接受一个字符串和目标Uint8Array。此方法返回一个包含read和written属性的字典，分别指示从源字符串成功读取和写入目标数组的字符数。如果定型数组空间不足，编码将提前终止，字典将指示结果：

```js
const textEncoder = new TextEncoder();
const fooArr = new Uint8Array(3);
const barArr = new Uint8Array(2);
const fooResult = textEncoder.encodeInto('foo', fooArr);
const barResult = textEncoder.encodeInto('bar', barArr);
console.log(fooArr); // Uint8Array(3) [102, 111, 111]
console.log(fooResult); // { read: 3, written: 3 }
console.log(barArr); // Uint8Array(2) [98, 97]
console.log(barResult); // { read: 2, written: 2 }
```

 encode()必须分配一个新的Uint8Array，而encodeInto()则不需要。对于对性能敏感的应用程序，这种区别可能具有重要意义。

>注意:文本编码将始终使用UTF-8格式,并且必须写入Uint8Array实例。在调用encodeInto()时尝试使用不同的定型将
>引发错误。

#### 流编码

 TextEncoderStream只是TransformStream形式的TextEncoder。通过流编码器管道解码文本流将产生编码文本块流：

```js
async function* chars() {
    const decodedText = 'foo';
    for (let char of decodedText) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, char));
    }
}
const decodedTextStream = new ReadableStream({
    async start(controller) {
        for await (let chunk of chars()) {
            controller.enqueue(chunk);
        }
        controller.close();
    }
});
const encodedTextStream = decodedTextStream.pipeThrough(new TextEncoderStream());
const readableStreamDefaultReader = encodedTextStream.getReader();
(async function() {
    while (true) {
        const {
            done,
            value
        } = await readableStreamDefaultReader.read();
        if (done) {
            break;
        } else {
            console.log(value);
        }
    }
})();
// Uint8Array[102]
// Uint8Array[111]
// Uint8Array[111]
```

### 解码文本

 Encoding API提供了两种将定型数组转换为其等效字符串的方式：批量解码和流解码。与编码器类不同，当从定型数组到字符串时，解码器支持大量字符串编码，这里列出：https://encoding.spec.whatwg.org/#names-and-labels。默认字符编码为UTF-8。

#### 批量解码

 批量意味着JavaScript引擎将同步解码整个字符串。对于很长的字符串，这可能是一项代价高昂的操作。使用DecoderEncoder的实例完成批量解码：

```js
const textDecoder = new TextDecoder();
```

 这个实例公开了一个decode()方法，它接受一个定型数组并返回解码后的字符串：

```js
const textDecoder = new TextDecoder();
// f encoded in utf-8 is 0x66 (102 in decimal)
// o encoded in utf-8 is 0x6F (111 in decimal)
const encodedText = Uint8Array.of(102, 111, 111);
const decodedText = textDecoder.decode(encodedText);
console.log(decodedText); // foo
```

 解码器不关心它传递的是哪个定型数组，因此它会尽职尽责地解码整个二进制表示。在此示例中，仅包含8 位字符的 32 位值被解码为UTF-8，从而产生额外的空字符：

```js
const textDecoder = new TextDecoder();
// f encoded in utf-8 is 0x66 (102 in decimal)
// o encoded in utf-8 is 0x6F (111 in decimal)
const encodedText = Uint32Array.of(102, 111, 111);
const decodedText = textDecoder.decode(encodedText);
console.log(decodedText); // "f o o "
```

解码器可以处理定型数组中跨越多个索引的字符，例如表情符号：

```js
const textDecoder = new TextDecoder();
// 😀 encoded in UTF-8 is 0xF0 0x9F 0x98 0x8A (240, 159, 152, 128 in decimal)
const encodedText = Uint8Array.of(240, 159, 152, 128);
const decodedText = textDecoder.decode(encodedText);
console.log(decodedText); //😀
```

 与TextEncoder不同，TextDecoder与多种字符编码兼容。如下所示，它使用UTF-16编码而不是默认的UTF-8：

```js
const textDecoder = new TextDecoder('utf-16');
// f encoded in utf-8 is 0x0066 (102 in decimal)
// o encoded in utf-8 is 0x006F (111 in decimal)
const encodedText = Uint16Array.of(102, 111, 111);
const decodedText = textDecoder.decode(encodedText);
console.log(decodedText); // foo
```
#### 流解码

 TextDecoderStream只是TransformStream形式的TextDecoder。通过流解码器管道编码文本流将产生解码文本块流：

```js
async function* chars() {
    // Each chunk must exist as a typed array
    const encodedText = [102, 111, 111].map((x) => Uint8Array.of(x));
    for (let char of encodedText) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, char));
    }
}
const encodedTextStream = new ReadableStream({
    async start(controller) {
        for await (let chunk of chars()) {
            controller.enqueue(chunk);
        }
        controller.close();
    }
});
const decodedTextStream = encodedTextStream.pipeThrough(new TextDecoderStream());
const readableStreamDefaultReader = decodedTextStream.getReader();
(async function() {
    while (true) {
        const {
            done,
            value
        } = await readableStreamDefaultReader.read();
        if (done) {
            break;
        } else {
            console.log(value);
        }
    }
})();
// f
// o
// o
```

 文本解码器流隐式地理解代理对（surrogate pairs）可以在块之间拆分。解码器流将保留任何碎片块，直到形成一个完整的字符。如下所示，其中流解码器将在解码的流发出单个字符之前等待所有四个块都通过：

```js
async function* chars() {
    // 😀 encoded in UTF-8 is 0xF0 0x9F 0x98 0x8A (240, 159, 152, 128 in decimal)
    const encodedText = [240, 159, 152, 138].map((x) => Uint8Array.of(x));
    for (let char of encodedText) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, char));
    }
}
const encodedTextStream = new ReadableStream({
    async start(controller) {
        for await (let chunk of chars()) {
            controller.enqueue(chunk);
        }
        controller.close();
    }
});
const decodedTextStream = encodedTextStream.pipeThrough(new TextDecoderStream());
const readableStreamDefaultReader = decodedTextStream.getReader();
(async function() {
    while (true) {
        const {
            done,
            value
        } = await readableStreamDefaultReader.read();
        if (done) {
            break;
        } else {
            console.log(value);
        }
    }
})();
//😀
```

 文本解码器流最常与fetch()结合使用，因为响应主体可以作为ReadableStream进行处理：

```js
const response = await fetch(url);
const stream = response.body.pipeThrough(new TextDecoderStream());
for await (let decodedChunk of decodedStream) {
    console.log(decodedChunk);
}
```



## BLOB 和FIlE API

 Web应用程序的主要痛点之一是无法与用户计算机上的文件进行交互。 2000 年之前，处理文件的唯一方法是放置\<input type="file"\>到表单中。Blob和File API旨在让Web开发人员能够以安全的方式访问客户端计算机上的文件，从而更好地与这些文件进行交互。

### File类型

 File API仍然基于表单的文件输入字段，但增加了直接访问文件信息的能力。 HTML5为文件输入元素向DOM添加了一个files集合。在字段中选择一个或多个文件时，files集合包含代表每个文件的一系列File对象。每个File对象都有几个只读属性，包括：

-  **name** 本地系统上的文件名。

-  **size** 文件的字节大小。

-  **type** 包含文件MIME类型的字符串。

-  **lastModifiedDate** 表示上次修改文件的时间的字符串。此属性仅在Chrome中实现。


 可以通过侦听change事件然后查看files集合来获取有关所选文件的信息：

```js
let filesList = document.getElementById("files-list");
filesList.addEventListener("change", (event) => {
    let files = event.target.files,
        i = 0,
        len = files.length;
    while (i < len) {
        const f = files[i];
        console.log(`${f.name} (${f.type}, ${f.size} bytes)`);
        i++;
    }
});
```

 此示例只是将有关每个文件的信息输出到控制台。仅此功能对于Web应用程序来说就是一大进步，但File API更进一步，允许通过FileReader类型从文件中实际读取数据。

### FileReader类型

 FileReader类型表示异步文件读取机制。可以将FileReader视为类似于XMLHttpRequest，只是它用于从文件系统读取文件，而不是从服务器读取数据。FileReader类型提供了几种读入文件数据的方法：

-  **readAsText(file, encoding)** 以纯文本形式读取文件并将文本存储在result属性中。第二个参数，编码类型，是可选的。

-  **readAsDataURL(file)**  读取文件并在result属性中存储表示文件的数据URI。

-  **readAsBinaryString(file)** 读取文件并存储一个字符串，其中每个字符代表result属性中的一个字节。

-  **readAsArrayBuffer(file)** 读取文件并将包含文件内容的ArrayBuffer存储在result属性中。


 这些读取文件的各种方式允许在处理文件数据时更具有灵活性。例如，可能希望将图像作为数据URI读取以便将其显示给用户，或者将文件作为文本读取以便对其进行解析。

 由于读取是异步发生的，因此每个FileReader都会发布多个事件。三个最有用的事件是progress、error和load，它们分别指示有更多数据可用、发生错误以及完全读取文件。

 progress事件大约每 50 毫秒触发一次，并且具有与XHR progress事件相同的可用信息：lengthComputable、loaded和total。此外，FileReader的result属性在progress事件期间是可读的，即使它可能尚未包含所有数据。

 如果由于某种原因无法读取文件，则会触发error事件。当error事件触发时，将填充FileReader的error属性。 该对象有一个属性code，可能的值为 1 （未找到文件）、 2 （安全错误）、 3 （读取被中止） 、 4 （文件不可读）或 5 （编码错误）。

 load事件在文件成功加载时触发；如果error事件已触发，它将不会触发。这是使用所有三个事件的示例：

```js
let filesList = document.getElementById("files-list");
filesList.addEventListener("change", (event) => {
    let info = "",
        output = document.getElementById("output"),
        progress = document.getElementById("progress"),
        files = event.target.files,
        type = "default",
        reader = new FileReader();
    if (/image/.test(files[0].type)) {
        reader.readAsDataURL(files[0]);
        type = "image";
    } else {
        reader.readAsText(files[0]);
        type = "text";
    }
    reader.onerror = function() {
        output.innerHTML = "Could not read file, error code is " +
            reader.error.code;
    };
    reader.onprogress = function(event) {
        if (event.lengthComputable) {
            progress.innerHTML = `${event.loaded}/${event.total}`;
        }
    };
    reader.onload = function() {
        let html = "";
        switch (type) {
            case "image":
                html = `<img src="${reader.result}">`;
                break;
            case "text":
                html = reader.result;
                break;
        }
        output.innerHTML = html;
    };
});
```

 此代码从表单字段中读取文件并将其显示在页面上。如果文件的MIME类型是图像，则请求数据URI，并且在加载时，该数据URI作为图像插入到页面中。如果文件不是图像，则将其作为字符串读入并按原样输出到页面中。 progress事件用于跟踪和显示正在读取的数据字节，而error事件用于监视任何错误。

 可以通过调用abort()方法来停止正在进行的读取，在这种情况下会触发abort事件。在触发load、error或abort之后，会触发一个名为loadend的事件。 loadend事件表明由于三个原因中的任何一个原因，所有读取都已完成。所有实现的浏览器都支持readAsText()和readAsDataURL()方法。

### FileReaderSync类型

 FileReaderSync类型，顾名思义，是FileReader的同步版本。它具有与FileReader相同的方法，但执行文件的阻塞读取，仅在整个文件加载到内存后才继续执行。FileReaderSync仅在Web Worker 内部可用，因为读取整个文件的极其缓慢的过程在顶级执行环境中永远不实用。

 假设一个worker通过postMessage()发送了一个File对象。以下代码指示worker将整个文件同步读入内存并将文件的数据URL发回：

```js
// worker.js
self.onmessage = (messageEvent) => {
    const syncReader = new FileReaderSync();
    console.log(syncReader); // FileReaderSync {}
    // Blocks worker thread while file is read
    const result = syncReader.readAsDataUrl(messageEvent.data);
    // Example response for PDF file
    console.log(result); // data:application/pdf;base64,JVBERi0xLjQK...
    // Send URL back up
    self.postMessage(result);
};
```



### Blob和部分读取

 在某些情况下，可能只想读取文件的一部分而不是整个文件。为此，File对象有一个名为slice()的方法。slice()方法接受两个参数：起始字节和要读取的字节数。该方法返回一个Blob的实例，它实际上是File的超类。

 “blob”是“binary large object”的缩写，是不可变二进制数据的JavaScript包装器。Blob可以从包含字符串、ArrayBuffers、ArrayBufferViews甚至其他Blob的数组中创建。可以选择为Blob构造函数提供MIME类型作为其options参数的一部分：

```js
console.log(new Blob(['foo']));
// Blob {size: 3, type: ""}
console.log(new Blob(['{"a": "b"}'], {type: 'application/json'}));
// {size: 10, type: "application/json"}
console.log(new Blob(['<p>Foo</p>', '<p>Bar</p>'], {type: 'text/html'}));
// {size: 20, type: "text/html"}
```

 Blob还具有size和type属性，以及用于进一步减少数据的slice()方法。也可以使用FileReader从Blob中读取。此伪代码仅从文件中读取前 32 个字节：

```js
let filesList = document.getElementById("files-list");
filesList.addEventListener("change", (event) => {
    let info = "",
        output = document.getElementById("output"),
        progress = document.getElementById("progress"),
        files = event.target.files,
        reader = new FileReader(),
        blob = blobSlice(files[0], 0, 32);
    if (blob) {
        reader.readAsText(blob);
        reader.onerror = function() {
            output.innerHTML = "Could not read file, error code is " +
                reader.error.code;
        };
        reader.onload = function() {
            output.innerHTML = reader.result;
        };
    } else {
        console.log("Your browser doesn't support slice().");
    }
});
```

 仅读取文件的一部分可以节省时间，尤其是在查找特定数据（例如文件头）时。

### 对象URL和Blob

 对象URL，有时也称为Blob URL，是引用存储在文件或Blob中的数据的URL。对象URL的优点是无需将文件内容读入JavaScript即可使用它们;只需在适当的位置提供对象URL。要创建对象URL，请使用window.URL.createObjectURL()方法并传入File或Blob对象。这个函数的返回值是一个指向内存地址的字符串。因为字符串是一个URL，所以它可以在DOM中使用。例如，下面在页面上显示一个图像文件：

```js
let filesList = document.getElementById("files-list");
filesList.addEventListener("change", (event) => {
    let info = "",
        output = document.getElementById("output"),
        progress = document.getElementById("progress"),
        files = event.target.files,
        reader = new FileReader(),
        url = window.URL.createObjectURL(files[0]);
    if (url) {
        if (/image/.test(files[0].type)) {
            output.innerHTML = `<img src="${url}">`;
        } else {
            output.innerHTML = "Not an image.";
        }
    } else {
        output.innerHTML = "Your browser doesn't support object URLs.";
    }
});
```

 通过将对象URL直接提供给\<img\>标签，无需先将数据读入JavaScript。\<img\>标签直接进入内存位置并将数据读入页面。

 一旦不再需要数据，最好释放与之相关的内存。只要对象URL正在使用中，就无法释放内存。可以通过将对象URL传递给window.URL.revokeObjectURL()来指示不再需要该对象URL。卸载页面时，所有对象URL都会自动从内存中释放。尽管如此，也最好释放每个对象URL。

### 拖放文件读取

 将HTML5拖放API与文件API相结合，可以创建有趣的界面来读取文件信息。在页面上创建自定义放置目标后，可以将文件从桌面拖放到放置目标上。这会触发drop事件，就像拖放图像或链接一样。放置的文件在event.dataTransfer.files上可用。这是一个File对象列表，就像文件输入字段中可用的那些对象一样。

 以下示例打印出有关放置在页面中自定义放置目标上的文件的信息：

```js
let droptarget = document.getElementById("droptarget");
function handleEvent(event) {
    let info = "",
        output = document.getElementById("output"),
        files, i, len;
    event.preventDefault();
    if (event.type == "drop") {
        files = event.dataTransfer.files;
        i = 0;
        len = files.length;
        while (i < len) {
            info += `${files[i].name} (${files[i].type}, ${files[i].size} bytes)
<br>`;
            i++;
        }
        output.innerHTML = info;
    }
}
droptarget.addEventListener("dragenter", handleEvent);
droptarget.addEventListener("dragover", handleEvent);
droptarget.addEventListener("drop", handleEvent);
```

 与之前的拖放示例一样，必须取消dragenter、dragover和drop的默认行为。在drop事件期间，文件在event.dataTransfer.files上可用。可以在那个时候阅读他们的信息。

## 媒体元素

 随着嵌入式音频和视频在Web上的爆炸性流行，大多数内容制作者被迫使用Flash以获得最佳的跨浏览器兼容性。HTML5引入了两个与媒体相关的元素，使跨浏览器的音频和视频无需任何插件即可嵌入浏览器： \<audio\>和\<video\>。

 这两个元素都允许Web开发人员轻松地将媒体文件嵌入到页面中，并为通用功能提供JavaScript钩子，从而允许为媒体创建自定义控件。这些元素的使用如下：

```html
<!-- embed a video -->
<video src="conference.mpg" id="myVideo">Video player not available.</video>
<!-- embed an audio file -->
<audio src="song.mp3" id="myAudio">Audio player not available.</audio>
```

 这些元素中的每一个都至少需要src特性来指示要加载的媒体文件。还可以指定width和height特性来指示视频播放器的预期尺寸，poster特性在加载视频内容时显示的图像URI。controls特性（如果存在）指示浏览器应显示允许用户直接与媒体交互的UI。如果媒体播放器不可用，则开始和结束标签之间的任何内容都被视为要显示的替代内容。

 可以选择指定多个不同的媒体源，因为并非所有浏览器都支持所有媒体格式。为此，请省略元素中的src特性，而是包含一个或多个\<source\>元素，如下例所示：

```html
<!-- embed a video -->
<video id="myVideo">
    <source src="conference.webm" type="video/webm; codecs='vp8, vorbis'">
    <source src="conference.ogv" type="video/ogg; codecs='theora, vorbis'">
    <source src="conference.mpg">
    Video player not available.
</video>
<!-- embed an audio file -->
<audio id="myAudio">
    <source src="song.ogg" type="audio/ogg">
    <source src="song.mp3" type="audio/mpeg">
    Audio player not available.
</audio>
```


### 属性

 \<video\>和\<audio\>元素提供了强大的JavaScript接口。两个元素共享许多属性，可以评估这些属性以确定媒体的当前状态，如下表所述。

| 属性名              | 数据类型   | 描述                                                         |
| ------------------- | ---------- | ------------------------------------------------------------ |
| autoplay            | Boolean    | 获取或设置autoplay标志。                                     |
| buffered            | TimeRanges | 指示已下载的缓冲时间范围的对象。                             |
| bufferedBytes       | ByteRanges | 指示已下载的缓冲字节范围的对象。                             |
| bufferingRate       | Integer    | 从下载中接收的平均每秒比特数。                               |
| bufferingThrottled  | Boolean    | 指示缓冲是否已被浏览器限制。                                 |
| controls            | Boolean    | 获取或设置controls特性,用于显示或隐藏浏览器的内置控件。      |
| currentLoop         | Integer    | 媒体播放的次数。                                             |
| currentSrc          | String     | 当前播放媒体的URL。                                          |
| currentTime         | Float      | 已播放的秒数。                                               |
| defaultPlaybackRate | Float      | 获取或设置默认播放速率。默认情况下为1.0秒。                  |
| duration            | Float      | 媒体的总秒数。                                               |
| ended               | Boolean    | 指示媒体是否已播放完。                                       |
| loop                | Boolean    | 获取或设置媒体在结束时是否应循环回到开头。                   |
| muted               | Boolean    | 获取或设置媒体静音。                                         |
| networkState        | Integer    | 指示媒体网络连接的当前状态:0表示空,1表示加载中,2表示加载元数据中,3表示加载完第一帧,4表示加载完成。 |
| paused              | Boolean    | 指示播放器是否暂停。                                         |
| playbackRate        | Float      | 获取或设置当前播放速率。这可能会受到用户设置的媒体播放更快或更慢的影响,与defaultPlaybackRate不同。 |
| played              | TimeRanges | 到目前为止已播放的时间范围。                                 |
| readyState          | Integer    | 指示媒体是否准备好播放。如果数据不可用,则值为0;如果可以显示当前帧,则值为1;如果可以开始播放,则值为2;如果可以从头到尾播放,则值为3。 |
| seekable            | TimeRanges | 可用于查找的时间范围。                                       |
| seeking             | Boolean    | 表示播放器正在移动到媒体文件中的新位置。                     |
| src                 | String     | 媒体文件来源。这可以随时重写。                               |
| start               | Float      | 获取或设置媒体文件中应开始播放的位置(以秒为单位)。           |
| totalBytes          | Integer    | 资源所需的总字节数(如果已知)。                               |
| videoHeight         | Integer    | 返回视频的高度(不一定是元素的高度)。仅用于 \<video\>。       |
| videoWidth          | Integer    | 返回视频的宽度(不一定是元素的宽度)。仅用于 \<video\>。       |
| volume              | Float      | 获取或设置当前音量为0.0到1.0之间的值。                       |

这些属性中的很多也可以指定为 \<audio\> 或 \<video\> 元素的特性。

### 事件

 除了这些属性之外，还有许多在这些媒体元素上触发的事件。这些事件监视由于媒体播放和用户与播放器的交互而引发的属性变化。下表列出了这些事件。

| 事件名              | 触发时机                                                  |
| ------------------- | --------------------------------------------------------- |
| abort               | 下载被中止。                                              |
| canplay             | 可以开始播放;readyState为2。                              |
| canplaythrough      | 播放可以继续且连续;readyState为3。                        |
| canshowcurrentframe | 当前帧已下载;readyState为1。                              |
| dataunavailable     | 由于没有数据,无法播放;readyState为0。                     |
| durationchange      | duration属性值已更改。                                    |
| emptied             | 网络连接已关闭。                                          |
| empty               | 发生阻止媒体下载的错误。                                  |
| ended               | 媒体已完全播放完毕并停止播放。                            |
| error               | 下载过程中出现网络错误。                                  |
| load                | 所有媒体都已加载。此事件被视为已弃用;改用canplaythrough。 |
| loadeddata          | 已加载媒体的第一帧。                                      |
| loadedmetadata      | 媒体的元数据已加载。                                      |
| loadstart           | 下载已开始。                                              |
| pause               | 播放已暂停。                                              |
| play                | 媒体已被要求开始播放。                                    |
| playing             | 媒体实际上已经开始播放。                                  |
| progress            | 正在下载。                                                |
| ratechange          | 媒体播放的速度已经改变。                                  |
| seeked              | 寻找已经结束。                                            |
| seeking             | 正在将播放移至新位置。                                    |
| stalled             | 浏览器正在尝试下载,但没有接收到数据。                     |
| timeupdate          | currentTime以不正常或意外的方式更新。                     |
| volumechange        | volume属性值或muted属性值已更改。                         |
| waiting             | 播放暂停以下载更多数据。                                  |

 这些事件设计得尽可能具体，使Web开发人员能够仅使用HTML和JavaScript（而不是创建新的Flash电影）来创建自定义音频/视频播放器。

### 自定义媒体播放器

 可以使用\<audio\>和\<video\>上都可用的play()和pause()方法手动控制媒体文件的播放。结合属性、事件和这些方法可以轻松创建自定义媒体播放器，如下例所示：

```html
<div class="mediaplayer">
    <div class="video">
        <video id="player" src="videos/yuanshensl.mp4" poster="images/zhongli.jpg"
               width="300" height="200">
            Video player not available.
        </video>
    </div>
    <div class="controls">
        <input type="button" value="Play" id="video-btn">
        <span id="curtime">0</span>/<span id="duration">0</span>
    </div>
</div>
```

 然后可以通过使用JavaScript创建一个简单的视频播放器来使这个基本的HTML栩栩如生，如下所示：

```js
// get references to the elements
let player = document.getElementById("player"),
    btn = document.getElementById("video-btn"),
    curtime = document.getElementById("curtime"),
    duration = document.getElementById("duration");
// update the duration
duration.innerHTML = player.duration;
// attach event handler to button
btn.addEventListener("click", (event) => {
    if (player.paused) {
        player.play();
        btn.value = "Pause";
    } else {
        player.pause();
        btn.value = "Play";
    }
});
// update the current time periodically
setInterval(() => {
    curtime.innerHTML = player.currentTime;
}, 250);
```
 此处的JavaScript代码只是将一个事件处理程序附加到按钮，根据当前状态暂停或播放视频。然后，为\<video\>元素的load事件设置一个事件处理程序，以便可以显示总时长。最后，设置重复计时器以更新当前时间显示。可以通过侦听更多事件和利用更多属性来扩展此自定义视频播放器的行为。完全相同的代码也可以与\<audio\>元素一起使用来创建自定义音频播放器。


### 编解码器支持检测

 如前所述，并非所有浏览器都支持\<video>和\<audio>的所有编解码器，这通常意味着必须提供多个媒体源。还有一个JavaScript API用于确定浏览器是否支持给定的格式和编解码器。两个媒体元素都有一个名为canPlayType()的方法，该方法接受格式/编解码器字符串并返回字符串值“probably”、“maybe”或“”（空字符串）。空字符串是一个false值，这意味着仍然可以在这样的if语句中使用canPlayType()：

```js
if (audio.canPlayType("audio/mpeg")) {
    // do something
}
```

"probably" 和 "maybe" 都是真值，因此它们在if语句的环境中被强制为真。

当仅向canPlayType()提供MIME类型时，最有可能的返回值是“maybe”和空字符串，因为文件实际上只是音频或视频数据的容器；真正决定文件是否可以播放的是编码。当同时指定MIME类型和编解码器时，将增加“probably”作为返回值的可能性：

```js
let audio = document.getElementById("audio-player");
// most likely "maybe"
if (audio.canPlayType("audio/mpeg")) {
    // do something
}
// could be "probably"
if (audio.canPlayType("audio/ogg; codecs=\"vorbis\"")) {
    // do something
}
```

 请注意，编解码器列表必须始终用引号引起来才能正常工作。还可以在任何视频元素上使用canPlayType()检测视频格式。

### Audio类型

 \<audio\>元素还有一个名为Audio的原生JavaScript构造函数，以允许在任何时间点播放音频。Audio类型与Image类似，因为它等效于DOM元素，但不需要插入到文档中即可工作。只需创建一个新实例并传入音频源文件：

```js
let audio = new Audio("sound.mp3");
EventUtil.addHandler(audio, "canplaythrough", function(event) {
audio.play();
});
```

 创建新的Audio实例开始于下载指定文件时。准备好后，就可以调用play()开始播放音频。

 在iOS上调用play()方法会弹出一个对话框，要求用户允许播放声音。为了播放一个接一个的声音，必须立即在onfinish事件处理程序中调用play()。

### 拖放事件

 为拖放提供的事件能够控制拖放操作的几乎所有方面。棘手的部分是确定触发每个事件的位置：一些在拖动的项目上触发；一些在放置目标上触发。拖动项目时，将触发以下事件（按此顺序）：

 1. dragstart

 2. drag

 3. dragend

 当按住鼠标按钮并开始移动鼠标时，dragstart事件会在被拖动的项目上触发。光标变为禁止放置符号（带有一条直线的圆圈），表示该项目不能放置在其上。可以使用ondragstart事件处理程序在拖动开始时运行JavaScript代码。

 在dragstart事件触发后，只要拖动对象，drag事件就会触发并继续触发。这类似于mousemove，它也会在鼠标移动时重复触发。当拖动停止时（因为将项目拖放到有效或无效的拖放目标上），将触发dragend事件。

 所有三个事件的目标都是被拖动的元素。默认情况下，浏览器在拖动过程中不会改变被拖动元素的外观，因此由你来改变外观。然而，大多数浏览器确实会创建一个被拖动元素的半透明克隆，它总是立即停留在光标下方。

 当一个项目被拖到一个有效的放置目标上时，会发生以下事件序列：

 1. dragenter

 2. dragover

 3. dragleave或drop

 DragEnter事件（类似于鼠标悬停事件），一旦该项目被拖到放置目标就触发。紧接着dragover事件持续触发，直到拖到放置目标边界内。当项目被拖动到放置目标外时，dragover停止触发，同时触发DragLeave事件（类似于mouseout）。如果拖动的项目实际上是放置在目标上，则触发drop事件而不是dragleave。这俩事件的目标是放置目标元素。

### 自定义放置目标

 当尝试在无效的放置目标上拖动某物时，看到一个特殊的光标（带有一条线的圆圈），指示不能放置在此。尽管所有元素都支持放置目标事件，但默认情况下不允许放置。如果将元素拖到不允许放置的对象上，则无论用户执行什么操作，放置事件都不会触发。但是，可以通过覆写dragenter和dragover事件的默认行为将任何元素转换为有效的放置目标。如有一个ID为“droptarget”的\<div\>元素，则可以使用以下代码将其转换为放置目标：

```js
let droptarget = document.getElementById("droptarget");
droptarget.addEventListener("dragover", (event) => {
    event.preventDefault();
});
droptarget.addEventListener("dragenter", (event) => {
    event.preventDefault();
});
```

 进行这些更改后，会注意到光标现在指示拖动元素时允许在放置目标上放置。此外，将触发drop事件。

 在Firefox中，放置事件的默认行为是导航到放置在放置目标上的URL。这意味着将图像放置到放置目标上将导致页面导航到图像文件，放置在放置目标上的文本会导致URL无效错误。对于Firefox支持，还必须取消drop事件的默认行为以防止发生这种导航：

```js
droptarget.addEventListener("drop", (event) => {
    event.preventDefault();
});
```

### dataTransfer对象

 除非数据实际受到影响，否则简单地拖放没有任何用处。为了帮助通过拖放操作传输数据，IE5引入了dataTransfer对象，该对象作为event属性存在，用于将字符串数据从拖放项目传输到放置目标。因为它是event的属性，因此dataTransfer对象仅存在于拖放事件的事件处理程序作用域内。在事件处理程序中，可以使用对象的属性和方法处理拖放功能。dataTransfer对象现在是HTML5工作草案的一部分。

 dataTransfer对象有两个主要方法：getData()和setData()。getData()能够获取由setData()存储的值。setData()的第一个参数，也是getData()的唯一参数，是一个字符串，指示正在设置的数据类型：“text”或“URL”

```js
// working with text
event.dataTransfer.setData("text", "some text");
let text = event.dataTransfer.getData("text");
// working with a URL
event.dataTransfer.setData("URL", "http://www.wrox.com/");
let url = event.dataTransfer.getData("URL");
```

 尽管IE开始时仅引入“text”和“URL”作为有效数据类型，但HTML5对此进行了扩展以允许指定任何MIME类型。为了向后兼容，HTML5将支持值“text”和“URL”，但它们被映射到“text/plain”和“text/uri-list”。

 dataTransfer对象可以包含每种MIME类型的一个值，这意味着可以同时存储文本和URL，而不会覆写它们。存储在dataTransfer对象中的数据仅在drop事件发生之前可用。如果没有在ondrop事件处理程序中获取数据，则dataTransfer对象将被销毁且数据将丢失。

 当从文本框中拖动文本时，浏览器会调用setData()并以“text”格式存储拖动的文本。同样，当拖动链接或图像时，会调用setData()并存储URL。当数据被放到目标上时，可以通过使用getData()来获取这些值。还可以在dragstart事件期间手动调用setData()来存储以后可能想要获取的自定义数据。

 作为文本处理的数据和作为URL处理的数据之间存在差异。当指定要存储为文本的数据时，它不会得到任何特殊处理。但是，当指定要存储为URL的数据时，它被视为网页上的链接，这意味着如果将其拖放到另一个浏览器窗口，浏览器将导航到该URL。

 Firefox直到版本 5 不能正确地将“url”别名为“text/uri-list”或将“text”别名为“text/plain”。但是，它确实将“Text”（大写T）别名为“text/plain”。为了从dataTransfer获取数据的最佳跨浏览器兼容性，需要检查URL的两个值并使用“Text”作为纯文本：

```js
let dataTransfer = event.dataTransfer;
// read a URL
let url = dataTransfer.getData("url") || dataTransfer.getData("text/uri-list");
// read text
let text = dataTransfer.getData("Text");
```

 首先尝试缩短的数据名称很重要，因为IE到版本 10 也不支持扩展名称，并且在无法识别数据名称时也会引发错误。

### dropEffect和effectAllowed

 dataTransfer对象不仅可以用来做简单的来回数据传输，它还可用于确定可以对拖动的项目和放置目标执行哪些类型的操作。可以通过使用两个属性来完成此操作：dropEffect和 ffectAllowed。

 dropEffect属性用于告诉浏览器允许哪种类型的放置行为。此属性具有以下四个可能的值：

-  **none**拖动的项目不能放在这里。这是除文本框以外的所有内容的默认值。

-  **move**应将拖动的项目移动到放置目标。

-  **copy**应将拖动的项目复制到放置目标。

-  **link**指示放置目标将导航到拖动的项目（但仅当它是URL时）。


 当将项目拖到放置目标上时，这些值中的每一个都会导致显示不同的光标。但是，由你来实际执行光标指示的操作。换句话说，没有你的直接干预，不会自动移动、复制或链接任何内容。唯一可以免费获得的是光标更改。为了使用dropEffect属性，必须在放置目标的ondragenter事件处理程序中设置它。

 dropEffect属性没有用，除非还设置了effectAllowed。此属性指示拖动的项目允许使用哪种dropEffect。 可能的值如下：

-  **uninitialized**尚未为拖动的项目设置任何操作。

-  **none**不允许对拖动的项目执行任何操作。

-  **copy**只允许dropEffect的“copy”。

-  **link**只允许dropEffect的“link”。

-  **move**只允许dropEffect的“move”。

-  **copyLink**只允许dropEffect的“copy”和"link"。

-  **linkMove**只允许dropEffect的“link”和"move"。

-  **all**允许所有dropEffect值。


 这些属性必须在ondragstart事件处理程序中设置。

 假设希望允许用户将文本从文本框中移动到\<div\>中。为此，必须将dropEffect和effectAllowed都设置为“move”。文本不会自动移动，因为\<div\>上放置事件的默认行为是什么都不做。如果覆盖默认行为，文本会自动从文本框中删除。然后由将其插入\<div\>以完成操作。如果将dropEffect和effectAllowed更改为“copy”，则不会自动删除文本框中的文本。

### 可拖动性

 默认情况下，图像、链接和文本是可拖动的，这意味着不需要额外的代码来允许用户拖动它们。只有在突出显示选区后才能拖动文本，而可以随时拖动图像和链接。

 可以使其他元素变成可拖动。HTML5为所有HTML元素指定了一个draggable特性，指示该元素是否可以拖动。图像和链接的draggable自动设置为true，而其他所有内容的默认值都为false。可以设置此属性以允许其他元素可拖动或确保图像或链接不可拖动。例如：

```html
<!-- turn off dragging for this image -->
<img src="smile.gif" draggable="false" alt="Smiley face">
<!-- turn on dragging for this element -->
<div draggable="true">...</div>
```



### 其他成员

 HTML5规范可能会为dataTransfer对象添加如下方法：

-  **addElement(element)** 向拖动操作添加元素。这纯粹是出于数据目的，不会影响拖动操作的外观。目前还没有浏览器实现此方法。

-  **clearData(format)** 清除以特定格式存储的数据。

-  **setDragImage(element, x, y)** 允许指定在拖动时要在光标下显示的图像。此方法接受三个参数：要显示的HTML元素以及图像上光标应定位的x和y坐标。HTML元素可以是图像，在这种情况下显示图像，或任何其他元素，在这种情况下显示元素的渲染结果。

-  **types** 当前存储的数据类型列表。这个集合就像一个数组，并将数据类型存储为字符串，例如“text”。


## 通知API

 Notifications API，顾名思义，用于向用户显示通知。在许多方面，通知类似于alert()对话框：两者都使用JavaScript API来触发页面本身之外的浏览器行为，并且都允许页面处理用户与对话框或通知图块（tiles)交互的各种方式。然而，通知提供了更大程度的可定制性。

 Notifications API在服务worker的环境中特别有用。它允许渐进式Web应用程序(PWA)的行为更像原生应用程序，即使在浏览器页面未处于活动状态时也会触发通知显示。

### 通知权限

 通知API有可能被滥用，因此默认情况下它会强制执行两个安全功能：

-  通知只能由在安全环境中执行的代码触发。

-  通知必须在逐源（per-origin)的基础上被用户显示允许。


 用户向浏览器对话框内的源授予通知权限。除非用户拒绝显示允许或拒绝权限，否则每个域只能发生一次此权限请求：浏览器将记住用户的选择，如果拒绝，则无法补救。

 页面可以使用Notification全局对象请求通知权限。此对象具有一个requestPemission()方法，该方法返回一个promise，该promise在用户对权限对话框执行操作时解决。

```js
Notification.requestPermission()
    .then((permission) => {
    console.log('User responded to permission request:', permission);
});
```

 值granted表示用户明确授予显示通知的权限。任何其他值表示尝试显示通知将无声地失败。如果用户拒绝权限，则该值为denied。对此没有程序化的补救措施，因为不可能重新触发权限提示。

### 显示和隐藏通知

 Notification构造函数用于创建和显示通知。最简单的通知形式是只有一个标题字符串，它作为第一个必需的参数传递给构造函数。以这种方式调用构造函数时，会立即显示通知（需开启浏览器权限）：

```js
Notification('好耶!');
```

 如图：

![](/js_img/2001.png)

 通知可以使用options参数进行高度定制。通知主体、图片、震动等设置都可以通过这个对象来控制：

```js
new Notification('好耶!', {
    body: '哒哒哒',
    image: 'images/zhongli.png',
    vibrate: true
});
```

 如图：

![](/js_img/2002.png)

 从构造函数返回的Notification对象可使用其close()方法关闭活动通知。以下示例打开一个通知，然后在1000 毫秒后关闭它：

```js
const n = new Notification('I will close in 1000ms');
setTimeout(() => n.close(), 1000);
```



### 通知生命周期回调

 通知并不总是只用于显示文本字符串；它们还被设计为可交互的。通知API提供了四个用于附加回调的生命周期钩子：

-  **onshow** 在显示通知时触发。

-  **onclick** 在单击通知时触发。

-  当通知被关闭或通过close()关闭时触发 **onclose** 。

-  当发生阻止显示通知的错误时触发 **onerror** 。


 以下通知在每个事件周期上记录一条消息：

```js
const n = new Notification('foo');
n.onshow = () => console.log('Notification was shown!');
n.onclick = () => console.log('Notification was clicked!');
n.onclose = () => console.log('Notification was closed!');
n.onerror = () => console.log('Notification experienced an error!');
```



## 页面可见性API

 Web开发人员的一个主要痛点是用户何时与页面实际交互。如果页面被最小化或隐藏在另一个选项卡后面，则继续使用诸如轮询（polling）服务器以获取更新或执行动画等功能可能没有意义。页面可见性API旨在向开发人员提供有关页面是否对用户可见的信息。

 API本身非常简单，由三部分组成：

-  **document.visibilityState** 指示四种状态之一的值：

  -  该页面位于后台选项卡中或浏览器已最小化。

  -  该页面位于前台选项卡中。

  -  实际页面是隐藏的，但页面的预览是可见的（例如在Win7中，当将鼠标移到任务栏中的图标上时会显示预览）。

  -  该页面正在屏幕外预渲染

-  **visibilitychange事件** 当文档从隐藏变为可见时触发此事件，反之亦然。

-  **document.hidden** 一个布尔值，指示页面是否从视图中隐藏。这可能意味着页面位于后台选项卡中或浏览器已最小化。支持此值是为了向后兼容，应该使用document.visibilityState来评估页面是否可见。


 要在页面从可见变为隐藏或从隐藏变为可见时得到通知，可以监听visibilitychange事件。

document.visibilityState可能是以下三个字符串值之一：

-  **hidden**

-  **visible**

-  **prerender**


## 流API

 Streams API回答了一个简单但基本的问题："Web应用程序如何以连续的块而不是批量的方式使用信息？"此功能主要在两个方面非常有用：

-  一个数据块可能无法一次全部使用。一个完美的例子是对网络请求的响应。网络负载以一系列数据包（packets）的形式传送，流处理可以允许应用程序在网络传送的数据可用时使用它，而不是等待完整的负载完成加载。

-  一个数据块可以被分成小份进行处理。视频处理、数据解压缩、图像解码和JSON解析都是以数据块的小份来计算，不需要它一次全部在内存中。


 “网络请求和远程资源”一章介绍了Streams API如何与fetch()相关联，但Streams API是完全通用的。实现Observables的JavaScript库与流共享许多基本概念。

> 注意:尽管Fetch API得到了主要浏览器的良好支持,但对Streams API的支持明显滞后。

### 流简介

 在考虑流时，将数据想象为流经管道的液体是一个恰当的比喻。由于大量的概念重叠，JavaScript流大量借鉴了管道词法。根据Streams规范，“这些API旨在有效地映射到低级I/O原语（primitives），包括在适当的情况下对字节流进行特殊化（specializations）。” Stream API 直接处理的两个常见任务是处理网络请求和读取/写入磁盘。

 Streams API具有三种类型的流：

-  可读流是可以通过公共接口从中读取块的流。数据从底层数据源(underlying source)内部进入流并由消费者处理。

-  可写流是可以通过公共接口写入块的流。生产者将数据写入流中，并且该数据在底层数据槽(underlying sink)中内部传递。

-  转换流由两个流组成：一个接受输入数据的可写流（可写端），以及一个发出输出数据的可读流（可读端）。在这两个流之间是转换器(transformer)，可用于根据需要检查和修改流数据。


#### 块、内部队列和背压

> 背压(backpressure),就是消费者需要多少,生产者就生产多少。

 流中的基本单位是块。块可以是任何数据类型，但通常采用类型化数组的形式。每个块都是流的一个离散段，可以整体处理。重要的是，块没有固定的大小或以固定的间隔到达。在理想的流中，块的大小通常大致相同，并且以大致惯常的间隔到达，但任何良好的流实现都应准备好处理边缘情况。

 对于所有类型的流，都有一个共享的流入口和出口概念。有时，数据进入和退出流的速率会不匹配。这种流平衡可以采用以下三种形式之一：

 流的出口可以比入口处提供的数据更快地处理数据。流出口通常是空闲的（这可能表明流入口处潜在的低效率），但几乎没有浪费内存或计算，因此这种流不平衡是可以接受的。

-  流入口和出口处于平衡状态。这种平衡是理想的。

-  流的入口可以比出口更快地提供数据。这种流不平衡本质上是有问题的。某处必然会有积压的数据，流必须相应地处理这个问题。

-  流不平衡是一个常见问题，但流被用来解决这个问题。所有流都维护一个已进入流但尚未退出的块的内部队列（internal queue)。对于处于平衡状态的流，内部队列将始终具有零个或少量的入队块，因为流出口正在使块


 出列的速度与它们入队的速度大致相同。这种流的内部队列的内存占用将保持相对较小。

 当块入队速度快于出队速度时，内部队列的大小将增加。流不能允许其内部队列无限增长，因此它使用背压向流入口发出信号以停止发送数据，直到队列大小返回到预定阈值以下。该阈值由排队策略定义的高水位线（high water mark）控制，即内部队列的最大内存占用。

### 可读流

 可读流是底层数据源的数据的包装。该底层数据源能够将其数据投喂到流中，并允许从流的公共接口读取该数据。

#### 使用ReadableStreamDefaultController

 下面是一个每 1000 毫秒产生一个递增的整数的生成器：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
```

  这些值可以通过其控制器传递到可读流中。访问控制器的最简单方法是创建一个ReadableStream的新实例，在构造函数的underlyingSource参数中定义一个start()方法，并使用传递给该方法的controller参数。默认情况下，控制器参数是ReadableStreamDefaultController的一个实例：

```js
const readableStream = new ReadableStream({
    start(controller) {
        console.log(controller); // ReadableStreamDefaultController {}
    }
});
```

使用enqueue()方法将值传递到控制器中。传递完所有值后，将使用close()关闭流：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const readableStream = new ReadableStream({
    async start(controller) {
        for await (let chunk of ints()) {
            controller.enqueue(chunk);
        }
        controller.close();
    }
});
```
#### 使用ReadableStreamDefaultReader

 到目前为止，这个示例成功地将流中的五个值排入队列，但没有任何东西从该队列中读取它们。为此，可以使用getReader()从流中获取ReadableStreamDefaultReader实例。这将获得对流的锁，确保只有此读取器可以从该流中读取值：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const readableStream = new ReadableStream({
    async start(controller) {
        for await (let chunk of ints()) {
            controller.enqueue(chunk);
        }
        controller.close();
    }
});
console.log(readableStream.locked); // false
const readableStreamDefaultReader = readableStream.getReader();
console.log(readableStream.locked); // true
```
 消费者可以使用它的read()方法从此读取器实例中获取值：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const readableStream = new ReadableStream({
    async start(controller) {
        for await (let chunk of ints()) {
            controller.enqueue(chunk);
        }
        controller.close();
    }
});
console.log(readableStream.locked); // false
const readableStreamDefaultReader = readableStream.getReader();
console.log(readableStream.locked); // true
// Consumer
(async function() {
    while (true) {
        const {
            done,
            value
        } = await readableStreamDefaultReader.read();
        if (done) {
            break;
        } else {
            console.log(value);
        }
    }
})();
// 0
// 1
// 2
// 3
// 4
```



### 可写流

 可写流是底层数据槽的包装。这个底层数据槽处理来自流公共接口的数据。

#### 创建WriteableStream

 下面是一个每 1000 毫秒产生一个递增的整数的生成器：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
```

 这些值可以通过其公共接口写入可写流。当调用公共的write()方法时，也会调用传递给构造函数的underlyingSink对象上定义的write()方法：

```js
const readableStream = new ReadableStream({
    write(value) {
        console.log(value);
    }
});
```



#### 使用WritableStreamDefaultWriter

 要将值写入此流，可以使用getWriter()从流中获取WritableStreamDefaultWriter实例。这将获得对流的锁，确保只有此写入器（writer）可以将值写入该流：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const writableStream = new WritableStream({
    write(value) {
        console.log(value);
    }
});
console.log(writableStream.locked); // false
const writableStreamDefaultWriter = writableStream.getWriter();
console.log(writableStream.locked); // true
```

 在将值写入流之前，生产者必须确保写入器能够接受值。WritableStreamDefaultWriter.ready返回一个promise，该promise在写入器准备好将值写入流时解决。在此之后，可以使用write()传递值，直到数据流完成，此时可以使用close()终止流：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const writableStream = new WritableStream({
    write(value) {
        console.log(value);
    }
});
console.log(writableStream.locked); // false
const writableStreamDefaultWriter = writableStream.getWriter();
console.log(writableStream.locked); // true
// Producer
(async function() {
    for await (let chunk of ints()) {
        await writableStreamDefaultWriter.ready;
        writableStreamDefaultWriter.write(chunk);
    }
    writableStreamDefaultWriter.close();
})();
```


### 转换流

 转换流结合了可读流和可写流。在两个流之间是transform()方法，它是块转换发生的中间点。

 下面是一个每 1000 毫秒产生一个递增的整数的生成器：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
```

 一个TransformStream可以将这个生成器发出的值加倍，可以定义如下：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const {
    writable,
    readable
} = new TransformStream({
    transform(chunk, controller) {
        controller.enqueue(chunk * 2);
    }
});
```

 将数据传入和从转换流的组件流中提取数据与本章前面的可读流和可写流部分相同：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const {
    writable,
    readable
} = new TransformStream({
    transform(chunk, controller) {
        controller.enqueue(chunk * 2);
    }
});
const readableStreamDefaultReader = readable.getReader();
const writableStreamDefaultWriter = writable.getWriter();
// Consumer
(async function() {
    while (true) {
        const {
            done,
            value
        } = await readableStreamDefaultReader.read();
        if (done) {
            break;
        } else {
            console.log(value);
        }
    }
})();
// Producer
(async function() {
    for await (let chunk of ints()) {
        await writableStreamDefaultWriter.ready;
        writableStreamDefaultWriter.write(chunk);
    }
    writableStreamDefaultWriter.close();
})();
```
### Piping Streams

 流可以通过管道相互连接以形成链。一种常见的形式是使用pipeThrough()方法将ReadableStream管道传输到TransformStream。在内部，初始ReadableStream将其值传递到TransformStream的内部WritableStream，流执行转换，转换后的值从新的ReadableStream端点出现。如下所示，其中整数的ReadableStream通过TransformStream传递，该TransformStream将每个值加倍：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const integerStream = new ReadableStream({
    async start(controller) {
        for await (let chunk of ints()) {
            controller.enqueue(chunk);
        }
        controller.close();
    }
});
const doublingStream = new TransformStream({
    transform(chunk, controller) {
        controller.enqueue(chunk * 2);
    }
});
// Perform stream piping
const pipedStream = integerStream.pipeThrough(doublingStream);
// Acquire reader on output of piped streams
const pipedStreamDefaultReader = pipedStream.getReader();
// Consumer
(async function() {
    while (true) {
        const {
            done,
            value
        } = await pipedStreamDefaultReader.read();
        if (done) {
            break;
        } else {
            console.log(value);
        }
    }
})();
```
 也可以使用pipeTo()方法将ReadableStream通过管道传输到WritableStream。这与pipeThrough()的行为方式类似：

```js
async function* ints() {
    // yield an incremented integer every 1000ms
    for (let i = 0; i < 5; ++i) {
        yield await new Promise((resolve) => setTimeout(resolve, 1000, i));
    }
}
const integerStream = new ReadableStream({
    async start(controller) {
        for await (let chunk of ints()) {
            controller.enqueue(chunk);
        }
        controller.close();
    }
});
const writableStream = new WritableStream({
    write(value) {
        console.log(value);
    }
});
const pipedStream = integerStream.pipeTo(writableStream);
// 0
// 1
// 2
// 3
// 4
```

 请注意，管道操作隐式地从ReadableStream获取读取器并将生成的值提供给WritableStream。

## 计时API

 页面性能始终是Web开发人员关注的领域。Performance接口通过JavaScript API公开内部浏览器指标来改变这种情况，允许开发人员直接访问这些信息并随心所欲地使用它。该接口可通过window.performance对象获得。与页面相关的所有指标，包括已经定义的指标和未来的指标，都存在于该对象中。

 性能接口由多个API组成，其中大部分有两个级别规范。

### 高分辨率时间API

 Date.now()方法仅对不需要精确计时的日期时间操作有用。在以下示例中，在调用函数foo()之前和之后捕获时间戳：

```js
const t0 = Date.now();
foo();
const t1 = Date.now();
const duration = t1 – t0;
console.log(duration);
```

 参考以下场景，其duration值不是预期的：

-  **duration为 0** 。 Date.now()只有毫秒精度，如果foo()执行得足够快，两个时间戳将捕获相同的值。

-  **duration为负或很大** 。 如果系统时钟在foo()执行时向后或向前调整（例如在夏令时期间），而捕获的时间戳将不考虑这一点，差异将包含调整。


 由于这些原因，必须使用不同的时间测量API来精确测量时间的流逝。为了满足这些需求，高分辨率时间API定义了window.performance.now()，它返回一个精度高达微秒的浮点数。因此，按顺序捕获时间戳并使它们相同的可能性要小得多。这种方法还保证了单调递增的时间戳:

```js
const t0 = performance.now();
const t1 = performance.now();
console.log(t0); // 1768.625000026077
console.log(t1); // 1768.6300000059418
const duration = t1 – t0;
console.log(duration); // 0.004999979864805937
```

 performance.now()计时器是一个相对度量。当它的执行环境产生时，它从 0 开始计数：例如，当打开一个页面或创建一个worker程序时。由于计时器初始化将在环境之间偏移，因此在没有共享参考点的情况下，无法在执行环境之间直接比较performance.now()值。当定时器初始化发生时，performance.timeOrigin属性返回全局系统时钟的值:

```js
const relativeTimestamp = performance.now();
const absoluteTimestamp = performance.timeOrigin + relativeTimestamp;
console.log(relativeTimestamp); // 244.43500000052154
console.log(absoluteTimestamp); // 1561926208892.4001
```

>注意:Spectre等安全漏洞可以通过使用performance.now()来测量L1缓存和主内存之间的延迟增量来执行缓存推理攻
>击。为了解决这个漏洞,所有主流浏览器要么降低了performance.now()的精度,要么在时间戳中加入了一些随机性。
>WebKit博客在https://webkit.org/blog/8048/what-spectre-and-meltdown-mean-for-webkit/上有一篇
>关于此主题的优秀文章。

## 性能时间线API

 Performance Timeline API使用了一套工具扩展了Performance接口以测量客户端延迟。性能测量几乎总是采用计算结束时间和开始时间之间之差的形式。这些开始和结束时间被记录为DOMHighResTimeStamp值，包装这些时间戳的对象是PerformanceEntry实例。

 浏览器会自动记录各种不同的PerformanceEntry对象，也可以使用performance.mark()记录自己的对象。可以使用performance.getEntires()访问记录在执行环境中的所有记录条目：

```js
console.log(performance.getEntries());
// [PerformanceNavigationTiming, PerformanceResourceTiming, ... ]
```

 这个集合代表浏览器的性能时间线。每个PerformanceEntry对象都有name、entryType、startTime和duration属性：

```js
const entry = performance.getEntries()[0];
console.log(entry.name); // "https://foo.com"
console.log(entry.entryType); // navigation
console.log(entry.startTime); // 0
console.log(entry.duration); // 182.36500001512468
```

 PerformanceEntry实际上是一个抽象基类，因为记录的条目将始终从PerformanceEntry继承，但最终作为以下类之一存在：

-  PerformanceMark

-  PerformanceMeasure

-  PerformanceFrameTiming

-  PerformanceNavigationTiming

-  PerformanceResourceTiming

-  PerformancePaintTiming


 这些类型中的每一种都添加了大量属性，这些属性描述了涉及条目所代表内容的元数据。实例的name和entryType属性将根据其类型而有所不同。

### 用户计时API

 用户计时API允许记录和分析自定义性能条目。记录自定义性能条目是通过performance.mark()完成的：

```js
performance.mark('foo');
console.log(performance.getEntriesByType('mark')[0]);
// PerformanceMark {
// name: "foo",
// entryType: "mark",
// startTime: 269.8800000362098,
// duration: 0
// }
```

 在计算的任一侧创建两个性能条目允许计算时间增量。最新的标记被推送到从getEntriesByType()返回的数组的开头：

```js
performance.mark('foo');
for (let i = 0; i < 1E6; ++i) {}
performance.mark('bar');
const [endMark, startMark] = performance.getEntriesByType('mark');
console.log(startMark.startTime - endMark.startTime); // 1.3299999991431832
```

 还可以生成一个PerformanceMeasure条目，该条目对应于通过其名称标识的两个标记之间的持续时间。这是通过performance.measure()实现的：

```js
performance.mark('foo');
for (let i = 0; i < 1E6; ++i) {}
performance.mark('bar');
performance.measure('baz', 'foo', 'bar');
const [differenceMark] = performance.getEntriesByType('measure');
console.log(differenceMark);
// PerformanceMeasure {
// name: "baz",
// entryType: "measure",
// startTime: 298.9800000214018,
// duration: 1.349999976810068
```

### 导航计时API

 Navigation Timing API为涵盖当前页面加载速度的指标提供高精度时间戳。当导航事件发生时，浏览器会自动记录一个PerformanceNavigationTiming条目。此对象捕获描述页面加载方式和时间的广泛时间戳。

 以下示例计算loadEventStart和loadEventEnd时间戳之间的时间：

```js
const [performanceNavigationTimingEntry] =
      performance.getEntriesByType('navigation');
console.log(performanceNavigationTimingEntry);
// PerformanceNavigationTiming {
// connectEnd: 2.259999979287386
// connectStart: 2.259999979287386
// decodedBodySize: 122314
// domComplete: 631.9899999652989
// domContentLoadedEventEnd: 300.92499998863786
// domContentLoadedEventStart: 298.8950000144541
// domInteractive: 298.88499999651685
// domainLookupEnd: 2.259999979287386
// domainLookupStart: 2.259999979287386
// duration: 632.819999998901
// encodedBodySize: 21107
// entryType: "navigation"
// fetchStart: 2.259999979287386
// initiatorType: "navigation"
// loadEventEnd: 632.819999998901
// loadEventStart: 632.0149999810383
// name: "https://foo.com"
// nextHopProtocol: "h2"
// redirectCount: 0
// redirectEnd: 0
// redirectStart: 0
// requestStart: 7.7099999762140214
// responseEnd: 130.50999998813495
// responseStart: 127.16999999247491
// secureConnectionStart: 0
// serverTiming: []
// startTime: 0
// transferSize: 21806
// type: "navigate"
// unloadEventEnd: 132.73999997181818
// unloadEventStart: 132.41999997990206
// workerStart: 0
// }
console.log(performanceNavigationTimingEntry.loadEventEnd –
            performanceNavigationTimingEntry.loadEventStart);
// 0.805000017862767
```
### 资源计时API

 Resource Timing API为指标提供高精度时间戳，涵盖为当前页面加载请求资源的速度。加载资源时，浏览器会自动记录PerformanceResourceTiming条目。该对象捕获了广泛的时间戳，描述了该资源加载的速度。

 以下示例计算加载特定资源所花费的时间：

```js
const performanceResourceTimingEntry = performance.getEntriesByType('resource')[0];
console.log(performanceResourceTimingEntry);
// PerformanceResourceTiming {
// connectEnd: 138.11499997973442
// connectStart: 138.11499997973442
// decodedBodySize: 33808
// domainLookupEnd: 138.11499997973442
// domainLookupStart: 138.11499997973442
// duration: 0
// encodedBodySize: 33808
// entryType: "resource"
// fetchStart: 138.11499997973442
// initiatorType: "link"
// name: "https://static.foo.com/bar.png",
// nextHopProtocol: "h2"
// redirectEnd: 0
// redirectStart: 0
// requestStart: 138.11499997973442
// responseEnd: 138.11499997973442
// responseStart: 138.11499997973442
// secureConnectionStart: 0
// serverTiming: []
// startTime: 138.11499997973442
// transferSize: 0
// workerStart: 0
// }
console.log(performanceResourceTimingEntry.responseEnd –
            performanceResourceTimingEntry.requestStart);
// 493.9600000507198
```

 使用不同时间之间的差异可以很好地了解页面是如何加载到浏览器中的，以及潜在的瓶颈隐藏在哪里。

## Web组件

 术语“Web 组件”指的是一些旨在增强DOM行为的工具：shadow DOM、自定义元素和HTML模板。这些浏览器API特别凌乱：

-  没有单一的“Web 组件”规范：每个 Web 组件都在不同的规范中定义。

-  一些web组件，例如shadow DOM和自定义元素，经历了向后不兼容的版本控制。

-  浏览器供应商的采用情况极其不一致。


 由于这些问题，采用web组件通常需要一个web组件库，例如Polymer (https://www.polymer-project.org/)，来填充和模拟浏览器中缺失的web组件。

### HTML模板

 在Web组件出现之前，没有一种特别好的编写HTML的方法允许浏览器从解析的HTML构建DOM子树并渲染，直到指示这样做。一种解决方法是使用innerHTML将标记字符串转换为DOM元素，但这种策略具有严重的安全隐患。另一种解决方法是使用document.createElement()构造每个元素，并逐步将它们附加到孤立的根节点（不附加到DOM），但这样做非常费力，并且根本无法使用标记进行导航。

 在浏览器自动解析为DOM子树但跳过渲染的页面中编写特殊标记会好得多。这是HTML模板的核心思想，它使用\<template\>标签正是为了这个目的。一个简单的HTML模板示例如下：

```html
<template id="foo">
    <p>I'm inside a template!</p>
</template>
```

#### 使用DocumentFragment

 在浏览器中渲染时，上例中的文本不会渲染到页面上。由于\<template\>内容不被认为是活动文档的一部分，因此诸如document.querySelector()之类的DOM匹配方法将无法找到上例中的\<p\>标签。这是因为它作为新Node节点的子类添加到HTML模板中：DocumentFragment。

 在浏览器内部检查时，\<template\>中的DocumentFragment是可见的：

```html
<template id="foo">
    #document-fragment
    <p>I'm inside a template!</p>
</template>
```

 可以通过\<template\>元素的content属性获取对此DocumentFragment的引用：

```js
console.log(document.querySelector('#foo').content); // #document-fragment
```

 DocumentFragment充当该子树的最小document对象。例如，DocumentFragment上的DOM匹配方法可以在其子树中找到节点：

```js
const fragment = document.querySelector('#foo').content;
console.log(document.querySelector('p')); // null
console.log(fragment.querySelector('p')); // <p>...<p>
```

 DocumentFragment对于批量添加HTML也非常有用。考虑这样一种场景，即希望尽可能高效地向HTML元素添加多个子元素。为每个孩子使用连续的document.appendChild()调用是很费力的，并且可能会导致多次页面重排。使用DocumentFragment允许对这些孩子添加进行批处理，保证最多只有一次重排：

```js
// Start state:
// <div id="foo"></div>
//
// Desired end state:
// <div id="foo">
// <p></p>
// <p></p>
// <p></p>
// </div>
// Also can use document.createDocumentFragment()
const fragment = new DocumentFragment();
const foo = document.querySelector('#foo');
// Adding children to a DocumentFragment incurs no reflow
fragment.appendChild(document.createElement('p'));
fragment.appendChild(document.createElement('p'));
fragment.appendChild(document.createElement('p'));
console.log(fragment.children.length); // 3
foo.appendChild(fragment);
console.log(fragment.children.length); // 0
console.log(document.body.innerHTML);
// <div id="foo">
// <p></p>
// <p></p>
// <p></p>
// </div>
```
#### 使用 \<template\> 标签

 请注意在前面的示例中DocumentFragment的子节点如何有效地转移到foo元素上，从而使DocumentFragment为空。可以使用\<template\>复制相同的过程：

```js
const fooElement = document.querySelector('#foo');
const barTemplate = document.querySelector('#bar');
const barFragment = barTemplate.content;
console.log(document.body.innerHTML);
// <div id="foo">
// </div>
// <template id="bar">
// <p></p>
// <p></p>
// <p></p>
// </template>
fooElement.appendChild(barFragment);
console.log(document.body.innerHTML);
// <div id="foo">
// <p></p>
// <p></p>
// <p></p>
// </div>
// <tempate id="bar"></template>
```

 如果希望复制模板，可以使用简单的importNode()来克隆DocumentFragment：

```js
const fooElement = document.querySelector('#foo');
const barTemplate = document.querySelector('#bar');
const barFragment = barTemplate.content;
console.log(document.body.innerHTML);
// <div id="foo">
// </div>
// <template id="bar">
// <p></p>
// <p></p>
// <p></p>
// </template>
fooElement.appendChild(document.importNode(barFragment, true));
console.log(document.body.innerHTML);
// <div id="foo">
// <p></p>
// <p></p>
// <p></p>
// </div>
// <template id="bar">
// <p></p>
// <p></p>
// <p></p>
// </template>
```
#### 模板脚本

 脚本执行将被推迟，直到DocumentFragment添加到真实的DOM树中。这在这里演示：

```js
// Page HTML:
//
// <div id="foo"></div>
// <template id="bar">
// <script>console.log('Template script executed');</script>
// </template>
const fooElement = document.querySelector('#foo');
const barTemplate = document.querySelector('#bar');
const barFragment = barTemplate.content;
console.log('About to add template');
fooElement.appendChild(barFragment);
console.log('Added template');
// About to add template
// Template script executed
// Added template
```

 这在添加的新元素需要一些初始化的情况下很有用。

### Shadow DOM

 从概念上讲，shadow DOM Web组件相当简单：它允许将一个完全独立的DOM树附加为父DOM树上的一个节点。这允许DOM封装，这意味着诸如CSS样式和CSS选择器之类的东西可以被限制在一个shadow DOM子树而不是整个顶级DOM树。

 Shadow DOM类似于HTML模板，因为两者都是类似document的结构，可以在一定程度上与顶级DOM分离。然而，Shadow DOM与HTML模板的不同之处在于，Shadow DOM内容是真实渲染在页面上，而HTML模板内容则不然。

#### Shadow DOM简介

 想象一个场景，有多个类似结构的DOM子树：

```html
<div>
    <p>Make me red!</p>
</div>
<div>
    <p>Make me blue!</p>
</div>
<div>
    <p>Make me green!</p>
</div>
```

 正如你可能从文本节点中推测的那样，这三个DOM子树中的每一个都应该被分配不同的颜色。通常，为了在不求助于style特性的情况下对其中的每一个应用唯一的样式，可能会将唯一的类名应用于每个子树并在相应的选择器中定义样式：

```html
<div class="red-text">
    <p>Make me red!</p>
</div>
<div class="green-text">
    <p>Make me green!</p>
</div>
<div class="blue-text">
    <p>Make me blue!</p>
</div>
<style>
    .red-text {
        color: red;
    }
    .green-text {
        color: green;
    }
    .blue-textcolor:}
</style>
```

 当然，这是一个不太理想的解决方案。这与在全局命名空间中定义变量没有太大区别；即使确定定义的这些样式在其他任何地方都不需要，但此CSS始终应用于整个DOM。可以继续添加CSS选择器特异性以防止这些样式在其他地方渗出，但这只是折衷办法。理想情况下，更愿意将CSS限制为DOM的一部分：这就是shadow DOM的原始用法。

#### 创建Shadow DOM

 出于安全或防止shadow DOM冲突的原因，并非所有元素类型都可以附加shadow DOM。尝试将shadow DOM附加到无效的元素类型，或已附加shadow DOM的元素，将引发错误。

 以下是能够托管shadow DOM的元素列表：

-  任何具有有效名称的自主（autonomous）自定义元素（如HTML规范中所定义：https://html.spec.whatwg.org/multipage/custom-elements.html#valid-customelement-name）


- \<article>
- \<aside>
- \<blockquote>
- \<body>
- \<div>
- \<footer>
- \<h1>
- \<h2>
- \<h3>
- \<h4>
- \<h5>
- \<h6>
- \<header>
- \<main>
- \<nav>
- \<p>
- \<section>
- \<span>

 shadow DOM是通过使用attachShadow()方法将其附加到有效的HTML元素来创建的。附加了shadowDOM的元素称为shadow host。 shadow DOM的根节点称为shadow root。

 attachShadow()方法需要一个必需的shadowRootInit对象并返回shadow DOM的实例。shadowRootInit对象必须包含一个指定“open”或“closed”的mode属性。可以通过shadowRoot属性在HTML 元素上获取对"open"的shadow DOM的引用；这对于"closed"的shadow DOM是不可能的。

 mode两种值的差异：

```js
document.body.innerHTML = `
<div id="foo"></div>
<div id="bar"></div>
`;
const foo = document.querySelector('#foo');
const bar = document.querySelector('#bar');
const openShadowDOM = foo.attachShadow({ mode: 'open' });
const closedShadowDOM = bar.attachShadow({ mode: 'closed' });
console.log(openShadowDOM); // #shadow-root (open)
console.log(closedShadowDOM); // #shadow-root (closed)
console.log(foo.shadowRoot); // #shadow-root (open)
console.log(bar.shadowRoot); // null
```

 一般来说，很少有需要创建一个关闭的shadow DOM的情况。尽管它赋予了限制从shadow host对shadow DOM进行编程访问的能力，但恶意代码有很多方法可以绕过这一点并重新获得对shadow DOM的访问。

 简而言之，**创建一个关闭的shadow DOM不应该用于安全目的**。

>注意:如果希望保护一个单独的DOM树免受不受信任的代码的影响,shadow DOM不适合这样的要求。对\<iframe\>实施的跨域限制更加健壮。

#### 使用Shadow DOM

 一旦附加到元素上，shadow DOM就可以用作普通DOM。考虑以下示例，它重新创建了之前显示的红/绿/蓝示例：

```js
for (let color of ['red', 'green', 'blue']) {
    const div = document.createElement('div');
    const shadowDOM = div.attachShadow({
        mode: 'open'
    });
    document.body.appendChild(div);
    shadowDOM.innerHTML = `
<p>Make me ${color}</p>
<style>
p {
color: ${color};
}
</style>
`;
}
```

 尽管有三个相同的选择器应用了三种不同的颜色，但这些选择器只会应用于定义它们的shadow DOM。因此，三个\<p\>元素将以三种不同的颜色出现。

 可以验证这些元素是否存在于它们自己的shadow DOM中，如下所示：

```js
for (let color of ['red', 'green', 'blue']) {
    const div = document.createElement('div');
    const shadowDOM = div.attachShadow({
        mode: 'open'
    });
    document.body.appendChild(div);
    shadowDOM.innerHTML = `
<p>Make me ${color}</p>
<style>
p {
color: ${color};
}
</style>
`;
    function countP(node) {
        console.log(node.querySelectorAll('p').length);
    }
    countP(document); // 0
    for (let element of document.querySelectorAll('div')) {
        countP(element.shadowRoot);
    }
    // 1
    // 1
    // 1
```
 浏览器检查器工具将明确shadow DOM存在的位置。例如，前面的示例将在浏览器检查器中显示如下：

```html
<div>
    #shadow-root (open)
    <p>Make me red!</p>
    <style>
        p {
            color: red;
        }
    </style>
</div>
<div>
    #shadow-root (open)
    <p>Make me green!</p>
    <style>
        p {
            color: green;
        }
    </style>
</div>
<div>
    #shadow-root (open)
    <p>Make me blue!</p>
    <style>
        p {
            color: blue;
        }
    </style>
</div>
```

 Shadow DOM不是不可渗透的边界。 HTML元素可以在DOM树之间不受限制地移动：

```js
document.body.innerHTML = `
<div></div>
<p id="foo">Move me</p>
`;
const divElement = document.querySelector('div');
const pElement = document.querySelector('p');
const shadowDOM = divElement.attachShadow({ mode: 'open' });
// Remove element from parent DOM
divElement.parentElement.removeChild(pElement);
// Add element to shadow DOM
shadowDOM.appendChild(pElement);
// Check to see that element was moved
console.log(shadowDOM.innerHTML); // <p id="foo">Move me</p>
```

#### 组合和Shadow DOM插槽

 shadow DOM旨在启用可定制的组件，这需要能够处理嵌套的DOM片段。从概念上讲，这相对简单。

 shadow宿主元素内的HTML需要一种在shadow DOM内部渲染的方法，而不是实际成为shadow DOM树的一部分。默认情况下，嵌套内容将被隐藏。考虑以下示例，其中文本在 1000 毫秒后隐藏：

```js
document.body.innerHTML = `
<div>
<p>Foo</p>
</div>
`;
setTimeout(() => document.querySelector('div').attachShadow({ mode: 'open' }), 1000);
```

 连接shadow DOM后，浏览器将优先考虑shadow DOM，并将渲染其内容而不是文本。在此示例中，shadow DOM为空，因此\<div\>显示为空。

 要显示此内容，可以使用\<slot\>标签来指示浏览器应将HTML放置在哪里。在下面的代码中，对前一个示例进行了返工，以便文本重新出现在shadow DOM中：

```js
document.body.innerHTML = `
<div id="foo">
<p>Foo</p>
</div>
`;
document.querySelector('div')
    .attachShadow({ mode: 'open' })
    .innerHTML = `<div id="bar">
<slot></slot>
<div>`
```

 现在，"shadow"的内容将表现得好像它存在于shadow DOM中。 检查页面后发现，内容似乎实际上取代了\<slot\>：

```html
<body>
    <div id="foo">
        #shadow-root (open)
        <div id="bar">
            <p>Foo</p>
        </div>
    </div>
</body>
```
 请注意，尽管它出现在页面检查器中，但这只是DOM内容的投影。该元素仍附着在外部DOM上：

```js
document.body.innerHTML = `
<div id="foo">
<p>Foo</p>
</div>
`;
document.querySelector('div')
    .attachShadow({ mode: 'open' })
    .innerHTML = `
<div id="bar">
<slot></slot>
</div>`
console.log(document.querySelector('p').parentElement);
// <div id="foo"></div>
```

 之前的红绿蓝示例可以使用slot返工：

```js
for (let color of ['red', 'green', 'blue']) {
    const divElement = document.createElement('div');
    divElement.innerText = `Make me ${color}`;
    document.body.appendChild(divElement);
    divElement
        .attachShadow({
        mode: 'open'
    })
        .innerHTML = `
<p><slot></slot></p>
<style>
p {
color: ${color};
}
</style>
`;
}
```

 也可以使用具名插槽执行多个shadow。这是通过匹配slot/name特性对完成的。标识带有slot="foo"特性的元素将投影到有name="foo"特性的\<slot\>上。以下示例通过切换shadow宿主元素的孩子子的渲染顺序来证明这一点：

```js
document.body.innerHTML = `
<div>
<p slot="foo">Foo</p>
<p slot="bar">Bar</p>
</div>
`;
document.querySelector('div')
    .attachShadow({ mode: 'open' })
    .innerHTML = `
<slot name="bar"></slot>
<slot name="foo"></slot>
`;
// Renders:
// Bar
// Foo
```
#### 事件重定位

 如果像单击这样的浏览器事件发生在shadow DOM中，则浏览器需要一种方法让父DOM处理该事件。但是，实施还必须尊重shadow DOM边界。为了解决这个问题，逃离shadow DOM并在外部处理的事件会发生事件重定位（event retargeting）。一旦逃离，事件像是被shadow宿主本身抛出，而不是真正的封装元素。此处演示此行为：

```js
// Create element to be shadow host
document.body.innerHTML = `
<div onclick="console.log('Handled outside:', event.target)"></div>
`;
// Attach shadow DOM and insert HTML into it
document.querySelector('div')
    .attachShadow({ mode: 'open' })
    .innerHTML = `
<button onclick="console.log('Handled inside:',
event.target)">Foo</button>
`;
// When clicking the button:
// Handled inside: <button onclick="..."></button>
// Handled outside: <div onclick="..."></div>
```

 请注意，重定位只针对实际存在于shadow DOM中的元素。使用\<slot\>标签从外部投射的元素不会重新定位其事件，因为它们在技术上仍然存在于shaodw DOM之外。

### 自定义元素

 如果你使用了JavaScript框架，可能熟悉自定义元素的概念，因为所有主要框架都以某种形式提供此功能。自定义元素将面向对象编程风格引入HTML元素。有了它们，可以创建自定义、复杂和可重复使用的元素，并使用简单的HTML标签或特性创建实例。

#### 定义自定义元素

 浏览器已经尝试将未识别的元素作为通用元素纳入DOM中。 当然，默认情况下，他们不会做任何通用HTML元素还没有做过的特殊事情。考虑以下示例，其中无意义的HTML标签成了HTMLElement的实例：

```js
document.body.innerHTML = `
<x-foo >I'm inside a nonsense element.</x-foo >
`;
console.log(document.querySelector('x-foo') instanceof HTMLElement); // true
```

自定义元素更进一步。它们允许在出现\<x-foo\>标签时定义复杂行为，还可以挖掘相关DOM元素的生命周期。 自定义元素定义使用返回CustomElementRegistry对象的全局customElements属性完成:

```js
console.log(customElements); // CustomElementRegistry {}
```

 定义自定义元素是使用define（）方法完成的。以下创建一个无聊的自定义元素，它继承自HTMLElement：

```js
class FooElement extends HTMLElement {}
customElements.define('x-foo', FooElement);
document.body.innerHTML = `
<x-foo >I'm inside a nonsense element.</x-foo >
`;
console.log(document.querySelector('x-foo') instanceof FooElement); // true
```
> 注意:自定义元素名称必须至少有一个连字符,且不能出现在名称的开头或结尾,还有元素标签不能是自我关闭的。

 自定义元素的强大在于包含在类定义中。例如，DOM中下面这个类的每个实例将调用你控制的构造函数：

```js
class FooElement extends HTMLElement {
    constructor() {
        super();
        console.log('x-foo')
    }
}
customElements.define('x-foo', FooElement);
document.body.innerHTML = `
<x-foo></x-foo>
<x-foo></x-foo>
<x-foo></x-foo>
`;
// x-foo
// x-foo
// x-foo
```

 >注意:super()必须始终先在自定义元素构造函数中调用。如果元素继承自HTMLElement或类似元素而不覆盖构造函数,
 >则不需要调用super() ,因为原型构造函数默认会这样做。定义不应从HTMLElement继承的自定义元素是非常罕见的。

如果自定义元素继承自元素类，则可以使用is特性和extends选项将标记指定为该自定义元素的实例：

```js
class FooElement extends HTMLDivElement {
    constructor() {
        super();
        console.log('x-foo')
    }
}
customElements.define('x-foo', FooElement, {
    extends: 'div'
});
document.body.innerHTML = `
<div is="x-foo"></div>
<div is="x-foo"></div>
<div is="x-foo"></div>
`;
// x-foo
// x-foo
// x-foo
```



#### 添加Web组件内容

 因为每次将元素添加到DOM时都会调用自定义元素类构造函数，所以很容易用子DOM内容自动填充自定义元素。尽管禁止在构造函数中添加DOM孩子（会抛出DOMException），但可以附加一个shadow DOM 并将内容放入其中：

```js
class FooElement extends HTMLElement {
    constructor() {
        super();
        // 'this' refers to the web component node
        this.attachShadow({
            mode: 'open'
        });
        this.shadowRoot.innerHTML = `
<p>I'm inside a custom element!</p>
`;
    }
}
customElements.define('x-foo', FooElement);
document.body.innerHTML += `<x-foo></x-foo`;
// Resulting DOM:
// <body>
// <x-foo>
// #shadow-root (open)
// <p>I'm inside a custom element!</p>
// <x-foo>
// </body>
```
 为了避免模板字符串和innerHTML的麻烦，这个例子可以使用HTML模板和document.createElement()重构：

```js
// (Initial HTML)
// <template id="x-foo-tpl">
// <p>I'm inside a custom element template!</p>
// </template>
const template = document.querySelector('#x-foo-tpl');
class FooElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}
customElements.define('x-foo', FooElement);
document.body.innerHTML += `<x-foo></x-foo`;
// Resulting DOM:
// <body>
// <template id="x-foo-tpl">
// <p>I'm inside a custom element template!</p>
// </template>
// <x-foo>
// #shadow-root (open)
// <p>I'm inside a custom element template!</p>
// <x-foo>
// </body>
```

 这种做法允许高度的HTML和代码重用以及自定义元素内的DOM封装。有了它，可以自由地构建可重用的小部件，而不必担心外部CSS会破坏样式。

#### 使用自定义元素生命周期钩子

 可以在自定义元素生命周期的各个点执行代码。具有相应名称的自定义元素类上的实例方法将在该生命周期阶段被调用。有五个可用的钩子：

-  在创建元素实例或将现有DOM元素升级为自定义元素时调用 constructor() 。

-  每次将自定义元素的实例添加到DOM时，都会调用 connectedCallback() 。

-  每次从DOM中删除自定义元素的实例时，都会调用 disconnectedCallback() 。

-  每次观察到的特性的值发生改变时，都会调用 attributeChangedCallback() 。当元素实例被实例化时，

-  初始值的定义算作改变。

-  每次使用document.adoptNode()将此实例移动到新文档对象时，都会调用 usedCallback() 。


 以下示例演示了构造、连接和断开连接的回调：

```js
class FooElement extends HTMLElement {
    constructor() {
        super();
        console.log('ctor');
    }
    connectedCallback() {
        console.log('connected');
    }
    disconnectedCallback() {
        console.log('disconnected');
    }
}
customElements.define('x-foo', FooElement);
const fooElement = document.createElement('x-foo');
// ctor
document.body.appendChild(fooElement);
// connected
document.body.removeChild(fooElement);
// disconnected
```



#### 反射自定义元素属性

 因为元素既作为DOM实体又作为JavaScript对象存在，一个常见的模式是反射两者之间的变化。换句话说，对DOM的更改应该反射对象的更改，反之亦然。为了从对象反射到DOM，一个常见的策略是使用getter和setter。以下示例将对象的bar属性反射到DOM：

```js
document.body.innerHTML = `<x-foo></x-foo>`;
class FooElement extends HTMLElement {
    constructor() {
        super();
        this.bar = true;
    }
    get bar() {
        return this.getAttribute('bar');
    }
    set bar(value) {
        this.setAttribute('bar', value)
    }
}
customElements.define('x-foo', FooElement);
console.log(document.body.innerHTML);
// <x-foo bar="true"></x-foo>
```

 反向反射(从DOM到对象)需为该属性设置一个监听器。为了实现这一点，可以使用observedAttributes()getter指示自定义元素在每次属性值更改时调用attributeChangedCallback()：

```js
class FooElement extends HTMLElement {
    static get observedAttributes() {
        // List attributes which should trigger attributeChangedCallback()
        return ['bar'];
    }
    get bar() {
        return this.getAttribute('bar');
    }
    set bar(value) {
        this.setAttribute('bar', value)
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            console.log(`${oldValue} -> ${newValue}`);
            this[name] = newValue;
        }
    }
}
customElements.define('x-foo', FooElement);
document.body.innerHTML = `<x-foo bar="false"></x-foo>`;
// null -> false
document.querySelector('x-foo').setAttribute('bar', true);
// false -> true
```
#### 升级自定义元素

 在自定义元素标签出现在DOM中之前，并不总是可以定义自定义元素。Web组件通过在CustomElementRegistry上公开几个附加方法来解决这个排序问题。

 如果自定义元素类已经定义，则CustomElementRegistry.get()方法返回自定义元素类。与此类似，CustomElementRegistry.whenDefined()方法返回一个promise，该promise在自定义元素被定义时解决：

```js
customElements.whenDefined('x-foo').then(() => console.log('defined!'));
console.log(customElements.get('x-foo'));
// undefined
customElements.define('x-foo', class {});
// defined!
console.log(customElements.get('x-foo'));
// class FooElement {}
```

 定义自定义元素时，连接到DOM的元素将自动升级。如果想在元素连接到DOM之前强制升级它，这可以通过CustomElementRegistry.upgrade()来完成：

```js
// Create HTMLUnknownElement object before custom element definition
const fooElement = document.createElement('x-foo');
// Define custom element
class FooElement extends HTMLElement {}
customElements.define('x-foo', FooElement);
console.log(fooElement instanceof FooElement); // false
// Force the upgrade
customElements.upgrade(fooElement);
console.log(fooElement instanceof FooElement); // true
```

>注意:还有一个HTML导入web组件,但仍然是一个工作草案,没有主流浏览器支持它。目前尚不清楚是否有任何浏览器最终
>会增加支持。

## 网络密码学 API

 Web Cryptography API(https://www.w3.org/TR/WebCryptoAPI)描述了一套加密工具，用于标准化JavaScript如何以安全和惯用的方式使用加密行为。这些工具包括生成、使用和应用加密密钥对的能力；加密和解密消息；并稳健地生成随机数。

### 随机数生成

 当任务是生成随机值时，大多数开发人员会使用Math.random()。此方法在浏览器中作为伪随机数生成器(PRNG)实现。 “伪”名称源于值生成的本质，因为它不是真正随机的。从PRNG产生的值仅与emulate属性与随机性相关联。这种随机性的出现是通过一些巧妙的工程实现的。浏览器的PRNG不使用任何真正的随机源——它纯粹是应用于密封的内部状态的固定算法。每次调用Math.random()时，内部状态都会被算法改变，结果被转换为新的随机值。例如，V8引擎使用一种称为xorshift128+的算法来执行这种变异。

 因为这个算法是固定的，它的输入只是先前的状态，所以随机数的顺序是确定的。xorshift128+使用 128位内部状态，该算法的设计使得任何初始状态在重复之前都会产生 2128 -1个伪随机值的序列。这种循环行为称为置换循环，该循环的长度称为周期。这意味着很明显：如果攻击者知道PRNG的内部状态，他们就能够预测它随后将发出的伪随机值。如果不知情的开发人员为了加密目的使用PRNG生成私钥，攻击者可以使用PRNG的属性来确定私钥。

 伪随机数生成器旨在能够快速计算看似随机的值。然而，它们不适合密码计算的目的。为了解决这个问题，加密安全伪随机数生成器(CSPRNG) 额外地将熵源作为其输入，例如测量硬件时序或表现出不可预测行为的其他系统属性。这样做比常规PRNG慢得多，但CSPRNG发出的值对于加密目的来说是完全不可预测的。

 Web Cryptography API引入了一个CSPRNG，可以通过crypto.getRandomValues()在全局Crypto对象上访问它。与Math.random()返回一个介于 0 和 1 之间的浮点数不同，getRandomValues()将随机数写入作为参数提供的定型数组中。定型数组类并不重要，因为底层缓冲区被随机二进制位填充。

 下例生成五个 8 位随机值：

```js
const array = new Uint8Array(1);
for (let i=0; i<5; ++i) {
    console.log(crypto.getRandomValues(array));
}
```

 getRandomValues() 将生成最多 216 个字节，超出它会抛出一个错误：

```js
const fooArray = new Uint8Array(2 ** 16);
console.log(window.crypto.getRandomValues(fooArray)); // Uint32Array(16384) [...]
const barArray = new Uint8Array((2 ** 16) + 1);
console.log(window.crypto.getRandomValues(barArray)); // Error
```

 使用CSPRNG重新实现Math.random()可以通过生成单个随机 32 位数字并将其除以最大可能值0xFFFFFFFF来完成。这会产生一个介于 0 和 1 之间的值：

```js
function randomFloat() {
    // Generate 32 random bits
    const fooArray = new Uint32Array(1);
    // Maximum value is 2^32 - 1
    const maxUint32 = 0xFFFFFFFF;
    // Divide by maximum possible value
    return crypto.getRandomValues(fooArray)[0] / maxUint32;
}
console.log(randomFloat()); // 0.5033651619458955
```

### 使用SubtleCrypto对象

 绝大多数Web Cryptography API驻留在SubtleCrypto对象中，可通过window.crypto.subtle访问：

```js
console.log(crypto.subtle); // SubtleCrypto {}
```
 该对象包含一组用于执行常见密码功能（例如加密、哈希、签名和密钥生成）的方法。因为所有加密操作都是在原始二进制数据上执行的，所以每个SubtleCrypto方法都可以处理ArrayBuffer和ArrayBufferView类型。由于字符串经常是加密操作的主题，因此TextEncoder和TextDecoder类通常与SubtleCrypto一起使用，以在字符串之间进行转换。

> 注意:SubtleCrypto对象只能在安全环境(https) 中访问。在不安全的环境中,subtle的属性将是undefined。

#### 生成加密摘要

 一种极其常见的加密操作是计算数据的加密摘要。该规范为此支持四种算法，SHA-1和三种SHA-2：

-  Secure Hash Algorithm 1 (SHA-1) 具有类似于MD5架构的哈希函数。它接受任何大小的输入并生成一个 160 位的消息摘要。该算法不再被认为是安全的，因为它容易受到碰撞攻击。

-  Secure Hash Algorithm 2 (SHA-2) 一系列哈希函数都建立在相同的抗碰撞单向压缩函数上。该规范支持该系列的三个成员：SHA-256、SHA-384和SHA-512。生成的消息摘要的大小可以是 256 位(SHA-256)、 384 位(SHA-384)或 512 位(SHA-512)。该算法被认为是安全的，并广泛用于许多应用程序和协议，包括TLS、PGP和比特币等加密货币。


 SubtleCrypto.digest()方法用于生成消息摘要。哈希算法使用字符串指定：SHA-1、SHA-256、SHA-384或SHA-512。下面的例子演示了一个简单的SHA-256应用来生成字符串foo的消息摘要：

```js
(async function() {
    const textEncoder = new TextEncoder();
    const message = textEncoder.encode('foo');
    const messageDigest = await crypto.subtle.digest('SHA-256', message);
    console.log(new Uint32Array(messageDigest));
})();
```

 通常，消息摘要二进制文件将以十六进制字符串格式使用。将数组缓冲区转换为这种格式是通过将缓冲区分成 8 位片段并使用以 16 为基数的toString()进行转换来完成的：

```js
(async function() {
    const textEncoder = new TextEncoder();
    const message = textEncoder.encode('foo');
    const messageDigest = await crypto.subtle.digest('SHA-256', message);
    const hexDigest = Array.from(new Uint8Array(messageDigest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
    console.log(hexDigest);
})();
```

 软件公司通常会发布其二进制安装文件的摘要，以便希望安全安装其软件的人可以验证他们下载的二进制文件是公司实际发布的版本（而不是注入恶意软件的版本）。以下示例下载Firefox v67.0，使用SHA-512对其进行哈希，下载SHA-512二进制验证，并检查两个十六进制字符串是否匹配：

```js
(async function() {
    const mozillaCdnUrl = '//downloadorigin.
    cdn.mozilla.net / pub / firefox / releases / 67.0 / ';
    const firefoxBinaryFilename = 'linux-x86_64/en-US/firefox-67.0.tar.bz2';
    const firefoxShaFilename = 'SHA512SUMS';
    console.log('Fetching Firefox binary...');
    const fileArrayBuffer = await (await fetch(mozillaCdnUrl +
                                               firefoxBinaryFilename))
    .arrayBuffer();
    console.log('Calculating Firefox digest...');
    const firefoxBinaryDigest = await crypto.subtle.digest('SHA-512',
                                                           fileArrayBuffer);
    const firefoxHexDigest = Array.from(new Uint8Array(firefoxBinaryDigest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
    console.log('Fetching published binary digests...');
    // The SHA file contains digests of every firefox binary in this release,
    // so there is some organization performed.
    const shaPairs = (await (await fetch(mozillaCdnUrl + firefoxShaFilename)).text())
    .split(/\n/).map((x) => x.split(/\s+/));
    let verified = false;
    console.log('Checking calculated digest against published digests...');
    for (const [sha, filename] of shaPairs) {
        if (filename === firefoxBinaryFilename) {
            if (sha === firefoxHexDigest) {
                verified = true;
                break;
            }
        }
    }
    console.log('Verified:', verified);
})();
// Fetching Firefox binary...
// Calculating Firefox digest...
// Fetching published binary digests...
// Checking calculated digest against published digests...
// Verified: true
```

#### 加密密钥和算法

 如果没有秘钥，密码学将毫无意义，而SubtleCrypto对象使用CryptoKey类的实例来藏起这些秘密。CryptoKey类支持多种类型的加密算法，并允许控制密钥提取和使用。

 CryptoKey类支持以下算法，按其父密码系统分类：

-  **RSA（Rivest-Shamir-Adleman）** 一种公钥密码系统，其中使用两个大素数来派生一对可用于签名/验证或加密/解密消息的公钥和私钥。 RSA的陷门（trapdoor）函数称为因式分解问题。

-  **RSASSA-PKCS1-v1_5** RSA的一种应用，用于使用私钥对消息进行签名，并允许使用公钥验证该签名。

  -  SSA代表signature schemes with appendix，表示该算法支持签名生成和验证操作。

  -  PKCS1代表Public-Key Cryptography Standards #1，表明该算法展示了RSA密钥必须具有的数学属性。
  -  RSASSA-PKCS1-v1_5是确定性的，这意味着每次执行相同的消息和密钥时都会产生相同的签名。

-  **RSA-PSS** RSA的另一应用，用于签名和验证消息。

  - PSS代表probabilistic signature scheme，表示签名生成包含盐(salt)来随机化签名。

  - 与RSASSA-PKCS1-v1_5不同，相同的消息和密钥在每次执行时都会产生不同的签名。

  -  与RSASSA-PKCS1-v1_5不同，RSA-PSS是可以证明可以简化RSA因式分解问题难度的。

  -  一般来说，虽然RSASSA-PKCS1-v1_5仍然被认为是安全的，但RSA-PSS应该被用作RSASSA-PKCS1-v1_5的替代品。

-  **RSA-OAEP** RSA的一种应用，用于使用公钥加密消息并使用私钥解之。

  -  OAEP代表Optimal Asymmetric Encryption Padding，表示该算法利用Feistel网络在加密之前处理未加密的消息。

  -  OAEP用于将确定性RSA加密方案转换为概率加密方案。

-  **ECC（Elliptic-Curve Cryptography）** 一种公钥密码系统，其中使用素数和椭圆曲线来派生一对可用于签名/验证消息的公钥和私钥。 ECC的陷门函数称为椭圆曲线离散对数问题(elliptic curve discrete logarithm problem)。 ECC被认为优于RSA：尽管RSA和ECC在密码学上都很强，但ECC密钥比RSA密钥短，并且ECC密码操作比RSA操作快。


-  **ECDSA（Elliptic Curve Diffie-Hellman）** ECC的一种应用，用于对消息进行签名和验证。该算法是数字签名算法(DSA)的椭圆曲线风格变体。

-  **ECDH（Elliptic Curve Diffie-Hellman）** ECC的密钥生成和密钥协商(key-agreement)应用，允许两方通过公共通信信道建立共享秘密。该算法是Diffie-Hellman密钥交换(DH)协议的椭圆曲线风格变体。

-  **AES（Advanced Encryption Standard）** 一种对称密钥密码系统，它使用源自替代置换网络(substitution-permutation network)的分组密码对数据进行加密/解密。AES用于不同的模式，这改变了算法的特性。

-  **AES-CTR** AES的计数器模式（counter mode）。此模式通过使用递增计数器来生成其密钥流，从而起到流密码的作用。它还必须提供一个随机数，它可以有效地用作初始化向量。AES-CTR加密/解密能够并行化。

-  **AES-CBC** AES的密码区块链模式。在加密明文的每个块之前，它是与之前的密文块异或（XOR)，因此以"链"为名。初始化矢量用作第一个块的异或输入。

-  **AES-GCM** AES的Galois/Counter模式。这种模式使用计数器和初始化向量来生成一个值，该值与每个块的明文进行异或。与CBC不同，异或输入不依赖于前一个块的加密，因此GCM模式可以并行化。由于其卓越的性能特点，AES-GCM在许多网络安全协议中得到使用。

-  **AES-KW** AES的密钥包装模式（key wrapping mode）。该算法将密钥包装成可移植的加密格式，可以安全地在不受信任的通道上传输。一旦发送，接收方就可以解开密钥。与其他AES模式不同，AES-KW 不需要初始化向量。

-  **HMAC （Hash-Based Message Authentication Code）** 一种生成消息身份验证代码（messageauthentication codes）的算法，用于验证消息在通过不受信任的网络发送时是否未更改到达。两方使用哈希函数和共享私钥对消息进行签名和验证。

-  **KDF （Key Derivation Functions）** 可以使用哈希函数从主密钥派生一个或多个密钥的算法。KDF能够生成不同长度的密钥或将密钥转换为不同的格式。

-  **HKDF （HMAC-Based Key Derivation Function）** 一种密钥派生函数，旨在与高熵（high-entropy）输入（例如现有密钥）一起使用。

-  **PBKDF2 （Password-Based Key Derivation Function 2）** 一种密钥派生函数，旨在与低熵输入（例如密码字符串）一起使用。


 CryptoKey支持大量算法，但只有部分算法适用于某些SubtleCrypto方法。有关哪些方法支持哪些算法的概述，请参阅规范：https://www.w3.org/TR/WebCryptoAPI/#algorithm-overview。

#### 生成加密密钥

 生成随机CryptoKey是通过SubtleCrypto.generateKey()方法完成的，该方法返回一个解决为一个或多个CryptoKey实例的promise。该方法被传递一个指定目标算法的参数对象、一个指示是否应从CryptoKey对象中提取密钥的布尔值，以及一个字符串数组——keyUsages——指示可以使用该密钥的哪些SubtleCrypto方法。

 因为不同的密码系统需要不同的输入来生成密钥，所以参数对象为每个密码系统提供所需的输入：

-  RSA密码系统使用RsaHashedKeyGenParams对象。

-  ECC密码系统使用EcKeyGenParams对象。

-  HMAC密码系统使用HmacKeyGenParams对象。

-  AES密码系统使用AesKeyGenParams对象。


 keyUsages对象描述了密钥可以使用的算法。它至少需要以下字符串之一：

-  encrypt

-  decrypt

-  sign

-  verify

-  deriveKey

-  deriveBits

-  wrapKey

-  unwrapKey



 假设要生成具有以下属性的对称密钥：

-  支持AES-CTR算法

-  密钥长度为 128 位

-  不可以从CryptoKey对象中提取

-  可以与encrypt()和decrypt()方法一起使用


 可以通过以下方式生成此密钥：

```js
(async function() {
    const params = {
        name: 'AES-CTR',
        length: 128
    };
    const keyUsages = ['encrypt', 'decrypt'];
    const key = await crypto.subtle.generateKey(params, false, keyUsages);
    console.log(key);
    // CryptoKey {type: "secret", extractable: true, algorithm: {...}, usages:
    Array(2)}
 })();
```

 假设要生成具有以下属性的非对称密钥对：

-  支持ECDSA算法

-  使用P-256椭圆曲线

-  可以从CryptoKey对象中提取

-  能够与sign()和verify()方法一起使用


 可以通过以下方式生成此密钥对：

```js
(async function() {
    const params = {
        name: 'ECDSA',
        namedCurve: 'P-256'
    };
    const keyUsages = ['sign', 'verify'];
    const {
        publicKey,
        privateKey
    } = await crypto.subtle.generateKey(params, true,
                                        keyUsages);
    console.log(publicKey);
    // CryptoKey {type: "public", extractable: true, algorithm: {...}, usages:
    Array(1)}
 console.log(privateKey);
// CryptoKey {type: "private", extractable: true, algorithm: {...}, usages:
Array(1)}
})();
```



#### 导出和导入密钥

 如果密钥是可提取的，则可以从CryptoKey对象内部公开原始密钥二进制文件。exportKey()方法允许这样做，同时还指定目标格式（raw、pkcs8、spki或jwk）。该方法返回一个解决为包含键的ArrayBuffer的promise：

```js
(async function() {
    const params = {
        name: 'AES-CTR',
        length: 128
    };
    const keyUsages = ['encrypt', 'decrypt'];
    const key = await crypto.subtle.generateKey(params, true, keyUsages);
    const rawKey = await crypto.subtle.exportKey('raw', key);
    console.log(new Uint8Array(rawKey));
    // Uint8Array[93, 122, 66, 135, 144, 182, 119, 196, 234, 73, 84, 7, 139, 43, 238,
    110]
})();
```
 exportKey()的逆操作是importKey()。该方法的签名本质上是generateKey()和exportKey()的组合。以下方法生成密钥，将其导出并再次导入：

```js
(async function() {
    const params = {
        name: 'AES-CTR',
        length: 128
    };
    const keyUsages = ['encrypt', 'decrypt'];
    const keyFormat = 'raw';
    const isExtractable = true;
    const key = await crypto.subtle.generateKey(params, isExtractable, keyUsages);
    const rawKey = await crypto.subtle.exportKey(keyFormat, key);
    const importedKey = await crypto.subtle.importKey(keyFormat, rawKey,
                                                      params.name,isExtractable, keyUsages);
    console.log(importedKey);
    // CryptoKey {type: "secret", extractable: true, algorithm: {...}, usages:
    Array(2)}
 })();
```



#### 从主密钥派生密钥

 SubtleCrypto对象允许从现有密钥派生具有可配置属性的新密钥。它支持一个deriveKey()方法，它返回一个解决为CryptoKey的promise，以及一个deriveBits()方法，返回一个解决为ArrayBuffer的promise。

>注意:deriveKey()和deriveBits()之间的区别是微不足道的,因为调用deriveKey()实际上与调用deriveBits()
>并将结果传递给importKey()相同。

 DeriveBits()函数接受一个算法参数对象、主密钥和输出的位长度。这可用于两个人（每个人都有自己的密钥对）希望获得共享密钥的情况。以下示例使用ECDH算法从两个密钥对生成互易密钥，并确保它们派生出相同的密钥位：

```js
(async function() {
    const ellipticCurve = 'P-256';
    const algoIdentifier = 'ECDH';
    const derivedKeySize = 128;
    const params = {
        name: algoIdentifier,
        namedCurve: ellipticCurve
    };
    const keyUsages = ['deriveBits'];
    const keyPairA = await crypto.subtle.generateKey(params, true, keyUsages);
    const keyPairB = await crypto.subtle.generateKey(params, true, keyUsages);
    // Derive key bits from A's public key and B's private key
    const derivedBitsAB = await crypto.subtle.deriveBits(
        Object.assign({
            public: keyPairA.publicKey
        }, params),
        keyPairB.privateKey,
        derivedKeySize);
    // Derive key bits from B's public key and A's private key
    const derivedBitsBA = await crypto.subtle.deriveBits(
        Object.assign({
            public: keyPairB.publicKey
        }, params),
        keyPairA.privateKey,
        derivedKeySize);
    const arrayAB = new Uint32Array(derivedBitsAB);
    const arrayBA = new Uint32Array(derivedBitsBA);
    // Ensure key arrays are identical
    console.log(
        arrayAB.length === arrayBA.length &&
        arrayAB.every((val, i) => val === arrayBA[i])); // true
})();
```

 DeriveKey()方法的行为类似，返回一个CryptoKey的实例而不是一个ArrayBuffer。以下示例采用原始字符串(raw string)，应用PBKDF2算法将其导入原始主密钥，并以AES-GCM格式派生新密钥：

```js
(async function() {
    const password = 'foobar';
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const algoIdentifier = 'PBKDF2';
    const keyFormat = 'raw';
    const isExtractable = false;
    const params = {
        name: algoIdentifier
    };
    const masterKey = await window.crypto.subtle.importKey(
        keyFormat,
        (new TextEncoder()).encode(password),
        params,
        isExtractable,
        ['deriveKey']
    );
    const deriveParams = {
        name: 'AES-GCM',
        length: 128
    };
    const derivedKey = await window.crypto.subtle.deriveKey(
        Object.assign({
            salt,
            iterations: 1E5,
            hash: 'SHA-256'
        }, params),
        masterKey,
        deriveParams,
        isExtractable,
        ['encrypt']
    );
    console.log(derivedKey);
    // CryptoKey {type: "secret", extractable: false, algorithm: {...}, usages:
    Array(1)}
 })();
```
#### 使用非对称密钥签署和验证消息

 SubtleCrypto对象允许用公钥算法使用私钥生成签名;或使用公钥验证签名。分别使用SubtleCrypto.sign()和SubtleCrypto.verify()方法执行。

 对消息进行签名需要一个参数对象来指定算法和任何必要的值、私有CryptoKey以及要签名的ArrayBuffer或ArrayBufferView。以下示例生成椭圆曲线密钥对并使用私钥对消息进行签名：

```js
(async function() {
    const keyParams = {
        name: 'ECDSA',
        namedCurve: 'P-256'
    };
    const keyUsages = ['sign', 'verify'];
    const {
        publicKey,
        privateKey
    } = await crypto.subtle.generateKey(keyParams, true,
                                        keyUsages);
    const message = (new TextEncoder()).encode('I am Satoshi Nakamoto');
    const signParams = {
        name: 'ECDSA',
        hash: 'SHA-256'
    };
    const signature = await crypto.subtle.sign(signParams, privateKey, message);
    console.log(new Uint32Array(signature));
    // Uint32Array(16) [2202267297, 698413658, 1501924384, 691450316, 778757775, ...
})();
```

 希望根据签名验证此消息的个人可以使用公钥和SubtleCrypto.verify()方法。此方法的签名几乎与sign()相同，不同之处在于它必须提供公钥和签名。以下示例通过验证生成的签名扩展了前面的示例：

```js
(async function() {
    const keyParams = {
        name: 'ECDSA',
        namedCurve: 'P-256'
    };
    const keyUsages = ['sign', 'verify'];
    const {
        publicKey,
        privateKey
    } = await crypto.subtle.generateKey(keyParams, true,
                                        keyUsages);
    const message = (new TextEncoder()).encode('I am Satoshi Nakamoto');
    const signParams = {
        name: 'ECDSA',
        hash: 'SHA-256'
    };
    const signature = await crypto.subtle.sign(signParams, privateKey, message);
    const verified = await crypto.subtle.verify(signParams, publicKey, signature,
                                                message);
    console.log(verified); // true
})();
```
#### 使用对称密钥加密和解密

 SubtleCrypto对象允许使用公钥和对称算法来加密和解密消息。这些分别使用SubtleCrypto.encrypt()和SubtleCrypto.decrypt()方法来执行。

 加密消息需要一个参数对象来指定算法和任何必要的值、加密密钥和要加密的数据。以下示例生成对称AES-CBC密钥，对其进行加密，最后解密消息：

```js
(async function() {
    const algoIdentifier = 'AES-CBC';
    const keyParams = {
        name: algoIdentifier,
        length: 256
    };
    const keyUsages = ['encrypt', 'decrypt'];
    const key = await crypto.subtle.generateKey(keyParams, true,
                                                keyUsages);
    const originalPlaintext = (new TextEncoder()).encode('I am Satoshi Nakamoto');
    const encryptDecryptParams = {
        name: algoIdentifier,
        iv: crypto.getRandomValues(new Uint8Array(16))
    };
    const ciphertext = await crypto.subtle.encrypt(encryptDecryptParams, key,
                                                   originalPlaintext);
    console.log(ciphertext);
    // ArrayBuffer(32) {}
    const decryptedPlaintext = await crypto.subtle.decrypt(encryptDecryptParams, key,
                                                           ciphertext);
    console.log((new TextDecoder()).decode(decryptedPlaintext));
    // I am Satoshi Nakamoto
})();
```



#### 包装和解包密钥

 SubtleCrypto对象允许包装和解包密钥以允许通过不受信任的通道进行传输。分别使用SubtleCrypto.wrapKey()和SubtleCrypto.unwrapKey()方法来执行。

 包装密钥需要格式字符串、要包装的CryptoKey实例、用于执行包装的CryptoKey以及用于指定算法和任何必要值的参数对象。以下示例生成对称AES-GCM密钥，使用AES-KW包装密钥，最后解包密钥：

```js
(async function() {
    const keyFormat = 'raw';
    const extractable = true;
    const wrappingKeyAlgoIdentifier = 'AES-KW';
    const wrappingKeyUsages = ['wrapKey', 'unwrapKey'];
    const wrappingKeyParams = {
        name: wrappingKeyAlgoIdentifier,
        length: 256
    };
    const keyAlgoIdentifier = 'AES-GCM';
    const keyUsages = ['encrypt'];
    const keyParams = {
        name: keyAlgoIdentifier,
        length: 256
    };
    const wrappingKey = await crypto.subtle.generateKey(wrappingKeyParams, extractable,
                                                        wrappingKeyUsages);
    console.log(wrappingKey);
    // CryptoKey {type: "secret", extractable: true, algorithm: {...}, usages: Array(2)}
    const key = await crypto.subtle.generateKey(keyParams, extractable, keyUsages);
    console.log(key);
    // CryptoKey {type: "secret", extractable: true, algorithm: {...}, usages: Array(1)}
    const wrappedKey = await crypto.subtle.wrapKey(keyFormat, key, wrappingKey,
                                                   wrappingKeyAlgoIdentifier);
    console.log(wrappedKey);
    // ArrayBuffer(40) {}
    const unwrappedKey = await crypto.subtle.unwrapKey(keyFormat, wrappedKey,
                                                       wrappingKey, wrappingKeyParams, keyParams, extractable, keyUsages);
    console.log(unwrappedKey);
    // CryptoKey {type: "secret", extractable: true, algorithm: {...}, usages: Array(1)}
})()
```
