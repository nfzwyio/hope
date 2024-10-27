---
permalink: /js/chapter15/
title: 第15章 DOM扩展
createTime: 2024/10/18 16:28:56
---
# 第15章 DOM扩展

## 选择器API

 JavaScript库最流行的功能之一是能够获取与使用CSS选择器指定的模式匹配的多个DOM元素。实际上，jQuery库（www.jquery.com）完全围绕DOM文档的CSS选择器查询构建，以便获取对元素的引用，而不是使用getElementById（）和getElementsByTagName（）。

## querySelector()方法

 querySelector（）方法接受CSS查询并返回与模式匹配的第一个后代元素；如果没有匹配的元素，则返回null。如下所示：

```js
// 获得body元素
let body = document.querySelector("body");
// 使用ID "myDiv"获取element元素
let myDiv = document.querySelector("#myDiv");
// 获取类名为"selected"的第一个元素
let selected = document.querySelector(".selected");
// 获取类名为"button"的第一张图片
let img = document.body.querySelector("img.button");
```

 在Document类型上使用querySelector（）方法时，它将查询匹配整个document；当用于Element类型时，仅查询元素的后代进行匹配。

### querySelectorAll()方法

 querySelectorAll()方法接受的参数同querySelector()，但返回所有匹配的节点：一个NodeList静态实例。

 需要清楚的是，此返回值也是有相同属性和方法的NodeList，其底层实现是 **充当元素的快照** 而不是对文档不断的进行动态查询。此实现消除了与使用NodeList对象相关的大多数性能开销:

```js
// 获取<div>中的所有<em> (类似于getElementsByTagName("em"))
let ems = document.getElementById("myDiv").querySelectorAll("em");
// 获取类名为"selected"的所有元素
let selecteds = document.querySelectorAll(".selected");
// 获取<p>中的所有<strong>元素
let strongs = document.querySelectorAll("p strong");
```

 返回的NodeList对象可使用迭代钩子item(),也可使用方括号标记获取单个元素。

### matches()方法

 matches()方法接受单个参数：一个css选择器，如果给定元素匹配则返回true否则返回false。可使用该方法检查某个引用的元素是否可由querySelectorAll()或querySelector()返回:

```js
if (document.body.matches("body.page1")) {
    // true
}
```



## 元素遍历

 元素遍历API添加了 5 个新属性到DOM元素：

-  childElementCount 返回子元素数量(包括文本节点和注释)。

-  firstElementChild 指向是元素的第一个孩子，仅元素可用的版本是firstChild。

-  lastElementChild 指向是元素的最后一个孩子，仅元素可用的版本是lastChild。

-  previousElementSibling 指向是元素的上一个同胞，仅元素可用的版本是previousSibling。

-  nextElementSibling 指向是元素的下一个同胞，仅元素可用的版本是nextSibling。


## HTML5

### 类相关的添加

#### getElementsByClassName()方法

 HTML5最受欢迎的附加功能之一是getElementsByClassName（），可在文档对象和所有HTML元素上使用。该方法接受一个参数，包含 一个或多个类名的字符串 ，返回一个包含所有符合条件的元素的NodeList。示例如下：

```html
<div id="myDiv"></div>
<div class="username">1</div>
<div class="current username">2</div>
<div class="current">3</div>
```

 

```js
//获取所有同时包含username和current的元素,类名顺序不重要
let allCurrentUsernames = document.getElementsByClassName("username current");
console.log(allCurrentUsernames);//[div.current.username]
// 获取myDiv子树中所有类名为selected的元素
let selected = document.getElementById("myDiv").getElementsByClassName("selected");
```

 **由于返回的值是NodeList，因此与使用getElementsByTagName（）和其他返回NodeList对象的DOM方法一样，存在相同的性能问题** 。

#### classList属性

 在类名操作中，className属性用于添加，删除和替换类名。由于className包含单个字符串，因此即使更改了字符串中的某些部分，也需要在每次更改时设置其值。

 HTML5可通过classList属性更加简单和安全的操纵类名。classList是新集合类型DOMTokenList的实例。和其他DOM集合一样，DOMTokenList有length属性，item()钩子，和如下方法：

-  add(value) 将value字符串添加到列表，如果该值已经存在，将不会添加。

-  contains(value) 列表中是否包含value值。

-  remove(value) 从列表中移除value值。

-  toggle(value) 如果列表中存在value值，则移除之；如果列表中不存在value值，则添加之。


 示例如下：

```html
<div class="bd user disabled" id="myDiv">classlist</div>
```

