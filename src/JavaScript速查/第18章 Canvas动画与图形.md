---
permalink: /js/chapter18/
title: 第18章 Canvas动画与图形
createTime: 2024/10/18 16:28:56
---
# 第18章 Canvas动画与图形

## canvas基本用法



\<canvas\>元素至少需要设置width和height特性以指定要创建的图形的尺寸。任何出现在开闭标签之间的内容是后备数据，仅在不支持\<canvas\>的情况下才显示出来：

```html
<canvas id="canvas" width="200" height="200">若支持canvas则这句话不显示</canvas>
```

 与其他元素一样，width和height特性也可以作为DOM元素对象上的属性使用，并且可以随时更改。整个元素也可以使用CSS进行样式设置，并且直到对其进行样式设置或绘制之前，该元素都是不可见的。

在canvas上绘制之前，需要先获取绘制环境。一种方式是使用getContext()方法并传递环境名获取：

```js
let canvas = document.getElementById("canvas");
//确保支持<canvas>
if (canvas.getContext) {
    let context = canvas.getContext("2d");
    // 其他代码
}
```

\<canvas\>元素上创建的图形可使用toDataURL()方法导出。该方法接受单个参数：要生成的图像的MIME类型格式，如下返回png格式的图片：

```html
<canvas id="canvas" width="200" height="200" style="background-color: red;"></canvas>
<img id="test" />
```

 

```js
let canvas = document.getElementById("canvas");
if (canvas.getContext) {
    let context = canvas.getContext("2d");
    context.fillStyle = "yellow";
    context.fillRect(10, 10, 66, 66);
    // 获取图片的URI数据
    let imgURI = canvas.toDataURL("image/png");
    // 展示图片
    let image = document.getElementById("test");
    image.src = imgURI; //该图片不包含内联样式信息
}
```

带内联样式信息的canvas：

![](/js_img/1801.png)

 toDataURL转换后：

![](/js_img/1802.png)

## 2D环境

 2D绘图环境提供了用于绘制简单2D形状（例如矩形，弧形和路径）的方法。2D环境的坐标始于\<canvas\>元素的左上角(0,0)，向右x递增，向下y递增。


### Fill和Stroke

 在2D环境中有两种基本的绘制操作：填充和描边。填充自动以特定的样式（颜色，渐变或图像）填充形状，而描边仅对边缘着色。大多数2D环境操作都具有填充和描边变体，它们的显示方式基于两个属性：fillStyle和strokeStyle。

 这两个属性都可以设置为字符串、渐变对象或图案（pattern）对象，并且都默认为“＃000000”。字符串值表示使用CSS定义的多种颜色格式之一：名称，十六进制代码，rgb，rgba，hsl或hsla。例如：

```js
let canvas = document.getElementById("canvas");
if (canvas.getContext) {
    let context = canvas.getContext("2d");
    context.strokeStyle = "red";
    context.fillStyle = "#ff2faf";
    context.fillRect(12, 12, 24, 24);
}
```



### 绘制矩形

 唯一可以直接在2D绘图环境中直接绘制的形状是矩形。有三种处理矩形的方法：fillRect（），strokeRect（）和clearRect（）。这些方法均接受四个参数：矩形的x坐标，y坐标，宽度和高度。这些参数中的每一个都以像素为单位。

 fillRect（）方法用于在画布上绘制以特定颜色填充的矩形。填充颜 色是使用fillStyle属性指定的：

```js
context.fillStyle = "#ff0000";
context.fillRect(10, 10, 50, 50);
// 绘制一个半透明的蓝色矩形
context.fillStyle = "rgba(0,0,255,0.5)";
context.fillRect(30, 30, 50, 50);
```

 效果如图：

![](/js_img/1803.png)

 strokeRect（）方法使用strokeStyle属性指定的颜色绘制矩形轮廓:

```
context.strokeStyle = "#ff0000";
context.strokeRect(10, 10, 50, 50);
context.strokeStyle = "rgba(0,0,255,0.5)";
context.strokeRect(30, 30, 50, 50);
```
 效果如图：

![](/js_img/1804.png)

> 注意:笔画的大小由lineWidth属性控制,该属性可以设置为任何整数。同样,lineCap属性描述了线头使用的形状("butt", "round"或"square"),而lineJoin指示应如何连接线段关点("round", "bevel",或"miter")。

lineCap：

```js
let context = canvas.getContext("2d");
context.beginPath();
context.strokeStyle = "red";
context.lineWidth = 10;
context.lineCap = "butt";
context.moveTo(20, 20);
context.lineTo(20, 100);
context.stroke();
context.closePath();
//需要重新开始和结束路径,否则最后一个lineCap属性将覆盖之前的
context.beginPath();
context.lineCap = "round";
context.moveTo(40, 20);
context.lineTo(40, 100);
context.stroke();
context.closePath();
context.beginPath();
context.lineCap = "square";
context.moveTo(60, 20);
context.lineTo(60, 100);
context.stroke();
context.closePath();
```

 效果如图：

![](/js_img/1805.png)

 lineJoin:

