---
permalink: /js/chapter14/
title: 第14章 DOM
createTime: 2024/10/18 16:28:56
---
# 第14章 DOM

## 节点层级

 可以使用DOM将任何HTML或XML文档表示为节点的层次结构。有多种节点类型，每种节点类型代表文档中的不同信息或标记。每种节点类型具有不同的特性、数据和方法，并且每种节点可能与其他节点有关系。这些关系创建了一个层次结构，该层次结构允许将标记表示为以特定节点为根的树。

```html
<html>
    <head>
        <title>Sample Page</title>
    </head>
    <body>
        <p>Hello World!</p>
    </body>
</html>
```



## Node类型

 JavaScript中所有节点类型都继承自Node，因此所有节点类型都共享相同的基本属性和方法。每个节点都

 有一个nodeType属性，指示节点类型，表示为十二个数字常量：

-  Node.ELEMENT_NODE (1)

-  Node.ATTRIBUTE_NODE (2)

-  Node.TEXT_NODE (3)

-  Node.CDATA_SECTION_NODE (4)

-  Node.ENTITY_REFERENCE_NODE (5)

-  Node.ENTITY_NODE (6)

-  Node.PROCESSING_INSTRUCTION_NODE (7)

-  Node.COMMENT_NODE (8)

-  Node.DOCUMENT_NODE (9)

-  Node.DOCUMENT_TYPE_NODE (10)

-  Node.DOCUMENT_FRAGMENT_NODE (11)

-  Node.NOTATION_NODE (12)


## 节点名和节点值属性

 nodeName和nodeValue属性用于获取节点的具体信息，它们的值取决于节点类型，对元素来说，nodeName为标签名，nodeValue总是null。

```js
//let div = document.getElementById("myDiv");
console.log(div.nodeName);//DIV
console.log(div.nodeType);//1
console.log(div.nodeValue);//null
```



## 节点关系

 文档中的所有节点都与其他节点有关系。这些关系是按照传统的家庭关系来描述的，文档树就像是家庭树一样。在HTML中，\<body\>元素被认为是 \<html\>元素的孩子，\<head\>元素被认为是\<body\>元素的同胞，因为它们有共同的直接父亲 \<html\>元素。每个节点都有一个childNodes属性，其包含NodeList。**NodeList是类数组对象，DOM改变时NodeList会同步更新**。每个节点在文档树中都有一个指向其父节点的parentNode属性。

 childNodes列表中包含的所有节点都具有相同的父节点，因此它们的每个parentNode属性都指向同一节点。另外，childNodes列表中的每个节点都被视为同一列表中其他节点的同胞。通过使用previousSibling和nextSibling属性，可以从列表中的一个节点导航到另一个节点。列表中的第一个节点的previousSibling属性的值为null，列表中的最后一个节点的nextSibling属性的值为null。

 NodeList里的元素可使用[]或item()方法访问。

### 操纵节点

 appendChild()添加节点到对应元素childNodes的末尾并**返回新添加的节点**，且更新此节点的所有关系指针。如果传递给appendChild()的节点已经是文档的一部分时，该节点将从之前的位置移除，并添加到新位置。DOM节点在文档中的位置是独一无二的，不可能同时存在于两个地方。

 insertBefore()接受两个参数，要插入的节点和参考节点。要插入的节点成为参考节点的上一个同胞节点，并**返回此节点**。如果参考节点为null，insertBefore（）的行为与appendChild（）相同。

 replaceChild()接受两个参数：要插入的新节点和要被替换掉的节点。该方法**返回替换掉的节点**并将其从节点树中移除。同时指针关系复制到新节点。

 removeChild()移除节点并返回之。被该方法移除的节点仍被文档所拥有，但在文档中没有具体位置。

### 其他方法

 两个被所有节点类型共享的方法：cloneNode()接受一个布尔参数， **若为true，则使用深复制** ，复制节点和整个子树；若为false，则只复制节点。克隆返回的节点归document所有，但是没有指定父节点。因此需要appendChild(), insertBefore(), 或replaceChild()方法添加。

> 注意:此方法不复制添加到DOM的JavaScript属性,如事件处理程序。但复制特性。

 第二个方法normalize（）方法，它的唯一工作是处理文档子树中的文本节点。当在一个节点上调用normalize()时，如果搜索到的文本节点为空，则移除该文本；如果有两个或多个同胞文本节点，则将它们合并为单个文本节点。

## Document类型

 JavaScript通过Document类型表示文档节点。在浏览器中，文档对象是HTMLDocument的实例（继承自Document），并表示整个HTML页面。document对象是window的属性，因此可以全局访问。一个Document节点有如下特征：

-  nodeType是 9

-  nodeName是"#document"

-  nodeValue是null

-  parentNode是null

-  子节点可以是DocumentType（最大为 1 ），Element（最大为 1 ），ProcessingInstruction或Comment


### Document的子节点

 尽管DOM规范指出Document节点的子节点可以是DocumentType，Element，ProcessingInstruction或Comment，但是有两个指向子节点的内置快捷方式。第一个是documentElement属性，该属性始终指向页面中的HTML元素。documentElement属性可以更快，更直接地访问该元素。

