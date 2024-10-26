---
permalink: /js/chapter22/
title: 第22章 JavaScript中的XML
createTime: 2024/10/18 16:28:56
---
# 第22章 JavaScript中的XML

XML（可扩展标记语言）和JSON（JavaScript对象表示）都是用于在不同系统之间交换数据的格式。它们之间有一些相似之处，也有一些区别：

1. **相似之处**：
   - **数据交换格式**：XML和JSON都是用于在不同系统之间交换数据的格式。
   - **易读性**：XML和JSON都相对易于阅读和编写。
   - **树状结构**：XML和JSON都支持树状结构，可以表示复杂的数据关系。

2. **区别**：
   - **语法**：XML使用标签和属性来表示数据，而JSON使用键值对和数组。
   - **数据类型**：JSON支持更多的数据类型，如数组、对象、字符串、数字、布尔值和null，而XML主要是文本数据。
   - **大小**：通常情况下，相同数据的JSON表示比XML表示更紧凑，因此JSON在网络传输时可能更高效。
   - **解析**：由于JSON的结构相对简单，解析速度通常比XML更快。

在实际应用中，JSON在Web开发中更为流行，因为它更轻量级、易于解析，适合在浏览器和服务器之间快速传输数据。而XML在一些传统的系统中仍然被广泛使用，特别是在一些需要复杂结构和元数据的场景中。

## 浏览器中的XML DOM支持

 因为浏览器供应商在正式标准创建之前就开始实施XML解决方案，所以每个供应商不仅提供不同级别的支持，而且还提供不同的实现。 DOM2是第一个引入动态XML DOM创建概念的规范。此功能在DOM3中得到了扩展，包括解析和序列化。然而，当DOM3最终确定时，大多数浏览器已经实现了他们自己的解决方案。

## DOM2核心

 如第 12 章所述，DOM2引入了document.implementation的createDocument() 方法。可以使用以下语法创建一个空白的XML文档：

```js
let xmldom = document.implementation.createDocument(namespaceUri, root, doctype);
```

 在JavaScript中处理XML时，通常只使用root参数，因为它定义了XML DOM document元素的标签名称。namespaceUri参数很少使用，因为命名空间很难从JavaScript管理。doctype参数也很少使用，如果有的话。

 创建一个包含\<root\> document元素的新XML文档:

```js
let xmldom = document.implementation.createDocument("", "root", null);
console.log(xmldom.documentElement.tagName); // "root"
let child = xmldom.createElement("child");
xmldom.documentElement.appendChild(child);
```

 此示例创建一个没有默认命名空间和文档类型的XML DOM文档。请注意，即使不需要命名空间和文档类型，仍必须传入参数。将空字符串作为命名空间URI传递，以便不应用命名空间，并将null作为文档类型传递。xmldom变量包含DOM2 Document类型的实例，以及第 12 章中讨论的所有DOM方法和属性。在这个例子中，显示了document元素的标签名称，然后创建并添加了一个新的子元素。

 可以使用以下代码检查浏览器中是否启用了DOM2 XML支持：

```js
let hasXmlDom = document.implementation.hasFeature("XML", "2.0");
```

 在实践中，很少会从头开始创建XML文档，然后使用DOM方法系统地构建它。更有可能的方法是将XML文档解析为DOM结构，或者相反。因为DOM2没有提供这样的功能，所以出现了几个事实上的标准。

## DOMParser类型

 Firefox引入了DOMParser类型，专门用于将XML解析为DOM文档，后来被其他浏览器供应商采用。要使用它，须先创建DOMParser的实例，然后调用parseFromString() 方法。此方法接受两个参数：要解析的XML字符串和内容类型，应始终为“text/xml”。返回值是Document的一个实例：

```js
let parser = new DOMParser();
let xmldom = parser.parseFromString("<root><child/></root>", "text/xml");
console.log(xmldom.documentElement.tagName); // "root"
console.log(xmldom.documentElement.firstChild.tagName); // "child"
let anotherChild = xmldom.createElement("child");
xmldom.documentElement.appendChild(anotherChild);
let children = xmldom.getElementsByTagName("child");
console.log(children.length); // 2
console.log(xmldom);
// #document
// <root>
//
<child></child>
//
<child></child>
// </root>
```

 在这个例子中，一个简单的XML字符串被解析成一个DOM文档。 DOM结构将\<root\>作为document元素，将单个\<child\>元素作为其子元素。然后，可以使用DOM方法与返回的文档进行交互。

 DOMParser只能解析格式良好的XML，因此无法将HTML解析为HTML文档。不幸的是，当发生解析错误时，浏览器的行为会有所不同。当Firefox、Opera、Safari、Chrome出现解析错误时，parseFromString()仍然返回一个Document对象，但是它的document元素是\<parsererror\>，元素的内容是解析错误的描述。下面是一个例子：

