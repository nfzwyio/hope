---
permalink: /js/chapter12/
title: 第12章 BOM
createTime: 2024/10/18 16:28:56
---
# 第12章 BOM

## window对象

 BOM的核心是window对象，代表浏览器的一个实例。

 window对象在浏览器中有两种用途：充当浏览器窗口的JavaScript接口和ECMAScript Global对象，这意味着任何定义在网页上的对象、变量、函数等将使用window做其全局对象。

## 全局作用域

 因为window对象是ECMAScript全局对象的替身，所有使用var关键字声明的函数和变量会成为window对象的属性和方法。

 let和const声明的变量或属性不会附加到全局对象。

 试图访问未定义的变量将抛出错误，但是可以通过查询window对象来检查是否存在未声明的变量。

```js
// oldValue未定义,将抛异常
var newValue = oldValue;//ReferenceError: oldValue is not defined.
// 不会抛异常,因为是属性查找,newValue被设置为undefined
var newValue = window.oldValue;
```



## Window关系

 top对象总是指向最外层窗口——浏览器窗口本身。

 另一个window对象叫parent，其指向当前窗口的直接父窗口。最外层的浏览器窗口，parent等同top(都等同于window)。

 有一个叫self的window属性，总是指向window。

 所有这些对象都是window的属性，可通过window.parent,window.top等访问。

## Window位置和像素比例

 moveTo()方法参数x,y为绝对坐标。

 moveBy()方法参数x,y为相对坐标。

```js
// 移动窗口到左上角坐标
window.moveTo(0, 0);
// 向下移动窗口100像素
window.moveBy(0, 100);
// 移动窗口到位置(200, 300)
window.moveTo(200, 300);
// 向左移动窗口50像素
window.moveBy(-50, 0);
//只有在window.open()方法创建的窗口才有效
```



## 像素比例

 “ CSS像素”是网站开发中普遍使用的像素名称。

 相同像素在不同分辨率上应该有一样的尺寸，这样系统就需要一个缩放因子来把物理像素转换为CSS像素。

 例如，手机的物理分辨率为1920x1080，因为这些像素非常小所以web浏览器将其缩放到更小的逻辑分辨率如640x360。浏览器提供了缩放因子window.devicePixelRatio。从1920x1080到640x360缩放因子devicePixelRatio为 3 。

### Window尺寸

 document.documentElement.clientWidth和document.documentElement.clientHeight属性指页面视口的宽和高。

![](/js_img/805.png)



```js
console.log(`window.outerWidth:${window.outerWidth}`); //window.outerWidth:1012
console.log(`window.outerHeight:${window.outerHeight}`); //window.outerHeight:587
console.log(`window.innerWidth:${window.innerWidth}`); // window.innerWidth:558
console.log(`window.innerHeight:${window.innerHeight}`); // window.innerHeight:499
console.log(document.documentElement);//即html元素
console.log(`document.documentElement.clientWidth:${document.documentElement.clientWidth}
`);//document.documentElement.clientWidth:558 html的宽,受控制台宽度影响
console.log(`document.documentElement.clientHeight:${document.documentElement.clientHeigh
            t}`);//document.documentElement.clientHeight:499同window.innerHeight
console.log(`document.body.clientWidth:${document.body.clientWidth}`);//document.body.cli
entWidth:542
console.log(`document.body.clientHeight:${document.body.clientHeight}`);//document.body.c
lientHeight:0
```

### Window视口位置

 由于浏览器窗口通常不够大，无法一次显示整个渲染的文档，因此用户可以使用有限的视口在文档周围滚动。

```js
window.scroll(66,66);
console.log(`window.scrollX:${window.scrollX}`);//66
console.log(`window.scrollY:${window.scrollY}`);//66
window.scrollTo(100,100);
console.log(`window.scrollX:${window.scrollX}`);//100
console.log(`window.scrollY:${window.scrollY}`);//100
window.scrollBy(88,88);
console.log(`window.scrollX:${window.scrollX}`);//188
console.log(`window.scrollY:${window.scrollY}`);//188
window.scrollTo({
    left: 1000,
    top: 1000,
    behavior: 'smooth'//平滑移动
});
```