```js
let html = document.documentElement; // 获取<html>的引用
console.log(html === document.childNodes[1]); // true 有DOCTYPE申明,所以是第二个孩子
console.log(html === document.lastChild); // true
```

 Document的另一个可能的子节点是DocumentType。\<!DOCTYPE\>标记被认为是与文档其他部分分开的实体，并且可以通过doctype属性（浏览器中的document.doctype）访问其信息:

```js
console.log(document.doctype);//<!DOCTYPE html>
```

 出现在元素外的注释在技术上认为是文档的子节点，但各个浏览器处理的方式不同。在大多数情况下，不对文档使用appendChild（），removeChild（）和replaceChild（）方法，因为文档类型是只读的。

### document信息

 作为HTMLDocument的实例，document对象具有标准Document对象所没有的一些额外属性。这些属性提供与已加载网页有关的信息：

-  title属性,其包含 \<title\> 元素中的文本
-  与网页请求有关的URL,domain,referrer
-  referrer属性提供链接到该页面的页面的URL

```js
console.log(document.title);//DOM笔记
console.log(document.URL);// http://panda.com/
console.log(document.domain);//panda.com
console.log(document.referrer);//
```

### 定位元素

 getElementById()返回第一个获取到的元素，没找到返回null。

 getElementsByTagName()返回一个包含零个或多个元素的NodeList。 **在HTML文档中，此方法返回一个HTMLCollection对象，该对象与NodeList非常相似，因为它被视为“活的”集合**。HTMLCollection对象还有一个namedItem()方法，可以通过其name属性引用集合中的元素。

```html
<img src="myimage.gif" name="myImage">
<script>
    let myImage = images.namedItem("myImage");
    //let myImage = images["myImage"];
    //获取所有元素
    let allElements = document.getElementsByTagName("*");
</script>
```

 仅在HTMLDocument类型上定义的第三个方法是getElementsByName（）。顾名思义，此方法返回具有给定name特性的所有元素，也是HTMLCollection，此时namedItem()总是返回第一个元素。

### 特殊集合

 document对象有几个特殊的集合。这些集合中每个集合都是一个HTMLCollection对象，可以更快地访问文档的公共部分。

-  document.anchors 所有有name特性的\<a>元素

-  document.links 所有有href特性的\<a>元素

-  document.forms document中所有\<form>元素，同document.getElementsByTagName("form")

-  document.images 同document.getElementsByTagName("img")

-  document.applets 不推荐使用


### DOM一致性检测

 document.implementation属性是一个对象，其中包含与浏览器的DOM实现直接相关的信息和功能。

 DOM1的document.implementation仅有一个方法，即hasFeature（）。 hasFeature（）方法接受两个参数：要检查的DOM特性的名称和版本。如果浏览器支持命名功能和版本，则此方法返回true：

```js
let hasXmlDom = document.implementation.hasFeature("XML", "1.0");
```



### 文档写入

 write()和writeln()接受一个字符串参数(页面未完成加载时添加内容到页面)：

```html
<html>
    <head>
        <title>document.write()示例</title>
    </head>
    <body>
        <p>当前时间是:
            <script type="text/javascript">
                document.write("<strong>" + (new Date()).toLocaleString() + "
                </strong>");
                               //当前时间是: 2020/10/29 下午1:46:55
            </script>
        </p>
    </body>
</html>
```

```js
//加载js文件
document.write("<script type=\"text/javascript\" src=\"file.js\">" + "<\/script>");
```

 

页面加载完成后调用该方法时，将覆盖整个页面：

```html
<html>
    <head>
        <title>document.write()示例</title>
    </head>
    <body>
        <p>这些内容会被hello world覆盖.</p>
        <script type="text/javascript">
            window.onload = function() {
                document.write("Hello world!");
            };
        </script>
    </body>
</html>
```

 **open()和close()分别用于打开和关闭页面输出流，也是在页面加载期间使用**。

>注意:严格的XHTML文档不支持文档编写。对于使用application / xml + xhtml内容类型提供的页面,这些方法将不起作用。

## Element类型

 元素类型表示XML或HTML元素，提供如标签名称，孩子和特性的访问。元素节点具有以下特征

-  nodeType 是 1

-  nodeName 是元素标签名

-  nodeValue 是null

-  parentNode可以是Document或Element

-  子节点可以是Element，Text，Comment，ProcessingInstruction，CDATASection或EntityReference元素的标签名称可通过nodeName属性或使用tagName属性来访问；这两个属性都返回相同的值（为清楚起见，通常使用后者）：

  ```js
  let div = document.getElementById("myDiv");
  console.log(div.tagName); // "DIV"
  console.log(div.tagName == div.nodeName); // true
  ```

### html元素

 所有HTML元素均由HTMLElement类型或其子类型表示。HTMLElement直接从Element继承并添加几个属性：

-  id 元素在文档中独一无二的标识符

-  title 元素的额外信息，通常表示为提示工具

-  lang 元素内容的语言代码（很少使用）

-  dir 语言的方向，“ ltr”（从左到右）或“ rtl”（从右到左）；也很少使用