```js
let context = canvas.getContext("2d");
context.beginPath();
context.strokeStyle = "darkmagenta";
context.lineWidth = 10;
context.lineJoin = "round";
context.moveTo(20, 20);
context.lineTo(20, 100);
context.lineTo(100, 100);
context.stroke();
context.closePath();
//需要重新开始和结束路径,否则最后一个lineCap属性将覆盖之前的
context.beginPath();
context.lineJoin = "bevel";
context.moveTo(40, 40);
context.lineTo(40, 120);
context.lineTo(120, 120);
context.stroke();
context.closePath();
context.beginPath();
context.lineJoin = "miter";
context.moveTo(60, 60);
context.lineTo(60, 140);
context.lineTo(140, 140);
context.stroke();
context.closePath();
```

 效果如图：

![](/js_img/1806.png)

 可以使用clearRect（）方法擦除画布的某个区域。通过绘制形状然后清除特定区域，可以创建有趣的效果，例如切出其他形状的一部分：

```js
context.fillStyle = "#ff0000";
context.fillRect(10, 10, 50, 50);
// 绘制一个半透明的蓝色矩形
context.fillStyle = "rgba(0,0,255,0.5)";
context.fillRect(30, 30, 50, 50);
context.clearRect(40, 40, 10, 10);
```

 效果如图：

![](/js_img/1807.png)

### 绘制路径

 2D绘图环境支持多种在画布上绘制路径的方法。路径可以创建复杂的形状和线条。创建路径时，必须首先调用beginPath（）来指示新路径已经开始。之后，可以调用以下方法来创建路径：

-  arc（x，y，radius，startAngle，endAngle，counterclockwise）绘制以点（x，y）为中心,radius为半径,在startAngle和endAngle之间（以弧度表示)的圆弧。最后一个参数是布尔值，指示startAngle和endAngle是否以逆时针计算。

-  arcTo(x1, y1, x2, y2, radius) 绘制一个从上一个点到控制点 1 （x1,y1)的连线和控制点 1 到控制点2(x2,y2)的连线相切,半径为radius的圆弧。

-  bezierCurveTo(c1x, c1y, c2x, c2y, x, y) 该方法需要三个点。 第一、第二个点是控制点，第三个点是结束点。起始点是当前路径的最后一个点，绘制贝赛尔曲线前，可以通过调用 moveTo() 进行修改。

-  lineTo(x, y) 从上一个点到点（x，y）画一条直线。

-  moveTo(x, y) 将绘图光标移动到点（x，y），不画线。

-  quadraticCurveTo(cx, cy, x, y) 使用控制点（cx，cy）绘制从上一个点到点（x，y）的二次曲线。

-  rect(x, y,width, height) 在点（x，y）处以给定的宽度和高度绘制一个矩形。这与strokeRect（）和

-  fillRect（）的不同之处在于，它创建路径而不是独立的形状。


 创建路径后，有几个选择：若要将线画回到路径的原点，可以调用closePath（）。如果路径已经完成，并且想用fillStyle填充它，请调用fill（）方法。若使用strokeStyle，可选择通过调用stroke（）方法来绘制路径。最后一个选项是调用clip（），它会根据路径创建一个新的裁剪区域。

 示例：

```js
let context = canvas.getContext("2d");
// 开始路径
context.beginPath();
// 逆时针画一个半圆
context.strokeText('(100,100)', 100, 100);
context.arc(100, 100, 99, 0, Math.PI, true);
// 顺时针画一个半圆
context.moveTo(400, 100);
context.strokeText('(300,100)', 300, 100);
context.arc(300, 100, 99, 0, Math.PI, false);
//绘制圆弧
context.moveTo(100, 300);
context.strokeText('(100,300)', 100, 300);
context.strokeText('(200,400)', 200, 400);
context.strokeText('(300,300)', 300, 300);
context.arcTo(200, 400, 300, 300, 200);
context.lineTo(200, 400);
// 绘制到起点
context.closePath();
context.stroke();
```

 如图：

![](/js_img/1808.png)

 贝塞尔曲线：

```js
let context = canvas.getContext("2d");
context.beginPath();
context.moveTo(100, 100);
context.strokeText('(100,100)',100,100);
context.strokeText('(200,100)',200,100);
context.strokeText('(120,130)',120,130);
context.strokeText('(180,180)',180,180);
context.bezierCurveTo(120, 130, 180, 180, 200, 100);
context.stroke();
```

 如图：

![](/js_img/1809.png)




### 绘制文本

 可用fillText()和strokeText()方法绘制文本，都接受 4 个参数：要绘制的字符串格式的文本，x坐标，y坐标，和可选的最大像素宽度（超过将被水平缩放)。两个方法都基于如下三个属性绘制：

-  **font** 包含字体样式，大小，如"10px Arial"。

-  **textAlign** 可能的值有"start"、"end"、"left"、"right"、"center",推荐使用"start"和"end"代替左右对齐，因为有些语言渲染顺序不一样。

-  **textBaseline** 文本的基线，可能的有"top","hanging", "middle","alphabetic","ideographic" 和 "bottom"。


fillText（）方法使用fillStyle属性绘制文本，而strokeText（）方法使用strokeStyle属性:

```
let context = canvas.getContext("2d");
context.beginPath();
context.moveTo(100, 100);
context.lineTo(100, 200);
context.font = "bold 14px Arial";
context.textBaseline = "middle";
context.textAlign = "start";
context.fillText("南风知我意", 100, 100);
context.textAlign = "center";
context.fillText("南风知我意", 100, 140);
context.textAlign = "end";
context.fillText("南风知我意", 100, 180);
context.stroke();
```

 效果如图：