### 导航和打开窗户

 window.open（）方法可用于导航到特定URL，也可用于打开新的浏览器窗口。此方法接受四个参数：加载的URL,window目标，特征字符串，和一个布尔值(决定新的网页是否取代当前已加载的网页，只有在不打开新窗口时有用)。

```js
let strWindowFeatures =
`
menubar=yes,
location=yes,
resizable=yes,
scrollbars=yes,
status=yes
`;
window.open("http://www.bilibili.com/", "topFrame",strWindowFeatures);
window.open("", "topFrame",strWindowFeatures);//空白页
```



### 弹窗

 当第二个参数不能识别存在的window时，一个新window或tab将基于第三个参数创建(若无则创建默认window或tab)。

 第三个参数是逗号分隔的字符串，主要选择如下：

| 设置       | 值      | 描述                                                         |
| ---------- | ------- | ------------------------------------------------------------ |
| fullscreen | yes或no | 是否全屏,仅适用IE                                            |
| height     | Number  | 新窗口初始高度,不能低于100                                   |
| width      | Number  | 新窗口初始宽度,不能少于100                                   |
| left       | Number  | 新窗口初始left坐标,不能为负值                                |
| top        | Number  | 新窗口初始top坐标,可为负值                                   |
| location   | yes或no | 是否展示地址栏,默认值因浏览器而异,当设置为no时,地址栏被隐藏或禁用 |
| menubar    | yes或no | 是否展示菜单栏,默认为no                                      |
| resizable  | yes或no | 是否可以拖拽新窗口边界缩放,默认为no                          |
| scrollbars | yes或no | 当内容不匹配视口时新窗口是否可以滚动,默认为no                |
| status     | yes或no | 是否展示状态栏,默认值因浏览器而异                            |
| toolbar    | yes或no | 是否展示工具栏,默认为no                                      |



 **特征字符串间不允许有空格** 。

 window.open()返回一个新创建的window对象的引用，此对象与其他窗口对象相同，但拥有更多控制权，例如：有些浏览器默认不允许缩放或移动主窗口，但使用window.open()创建的却可以：

```js
let mybili = window.open("http://www.bilibili.com/", "666",
                         "width=500,height=500,top=50,left=10");
mybili.resizeTo(600,600);
mybili.moveTo(100,100);
mybili.close();//只能用于window.open()创建的弹窗
console.log(mybili.closed);//true
//可通过opener属性获取打开新窗口对象的窗口对象
console.log(mybili.opener);//Window
```

 一些浏览器尝试将每个标签页运行在单独的进程中。当一个标签页打开另一个时，窗口对象需要能够与另一个通信，所以这些标签页不能运行在单独的进程里，这些浏览器允许通过设置opener属性为null来指示新创建的标签页运行在单独的进程里。

### 安全限制

 弹出窗口经历了广告商在网上过度使用的时期。弹出窗口通常伪装成系统对话，以便用户点击广告。由于这些弹出式网页的样式看起来像系统对话，因此用户不清楚这些对话是否合法。为了帮助做出这一决定，浏览器开始限制弹出窗口的配置。

 早期版本的IE在弹出窗口上实现了多个安全功能，包括不允许创建弹出窗口或移离屏幕，并确保状态栏不能关闭。从IE7开始，位置栏无法关闭，并且默认无法移动或调整弹出窗口。Firefox1关闭了抑制状态栏的功能，因此所有弹出窗口必须显示状态栏，而不管进入窗口的功能字符串如何。firefox3强制位置栏始终显示在弹出窗口上。Opera仅在其主浏览器窗口内打开弹出窗口，但不允许它们在与系统对话混淆的地方存在。

 此外，浏览器仅允许在用户操作后创建弹出窗口。例如，当页面仍在加载时，调用window.open()将不会执行，并可能导致向用户显示错误。弹出窗口只能根据单击或按键打开。