-  className 等同于class特性，用于在元素上指定CSS类。该属性无法命名为class，因为class是ECMAScript保留字。

  ```js
  <div id="myDiv" class="bd" title="鼠标移到666上会显示这句话” lang="en"
  dir="ltr">666</div>
  <script>
      let div = document.getElementById("myDiv");
      console.log(div.id); // "myDiv"
      console.log(div.className); // "bd"
      console.log(div.title); // "鼠标移到666上会显示这句话"
      console.log(div.lang); // "en"
      console.log(div.dir); // "ltr"
      div.id = "someOtherId";
      div.className = "ft";
      div.title = "Some other text";
      div.lang = "fr";
      div.dir ="rtl";
  </script>
  ```

  

### 获取特性

 每个元素可以具有零个或多个特性，这些特性通常用于提供有关元素或其内容的额外信息。使用特性的三个主要DOM方法是getAttribute（），setAttribute（）和removeAttribute（）。这些方法适用于任何特性，包括那些定义在HTMLElement类型上的属性。

```js
let div = document.getElementById("myDiv");
console.log(div.getAttribute("id")); // "myDiv"
console.log(div.getAttribute("class")); // "bd"
console.log(div.getAttribute("title")); // "鼠标移到666上会显示这句话"
console.log(div.getAttribute("lang")); // "en"
console.log(div.getAttribute("dir")); // "ltr"
// 自定义特性也可以获取,并且特性名大小写不敏感
// <div id="myDiv" my_special_attribute="hello!"></div>
// let value = div.getAttribute("my_special_attribute");
```

HTML5里，自定义特性名应加上data-前缀。

### 设置特性

 setAttribute()接受两个参数：需要设置的特性名和值，**如果特性存在，则替换其值**。

 **添加自定义特性到DOM元素不会自动成为元素的特性** 。

```js
div.mycolor = "red";
console.log(div.getAttribute("mycolor")); // null
```



### attributes属性

 Element类型是唯一使用attributes属性的DOM节点类型。 attributes属性包含一个NamedNodeMap，它是一个类似于NodeList的“活的”集合。 **元素上的每个特性都由Attr节点表示，每个Attr节点都存储在NamedNodeMap对象中** 。 NamedNodeMap对象具有以下方法：

-  getNamedItem(name) 返回nodeName属性等于name的节点

-  removeNamedItem(name) 移除nodeName属性等于name的节点

-  setNamedItem(node) 将node添加到列表中，并通过nodeName属性对其进行索引

-  item(pos) 返回pos位置的节点


 获取div元素的id特性值：

```js
// <div id="myDiv" class="bd" title="Body text" lang="en" dir="ltr"></div>
let div = document.getElementById("myDiv");
let id = div.attributes.getNamedItem("id").nodeValue;
console.log(id); //myDiv
console.log(div.attributes.item(2)); // title="Body text"
//div.attributes.setNamedItem();参数为Attr类型
console.log(div.attributes);
//NamedNodeMap {0: id, 1: class, 2: title, 3: lang, 4: dir, id: id, class: class,
title: title, lang: lang, dir: dir, ...}
```



### 创建元素

 可使用document.createElement()方法创建新元素，该方法接受一个参数，要创建的元素的标签名。在HTML中，标签名不区分大小写，但在XML和XHTML中区分大小写。

```js
let div = document.createElement("div");
div.id = "myNewDiv";
div.className = "box";
// 新创建的元素需使用appendChild(), insertBefore(), 或 replaceChild()添加到文档树中
document.body.appendChild(div);
```


### 子元素

 元素可以有任意个子孙元素，因为元素的子元素也可以是元素。childNodes属性包含直接的子元素。

```html
<ul id="myList01">
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
</ul>
<ul id="myList02"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>
```

```js
let list01 = document.getElementById("myList01");
let list02 = document.getElementById("myList02");
console.log(list01.childNodes.length);//7
 li元素周围的空白是四个text节点
console.log(list02.childNodes.length);//3
```



## Text类型

 Text节点具有如下特征：

-  nodeType是 3

-  nodeName是"#text"

-  nodeValue是节点中包含的文本

-  parentNode 是 Element

-  不支持子节点


 可以通过nodeValue属性或data属性访问Text节点中包含的文本。以下方法允许对节点中的文本进行操作：

```js
let p = document.getElementById("mp");
//console.log(p.firstChild);
p.firstChild.appendData(" 吹梦到西洲"); //南风知我意 吹梦到西洲
p.firstChild.deleteData(0, 2); //知我意 吹梦到西洲
p.firstChild.insertData(0, "南风"); //南风知我意 吹梦到西洲
p.firstChild.replaceData(0, 2, "东风"); //东风知我意 吹梦到西洲
p.firstChild.splitText(5);
console.log(p.firstChild.data.length); //5
console.log(p.firstChild.substringData(0, 2)); //东风
```

-  appendData(text) 附加text到节点末尾

-  deleteData(offset, count) 从offset(包含)位置删除count个字符

-  insertData(offset, text) 在offset（该位置之前）位置插入text

-  replaceData(offset, count, text) 用text替换从offset（包含）开始的count个字符的文本

-  splitText(offset) 从offset（之前）处将文本节点拆分为两个文本节点

-  substringData(offset, count) 从文本中offset位置提取count个字符的字符串


 改变文本节点的字符串是HTML或XML编码的，意味着任何特殊字符将被转义：

```js
div.firstChild.nodeValue = "Some <strong>other</strong> message";
//输出效果同字符串"Some &lt;strong&gt;other&lt;/strong&gt; message"
```
### 创建文本节点

 可 使用document.createTextNode()方法创建文本节点 ，此方法接受一个参数：插入到节点的文本，该文本也是HTML或XML编码的：