```html
<parsererror xmlns="http://www.mozilla.org/newlayout/xml/parsererror.xml">XML
    Parsing Error: no element found Location: file:// /I:/My%20Writing/My%20Books/
    Professional%20JavaScript/Second%20Edition/Examples/Ch15/DOMParserExample2.js Line
    Number 1, Column 7:<sourcetext>&lt;root&gt; ------^</sourcetext></parsererror>
```

 Firefox和Opera都以这种格式返回文档。Safari和Chrome会返回一个文档，该文档在发生解析错误的位置嵌入了\<parsererror\>元素。早期的IE版本会在调用parseFromString()时引发解析错误。由于这些差异，确定是否发生解析错误的最佳方法是使用try-catch块，如果没有错误，则通过getElementsByTagName() 在文档中的任何位置查找\<parsererror\>元素:

```js
let parser = new DOMParser(),
    xmldom,
    errors;
try {
    xmldom = parser.parseFromString("<root>", "text/xml");
    errors = xmldom.getElementsByTagName("parsererror");
    if (errors.length > 0) {
        throw new Error("Parsing error!");
    }
} catch (ex) {
    //console.log("Parsing error!");
    //console.log(xmldom.getElementsByTagName("parsererror"));
    console.log(xmldom);
}
```

 在此示例中，要解析的字符串缺少结束\</root\>标记，这会导致解析错误。在IE中，这会引发错误。在Firefox和Opera中，\<parsererror\>元素将是document元素，而在Chrome和Safari中它是\<root\>的第一个子元素。对getElementsByTagName("parsererror") 的调用涵盖了这两种情况。如果此方法调用返回任何元素，则发生错误并显示警报。还可以更进一步，从元素中提取错误信息。

### XMLSerializer 类型

 作为DOMParser的小伙伴，Firefox还引入了XMLSerializer类型来提供反向功能：将DOM文档序列化为XML字符串。从那时起，所有主要浏览器供应商都采用了XMLSerializer。

 要序列化 DOM文档，须创建一个新的XMLSerializer实例，然后将文档传递给serializeToString()方法，如下例所示：

```js
let serializer = new XMLSerializer();
let xml = serializer.serializeToString(xmldom);
console.log(xml);
```

 从serializeToString()返回的值是一个没有排版的字符串，因此肉眼可能难以阅读。

 XMLSerializer能够序列化任何有效的DOM对象，包括单个节点和HTML文档。当HTML文档被传递到serializeToString()时，它被视为一个XML文档，因此生成的代码是格式良好的。

> 注意:如果将非DOM对象传递给serializeToString()方法,则会引发错误。

## 浏览器中的XPATH支持

 创建XPath是为了在DOM文档中定位特定节点，因此它对XML处理很重要。直到DOM3引入了DOM3XPath标准，XPath的API才成为规范的一部分。许多浏览器选择实现此规范，但IE决定以自己的方式实现支持。

### DOM3 XPath

 DOM3 XPath规范定义了用于计算DOM中XPath表达式的接口。要确定浏览器是否支持DOM3 XPath，可使用以下JavaScript代码：

```js
let supportsXPath = document.implementation.hasFeature("XPath", "3.0");
```

 尽管规范中定义了多种类型，但最重要的两个是XPathEvaluator和XPathResult。 XPathEvaluator用于计算特定环境中的XPath表达式。该类型有以下三种方法：

-  createExpression(expression, nsresolver) 将XPath表达式和伴随的命名空间信息计算为XPathExpression，它是查询的编译版本。如果要多次运行同一个查询，这很有用。

-  createNSResolver(node) 根据节点的命名空间信息创建一个新的XPathNSResolver对象。对使用命名空间的XML文档进行计算时，需要XPathNSResolver对象。