![](/js_img/1810.png)

 垂直调整使用textBaseline。

 可使用measureText（）方法确定文本的尺寸，该方法接受单个参数：要绘制的文本，并返回一个TextMetrics对象，该对象仅有一个width属性。measureText（）方法使用font，textAlign和textBaseline的当前值来计算指定文本的大小。如下所示：

```js
let context = canvas.getContext("2d");
let fontSize = 100;
context.font = fontSize + "px Arial";
while (context.measureText("南风知我意").width > 140) {
    fontSize--;
    context.font = fontSize + "px Arial";
}
context.fillText("南风知我意", 30, 30);
context.fillText("字体尺寸是: " + fontSize + "px", 50, 60);
```

 效果如图：

![](/js_img/1811.png)

### 变换

 可以使用以下方法来扩充变换矩阵：

-  **rotate(angle)** 将图片围绕原点旋转angle弧度（顺时针） :

```js
context.beginPath();
context.strokeText('(100,100)', 100, 100);
context.strokeRect(100, 100, 200, 50);
context.translate(100, 200);
context.rotate(Math.PI * 0.25);
context.strokeText('(0,0)', 0, 0);
context.strokeRect(0, 0, 200, 50);// 注意使用了translate(100,200)
```

 效果如图：

![](/js_img/1812.png)

-  **scale(scaleX, scaleY)** 通过x乘scaleX，y乘scaleY来缩放图片。

-  **translate(x, y)** 移动原点到点(x,y)。原来的点(x,y)变成了(0,0)。


```js
context.beginPath();
context.strokeText('(100,100)', 100, 100);
context.arc(100, 100, 99, 0, 2 * Math.PI, true);
context.translate(100, 100);
context.moveTo(200, 100);
context.strokeText('(100,100)', 100, 100);
context.arc(100, 100, 99, 0, 2 * Math.PI, true);
context.stroke();
```

 效果如图：

![](/js_img/1813.png)

-  **transform(m1_1, m1_2, m2_1, m2_2, dx, dy)** 直接更改变换矩阵为：

  

| $m_{1\_1}$ | $m_{1\_2}$ | $dx$ |
	| $m_{2\_1}$ | $m_{2\_2}$ | $dy$ |
	| 0        | 0       | 1    |

-  **setTransform(m1_1, m1_2, m2_1, m2_2, dx, dy)** 重置变换矩阵到默认状态，随后调用transform()。


 save()方法调用时将保存环境的参数和变换设置到栈中，restore()调用时弹出：

```js
let context = canvas.getContext("2d");
context.fillStyle = "red";
context.save();
context.fillStyle = "blue";
context.translate(100, 100);
context.save();
context.fillStyle = "yellow";
context.strokeText("第一个黄", 0, 0);
context.fillRect(0, 0, 80, 80);
context.restore();
context.strokeText("第二个蓝", 100, 200);
context.fillRect(100, 200, 80, 80);
context.restore();
context.strokeText("第三个红", 200, 100);
context.fillRect(200, 100, 80, 80);
```

 效果如图：

![](/js_img/1814.png)


### 绘制图片

 可使用drawImage()方法将图片绘制到画布上，语法如下：

```c
void context.drawImage(image, dx, dy);
void context.drawImage(image, dx, dy, dWidth, dHeight);
void context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
```

 参数如图：

![](/js_img/1815.png)

```js
let image = document.getElementById('sourse');
if (canvas.getContext) {
    let context = canvas.getContext("2d");
    //确保图片加载完成再绘制
    window.onload = function() {
        context.drawImage(image, 22, 22);
    }
}
```



### 阴影

 2d环境将基于几个属性绘制形状或路径的阴影：

-  **shadowColor** 阴影颜色，默认为黑色

-  **shadowOffsetX** 形状或阴影在x轴方向的偏移量，默认为 0

-  **shadowOffsetY** 形状或阴影在y轴方向的偏移量，默认为 0

-  **shadowBlur** 要模糊的像素数。如果设置为 0 ，则阴影不会模糊。默认为 0


 自动绘制前设置好属性既可：

```js
context.shadowOffsetX = 5;
context.shadowOffsetY = 5;
context.shadowBlur = 4;
context.shadowColor = "rgba(255, 0, 0, 0.5)";
context.fillStyle = "#ff0000";
context.fillRect(10, 10, 50, 50);
```

 效果如图：

![](/js_img/1816.png)

### 渐变

 渐变通过CanvasGradient实例呈现，可调用createLinearGradient()方法创建线性渐变，该方法接受两个参数，开始的x,y坐标，和结束的x,y坐标，调用后该方法将创建指定尺寸的CanvasGradient实例并返回之。

 一旦拥有了渐变对象，下一步是使用addColorStop（）方法分配色标。该方法接受两个参数：色标的位置和CSS颜色。色标位置是介于 0 （第一种颜色）和 1 （最后一种颜色）之间的数字。如下所示：

```js
let gradient = context.createLinearGradient(30, 30, 80, 80);
gradient.addColorStop(0.5, "white");
gradient.addColorStop(1, "red");
context.fillStyle = gradient;
context.fillRect(20, 20, 100, 100);
context.fillStyle="#0000FF";
context.strokeText('(30,30)', 30, 30);
context.strokeText('(80,80)', 80, 80);
context.fillRect(30,30,5,5);
context.fillRect(80,80,5,5);
```