```js
let div = document.getElementById("myDiv");
// 移除类"user"
div.classList.remove("user");
// 移除类"disabled"
div.classList.remove("disabled");
// Add the "current" class
div.classList.add("current");
// 切换类"user"——有则移除,无则添加
div.classList.toggle("user");
// 其他一些事情
if (div.classList.contains("bd") && !div.classList.contains("disabled")) {
    // 这是代码
}
// 迭代类名
for (let cs of div.classList) {
    //doStuff(cs);
}
```



### 焦点管理

 HTML5添加了DOM中的焦点管理功能，document.activeElement是指向具有焦点的DOM元素的指针。一个元素可随着页面的加载自动获得焦点，也可通过用户输入(典型的Tab键)，或在程序中使用focus()方法：

```js
let button = document.getElementById("myButton");
button.focus();
console.log(document.activeElement === button); // true
```

 默认情况下，当文档第一次加载完成时document.activeElement为document.body。文档完全加载前document.activeElement为null。

 document.hasFocus()返回布尔值，指示文档是否有焦点：

```js
let button = document.getElementById("myButton");
button.focus();
console.log(document.activeElement);//<button id="myButton"></button>
alert(document.hasFocus());//true
console.log(document.hasFocus()); // 焦点可能跑到控制台去,为false
```



### HTMLDocument的变化

 HTML5扩展了HTMLDocument类型以包含更多功能。

#### readyState属性

 document的readyState属性具有两个可能的值：

-  loading 文档正在加载。

-  complete 文档加载完成。


#### head属性

 HTML5添加的document.head指向\<head\>元素。

### 字符集属性

 HTML5描述了一些处理文档字符集的新属性。 characterSet属性指示文档正在使用的实际字符集，也可以用于指定新的字符集。默认情况下，此值是“ UTF-8”。可通过<meta>元素或响应头或设置characterSet属性直接改变：

```js
console.log(document.characterSet); // "UTF-8"
document.characterSet = "UTF-16";
```



### 自定义Data特性

 HTML5可添加非标准特性，特性名需加上"data-"前缀：

```html
<div id="myDiv" data-myname="Ciri" data-myAge="18"></div>
```

 当自定义特性定义后，可通过元素的dataset属性访问。dataset属性是DOMStringMap的实例，其包含键值对的映射。

 每一个data-name形式的特性，由一个没有data-前缀的name属性表示，并且在dataset中name将转换为小写。如下例所示：

```js
let div = document.getElementById("myDiv");
console.log(div.dataset.myAge); //undefined
console.log(div.dataset.myage); //18
console.log(div.dataset);
//DOMStringMap {myname: "Ciri", myage: "18"}
div.dataset.myname = "Geralt";
if (div.dataset.myname) {
    console.log(`Hello, ${div.dataset.myname}`); //Hello, Geralt
}
```



### 标记插入

 尽管DOM提供了对文档中节点的细粒度控制，但是当尝试向文档中注入大量新HTML时，它可能会很麻烦。与其创建一系列DOM节点并以正确的顺序连接它们，不如使用标记插入（markup insertion）功能来插入HTML字符串。这要容易得多（并且更快）。为此，以下DOM扩展已在HTML5中标准化。

#### innerHTML属性

 在读取模式下使用时，innerHTML返回表示所有子节点的HTML，包括元素，注释和文本节点。在写模式下使用时，innerHTML将根据指定的值用新的DOM子树完全替换元素中的子节点。如下例所示：

```html
<div id="content">
    <p>This is a <strong>paragraph</strong> with a list following it.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
</div>
```

 此例中\<div\>元素的innerHTML属性会返回如下字符串：

```html
<p>This is a <strong>paragraph</strong> with a list following it.</p>
<ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
</ul>
```

 在写模式下使用时，innerHTML会将给定的字符串解析为DOM子树，并用它替换所有现有的子节点。设置没有任何HTML标记的简单文本，如下所示:

```js
div.innerHTML = "Hello world!";
```

 将innerHTML设置为包含HTML的字符串的行为与innerHTML解析它们的行为大不相同:

```js
let div = document.getElementById("content");
div.innerHTML = "Hello & welcome, <b>\"reader\"!</b>";
```

 输出同：

```html
<div id="content1">Hello &amp; welcome, <b>&quot;reader&quot;!</b></div>
```

 都为：Hello & welcome, \"reader\"! 。

#### outerHTML属性

 在读取模式下调用outerHTML时，它将返回在其上被调用的元素及其子节点的HTML。在写入模式下调用时，outerHTML将其调用的节点替换为通过解析给定HTML字符串而创建的DOM子树。如下所示：