```js
let textNode = document.createTextNode("<strong>Hello</strong> world!");
console.log(textNode);//"<strong>Hello</strong> world!"
document.getElementById("creatnode").appendChild(textNode);
```

 通常，元素只有一个子文本节点，但是可以有多个：

```js
let element = document.createElement("div");
element.className = "message";
let textNode = document.createTextNode("Hello world!");
element.appendChild(textNode);
let anotherTextNode = document.createTextNode("Yippee!");
element.appendChild(anotherTextNode);
document.body.appendChild(element);
//Hello world!Yippee!
```



### 规范化文本节点

 nomalize()用来合并同胞文本节点：

```js
let element = document.createElement("div");
element.className = "message";
let textNode = document.createTextNode("Hello world!");
element.appendChild(textNode);
let anotherTextNode = document.createTextNode("Yippee!");
element.appendChild(anotherTextNode);
document.body.appendChild(element);
console.log(element.childNodes.length); // 2
element.normalize();
console.log(element.childNodes.length); // 1
console.log(element.firstChild.nodeValue); // "Hello world!Yippee!"
```



### 拆分文本节点

 splitText()拆分一个文本节点为两个，使用给定的offset分隔nodeValue，并返回新节点(包含offset位置字符)。原始文本节点包含拆分后的文本，它们有相同的父节点：

```js
let element = document.createElement("div");
element.className = "message";
let textNode = document.createTextNode("Hello world!");
element.appendChild(textNode);
document.body.appendChild(element);
let newNode = element.firstChild.splitText(5);
console.log(element.firstChild.nodeValue); // "Hello"
console.log(newNode.nodeValue); // " world!"
console.log(element.childNodes.length); // 2
```



## Comment类型

 注释类型有如下特征：

-  nodeType是 8

-  nodeName是"#comment"

-  nodeValue是注释内容

-  parentNode是Document或Element

-  不支持子节点


 Comment类型和Text类型继承相同的基类，所以注释类型有相同的字符串操纵方法，除了splitText()。注释内容可使用nodeValue或data属性获取。

 注释节点可以作为子节点访问：

```js
<div id="myDiv"><!-- A comment --></div>
<script>
    let div = document.getElementById("myDiv");
    let comment = div.firstChild;
    console.log(comment.data); // "A comment"
</script>
```

 浏览器无法识别\</html\>标签后面的注释。

## CDATASection类型

 在XML中， CDATA可以直接包含未经转义的文本。比如\<和\&，只要位于CDATA片段中，它们就不需要被转义，保持原样就可以了。

 CDATA也和Text类型继承相同的基类，拥有除splitText()外的字符串操纵方法，CDATASection节点有如下特征：

-  nodeType是 4

-  nodeName是"#cdata-section"

-  nodeValue是CDATA片段的内容

-  parentNode是Document或Element

-  不支持子节点


 CDATA片段仅在XML文档中有效，所以大多数浏览器不能正确解析CDATA片段，如：

```html
<div id="myDiv"><![CDATA[This is some content.]]></div>
```



## DocumentType类型

 DocumentType对象包含文档的doctype的所有信息，具有如下特征：

-  nodeType是 10

-  nodeName是doctype的名称

-  nodeValue为null

-  parentNode是Document

-  不支持子节点


 唯一有点用的name属性：

```js
<!DOCTYPE HTML PUBLIC "-// W3C// DTD HTML 4.01// EN"
"http:// www.w3.org/TR/html4/strict.dtd">
//console.log(document.doctype.name); // "HTML"
```



## DocumentFragment类型

 DocumentFragment节点具有以下特征：

-  nodeType是 11

-  nodeName是"#document-fragment"

-  nodeValue为null

-  parentNode为null

-  子节点可以是Element，ProcessingInstruction，Comment，Text，CDATASection或EntityReference文档片段无法直接添加到文档中。相反，它充当可能需要添加到文档中的其他节点的仓库。可通过document.createDocumentFragment()方法创建：

  ```js
  let fragment = document.createDocumentFragment();
  ```

  

 文档片段继承了Node的所有方法，**如果将文档中的某个节点添加到文档片段中，则该节点将从文档树中删除，并且不会被浏览器渲染**。添加到文档片段的新节点也不是文档树的一部分。可以通过appendChild（）或insertBefore（）将文档片段的内容添加到文档中。当文档片段作为参数传递给这两个方法时，所有文档片段的子节点都添加到该位置，文档片段本身不会添加到文档树。例如:

```html
<ul id="myList"></ul>
```

 如果要添加三个li条目到ul，若逐个添加，浏览器每次都会渲染新的信息到网页。为了避免这种情况，可使用文档片段添加：

```js
let fragment = document.createDocumentFragment();
let ul = document.getElementById("myList");
for (let i = 0; i < 3; ++i) {
let li = document.createElement("li");
li.appendChild(document.createTextNode(`Item ${i + 1}`));
fragment.appendChild(li);
}
ul.appendChild(fragment);
```



## Attr类型

 在DOM中元素特性表示为Attr类型。在所有浏览器中都可以访问Attr类型的构造函数和原型。技术上来讲，特性是元素attributes属性里的节点，特性节点有如下特征：