效果如图：

![](/js_img/1817.png)

 使用createRadialGradient（）方法创建径向渐变。此方法接受与圆心及其半径相对应的六个参数。前三个变量定义起始圆的中心（x和y）和半径，后三个变量定义终止圆。

```js
let gradient = context.createRadialGradient(100, 100, 20, 100,100,80);
gradient.addColorStop(0, "white");
gradient.addColorStop(1, "red");
context.fillStyle = gradient;
context.fillRect(10, 10, 180, 180);
```

 效果如图：

![](/js_img/1818.png)

### 图案

 图案只是重复的图像，可用于填充或绘制形状。要创建新图案，可调用createPattern（）方法并传入两个参数：一个\<img\>元素和一个表示重复方式的字符串，可能的值为：repeat、repeat-x、repeat-y、no-

 reapeat。示例如下：

```js
let image = document.getElementById("keq");
// 确保图片加载完成再创建图案
window.onload = function() {
    pattern = context.createPattern(image, "repeat");
    context.fillStyle = pattern;
    context.fillRect(10, 10, 1500, 1500);
}
```

 效果如下：

![](/js_img/1819.png) 

 createPattern()方法的第一个参数也可以是\<video\>元素或其他canvas元素。

### 处理图像数据

 2d环境的一个强大的功能是使用getImageData()方法获取原始图像数据。该方法接受四个参数：需要获取的数据的第一个像素的坐标、像素宽度和像素高度。如下所示：

```js
let imageData = context.getImageData(10, 5, 50, 50);
```

 该方法返回的对象是ImageData实列。每一个ImageData对象仅包含三个属性：width、height和data。data属性是一个数组，其中包含图像的原始像素信息。每个像素实际上表示为data数组中的四项，每一项分别代表红，绿，蓝和alpha。因此，第一个像素的数据包含在data的0~3项中，如下所示：

```js
let data = imageData.data,
    red = data[0],
    green = data[1],
    blue = data[2],
    alpha = data[3];
```

 数组中的每个值都是 0 到 255 之间的数字（包括 0 和 255 ）。访问原始图像数据可以用多种方式处理图像。例如，可以通过更改图像数据来创建简单的灰度滤镜：

```js
window.onload = function() {
    let imageData, data, i, len, average, red, green, blue, alpha;
    // 将图片绘制到canvas
    context.drawImage(image, 0, 0);
    // 获取图片数据
    imageData = context.getImageData(0, 0, image.width, image.height);
    data = imageData.data;
    for (i = 0, len = data.length; i < len; i += 4) {
        red = data[i];
        green = data[i + 1];
        blue = data[i + 2];
        alpha = data[i + 3];
        // 获取rgb的平均值
        average = Math.floor((red + green + blue) / 3);
        // 设置rgb,不管alpha
        data[i] = average;
        data[i + 1] = average;
        data[i + 2] = average;
    }
    // 赋给图像并展示
    imageData.data = data;
    context.putImageData(imageData, 0, 0);
}
```

 效果如下：

![](/js_img/1820.png)

>注意:只有在画布没有因加载跨域资源而污染(dirty)的情况下,图像数据才可用。否则尝试访问图像数据会导致JavaScript错误。

### 合成

 有两个属性适用于在2D环境上的所有绘制：globalAlpha和globalCompositionOperation。globalAlpha属性是介于 0 和 1 之间（包括 0 和 1 ）的数字，用于指定所有图形的alpha值。默认值为 0 。如果所有即将出现的图形都应使用相同的Alpha完成，可将globalAlpha设置为适当的值，执行绘制，然后将globalAlpha设置回 0 。例如：

```js
context.fillStyle = "#ff0000";
context.fillRect(10, 10, 50, 50);
// 更改全局alpha
context.globalAlpha = 0.5;
// 之后绘制的图形皆为半透明
context.fillStyle = "rgba(0,0,255,1)";
context.fillRect(30, 30, 50, 50);
context.fillRect(66, 66, 66, 66);
// 重置
context.globalAlpha = 0;
```
 效果如下：

![](/js_img/1821.png)


 globalCompositionOperation属性指示新绘制的形状应如何与环境中已经存在的图像合并，具体效果参考https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation

## WEBGL

 WebGL是画布的3D环境。OpenGL ES 2.0是浏览器中WebGL的基础。本节需OpenGL ES 2.0概念的实际知识储备。

### WebGL环境

 在完全支持的浏览器中，WebGL 2.0环境名为“webgl2”。WebGL 1.0环境名为“webgl”。如果浏览器不支持WebGL，尝试获取WebGL环境将返回null。

```js
let canvas = document.getElementById("canvas");
if (canvas.getContext) {
    let gl = canvas.getContext("webgl");
    if (gl) {
        console.log("666");
    }
}
```



### WebGL基础

 建立WebGL环境后，就可以开始进行3D绘图了。可以通过将第二个参数传递给getContext（）来为WebGL环境指定选项。该参数是一个包含以下一个或多个属性的对象：

```js
if (canvas.getContext) {
    let gl = canvas.getContext("webgl", {alpha: false});
    if (gl) {
        console.log("666");
    }
}
```



-  **alpha** 为true时，将为环境创建alpha通道缓冲区，默认为true。

-  **depth** 为true时， 16 位深度缓冲区可用，默认为true。