### 弹窗拦截

 当浏览器或其他拦截程序屏蔽弹窗时，window.open()通常会抛出异常。

```js
let blocked = false;
try {
    let mb = window.open("http://www.bilibili.com/", "_blank",
                         "width=500,height=500,top=50,left=10");
    if (mb == null) {
        blocked = true;
    }
} catch (ex) {
    blocked = true;
}
if (blocked) {
    alert("请允许此弹窗!");
}
```

### Interval和Timeout

 JavaScript在浏览器中执行是单线程的，但可以使用Interval和Timeout来安排代码在特定的时间点执行。

 Timeout在一段指定时间过后执行代码，Interval间隔特定的时间重复执行代码。

 当setTimeout()调用时，将返回一个独一无二的数字ID，传入clearTimeout()可用于取消待执行的timeout。

```js
let timeoutID = setTimeout(() => alert("Hello world!"), 2000);
console.log(timeoutID);//1
clearTimeout(timeoutID);//不弹hello world
```

 setInterval()接受两个参数，要执行的代码(字符串或函数)和添加回调到执行队列需等待的时间。

```js
setInterval(()=>console.log('666'),1000);
```

 setInterval()也返回interval ID,传入clearInterval()用于取消所有待执行的interval。这比timeout重要，如果不检查，interval将执行到页面关闭：

```js
let num = 0,
    intervalId = null;
let max = 10;
let incrementNumber = function() {
    num++;
    // 如果到达max,取消所有待定的执行
    if (num == max) {
        clearInterval(intervalId);
        alert("Done");
    }
}
intervalId = setInterval(incrementNumber, 500);
```

 interval很少用于生产环境，因为一个interval结束到下一个interval开始之间的时间不一定得到保证，所以尽量避免使用interval而使用timeout。

### 系统对话框

 浏览器可通过alert(),confirm(),prompt()调用系统对话框，它们的样式是由系统或浏览器设置决定的而不是css，每个对话框都是同步和模态(modal)的,当对话框出现时代码执行将暂停，直到对话解除。

 alert()只接受一个字符串参数，如果不是基本字符串其将通过tostring()方法强制转换。

 confirm()返回一个布尔值，用户点击OK为true，Cancle或X为false。

```js
if (confirm("Are you sure?")) {
    alert("I'm so glad you're sure!");
} else {
    alert("I'm sorry to hear you're not sure.");
}
```

 promt()提示用户输入，接受两个参数，展示给用户的文本和文本盒子的默认值。点击OK将返回消息盒子的值，取消或关闭返回null。

```js
let result = prompt("What is your name? ", "666");
if (result !== null) {
    alert("Welcome, " + result);
}
```

### location对象

 location提供window当前加载的document信息和导航功能。

 location对象即是window的属性也是document的属性，window.location和document.location指向相同的对象。

 location不仅知道当前加载的文档，还可将URL解析为可通过一系列属性访问的离散片段。

```js
console.log(location);
// hash: ""
// host: "panda.com"
// hostname: "panda.com"
// href: "http://panda.com/"
// origin: "http://panda.com"
// pathname: "/"
// port: ""
// protocol: "http:"
```

 如果浏览器位于http://foouser:barpassword@www.wrox.com:80/WileyCDA/?q=javascript#contents则location属性和值如下：