-  evaluate(expression, context, nsresolver, type, result) 计算给定环境中的XPath表达式并使用特定的命名空间信息。其余参数指示应如何返回结果。


 Document类型通常使用XPathEvaluator接口实现。因此，可以创建XPathEvaluator的新实例，也可以使用位于Document实例上的方法（XML和HTML文档）。

 在这三种方法中，evaluate() 是最常用的。这个方法有五个参数：XPath 表达式、一个环境节点、一个命名空间解析器、要返回的结果类型和一个用结果填充的XPathResult对象（通常为null，因为结果也作为函数值返回）。第三个参数，命名空间解析器，只有在XML代码使用XML命名空间时才需要。如果未使用命名空间，则应将其设置为null。第四个参数，要返回的结果类型，是以下 10 个常量值之一：

-  **XPathResult. ANY_TYPE** 返回适合XPath表达式的数据类型。

-  **XPathResult. NUMBER_TYPE** 返回数字值。

-  **XPathResult. STRING_TYPE** 返回字符串值。

-  **XPathResult. BOOLEAN_TYPE** 返回布尔值。

-  **XPathResult. UNORDERED_NODE_ITERATOR_TYPE** 返回匹配节点的节点集，尽管顺序可能与文档中节点的顺序不匹配。

-  **XPathResult. ORDERED_NODE_ITERATOR_TYPE** 按照它们在文档中出现的顺序返回匹配节点的节点集。这是最常用的结果类型。

-  **XPathResult. UNORDERED_NODE_SNAPSHOT_TYPE** 返回节点集快照，进一步的文档修改不会影响节点集。节点集中的节点不一定与它们在文档中出现的顺序相同。

-  **XPathResult. ORDERED_NODE_SNAPSHOT_TYPE** 返回节点集快照，进一步的文档修改都不会影响结果集。结果集中的节点与它们在文档中出现的顺序相同。

-  **XPathResult. ANY_UNORDERED_NODE_TYPE** 返回匹配节点的节点集，顺序可能与文档中节点的顺序不匹配。

-  **XPathResult. FIRST_ORDERED_NODE_TYPE** 返回只有一个节点的节点集，它是文档中第一个匹配的节点。


 指定的结果类型决定了如何获取结果的值：

```js
let result = xmldom.evaluate("employee/name", xmldom.documentElement, null,
                             XPathResult.ORDERED_NODE_ITERATOR_TYPE,null);
if (result !== null) {
    let element = result.iterateNext();
    while (element) {
        console.log(element.tagName);
        node = result.iterateNext();
    }
}
```

 此示例使用XPathResult. ORDERED_NODE_ITERATOR_TYPE结果，这是最常用的结果类型。如果没有节点匹配XPath表达式，evaluate()返回null；否则，它返回一个XPathResult对象。XPathResult具有用于获取特定类型结果的属性和方法。如果结果是一个节点迭代器，无论它是有序的还是无序的，都必须使用iterateNext()方法来获取结果中每个匹配的节点。当没有进一步匹配的节点时，iterateNext()返回null。

 如果指定快照结果类型（有序或无序），则必须使用snapshotItem()方法和snapshotLength属性：

```js
let result = xmldom.evaluate("employee/name", xmldom.documentElement, null,
                             XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
if (result !== null) {
    for (let i = 0, len = result.snapshotLength; i < len; i++) {
        console.log(result.snapshotItem(i).tagName);
    }
}
```

 在此示例中，snapshotLength返回快照中的节点数，而snapshotItem()返回快照中给定位置的节点（类似于NodeList中的length和item()）。

### 单节点结果

 XPathResult. FIRST_ORDERED_NODE_TYPE结果返回第一个匹配的节点，可通过结果的singleNodeValue属性访问该节点：

```js
let result = xmldom.evaluate("employee/name", xmldom.documentElement, null,
                             XPathResult.FIRST_ORDERED_NODE_TYPE,null);
if (result !== null) {
    console.log(result.singleNodeValue.tagName);
}
```

 与其他查询一样，当没有匹配的节点时，evaluate()返回null。如果返回了一个节点，则使用singleNodeValue属性访问它。这对于XPathResult. FIRST_ORDERED_NODE_TYPE也是一样的。

### 简单类型结果

 也可以使用布尔、数字和字符串的XPathResult类型从XPath获取简单的非节点数据类型。这些结果类型分别使用booleanValue、numberValuee和stringValue属性返回单个值。对于Boolean类型，如果至少有一个节点与XPath表达式匹配，则计算通常返回true，否则返回false：

```js
let result = xmldom.evaluate("employee/name", xmldom.documentElement,
                             null,XPathResult.BOOLEAN_TYPE, null);
console.log(result.booleanValue);
```

 在此示例中，如果任何节点匹配“employee/name”，则booleanValue属性为true。

 对于数字类型，XPath表达式必须使用返回数字的XPath函数，例如count()，它计算与给定模式匹配的所有节点：