-  **stencil** 为true时，一个 8 位的模板缓冲区可用，默认为false。

-  **antialias** 为true时，抗锯齿将使用默认机制执行。默认为true。

-  **premultipliedAlpha** 为true时，假定绘图缓冲区具有预乘的alpha值。默认为true。

-  **preserveDrawingBuffer** 为true时，在绘制完成后将保留绘图缓冲区。默认为false。建议仅在确切了解其功能的情况下进行更改，因为这可能会影响性能。


#### 常量

 常量在OpenGL中以GL_的前缀命名。在WebGL中则是以gl_前缀开头。例如，GL\_COLOR\_BUFFER\_BIT常量在WebGL中是gl.COLOR\_BUFFER\_BIT。 WebGL以这种方式支持大多数OpenGL常量（某些常量不可用）。

#### 方法名

 OpenGL以及WebGL中很多的方法名，都倾向于包含有关与该方法一起使用的数据类型的信息。如果一个方法可以接受不同类型和数量的参数，则将其后缀表示所需的输入。该方法将指示参数数量（ 1 到 4 ），后跟数据类型（“f”表示浮点数，“i”表示整数）。例如，gl.uniform4f（）期望传入四个浮点数，而gl.uniform3i（）期望传入三个整数。

 许多方法还允许传递数组而不是传递单个参数。这由字母“v”表示，它是向量的缩写。因此gl.uniform3iv（）接受具有三个整数值的数组。

#### 准备绘制

 使用WebGL环境工作的第一步是用固定的颜色清除\<canvas\>，可通过clearColor()方法完成，该方法接受四个参数：红、绿、蓝和alpha。每个参数范围为[0,1]。如下所示：

```js
gl.clearColor(0, 0, 0, 1); // 画布变成黑色
gl.clear(gl.COLOR_BUFFER_BIT);
```

 提供参数gl.COLOR\_BUFFER\_BIT告诉WebGL使用先前定义的颜色填充该区域。一般而言，所有绘图操作都以调用清除绘图区域开始。

#### 视口和坐标

 默认情况下，视口使用整个\<canvas\>区域。若要改变视口，可调用viewport()并传入相对于canvas左下角的x,y坐标、width和height，如下使用整个canvas：

```js
gl.viewport(0,0,canvas.width,canvas.height);
// 使用canvas的左下4分之一
gl.viewport(0,0,canvas.width/2,canvas.height/2);
// 获取当前的视口
console.log(gl.getParameter(gl.VIEWPORT));//Int32Array(4)[0: 0 1: 0 2: 100 3: 100]
```

 视口使用不同的坐标系，(0,0)坐标开始于canvas元素的左下角，向上和向右递增。

 视口中的坐标系不同于用于定义视口的坐标系。在视口内部，坐标从视口中心的点（ 0 ， 0 ）开始。左下角是（–1，–1），右上角是（ 1 ， 1 ）。

#### 缓冲区

 顶点信息存储在JavaScript中的定型数组中，必须转换成WebGL缓冲区才能使用。通过调用gl.createBuffer（）创建缓冲区，然后使用gl.bindBuffer（）将其绑定到WebGL环境。这样就可以用数据填充缓冲区：

```js
let buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0.5, 1]), gl.STATIC_DRAW);
```

 **调用gl.bindBuffer（）将buffer设置为环境的当前缓冲区。此后，所有缓冲区操作将直接在buffer上执行。因此，对gl.bufferData（）的调用不包含对buffer的直接引用，但仍可对其进行处理**。最后一行使用来自Float32Array的信息初始化缓冲区（通常使用Float32Array获取所有顶点信息）。如果打算使用drawElements（）输出缓冲区内容，则使用gl.ELEMENT\_ARRAY\_BUFFER。

 gl.bufferData（）的最后一个参数指示如何使用缓冲区。这是以下常量之一：

-  **gl.STATIC_DRAW** 数据加载一次，可用于多次绘制。

-  **gl.STREAM_DRAW** 数据加载一次，只能有限次绘制。

-  **gl.DYNAMIC_DRAW** 数据可反复修改并用于多次绘制。


 缓冲区将保留在内存中，直到关闭包含此缓冲区的页面。若不再需要缓冲区，那么最好通过调用gl.deleteBuffer（）释放其内存：

```js
gl.deleteBuffer(buffer);
```
#### 错误

 大多数JavaScript和WebGL之间的区别之一是WebGL操作通常不会引发错误。因此必须在调用可能失败的方法后调用gl.getError（）方法。此方法返回一个常数值，指示发生的错误的类型。常量如下：

-  **gl.NO_ERROR** 上一次操作没有错误（值为 0 ）。

-  **gl.INVALID_ENUM** 一个不正确的参数传递给期望使用WebGL常量之一的方法。

-  **gl.INVALID_VALUE** 传递了一个负数给仅接受无符号数的地方。

-  **gl.INVALID_OPERATION** 该操作无法在当前状态下完成。

-  **gl.OUT_OF_MEMORY** 没有足够的内存来完成操作。

-  **gl.CONTEXT_LOST_WEBGL** WebGL环境因外部事件（例如设备断电）而丢失。


 每次调用gl.getError（）都会返回一个错误值，再次调用gl.getError()可能会返回其他错误值，如果存在多个错误，则此过程将继续进行，直到gl.getError（）返回gl.NO_ERROR。如果执行了许多操作，则可能需要循环调用getError（），例如：

