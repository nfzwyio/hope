---
permalink: /js/chapter23/
title: 第23章 JSON
createTime: 2024/10/18 16:28:56
---
# 第23章 JSON

 JSON是一种数据格式，而不是一种编程语言。 JSON不是JavaScript的一部分，即使它们共享语法。 JSON也不仅仅被JavaScript使用，因为它是一种数据格式。许多编程语言都有解析器和序列化器。

## 语法

 JSON语法允许表示三种类型的值：

-  **简单值** 字符串、数字、布尔值和null都可以使用与JavaScript相同的语法在JSON中表示。不支持特殊值undefined。

-  **对象** 对象表示有序的键值对。每个值可以是原始类型或复杂类型。

-  **数组** 数组表示可通过数字索引访问的有序值列表。值可以是任何类型，包括简单值、对象，甚至其他数组。


 JSON中没有变量、函数或对象实例。 JSON完全是用来表示结构化数据的，虽然它与JavaScript共享语法，但不应与JavaScript混淆。

## 简单值

 最简单的形式中, JSON表示一些简单值。以下是有效的JSON：

```json
666
```

 这是表示数字 666 的JSON。同样，以下也是表示字符串的有效JSON：

```json
"Hello,甘雨!"
```

 JavaScript字符串和JSON字符串的最大区别在于**JSON字符串必须使用双引号才有效**（单引号会导致语法错误）。

 布尔值和null与独立JSON完全一样有效。然而，在实践中，JSON最常用于表示更复杂的数据结构，其中简单的值仅表示整体信息的一部分。

## 对象

 对象使用对象字面量表示法，但略有不同。JavaScript中的对象字面量：

```js
let person = {
    name: "甘雨",
    age: 3000
};
```

 JSON中表示如下：

```json
{
    "name": "甘雨",
    "age": 3000
}
```

 与JavaScript示例有一些不同之处。首先，**没有变量声明**。其次，**没有尾随分号**。同样**属性名称周围的引号是必须的**。该值可以是任何简单或复杂的值，且允许在对象中嵌入对象：

```json
{
    "name": "甘雨",
    "age": 3000,
    "friends":{
        "name":"钟离",
        "work":"尘世闲游"
    }
}
```



### 数组

 JSON中的数组几乎和JavaScript的数组字面表示法相同，但是没有变量声明和后面的分号。例如，这是JavaScript中的数组：

```js
let values = [666, "hi", true];
```

 JSON中的：

```json
[666, "hi", true]
```

 数组和对象可以一起使用来表示更复杂的数据集合，例如：

```json
[{
    "title": "Professional JavaScript",
    "authors": [
        "Nicholas C. Zakas",
        "Matt Frisbie"
    ],
    "edition": 4,
    "year": 2017
},
 {
     "title": "Professional JavaScript",
     "authors": [
         "Nicholas C. Zakas"
     ],
     "edition": 3,
     "year": 2011
 },
 {
     "title": "Professional JavaScript",
     "authors": [
         "Nicholas C. Zakas"
     ],
     "edition": 2,
     "year": 2009
 },
 {
     "title": "Professional Ajax",
     "authors": [
         "Nicholas C. Zakas",
         "Jeremy McPeak",
         "Joe Fawcett"
     ],
     "edition": 2,
     "year": 2008
 },
 {
     "title": "Professional Ajax",
     "authors": [
         "Nicholas C. Zakas",
         "Jeremy McPeak",
         "Joe Fawcett"
     ],
     "edition": 1,
     "year": 2007
 },
 {
     "title": "Professional JavaScript",
     "authors": [
         "Nicholas C. Zakas"
     ],
     "edition": 1,
     "year": 2006
 }
]
```



## 解析和序列化

 JSON流行并不是因为它使用了熟悉的语法。相反，它变得流行是因为数据可以在JavaScript中被解析为一个可用的对象。这与解析为DOM文档的XML形成鲜明对比，对JavaScript开发者来说提取数据是一件苦差事。例如，上一节中的JSON代码包含一个图书列表，可以通过以下方式轻松获取第三本书的标题：