-  nodeType是 11

-  nodeName是特性名

-  nodeValue是特性值

-  parentNode为null

-  HTML中不支持子节点

-  在XML中子节点可以是Text或EntityReference尽管它们是节点，但特性不被视为文档树的一部分，特性节点很少直接引用，大多使用getAttribute（），setAttribute（）和removeAttribute（）。


 Attr对象有三个属性：特性名name、特性值value和布尔值specified，指示该特性是在代码中指定的还是默认值。

 **可使用document.createAttribute()方法创建新特性节点** ，如下(element为具体元素的标签名)：

```js
let attr = document.createAttribute("align");
attr.value = "left";
//使用setAttributeNode()方法添加特性节点到元素
element.setAttributeNode(attr);
console.log(element.attributes["align"].value); // "left"
console.log(element.getAttributeNode("align").value); // "left"
console.log(element.getAttribute("align")); // "left"
```
## 动态脚本

 两种加载脚本方式：

```html
<script src="foo.js"></script>
```

```js
let script = document.createElement("script");
script.src = "foo.js";
document.body.appendChild(script);
```



## 动态样式

 两种方式包含css样式到html页面：\<link\>元素用于包含外部css文件，\<style\>元素指定内联样式。

```html
<link rel="stylesheet" type="text/css" href="styles.css">
```

 可使用DOM代码添加上面元素：

```js
let link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = "styles.css";
let head = document.getElementsByTagName("head")[0];
head.appendChild(link);
```

**通过外部文件加载样式是异步的，所以JS执行时加载的样式是无序的，通常，无需知道样式何时加载完成**。

## 操纵表格

 使用DOM方法创建表格需要大量代码：

```html
<table border="1" width="100%">
    <tbody>
        <tr>
            <td>Cell 1,1</td>
            <td>Cell 2,1</td>
        </tr>
        <tr>
            <td>Cell 1,2</td>
            <td>Cell 2,2</td>
        </tr>
    </tbody>
</table>
```


```js
// 创建table
let table = document.createElement("table");
table.border = 1;
table.width = "100%";
// 创建tbody
let tbody = document.createElement("tbody");
table.appendChild(tbody);
// 创建第一行
let row1 = document.createElement("tr");
tbody.appendChild(row1);
let cell1_1 = document.createElement("td");
cell1_1.appendChild(document.createTextNode("Cell 1,1"));
row1.appendChild(cell1_1);
let cell2_1 = document.createElement("td");
cell2_1.appendChild(document.createTextNode("Cell 2,1"));
row1.appendChild(cell2_1);
// 创建第二行
let row2 = document.createElement("tr");
tbody.appendChild(row2);
let cell1_2 = document.createElement("td");
cell1_2.appendChild(document.createTextNode("Cell 1,2"));
row2.appendChild(cell1_2);
let cell2_2 = document.createElement("td");
cell2_2.appendChild(document.createTextNode("Cell 2,2"));
row2.appendChild(cell2_2);
// 添加table到文档
document.body.appendChild(table);
```

 这段代码很冗长，有点难以理解。为了方便创建表格，HTML DOM添加了几个属性和方法到\<table\>、\<tbody\>和 \<tr\>元素。

## 使用NodeList

 理解NodeList对象及与之相关联的NamedNodeMap和HTMLCollection对于全面理解DOM至关重要。这些集合中的每一个都被认为是“活的”的，也就是说，当文档结构发生更改时，它们会被更新。

 如下代码会导致无限循环：

```js
let divs = document.getElementsByTagName("div");
let divs2 = document.getElementsByTagName("div");
console.log(divs === divs2);//true
for (let i = 0; i < divs.length; ++i) {
    let div = document.createElement("div");
document.body.appendChild(div);
}
```

 上述第一行代码从文档中获取所有div元素组成的HTMLCollection集合，因为此集合是“活的”，任何新div元素添加到页面，都将更新到集合中。由于浏览器不想保留所有已创建集合的列表，因此仅在再次访问该集合时才会更新该集合。这就产生了一个有趣的问题，例如本例中的循环。每次循环将计算条件i \< divs.length，这意味着需要再次查询获取所有div元素，故每次循环divs.lenght将递增。

## 突变观察者

 MutationObserver API是最近添加到DOM规范中的，可在修改DOM后异步执行回调。使用MutationObserver，可以观察整个文档，DOM子树或仅观察单个元素。此外，还可以观察到元素特性，子节点，文本或这三者的任意组合的变化。

### 基本用法

 通过调用MutationObserver构造函数并传递回调函数来创建MutationObserver实例：

```js
let observer = new MutationObserver(() => console.log('DOM was mutated!'));
```



### observe()方法

 实例最开始与DOM任何部分无关，需要使用observe()方法链接观察者与DOM。此方法接受两个必选参数：需要观察变化的目标DOM节点，和MutationObserverInit对象。MutationObserverInit对象用于控制观察者

 应注意的更改，其采用字典形式的键值对配置选项，如下：

```js
let observer = new MutationObserver(() => console.log('<body> attributes changed'));
observer.observe(document.body, { attributes: true });
```

 此时，body元素的任何特性改变将被MutationObserver实例探测到，异步执行回调：

```js
let observer = new MutationObserver(() => console.log(`<body> attributes changed`));
observer.observe(document.body, {
    attributes: true
});
document.body.className = 'foo';
console.log('Changed body class');
// Changed body class
// <body> attributes changed
```