```js
let errorCode = gl.getError();
while (errorCode) {
    console.log("Error occurred: " + errorCode);
    errorCode = gl.getError();
}
```



## 着色器

 着色器是OpenGL中的另一个概念。 WebGL中有两种类型的着色器：顶点着色器和片元着色器。顶点着色器用于将3D顶点转换为要渲染的2D点。片元着色器用于计算正确的颜色以绘制单个像素。 WebGL着色器独特且具有挑战性的方面是它们不是用JavaScript编写的。着色器是使用OpenGL着色语言（GLSL）编写的，这是一种与C或JavaScript完全独立的语言。

### 编写着色器

 GLSL是一种类似于C的语言，专门用于定义OpenGL着色器。由于WebGL是OpenGL ES 2的实现，因此OpenGL中使用的着色器可以直接在WebGL中使用，从而可以轻松地将桌面图形移植到Web。

 每个着色器都有一个main（）方法，在绘制过程中会重复执行该方法。有两种方法可以将数据传递到着色器中：attribute和uniform。 **attribute用于将顶点传递到顶点着色器中，而uniform用于将常量值传递到任一类型的着色器中** 。attribute和uniform分别在main（）之外通过使用关键字attribute和uniform定义。在值类型关键字之后，指定数据类型和变量名。这是一个简单的顶点着色器示例：

```glsl
attribute vec2 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
```

 此顶点着色器定义了一个称为aVertexPosition的属性。此属性是两个项的数组（vec2数据类型），分别表示x坐标和y坐标。即使仅传递了两个坐标，顶点着色器也必须始终将含四个项的顶点分配给特殊变量gl\_Position。该着色器创建一个新的四项数组（vec4）并填充缺少的坐标，从而有效地将2D坐标转换为3D坐标。片元着色器与顶点着色器相似，除了只能通过uniform传递数据：

```glsl
uniform vec4 uColor;
void main() {
    gl_FragColor = uColor;
}
```

 片元着色器必须将一个值分配给gl\_FragColor，该值指示绘图时要使用的颜色。从字面上看，此着色器不执行任何操作，只是将传入的值分配给gl\_FragColor。无法在着色器中更改uColor的值。

### 创建着色器程序

 浏览器无法直接理解GLSL，因此必须将GLSL代码字符串进行编译并链接到着色器程序。为了方便使用，着色器通常包含在\<script\>元素中，并设置好类型。如下所示：

```glsl
<script type="x-webgl/x-vertex-shader" id="vertexShader">
    attribute vec2 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
</script>
<script type="x-webgl/x-fragment-shader" id="fragmentShader">
    uniform vec4 uColor;
void main() {
    gl_FragColor = uColor;
}
</script>
```

 随后可使用\<script\>元素的text属性提取之:

```js
let vertexGlsl = document.getElementById("vertexShader").text,
    fragmentGlsl = document.getElementById("fragmentShader").text;
```

 更复杂的WebGL应用程序可以选择动态下载着色器。重要的是需要GLSL代码字符串才能使用着色器。

 一旦有了GLSL字符串，下一步就是创建一个着色器对象。这是通过调用gl.createShader（）方法并传入要创建的着色器的类型（gl.VERTEX\_SHADER或gl.FRAGMENT\_SHADER）来完成的。随后，使用gl.shaderSource（）应用着色器的源代码，并使用gl.compileShader（）编译着色器：

```js
let vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexGlsl);
gl.compileShader(vertexShader);
let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentGlsl);
gl.compileShader(fragmentShader);
```

 这段代码创建两个着色器，并将它们存储在vertexShader和fragmentShader中。然后，可以使用以下代码将这两个对象链接到着色器程序中：

```js
let program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
```

 第一行创建一个程序，然后使用attachShader（）添加着色器。对gl.linkProgram（）的调用将两个着色器一起封装到变量program中。通过链接程序，可以通过gl.useProgram（）方法指示WebGL环境使用该程序：

```js
gl.useProgram(program);
```

 调用gl.useProgram（）之后，接下来的绘制操作将使用指定的程序。

### 传递值给着色器

 之前定义的着色器都必须传递一个值才能完成着色器的工作。要将值传递到着色器中，先要找到必须填充其值的变量。对于uniform变量，这是通过gl.getUniformLocation（）完 成的，该函数返回一个对象，该对象表示uniform变量在内存中的位置。然后，可使用此位置来分配数据：

```js
let uColor = gl.getUniformLocation(program, "uColor");
gl.uniform4fv(uColor, [0, 0, 0, 1]);
```

 本示例在程序中找到uniform变量uColor并返回其存储位置。第二行使用gl.uniform4fv（）将值分配给uColor。

 顶点着色器中的attribute变量遵循类似的过程。要获取attribute变量的位置，需使用gl.getAttribLocation（）。获取到位置后，就可以使用它：

```js
let aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
gl.enableVertexAttribArray(aVertexPosition);
gl.vertexAttribPointer(aVertexPosition, itemSize, gl.FLOAT, false, 0, 0);
```

 在这里，将获取aVertexPosition的位置，以便可以通过gl.enableVertexAttribArray（）启用它。最后一行在使用gl.bindBuffer()指定的最后一个缓冲区中创建一个指针。并将其存储在aVertexPosition中，以便顶点着色器可以使用它。