```json
books[2].title
```

 DOM结构中：

```js
doc.getElementsByTagName("book")[2].getAttribute("title");
```



### JSON对象

 早期的JSON解析器仅使用JavaScript的eval()函数。因为JSON是JavaScript语法的一个子集，所以eval()可以解析、解释并将数据作为JavaScript对象和数组返回。 ECMAScript5在名为JSON的本地全局变量下规范化了JSON解析。所有主要浏览器都支持此对象。

 JSON对象有两个方法：stringify()和parse()。在简单的使用中，这些方法分别将JavaScript对象序列化为JSON字符串和将JSON解析为原生JavaScript值：

```js
let book = {
title: "Professional JavaScript",
authors: [
"Nicholas C. Zakas",
"Matt Frisbie"
],
edition: 4,
year: 2017
};
let jsonText = JSON.stringify(book);
```

 此示例使用JSON.stringify()将JavaScript对象序列化为JSON字符串并将其存储在jsonText中。默认情况下，JSON.stringify()输出一个JSON字符串，没有任何多余的空格或缩进，因此jsonText中存储的值如下：

```json
{"title":"Professional JavaScript","authors":["Nicholas C. Zakas","Matt
Frisbie"],"edition":4,"year":2017}
```

 当序列化一个JavaScript对象时，所有的函数和原型成员都会被有意地从结果中省略掉。此外，任何值为undefined的属性也会被跳过。

 JSON字符串可以直接传递到JSON.parse()中，它会创建一个合适的JavaScript值。例如，可以使用以下代码创建一个类似于book对象的对象：

```js
let bookCopy = JSON.parse(jsonText);
```

 注意，book和bookCopy都是独立的对象，彼此之间没有任何关系:

```js
book.year = 2021;
console.log(bookCopy.year); //2017
```

 如果传入JSON.parse()的文本不是有效的JSON，则会引发错误。

### 序列化选项

 除了要序列化的对象之外，JSON.stringify()方法实际上还接受两个参数。这些参数允许指定序列化JavaScript对象的替代方法。第一个参数是一个过滤器，它可以是一个数组或一个函数。

#### 过滤结果

 如果参数是一个数组，那么JSON.stringify()将只包含数组中列出的对象属性:

```js
let book = {
    title: "Professional JavaScript",
    authors: [
        "Nicholas C. Zakas",
        "Matt Frisbie"
    ],
    edition: 4,
    year: 2017
};
let jsonText = JSON.stringify(book, ["title", "edition"]);
```

 JSON.stringify()的第二个参数是一个包含两个字符串的数组：“title”和“edition”。这些对应正在序列化的对象中的属性，因此只有这些属性出现在结果JSON字符串中：

```json
{"title":"Professional JavaScript","edition":4}
```

 当第二个参数是一个函数时，行为略有不同。提供的函数接收两个参数：属性键名称和属性值。可以通过键来处理该属性。

 为了更改对象的序列化结果，应返回包含在该键中的值：

```js
let book = {
    title: "Professional JavaScript",
    authors: [
        "Nicholas C. Zakas",
        "Matt Frisbie"
    ],
    edition: 4,
    year: 2017
};
let jsonText = JSON.stringify(book, (key, value) => {
    switch (key) {
        case "authors":
            return value.join(",")
        case "year":
            return 5000;
        case "edition":
            return undefined;
        default:
            return value;
    }
});
console.log(jsonText);
//{"title":"Professional JavaScript","authors":"Nicholas C. Zakas,Matt
Frisbie","year":5000}
```

 该函数根据键进行过滤。“authors”键从数组转换为字符串，“year”键设置为 5000 ，通过返回undefined完全删除“edition”键。默认行为原封不动的返回对应值很重要，以便所有其他值都能传递给结果。

#### 字符串缩进

 JSON.stringify()的第三个参数控制缩进和空格。当这个参数是一个数字时，它表示每级缩进的空格数。例如，要将每级缩进四个空格，可这样使用：