```js
console.log(document.getElementById("content").outerHTML);
```

 这将返回包括div在内的所有内容：

```html
<div id="content">
    <p>This is a <strong>paragraph</strong> with a list following it.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
</div>
```

 写入：

```js
let div = document.getElementById("content");
div.outerHTML = "<p>This is a paragraph.</p>";
```

 同下列：

```js
let p = document.createElement("p");
p.appendChild(document.createTextNode("This is a paragraph."));
div.parentNode.replaceChild(p, div);
```

\<p\>元素替换掉原来DOM树中的\<div\>元素。


#### insertAdjacentHTML()方法和insertAdjacentText()方法

 这两个方法接受两个参数，要插入的HTML或text的位置，第一个参数必须是如下值：

-  "beforebegin"

-  "afterbegin"

-  "beforeend"

-  "afterend"


 插入前html结构：

```html
<div id="myDiv">原始div</div>
```

 第一个参数为beforebegin时,作为同胞 **插入到元素之前** ：

```js
let div = document.getElementById("myDiv");
div.insertAdjacentHTML("beforebegin","<p>Hello world!</p>");
div.insertAdjacentText("beforebegin", "Hello world!");
```

 效果如下：

```html
<p>Hello world!</p>
Hello world!
<div id="myDiv">原始div</div>
```

 第一个参数为afterbegin时，将作为新孩子或第一个孩子 **插入到元素中** ：

```js
let div = document.getElementById("myDiv");
div.insertAdjacentHTML("afterbegin","<p>Hello world!</p>");
div.insertAdjacentText("afterbegin", "Hello world!");
```

 效果如下：

```html
<div id="myDiv">
    原始div
    <p>Hello world!</p>
    Hello world!
</div>
```

 第一个参数为afterend时，将作为同胞 **插入到元素后面** ：

```js
div.insertAdjacentHTML("afterend","<p>Hello world!</p>");
div.insertAdjacentText("afterend", "Hello world!");
```

 效果如下：

```html
<div id="myDiv">原始div</div>
Hello world!
<p>Hello world!</p>
```



#### 内存和性能问题

 当使用innerHTML，outerHTML和insertAdjacentHTML（）时，最好手动删除要删除的元素上的所有事件处理程序和JavaScript对象属性。

 使用这些属性确实有好处，尤其是在使用innerHTML时。一般而言，通过innerHTML插入大量新HTML比通过多个DOM操作创建节点并分配它们之间的关系要有效。

 这是因为只要将值赋给innerHTML（或outsideHTML），就会创建HTML解析器。该解析器以浏览器级别的代码（通常用C ++编写）运行，该代码比JavaScript更快。话虽如此，HTML解析器的创建和销毁确实有一些开销，所以最好限制设置innerHTML或outerHTML的次数。

#### 跨站点脚本注意事项

 尽管innerHTML不会执行它创建的脚本标签，它仍然为恶意攻击者提供了极为广泛的攻击面，因为很容易创建元素和可执行属性，例如onclick。

 在将用户提供的信息插入页面的任何地方时，不建议使用innerHTML。防止XSS（Cross Site Scripting）漏洞的头痛远远超过了使用innerHTML所带来的任何便利。建议对插入的数据进行分区，并且在将插入的数据插入页面之前使用转义数据的库。

### scrollIntoView()方法

 DOM规范未解决的问题之一是如何滚动页面区域。为了填补这一空白，浏览器实现了几种以不同方式控制滚动的方法。在各种专有方法中，仅选择scrollIntoView（）包含在HTML5中。

 scrollIntoView（）方法存在于所有HTML元素上，并滚动浏览器窗口或容器元素，以便该元素在视口中可见。

-  如果提供的参数为true，则它指定alignToTop：窗口将滚动，以便元素的顶部在视口的顶部。

-  如果提供的参数为false，则它指定alignToTop：窗口将滚动，以便元素的底部在视口的顶部。

-  如果提供了对象参数，则用户可以为behavior属性提供值，该值指定滚动的发生方式：auto，instant或

  smooth（可能浏览器不支持），并且block属性与AlignToTop相同。