### 调试着色器和程序

 与WebGL中的其他操作一样，着色器操作可能会失败，并且会以静默方式失败。若存在错误，则需要手动向WebGL环境询问有关着色器或程序的信息。

 对于着色器，尝试编译后，请调用gl.getShaderParameter（）以获取着色器的已编译状态：

```js
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(vertexShader));
}
```

 本示例检查vertexShader的编译状态。如果着色器编译成功，则对gl.getShaderParameter（）的调用将返回true。如果调用返回false，则在编译期间发生错误，可以使用gl.getShaderInfoLog（）并传入着色器来获取错误。此方法返回表示问题的字符串消息。 gl.getShaderParameter（）和gl.getShaderInfoLog（）均可用于顶点着色器和片元着色器。

 程序也可能会失败，并具有类似的方法gl.getProgramParameter（）来检查状态。最常见的程序故障是在链接过程中，可以使用以下代码进行检查：

```js
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert(gl.getProgramInfoLog(program));
}
```

 与gl.getShaderParameter（）一样，gl.getProgramParameter（）返回true表示链接成功，返回false表示链接失败。还有gl.getProgramInfoLog（），用于在故障期间获取有关程序的信息。

 这些方法主要用于开发过程中以帮助调试。只要没有外部依赖项，就可以在生产环境中将其删除。

### 从GLSL 100升级到GLSL 300

 WebGL2的主要更改之一是升级到GLSL 3.00 ES着色器。此升级将公开各种新的着色器功能，例如3D纹理，可在支持OpenGL ES 3.0的设备上使用。若要使用升级的着色器版本，着色器的第一行必须为以下内容：

```glsl
#version 300 es
```

 此升级需要一些语法上的更改：

-  顶点attribute变量使用in关键字而不是attribute声明。

-  对于诸如顶点着色器或片元着色器之类的东西，使用关键字的变量现在必须根据其相对于着色器的行为而使用in或out。

-  gl_FragColor预定义的输出变量不再存在；片元着色器必须为颜色输出声明自己的out变量。

-  纹理查找函数（例如texture2D和textureCube）已统一为一个texture函数。


### 绘制

 WebGL只能绘制三种类型的形状：点，线和三角形。所有其他形状必须使用在三维空间中绘制的这三个基本形状的组合来组成。通过使用drawArrays（）或drawElements（）方法执行绘图；前者适用于数组缓冲区，而后者适用于元素数组缓冲区。

 gl.drawArrays（）和drawElements（）的第一个参数是一个常量，指示要绘制的形状的类型。常量是：

-  **gl.POINTS** 将每个顶点视为要绘制的单个点。

-  **gl.LINES** 将数组视为在其间绘制线的一系列顶点。每组顶点都是起点和终点，因此，数组中必须有偶数个顶点。

-  **gl.LINE_LOOP** 将数组视为在其间绘制线的一系列顶点。线是从第一个顶点到第二个顶点，从第二个顶点到第三个顶点绘制的，依此类推，直到到达最后一个顶点为止。然后从最后一个顶点到第一个顶点绘制一条线。这有效地创建了形状的轮廓。

-  **gl.LINE_STRIP** 与gl.LINE_LOOP相同，只是没有从最后一个顶点绘制回第一个顶点。

-  **gl.TRIANGLES** 将数组视为一系列应在其中绘制三角形的顶点。除非明确指定，否则每个三角形均与前一个三角形分开绘制，并且不共享顶点。

-  **gl.TRIANGLES_STRIP** 与gl.TRIANGLES相同，但从第二个三角形开始，将包括前一个三角形的两个顶点。例如：如果数组包含顶点A，B，C，D，则第一个三角形绘制为ABC，第二个三角形绘制为BCD。

-  **gl.TRIANGLES_FAN** 与gl.TRIANGLES相同，但从第二个三角形开始，将包括前一个三角形两端的顶点。例如，如果数组包含顶点A，B，C，D，则第一个三角形绘制为ABC，第二个三角形绘制为ACD。

-  **gl.drawArrays**（）方法接受上述值之一作为其第一个参数，将数组缓冲区中的起始索引作为第二个参数，并将数组缓冲区中包含的集合数作为第三个参数。以下代码使用gl.drawArrays（）在画布上绘制一个三角形：


```html
<canvas id="canvas" width="800" height="600"></canvas>
<!-- 顶点着色器代码 -->
<script type="x-webgl/x-vertex-shader" id="vertexShader">
    attribute vec2 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
</script>
<!-- 片元着色器代码 -->
<script type="x-webgl/x-fragment-shader" id="fragmentShader">
    precision mediump float;
uniform vec4 uColor;
void main() {
    gl_FragColor = uColor;
}
</script>
```
 