```js
let book = {
    title: "Professional JavaScript",
    authors: [
        "Nicholas C. Zakas",
        "Matt Frisbie"
    ],
    edition: 4,
    year: 2017
};
let jsonText = JSON.stringify(book, null, 4);
```

 jsonText中存储的字符串：

```json
{
    "title": "Professional JavaScript",
    "authors": [
        "Nicholas C. Zakas",
        "Matt Frisbie"
    ],
    "edition": 4,
    "year": 2017
}
```

 可能已经注意到JSON.stringify()还会在JSON字符串中插入新行以便于阅读。这适用于所有有效的缩进参数值。（没有换行的缩进不是很有用。）最大数字缩进值为 10 。传入大于 10 的值会自动将值设置为 10 。

如果缩进参数是字符串而不是数字，则该字符串将用作JSON字符串的缩进字符而不是空格。使用字符串，可以将缩进字符设置为制表符或其他字符，例如两个破折号：

```js
let jsonText = JSON.stringify(book, null, "--");
```

 jsonText值变成如下：

```json
{
--"title": "Professional JavaScript",
--"authors": [
----"Nicholas C. Zakas",
----"Matt Frisbie"
--],
--"edition": 4,
--"year": 2017
}
```



#### toJSON()方法

 有时对象需要自定义JSON序列化。在这些情况下，可以向对象添加一个toJSON()方法，并让它为自己返回正确的JSON表示。实际上，原生Date对象有一个toJSON() 方法，可以自动将JavaScript Date对象转换为ISO 8601 日期字符串（本质上与在Date对象上调用toISOString()一样）。

 toJSON() 方法可以添加到任何对象，例如：

```js
let book = {
    title: "Professional JavaScript",
    authors: [
        "Nicholas C. Zakas",
        "Matt Frisbie"
    ],
    edition: 4,
    year: 2017,
    toJSON: function() {
        return this.title;
    }
};
let jsonText = JSON.stringify(book);
console.log(jsonText); //"Professional JavaScript"
```

 此代码在book对象上定义了一个toJSON()方法，该方法仅返回书名。与Date对象类似，这个对象被序列化为一个简单的字符串而不是一个对象。如果对象嵌入到另一个对象中，序列化也会正常执行。请注意，箭头函数不用于toJSON()方法。这主要是因为箭头函数的词法作用域将是全局作用域:

```js
let desk = {
    interest:book,
    year:2077
}
let jsonText = JSON.stringify(desk);
console.log(jsonText);//{"interest":"Professional JavaScript","year":2077}
```

 除了过滤器函数之外，还可以使用toJSON()方法，因此了解序列化过程的各个部分发生的顺序非常重要。

 当一个对象传入JSON.stringify()时，会采取以下步骤：

  1. 如果可以获取实际值，则调用toJSON()方法。否则使用默认序列化。

  2. 如果提供了第二个参数，则应使用过滤器。传递给过滤器函数的值将是从步骤 1 返回的值。

  3. 步骤 2 中的每个值都被适当地序列化。

  4. 如果提供了第三个参数，则适当地格式化。

### 解析选项

 JSON.parse()方法还接受一个额外的函数参数reviver，该函数在每个键值对上调用，并接收key和value两个参数，且返回一个值。

 如果函数返回undefined，则从结果中删除键；如果它返回任何其他值，则将该值插入到结果中。函数的一个非常常见的用途是将日期字符串转换为Date对象：

```js
let book = {
    title: "Professional JavaScript",
    authors: [
        "Nicholas C. Zakas",
        "Matt Frisbie"
    ],
    edition: 4,
    year: 2017,
    releaseDate: new Date(2017, 11, 1)
};
let jsonText = JSON.stringify(book);
let bookCopy = JSON.parse(jsonText,
                          (key, value) => key == "releaseDate" ? new Date(value) : value);
alert(bookCopy.releaseDate.getFullYear());
```

 这段代码向book对象添加了一个releaseDate属性。对象被序列化以获取有效的JSON字符串，然后解析回对象bookCopy。函数查找“releaseDate”键，并在找到时基于该字符串创建一个新的Date对象。生成的bookCopy.releaseDate属性则是一个Date对象，因此可以调用getFullYear()方法。