| 属性名   | 返回值                                                   | 描述                                                 |
| -------- | -------------------------------------------------------- | ---------------------------------------------------- |
| location | "#contents"                                              | URL哈希(#后面零个或多个字符)或空                     |
| hash     | ""                                                       | 字符串                                               |
| host     | "www.wrox.com:80"                                        | 服务器名称和展示的端口号                             |
| hostname | "www.wrox.com"                                           | 没有端口号的服务器名                                 |
| href     | "http://www.wrox.com:80/WileyCDA/?q=javascript#contents" | 当前加载页面的完整URL,location的tostring方法返回此值 |
| pathname | "/WileyCDA/"                                             | URL的目录和/或文件名                                 |
| port     | "80"                                                     | 请求的端口(如果在URL中指定)                          |
| protocol | "http:"                                                  | 页面使用的协议                                       |
| search   | "?q=javascript"                                          | URL的查询字符串。它返回以问号开头的字符串            |
| username | "foouser"                                                | 域名前指定的用户名                                   |
| password | "barpassword"                                            | 域名前指定的密码                                     |
| origin   | "http:// www.wrox.com"                                   | 原始URL,只读                                         |

### 查询字符串参数

 location中的大多数信息可以很容易从上面这些属性中访问。URL没有提供的一部分是易于使用的查询字符串。虽然location.search返回从问号到URL结束的所有内容，但无法立即逐一访问查询字符串参数。下列函数解析查询字符串，并返回每个参数条目的对象：

```js
let getQueryStringArgs = function() {
    // 获取除去开头'?'的查询字符串
    let qs = (location.search.length > 0 ? location.search.substring(1) : ""),
        // 保存数据的对象
        args = {};
    // 分配每一项到args对象
    for (let item of qs.split("&").map(kv => kv.split("="))) {
        let name = decodeURIComponent(item[0]),
            value = decodeURIComponent(item[1]);
        if (name.length) {
            args[name] = value;
        }
    }
    return args;
    // 假设查询字符串为:?q=javascript&num=10
    let args = getQueryStringArgs();
    alert(args["q"]); // "javascript"
    alert(args["num"]); // "10"
```

### URLSearchParams

 URLSearchParams提供了一系列实用方法，可以使用标准API检查和修改查询参数。

 通过将查询字符串传递给构造函数来创建URLSearchParams实例。该实例提供了get(),set()和delete()之类的各种方法来执行查询字符串操作:

```js
let qs = "?q=javascript&num=10";
let searchParams = new URLSearchParams(qs);
alert(searchParams.toString()); // " q=javascript&num=10"
searchParams.has("num"); // true
searchParams.get("num"); // 10
searchParams.set("page", "3");
alert(searchParams.toString()); // " q=javascript&num=10&page=3"
searchParams.delete("q");
alert(searchParams.toString()); // " num=10&page=3"
```

 大多数支持URLSearchParams的浏览器也支持使用URLSearchParams作为可迭代对象:

```js
let qs = "?q=javascript&num=10";
let searchParams = new URLSearchParams(qs);
for (let param of searchParams) {
    console.log(param);
}
// ["q", "javascript"]
// ["num", "10"]
```



### 操控location

 可使用location对象的多种方式更改浏览位置。第一种也是最常见的方法是使用assign（）方法传入URL：

```js
location.assign("http://www.bilibili.com/");//当前页跳转到b站
window.location = "http://www.bilibili.com/";
location.href = "http://www.bilibili.com/";
```

 改变location对象的多个属性可修改当前加载的页面：

```js
// 假设开始位置为 http://www.wrox.com/WileyCDA/
// changes URL to "http://www.wrox.com/WileyCDA/#section1"
location.hash = "#section1";
// changes URL to "http://www.wrox.com/WileyCDA/?q=javascript"
location.search = "?q=javascript";
// changes URL to "http://www.yahoo.com/WileyCDA/"
location.hostname = "www.yahoo.com";
// changes URL to "http://www.yahoo.com/mydir/"
location.pathname = "mydir";
// changes URL to "http://www.yahoo.com:8080/WileyCDA/
Location.port = 8080;
```

 每次更改location的属性（hash除外）时，页面都会使用新的URL重新加载。

 使用如上方式改变URL时，浏览器历史记录栈将新增一个条目，故用户可点击后退按钮导航到之前的页面。

 使用replace()方法不会在浏览器历史记录栈新增条目，因此不可使用后退按钮导航到之前页面：

```js
setTimeout(() => location.replace("http://www.wrox.com/"), 1000);
```



### Navigator对象

 navigator对象在所有支持JavaScript的Web浏览器中都很常见。与其他BOM对象一样，每个浏览器都支持自己的一组属性。

 navigator对象的属性和方法定义在NavigatorID,NavigatorLanguage,NavigatorOnLine,NavigatorContentUtils,NavigatorStorage,NavigatorStorageUtils,NavigatorConcurrentHardware,NavigatorPlugins和NavigatorUserMedia等接口中。

 下表列出了每个可用属性和方法：

```js
console.log(navigator);
Navigator {
    appCodeName: "Mozilla"
    appName: "Netscape"
    appVersion: "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like
    Gecko) Chrome/95.0.4638.10 Safari/537.36"
    bluetooth: Bluetooth {}
    clipboard: Clipboard {}
    connection: NetworkInformation {
        onchange: null,
            effectiveType: '4g',
                rtt: 200,
                    downlink: 2.65,
                        saveData: false
    }
    cookieEnabled: true
    credentials: CredentialsContainer {}
    deviceMemory: 8
    doNotTrack: null
    geolocation: Geolocation {}
    hardwareConcurrency: 8
    hid: HID {
        onconnect: null,
            ondisconnect: null
    }
    ink: Ink {}
    keyboard: Keyboard {}
    language: "zh-CN"
    languages: (2)['zh-CN', 'zh']
    locks: LockManager {}
    managed: NavigatorManagedData {
        onmanagedconfigurationchange: null
    }
    maxTouchPoints: 0
    mediaCapabilities: MediaCapabilities {}
    mediaDevices: MediaDevices {
        ondevicechange: null
    }
    mediaSession: MediaSession {
        metadata: null,
            playbackState: 'none'
    }
    mimeTypes: MimeTypeArray {
        0: MimeType,
            1: MimeType,
                application / pdf: MimeType,
                    text / pdf: MimeType,
                        length: 2
    }
    onLine: true
    pdfViewerEnabled: true
    permissions: Permissions {}
    platform: "Win32"
    plugins: PluginArray {
        0: Plugin,
            1: Plugin,
                2: Plugin,
                    3: Plugin,
                        4: Plugin,
                            PDF Viewer: Plugin,
                                Chrome PDF Viewer: Plugin,
                                    Chromium PDF Viewer: Plugin,
                                        Microsoft Edge PDF Viewer: Plugin,
                                            WebKit built - in PDF: Plugin,
                                                ...
    }
                                            presentation: Presentation {
                                                defaultRequest: null,
                                                    receiver: null
                                            }
        product: "Gecko"
        productSub: "20030107"
        scheduling: Scheduling {}
        serial: Serial {
            onconnect: null,
                ondisconnect: null
        }
        serviceWorker: ServiceWorkerContainer {
            controller: null,
                ready: Promise,
                    oncontrollerchange: null,
                        onmessage: null,
                            onmessageerror: null
        }
        storage: StorageManager {}
        usb: USB {
            onconnect: null,
                ondisconnect: null
        }
        userActivation: UserActivation {
            hasBeenActive: true,
                isActive: true
        }
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,
        like Gecko) Chrome/95.0.4638.10 Safari/537.36"
        userAgentData: NavigatorUAData {
            brands: Array(3),
                mobile: false,
                    platform: 'Windows'
        }
        vendor: "Google Inc."
        vendorSub: ""
        virtualKeyboard: VirtualKeyboard {
            boundingRect: DOMRect,
                overlaysContent: false,
                    ongeometrychange: null
        }
        wakeLock: WakeLock {}
        webdriver: false
        webkitPersistentStorage: DeprecatedStorageQuota {}
        webkitTemporaryStorage: DeprecatedStorageQuota {}
        xr: XRSystem {
            ondevicechange: null
        }
        [
            [Prototype]
        ]: Navigator
    }
```



 具体参考: https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator

### 插件检测

 最常见的检测程序之一是确定浏览器是否安装了特定的插件。对于除IE10及以下外的所有浏览器，这可以使用plugins数组来确定。数组中的每一项都包含以下属性：

-  name 插件名

-  description 插件描述

-  filename 插件的文件名

-  length 该插件处理的MIME类型数量


 插件检测通过循环遍历所有可用的插件并将插件名称与给定名称进行比较，如下所示：

```js
let hasPlugin = function(name) {
    name = name.toLowerCase();
    for (let plugin of window.navigator.plugins) {
        if (plugin.name.toLowerCase().indexOf(name) > -1) {
            return true;
        }
    }
    return false;
}
// detect flash
alert(hasPlugin("Flash"));
// detect quicktime
alert(hasPlugin("QuickTime"));
```



### 注册handler

 现代浏览器正式支持navigator.registerProtocolHandler()方法。这些方法允许网站表明它可以处理特定类型的信息。如在线RSS阅读器和在线电子邮件应用程序。

 可通过registerProtocolHandler()调用协议，其接受三个参数:要处理的协议（即"mailto"或"ftp"),处理协议的页面的URL和应用名。例如，注册一个网页应用程序为默认的邮件客户端：