### 使用回调和MutationRecords

 每个回调提供一个MutationRecord实例数组，每个实例都包含有关发生了哪种突变以及DOM的哪个部分受到影响的信息。因为执行回调之前可能会发生多个限定突变，每个回调调用都会使用排好队的MutationRecord实例备份。下面是单个特性突变的MutationRecord数组：

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
observer.observe(document.body, {
    attributes: true
});
document.body.setAttribute('foo', 'bar');
// [
// {
// addedNodes: NodeList [],
// attributeName: "foo",
// attributeNamespace: null,
// nextSibling: null,
// oldValue: null,
// previousSibling: null
// removedNodes: NodeList [],
// target: body
// type: "attributes"
// }
// ]
```

 一个涉及命名空间的突变：

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
observer.observe(document.body, {
    attributes: true
});
document.body.setAttributeNS('baz', 'foo', 'bar');
// [
// {
// addedNodes: NodeList [],
// attributeName: "foo",
// attributeNamespace: "baz",
// nextSibling: null,
// oldValue: null,
// previousSibling: null
// removedNodes: NodeList [],
// target: body
// type: "attributes"
// }
// ]
```

连续修改将生成多个MutationRecord实例,并且下一个回调调用将按照它们入队的顺序依次使用:

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
observer.observe(document.body, {
    attributes: true
});
document.body.className = 'foo';
document.body.className = 'bar';
document.body.className = 'baz';
// [MutationRecord, MutationRecord, MutationRecord]
```

MutationRecord实例有如下属性:

| 键                 | 值                                                           |
| ------------------ | ------------------------------------------------------------ |
| target             | 突变影响的节点                                               |
| type               | "childList"                                                  |
| oldValue           | 在MutationObserverInit对象中启用后,attributes或characterData突变会将此字段设置为替换前的值。仅当attributeOldValue或characterDataOldValue为true时才提供此值,否则该值为null。childList突变始终将此字段设置为null |
| attributeName      | 对于attributes突变,是已修改特性的字符串名称。对于所有其他突变,此字段设置为null |
| attributeNamespace | 对于使用命名空间的attributes突变,修改了的特性的命名空间字符串。对于所有其他突变,此字段设置为null |
| addedNodes         | 对于childList突变,返回在突变中添加的节点的NodeList。默认为空的NodeList |
| removedNodes       | 对于childList突变,返回在该突变中删除的节点的NodeList。默认为空的NodeList |
| previousSibling    | 对于childList突变,返回突变节点的前一个同胞节点。默认为null   |
| nextSibling        | 对于childList突变,返回突变节点的下一个同胞节点。默认为null   |

 回调的第二个实参是探测突变的MutationObserver实例：

```js
let observer = new MutationObserver((mutationRecords, mutationObserver) =>
                                    console.log(mutationRecords,mutationObserver));
observer.observe(document.body, {
    attributes: true
});
document.body.className = 'foo';
// [MutationRecord], MutationObserver
```




### disconnect()方法

 默认情况下，MutationObserver回调将在其指定范围中的每个DOM突变时执行，直到元素被垃圾回收为止。如需尽早终止回调执行，可以调用disconnect（）方法。此示例演示如何同步调用disconnect（）来停止回调，但会舍弃所有待处理的异步回调，即使它们来自观察窗口中的DOM突变:

```js
let observer = new MutationObserver(() => console.log('<body> attributes changed'));
observer.observe(document.body, {
    attributes: true
});
document.body.className = 'foo';//也无输出
observer.disconnect();
document.body.className = 'bar';
// (无输出)
```

 为了允许这些排队的回调在调用disconnect（）之前执行，可以使用setTimeout来允许挂起的回调执行:

```js
let observer = new MutationObserver(() => console.log('<body> attributes changed'));
observer.observe(document.body, {
    attributes: true
});
document.body.className = 'foo';
setTimeout(() => {
    observer.disconnect();
    document.body.className = 'bar';
}, 0);
// <body> attributes changed
```



### 多路复用MutationObserver

 可通过多次调用observe（）将MutationObserver与多个不同的目标元素相关联。MutationRecord上的target属性可以标识哪个元素发生了哪种突变。演示如下：

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords.map((x) => x.target)));
// 附加两个孩子到body
let childA = document.createElement('div'),
    childB = document.createElement('span');
document.body.appendChild(childA);
document.body.appendChild(childB);
// 观察两个孩子
observer.observe(childA, {
    attributes: true
});
observer.observe(childB, {
    attributes: true
});
// 对每个孩子执行突变
childA.setAttribute('foo', 'bar');
childB.setAttribute('foo', 'bar');
// [<div>, <span>]
```
 这种情况下disconnect()是个生硬的工具，将断开所有观察节点：

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords.map((x) => x.target)));
// 附加两个孩子到body
let childA = document.createElement('div'),
    childB = document.createElement('span');