```js
let result = xmldom.evaluate("count(employee/name)", xmldom.documentElement,null,
                             XPathResult.NUMBER_TYPE, null);
console.log(result.numberValue);
```

 此代码输出与“employee/name”（即 2 ）匹配的节点数。如果尝试在没有特殊XPath函数的情况下使用此方法，则numberValue等于NaN。

 对于字符串类型，evaluate() 方法查找与XPath表达式匹配的第一个节点，然后返回第一个子节点的值，假设第一个子节点是文本节点。如果不是，则结果为空字符串:

```js
let result = xmldom.evaluate("employee/name", xmldom.documentElement,
                             null,XPathResult.STRING_TYPE, null);
console.log(result.stringValue);
```

 在此例中，代码输出包含在匹配“employee/name”的第一个元素下的第一个文本节点中的字符串。

### 默认类型结果

 所有XPath表达式都会自动映射到特定的结果类型。设置特定的结果类型会限制表达式的输出。但是，可以使用XPathResult. ANY_TYPE常量来允许返回自动结果类型。通常，结果类型以布尔值、数字值、字符串值或无序节点迭代器结束。要确定返回的是哪种结果类型，需对计算结果使用resultType属性，如下所示：

```js
let result = xmldom.evaluate("employee/name", xmldom.documentElement,
                             null,XPathResult.ANY_TYPE, null);
if (result !== null) {
    switch (result.resultType) {
        case XPathResult.STRING_TYPE:
            // handle string type
            break;
        case XPathResult.NUMBER_TYPE:
            // handle number type
            break;
        case XPathResult.BOOLEAN_TYPE:
            // handle boolean type
            break;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            // handle unordered node iterator type
            break;
        default:
            // handle other possible result types
    }
}
```

 使用XPathResult. ANY_TYPE常量可以更自然地使用XPath，但在返回结果后可能还需要额外的处理代码。

## 命名空间支持

 对于使用名称空间的XML文档，必须将命名空间信息告知XPathEvaluator，以便进行正确的计算。有多种方法可以实现这一点。如下XML代码：

```xml
<?xml version="1.0" ?>
<wrox:books xmlns:wrox="http://www.wrox.com/">
    <wrox:book>
        <wrox:title>Professional JavaScript for Web Developers</wrox:title>
        <wrox:author>Nicholas C. Zakas</wrox:author>
    </wrox:book>
    <wrox:book>
        <wrox:title>Professional Ajax</wrox:title>
        <wrox:author>Nicholas C. Zakas</wrox:author>
        <wrox:author>Jeremy McPeak</wrox:author>
        <wrox:author>Joe Fawcett</wrox:author>
    </wrox:book>
</wrox:books>
```

 在这个XML文档中，所有元素都是http://www.wrox.com/命名空间的一部分，由wrox前缀标识。如果要在此文档中使用XPath，则需要定义正在使用的名称空间；否则计算将失败。

 处理命名空间的第一种方法是通过createNSResolver()方法创建一个XPathNSResolver对象。此方法接受单个参数，它是包含命名空间定义的文档中的一个节点。在前面的示例中，此节点是document元素\<wrox:books\> ，它具有定义命名空间的xmlns特性。可以将此节点传递给createNSResolver()，然后可以在evaluate()中使用结果：

```js
let nsresolver = xmldom.createNSResolver(xmldom.documentElement);
let result = xmldom.evaluate("wrox:book/wrox:author",xmldom.documentElement,
                             nsresolver,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
console.log(result.snapshotLength);
```

 当nsresolver对象被传递到evaluate() 时，它确保XPath表达式中使用的wrox前缀被正确理解。在不使用XPathNSResolver的情况下尝试使用相同的表达式将导致错误。

 处理命名空间的第二种方法是定义一个函数，该函数接受命名空间前缀并返回关联的URI：

```js
let nsresolver = function(prefix) {
    switch (prefix) {
        case "wrox":
            return "http://www.wrox.com/";
            // others here
    }
};
let result = xmldom.evaluate("count(wrox:book/wrox:author)",xmldom.documentElement,
                             nsresolver, XPathResult.NUMBER_TYPE, null);
console.log(result.numberValue);
```

当不确定文档的哪个节点包含名称空间定义时，定义命名空间解析函数会很有帮助。只要知道前缀和URI，就可以定义一个函数来返回此信息并将其作为第三个参数传递给evaluate()。