```js
navigator.registerProtocolHandler("mailto","http://www.somemailclient.com?cmd=%s","Some Mail Client");
```

 在此示例中，处理程序注册为mailto协议，该协议现在将指向基于Web的电子邮件客户端。第二个参数是应处理请求的URL，并且%s表示原始请求。

### screen对象

 屏幕对象（也是window的属性）是很少使用或根本没有编程使用的少数JavaScript对象之一。它仅用于指示客户端功能。此对象提供有关客户端在浏览器窗口外的显示的信息，包括像素宽度和高度等信息。每个浏览器在屏幕对象上提供不同的属性。

```js
console.log(window.screen);
// availHeight: 1080
// availLeft: 0
// availTop: 0
// availWidth: 1920
// colorDepth: 24
// height: 1080
// orientation: ScreenOrientation {angle: 0, type: "landscape-primary",
// onchange: null}
// pixelDepth: 24
// width: 1920
// __proto__: Screen
```

| 属性        | 描述                                      |
| ----------- | ----------------------------------------- |
| availHeight | 屏幕像素高度减去系统元素(如window任务栏)  |
| availWidth  | 屏幕像素宽度减去系统元素占用的宽度        |
| availLeft   | 左起第一个未被系统元素占用的像素(只读)    |
| availTop    | 顶部起第一个未被系统元素占用的像素(只读)  |
| colorDepth  | 用于表示颜色的位数;大多数系统为32位(只读) |
| height      | 屏幕像素高度                              |
| width       | 屏幕像素宽度                              |
| orientation | 返回屏幕方向API中指定的屏幕方向           |

### history对象

 历史记录对象代表自首次使用给定窗口以来用户的导航历史记录。由于历史记录是窗口的属性，因此每个浏览器窗口对象都有自己的历史记录对象，专门与该实例相关。出于安全原因，无法确定用户访问过的网址。但是，可以在用户不知道确切URL的情况下前后浏览列表。

### 导航

 go（）方法可在用户历史记录中向后或向前导航。此方法接受单个参数，该参数是一个整数，表示要前进或后退的页面数。负数在历史记录中向后移动（类似于单击浏览器的“后退”按钮），正数向前（类似于单击浏览器的“前进”按钮）。

```js
// 后退一页
history.go(-1);
// 前进一页
history.go(1);
// 前进两页
history.go(2);
```



### 历史记录状态管理

 现代Web应用程序编程中最困难的方面之一是历史记录管理，将用户带到一个全新页面的日子已经一去不复返了，这也意味着将“后退”和“前进”按钮从用户手中夺走了，这是一种常见的说法，即“使我进入另一种状态”。解决该问题的第一步是hashchange事件（在“事件”一章中进行了讨论）。 HTML5更新了历史记录对象，以提供简单的状态管理。