document.body.appendChild(childA);
document.body.appendChild(childB);
// 观察两个孩子
observer.observe(childA, {
    attributes: true
});
observer.observe(childB, {
    attributes: true
});
observer.disconnect();
// 对每个孩子执行突变
childA.setAttribute('foo', 'bar');
childB.setAttribute('foo', 'bar');
// (无输出)
```



### 重用MutationObserver

 调用disconnect()不能中止MutationObserver的生命，此实例可重新附加到节点。下面的演示通过断开然后在两个连续的异步块中重新连接来演示此行为:

```js
let observer = new MutationObserver(() => console.log(`<body> attributes changed`));
observer.observe(document.body, {
    attributes: true
});
// 注册突变
document.body.setAttribute('foo', 'bar');
setTimeout(() => {
    observer.disconnect();
    // 不注册突变
    document.body.setAttribute('bar', 'baz');
}, 0);
setTimeout(() => {
    // 重新附加
    observer.observe(document.body, {
        attributes: true
    });
    // 注册突变
    document.body.setAttribute('baz', 'qux');
}, 0);
// <body> attributes changed
// <body> attributes changed
```
 

### 使用MutationObserverInit控制观察范围

 MutationObserverInit对象用于控制观察者应该关注的元素，以及元素的变化类型。广义上讲，观察者可以监视特性更改，文本更改或子节点更改。

 MutationObserverInit对象的属性：

| 键                    | 值                                                           |
| --------------------- | ------------------------------------------------------------ |
| subtree               | 布尔值，指示除目标元素外是否还应关注目标元素的节点子树。如果为false，则仅观察到目标元素的指定突变。设置为true时，将监视目标元素及其整个节点子树是否存在指定的突变。默认为false |
| attributes            | 布尔值，指示对节点特性的修改是否应注册为突变。默认为false    |
| attributeFilter       | 字符串值数组，指示应观察哪些指定特性的突变。将此值设置为true也将强制将attributes的值设置为true。默认为观察所有属性 |
| attributeOldValue     | 布尔值，指示是否应将突变之前的字符数据记录在MutationRecord中。将此值设置为数组也会将attributes的值强制为true。默认为false |
| characterData         | 布尔值，指示对字符数据的修改是否应注册为突变。默认为false。  |
| characterDataOldValue | 布尔值，指示是否应将突变之前的字符数据记录在MutationRecord中。将此值设置为true还将将characterData的值强制为true。默认为false |
| childList             | 布尔值，指示对目标节点的子节点的修改是否应注册为突变。默认为false |

### 观察特性突变

 当添加，删除或更改节点特性时，MutationObserver能够进行注册。通过将MutationObserverInit对象内的attributes属性设置为true来注册回调:

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
observer.observe(document.body, {
    attributes: true
});
// 添加特性
document.body.setAttribute('foo', 'bar');
// 修改存在的特性
document.body.setAttribute('foo', 'baz');
// 移除特性
document.body.removeAttribute('foo');
// [MutationRecord, MutationRecord, MutationRecord]
```

 默认行为是观察所有属性更改，并且不将旧值记录在MutationRecord中。如果希望观察部分特性，可以将attributeFilter属性用作特性名的白名单:

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
observer.observe(document.body, {
    attributeFilter: ['foo']
});
// 添加特性白名单
document.body.setAttribute('foo', 'bar');
// 添加白名单外特性
document.body.setAttribute('baz', 'qux');
// 仅有一个突变记录
// [MutationRecord]
```

 如果希望保留突变记录中的旧值，则可以将attributeOldValue设置为true：

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords.map((x) => x.oldValue)));
observer.observe(document.body, {
    attributeOldValue: true
});
document.body.setAttribute('foo', 'bar');
document.body.setAttribute('foo', 'baz');
document.body.setAttribute('foo', 'qux');
// 每个突变记录之前的值
// [null, 'bar', 'baz']
```



### 观察字符数据突变

 当文本节点（例如Text，Comment或ProcessingInstruction节点）的字符数据添加，删除或更改时，MutationObserver能够进行注册。这是通过将MutationObserverInit对象内的characterData属性设置为true来实现的：

```js
//<p id="mp">字符数据观察</p>
let p = document.getElementById("mp");
console.log(p.childNodes);
//NodeList [text]
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
// 创建一个文本节点用来观察
observer.observe(p, {
    childList: true,
    characterData: true
});
p.textContent = 'foo';
p.textContent = 'bar';
p.textContent = 'baz';
// [MutationRecord, MutationRecord, MutationRecord]
```

 默认情况下，MutationRecord不记录旧值。如果希望保留突变记录中的旧值，则可以将attributeOldValue设置为true：

```js
let text = document.createTextNode("南风知我意");
document.body.appendChild(text); //未添加到文档也能观察突变。
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords.map((x) => x.oldValue)));
// 创建一个文本节点用来观察
observer.observe(text, {
    //childList: true,
    characterDataOldValue:true
    // 赋一个相同的字符串
    text.textContent = "南风知我意";
    // 赋一个新字符串
    text.textContent = "吹梦到西洲";
    // 节点文本内容赋值
    text.textContent = "海水梦悠悠";
    //["南风知我意", "南风知我意", "吹梦到西洲"]
    //["海水梦悠悠"] 使用appendChild时输出
```


### 观察孩子突变

 当元素添加或删除子节点时，MutationObserver能够进行注册。这是通过将MutationObserverInit对象内的childList属性设置为true来完成的：