## 浏览器中的XSLT支持

 XSLT是XML的配套技术，它使用XPath将一种文档表示形式转换为另一种文档表示形式。与XML和XPath不同，XSLT没有与之关联的正式API，并且根本不在正式DOM中表示。这让浏览器供应商以自己的方式实现支持。第一个在JavaScript中添加XSLT处理的浏览器是IE。

### XSLTProcessor类型

 Mozilla通过创建新类型在Firefox中实现了对XSLT的JavaScript支持。 XSLTProcessor类型允许开发人员以类似于IE中的XSL处理器的方式使用XSLT来转换XML文档。自实现以来，所有主要浏览器都复制了该实现，使XSLTProcessor成为支持JavaScript的XSLT转换的标准。

 与IE实现一样，第一步是加载两个DOM文档，一个是XML，另一个是XSLT。之后，创建一个新的XSLTProcessor并使用importStylesheet()方法将XSLT分配给它：

```js
let processor = new XSLTProcessor()
processor.importStylesheet(xsltdom);
```

 最后一步是执行转换。这可通过两种不同的方式完成。如果想返回一个完整的DOM文档作为结果，请调用transformToDocument()。还可以通过调用transformToFragment()来获取文档片段对象作为结果。一般来说，使用transformToFragment()的唯一原因是打算将结果添加到另一个DOM文档中。

 使用transformToDocument()时，只需传入XML DOM并将结果用作另一个完全不同的DOM：

```js
let result = processor.transformToDocument(xmldom);
console.log(serializeXml(result));
```

 transformToFragment()方法接受两个参数：要转换的XML DOM和应该拥有结果片段的文档。这确保新文档片段在目标文档中是有效的。因此，通过将文档作为第二个参数传入来创建片段并将其添加到页面中：

```js
let fragment = processor.transformToFragment(xmldom, document);
let div = document.getElementById("divResult");
div.appendChild(fragment);
```

 在这里，处理器创建document对象拥有的片段。这使片段能够被添加到div上。当XSLT样式单的输出格式是“xml”或“html”时，创建文档或文档片段就非常有意义。但是，当输出格式为“text”时，通常只需要转换的文本结果。不幸的是，没有直接返回文本的方法。当输出为“text”时调用transformToDocument()会返回完整的XML文档，但该文档的内容因浏览器而异。例如，Safari返回整个HTML文档，而Opera和Firefox返回一个单元素文档，输出作为元素的文本。

 解决方案是调用transformToFragment()，它返回一个文档片段，该文档片段具有一个包含结果文本的子节点。因此，可以使用以下代码获取文本：

```js
let fragment = processor.transformToFragment(xmldom, document);
let text = fragment.firstChild.nodeValue;
console.log(text);
```

 对于每个支持的浏览器，此代码的工作方式相同，并且仅正确返回转换的文本输出。

### 使用形参

 XSLTProcessor还允许使用setParameter()方法设置XSLT参数，该方法接受三个参数：命名空间URI、参数本地名称和要设置的值。通常，命名空间 URI为空，本地名称只是参数的名称。必须在transformToDocument()或transformToFragment() 之前调用此方法：

```js
let processor = new XSLTProcessor()
processor.importStylesheet(xsltdom);
processor.setParameter(null, "message", "Hello World!");
let result = processor.transformToDocument(xmldom);
```

 另外两个方法与参数相关，getParameter()和removeParameter()；它们分别用于获取参数的当前值和删除参数值。每个方法都采用命名空间URI（通常为null）和参数的本地名称。例如：

```js
let processor = new XSLTProcessor()
processor.importStylesheet(xsltdom);
processor.setParameter(null, "message", "Hello World!");
console.log(processor.getParameter(null, "message")); // outputs "Hello World!"
processor.removeParameter(null, "message");
let result = processor.transformToDocument(xmldom);
```

 这些方法不经常使用，主要是为了方便而提供。

### 重置处理器

 对于具有不同XSLT样式单的多个转换，每个XSLTProcessor实例都可以重复使用多次。 reset()方法从处理器中删除所有参数和样式单，允许 再次调用importStylesheet()以加载不同的XSLT样式单，如下例所示：

```js
let processor = new XSLTProcessor()
processor.importStylesheet(xsltdom);
// do some transformations
processor.reset();
processor.importStylesheet(xsltdom2);
// do more transformations
```

 在使用多个样式表执行转换时，重用单个XSLTProcessor可以节省内存。