```js
let canvas = document.getElementById("canvas");
let gl = canvas.getContext("webgl");
gl.clearColor(0, 1, 1, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
let vertices = new Float32Array([0, 1, 1, -1, -1, -1]),
    buffer = gl.createBuffer(),
    vertexSetSize = 2,
    vertexSetCount = vertices.length / vertexSetSize,
    uColor, aVertexPosition;
// 将数据放到缓冲区
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
// 获取顶点着色器和片元着色器代码字符串
let vertexGlsl = document.getElementById("vertexShader").text;
let fragmentGlsl = document.getElementById("fragmentShader").text;
// 创建着色器对象、应用着色器源码、编译着色器
let vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexGlsl);
gl.compileShader(vertexShader);
let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentGlsl);
gl.compileShader(fragmentShader);
// 将着色器对象链接到着色器程序中
let program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);
// 传递颜色到片元着色器
uColor = gl.getUniformLocation(program, "uColor");
gl.uniform4fv(uColor, [0, 1, 0, 1]);
// 传递顶点信息给顶点着色器
aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
gl.enableVertexAttribArray(aVertexPosition);
gl.vertexAttribPointer(aVertexPosition, vertexSetSize, gl.FLOAT, false, 0, 0);
// 绘制三角形
gl.drawArrays(gl.TRIANGLES, 0, vertexSetCount);
```

效果如图：

![](/js_img/1822.png)

通过改变gl.drawArrays()的第一个参数,可以更改三角形的绘制方式。gl.LINE_LOOP,视口使用canvas的右上角:

![](/js_img/1823.png)

gl.LINE\_STRIP,视口使用canvas的右上角:

![](/js_img/1824.png)



### 纹理

 WebGL纹理与DOM中的图像一起使用。可以使用gl.createTexture（）创建新纹理，然后将图像绑定到该纹理。如果尚未加载图片，则可以创建一个新的Image实例来动态加载它。在图像完全加载之前，不会初始化纹理，因此必须在load事件发生后执行纹理设置：

```js
let image = new Image(),
    texture;
image.src = "smile.gif";
image.onload = function() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // 清除当前纹理
    gl.bindTexture(gl.TEXTURE_2D, null);
```

 除了使用DOM图像外，这些步骤与在OpenGL中创建纹理的步骤相同。最大的不同在于使用gl.pixelStorei（）设置像素存储格式。常量gl.UNPACK\_FLIP\_Y\_WEBGL对于WebGL是唯一的，并且在加载基于Web的图像时，在大多数情况下都必须使用它。这是因为WebGL的内部坐标系与GIF、JPEG和PNG图像使用的坐标系不同。若没有此标志，图像将被上下颠倒地解释。

 用于纹理的图片需跟当前页面同源，或来自为图片开启了跨源资源共享（CORS）的服务器上。

 注意：纹理源可以是图片、使用\<video\>元素加载的视频，或是别的\<canvas\>元素。视频同样受跨源限制。

#### 读取像素

 与2D环境一样，可以从WebGL环境中读取像素。 readPixels（）方法的参数与OpenGL中的参数相同，但最后一个参数必须是定型数组。该方法从帧缓冲区读取像素信息，并将其放入定型数组中。readPixels()的参数为：x,y,width,height,图片格式，type，定型数组。前四个参数指定读取的像素的区域，图片格式几乎总是gl.RGBA。type参数是将存储在定型数组中的数据类型，并具有以下限制：

-  如果类型是gl.UNSIGNED\_BYTE，则定型数组必须是Uint8Array。

-  如果类型是gl.UNSIGNED\_SHORT\_5\_6\_5，gl.UNSIGNED_SHORT\_4\_4\_4\_4或gl.UNSIGNED_


 SHORT\_5\_5\_5\_1，则定型数组必须是Uint16Array。

 如下所示：

```js
let pixels = new Uint8Array(25 * 25);
gl.readPixels(0, 0, 25, 25, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
```

 这段代码读取帧缓冲区种大小为25×25的区域并将像素信息存储在pixels中。每种像素颜色表示为数组中的四个项，每个项分别代表红，绿，蓝和alpha。值是 0 到 255 之间的数字（含 0 和 255 ）。

 可以在浏览器绘制更新WebGL图像之前调用readPixels（）。绘制发生后，帧缓冲区将恢复为其原始的清除状态，并且调用readPixels（）将导致像素数据与清除状态匹配。如果要在绘制发生后读取像素，则必须使用前面讨论的preserveDrawingBuffer选项初始化WebGL环境：

```js
let gl = drawing.getContext("webgl", { preserveDrawingBuffer: true; });
```

 配置此选项将强制帧缓冲区保持到最后状态，直到下一次绘制发生为止。此选项确实会带来一些性能开销，因此，如果可能的话，最好避免使用。

### WebGL1对比WebGL2

 为WebGL1编写的代码与WebGL2几乎 100 ％兼容。使用webgl2环境时，仅需对扩展进行处理以确保兼容性。在WebGL2中，很多扩展已成为默认功能。

 例如，要在WebGL1中使用绘图缓冲区，需在使用前测试扩展名，如下所示：

```js
let ext = gl.getExtension('WEBGL_draw_buffers');
if (!ext) {
    //
} else {
    ext.drawBuffersWEBGL([...])
}
```

 在WebGL2中，这不再是必需的，因为该功能可以直接作为环境对象方法使用：

```glsl
gl.drawBuffers([...]);
```

 下面是已经成为标准的功能：

- ANGLE\_instanced\_arrays
- EXT\_blend\_minmax
- EXT\_frag\_depth
- EXT\_shader\_texture\_lod
- OES\_element\_index\_uint
- OES\_standard\_derivatives
- OES\_texture\_float
- OES\_texture\_float\_linear
- OES\_vertex\_array\_object
- WEBGL\_depth\_texture
- WEBGL\_draw\_buffers
- Vertex\_shader\_texture\_access