```js
let div = document.getElementById("myDiv");
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
observer.observe(div, {
    childList: true
});
div.appendChild(document.createElement('div'));
// MutationRecord
// [
// addedNodes: NodeList [div]
// attributeName: null
// attributeNamespace: null
// nextSibling: null
// oldValue: null
// previousSibling: text
// removedNodes: NodeList []
// target: div#myDiv
// type: "childList"
// ]
```

 移除子节点时：

```js
let div = document.getElementById("myDiv");
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
observer.observe(div, {
    childList: true
});
div.appendChild(document.createElement('div'));
div.removeChild(div.firstChild);
//第二个MutationRecord
//[
// addedNodes: NodeList []
// attributeName: null
// attributeNamespace: null
// nextSibling: div
// oldValue: null
// previousSibling: null
// removedNodes: NodeList [text]
// target: div#myDiv
// type: "childList"
//]
```


 子节点重排序虽然可以用一种方法执行，但由于在技术上是先删除节点然后再添加，因此将注册为两个单独的突变。

### 观察子树突变

 默认情况下，MutationObserver的观察范围是仅观察对单个元素的修改。通过将MutationObserverInit对象内的subtree属性设置为true，可以将该范围扩展到其DOM子树的整个范围:

```js
let div = document.getElementById("myDiv");
let observer = new MutationObserver((MutationRecord)=>console.log(MutationRecord));
observer.observe(div,{
    attributes:true,
    subtree:true
})
div.appendChild(document.createElement("div"));
div.firstChild.setAttribute('id','233');
// [
// addedNodes: NodeList []
// attributeName: "id"
// attributeNamespace: null
// nextSibling: null
// oldValue: null
// previousSibling: null
// removedNodes: NodeList []
// target: div#233
// type: "attributes"
// ]
```

 有趣的是，即使该节点从观察到的树中移出，它的子树名仍将保留。这意味着在子树节点离开树后，在观察到的子树之外的突变仍将注册为合格突变：



```js
document.body.innerHTML = '';
let observer = new MutationObserver((mutationRecords) =>
                                    console.log(mutationRecords));
let subtreeRoot = document.createElement('div'),
    subtreeLeaf = document.createElement('span');
// 创建高度为2的子树
document.body.appendChild(subtreeRoot);
subtreeRoot.appendChild(subtreeLeaf);
// 观察子树
observer.observe(subtreeRoot, {
    attributes: true,
    subtree: true
});
// 从subtreeRoot中移除subtreeLeaf
//document.body.insertBefore(subtreeLeaf, subtreeRoot);
subtreeRoot.removeChild(subtreeLeaf);
subtreeLeaf.setAttribute('foo', 'bar');
// 子树修改仍将注册为突变
// [
// addedNodes: NodeList []
// attributeName: "foo"
// attributeNamespace: null
// nextSibling: null
// oldValue: null
// previousSibling: null
// removedNodes: NodeList []
// target: span
// type: "attributes"
// ]
```
## 异步回调和记录队列

 MutationObserver规范旨在提高性能，其设计的核心是异步回调和记录队列模型。为了允许在不降低性能的情况下注册大量突变，每个突变的信息被捕获到MutationRecord中，然后加入记录队列。该队列对于每个MutationObserver实例都是唯一的，并且记录每个DOM突变的顺序。

### 记录队列的行为

 每次将MutationRecord添加到MutationObserver的记录队列时，将观察者回调（由MutationObserver构造函数提供）调度为微任务(仅在没有其他调度时，如队列长度为0)。这保证记录队列没有第二个回调进程。

### takeRecords()方法

 可以使用takeRecords（）方法清空记录队列的MutationObserver实例，这将返回队列中存在的MutationRecord实例的数组，并清空队列：

```js
let observer = new MutationObserver(
    (mutationRecords) => console.log(mutationRecords));
observer.observe(document.body, {
    attributes: true
});
document.body.className = 'foo';
document.body.className = 'bar';
document.body.className = 'baz';
console.log(observer.takeRecords());
console.log(observer.takeRecords());
// [MutationRecord, MutationRecord, MutationRecord]
// []
```



## 性能 内存和垃圾回收

 在DOM2规范中引入的MutationEvent定义了少数事件，这些事件会因各种DOM突变而触发。在实现中，由于浏览器中事件的性质，此规范导致了严重的性能问题，在DOM3规范中，不建议使用这些事件。而应使用MutationObserver，其更实用，性能更好。

### MutationObserver的引用

**MutationObserver与它观察到的一个或多个节点之间的引用关系是不对称的。 MutationObserver对它正在观察的目标节点是弱引用。由于此引用很弱，因此不会阻止目标节点被垃圾回收。但是，节点对其MutationObserver有很强的引用。如果将目标节点从DOM中删除并随后进行垃圾回收，则关联的MutationObserver也将被垃圾回收**。

### MutationRecord的引用

 记录队列中的每个MutationRecord实例将至少包含一个对现有DOM节点的引用；对于childList突变，它将包含许多引用。记录队列和回调处理的默认行为是清空队列，处理每个MutationRecord，并允许它们超出作用域并进行垃圾回收。在某些情况下，保留给定观察者的完整突变记录会很有用。保留每个MutationRecord实例也将保留其包含的节点引用，从而防止对节点进行垃圾回收。如果需要及时进行节点垃圾回收，则最好将每个MutationRecord所需的有用信息提取到一个新对象中，并丢弃MutationRecord。