-  如果未提供任何参数，则将滚动该元素，以使其在视口中完全可见，但可能不会在顶部对齐。如下所示：

  ```js
  // 确保这个元素可见
  document.forms[0].scrollIntoView();
  // 这些行为相同
  document.forms[0].scrollIntoView(true);
  document.forms[0].scrollIntoView({
      block: true
  });
  // 尝试平滑的滚动元素到视口:
  document.forms[0].scrollIntoView({
      behavior: 'smooth',
      block: true
  });
  ```

  

 当页面上发生一些需要引起用户注意的事情时，该方法非常有用。给元素设置焦点也会导致浏览器滚动元素到视口，让焦点正确展示。

## 专有扩展

 尽管所有浏览器供应商都了解遵守标准的重要性，但它们都有向DOM添加专有扩展以填补功能性空白的历史。尽管从表面上看这似乎是一件坏事，但专有扩展为Web开发社区提供了许多重要功能，这些功能后来被编纂为HTML5等标准。

### children属性

 children属性是一个HTMLCollection，它只包含是元素类型的子节点。

### contains()方法

 通常需要确定给定节点是否是另一个节点的后代。 IE首先引入了contains（）方法，以提供此信息而无需遍历DOM文档树。contains()方法应从搜索开始的祖宗节点调用，并接受一个参数，通常为后代节点。如果该节点在根节点的后代中，则返回true，否则返回false。如：

```js
console.log(document.documentElement.contains(document.body)); // true
```

 DOM3里有另一个确定节点关系的方法compareDocumentPosition()，该方法返回一个决定两个节点关系的位掩码，值如下：

| 掩码 | 节点关系                                         |
| ---- | ------------------------------------------------ |
| 0x1  | Disconnected(传入的节点不在文档中)               |
| 0x2  | Precedes(传入的节点在DOM树中,出现在参考节点之前) |
| 0x4  | Follows (传入的节点在DOM树中,出现在参考节点之后) |
| 0x8  | Contains (传入的节点是参考节点的祖先)            |
| 0x10 | Is contained by (传入的节点是参考节点的后代)     |

 为了模仿contains（）方法，你可能对 16 位掩码感兴趣。 compareDocumentPosition（）的结果可以按位与，以确定引用节点是否包含给定节点。如下：

```js
let result = document.documentElement.compareDocumentPosition(document.body);
console.log(!!(result & 0x10));// true 使用两个NOT操作符模拟Boolean()转换
```

 当代码执行时，result是 20 ，或0x14(0x4是"Follows"加上0x10"被包含"),将0x10的按位掩码应用于结果将返回一个非零数字，并且两个NOT bang运算符将该值转换为布尔值。

### 标记插入

 HTML5采用了innerHTML和outerHTML标记插入属性，但还有两个没有：innerText和outerlText。

#### innerText属性

 innerText属性适用于元素中包含的所有文本内容，而不管文本在子树中的深度如何。当用于读取值时，innerText以深度优先的顺序连接子树中所有文本节点的值。用于写入值时，innerText会删除元素的所有子元素，并插入包含给定值的文本节点。如下所示：

```html
<div id="content">
    <p>This is a <strong>paragraph</strong> with a list following it.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
</div>
```

 div元素的innerText将返回如下字符串：

div.innerText = div.innerText;

 Item 1

 Item 2

 Item 3"

 使用innerText设置div的内容：

```js
div.innerText = "Hello world!";
```

 执行此行代码后，div将变为：

```html
<div id="content">Hello world!</div>
```

 设置innerText将移除元素的所有子节点。此外，设置innerText将对其内容进行编码：

```js
div.innerText = "Hello & welcome, <b>\"reader\"!</b>";
```

 等同于：

```html
<div id="content">
    Hello &amp; welcome, &lt;b&gt;&quot;reader&quot;!&lt;/b&gt;
</div>
```

 innerText属性可用以剥离html标签：

```html
<div id="content">
    <p>This is a <strong>paragraph</strong> with a list following it.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
</div>
```

```js
div.innerText = div.innerText;
```

剥离后：

```html
<div id="content">
    This is a paragraph with a list following it.
    <br>
    <br>
    Item 1
    <br>
    Item 2
    <br>
    Item 3
</div>
```



#### outerText属性

 outerText 属性的工作方式与innerText相同，只是它包括调用该属性的节点。对于读取文本值，outerText与innerText基本相同。但outerText在写入模式下表现不同,这将替换整个元素：

```html
<div id="content">
    <p>This is a <strong>paragraph</strong> with a list following it.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
</div>
```

 

```js
let div = document.getElementById("content");
div.outerText = "Hello world!";
```

这将div替换成 "Hello world!"文本节点，效果如下例代码：

```js
let text = document.createTextNode("Hello world!");
div.parentNode.replaceChild(text, div);
```

 Firefox不支持outerText。