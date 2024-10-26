---
permalink: /cpp/chapter20/
---

# 第20章 std模块

+ 引言
+ 使用你的实现所提供的功能
+ 使用头文件
+ 创建你自己的std模块
+ 建议

## A.1 引言

在撰写本文时，遗憾的是，**std模块**[Stroustrup,2021b]尚未成为标准的一部分。
我有合理的希望，它将成为C++23的一部分。本附录提供了一些关于当前如何管理的想法。

**std模块**的目的是通过单一的**import std;**语句，简单且低成本地提供标准库的所有组件。我在各个章节中都依赖于此。提到并命名头文件主要是因为它们是传统的且普遍可用的，部分原因是它们反映了标准库（不完善）的历史组织结构。

一些标准库组件会将名称（如**\<cmath>**中的**sqrt()**）放入全局命名空间中。**std**模块不会这样做，但当我们需要获取这样的全局名称时，我们可以**import std.compat**。导入**std.compat**而不是**std**的唯一真正好的理由是，在仍然可以获得模块带来的编译速度提升的一些好处的同时，避免干扰旧的代码库。

请注意，模块有意不导出宏。如果你需要宏，请使用**#include**。

模块和头文件共存；也就是说，如果你同时**#include**和**import**一组相同的声明，你将得到一个一致的程序。这对于大型代码库从依赖头文件到使用模块的演变至关重要。

## A.2 使用你的实现所提供的功能

幸运的是，我们想要使用的实现可能已经包含在了**std模块**中。在这种情况下，我们的首选应该是使用它。它可能被标记为“实验性”的，并且使用它可能需要一些设置或几个编译器选项。因此，首先，探索实现是否提供了**std模块**或等效物。例如，目前（2022年春季），Visual Studio提供了许多“实验性”模块，因此使用该实现，我们可以这样定义**std**模块：

```cpp
export module std;  
export import std.regex; // <regex>  
export import std.filesystem; // <filesystem>  
export import std.memory; // <memory>  
export import std.threading; // <atomic>, <condition_variable>, <future>, <mutex>, <shared_mutex>, <thread>  
export import std.core; // 所有其他部分
```

为了使这生效，我们显然必须使用C++20编译器，并设置选项以访问实验性模块。请注意，所有“实验性”的内容都会随时间而变化。

## A.3 使用头文件

如果实现尚不支持模块或尚未提供**std模块**或等效物，我们可以退而使用传统的头文件。它们是标准的且普遍可用的。但是，为了使示例工作，我们需要确定需要哪些头文件并使用**#include**包含它们。第9章可以在这里提供帮助，我们可以在[cppreference]上查找我们想要使用的功能的名称，以查看它是哪个头文件的一部分。如果这变得很繁琐，我们可以将经常使用的头文件收集到一个**std.h**头文件中：

```cpp
// std.h  
#include <iostream>  
#include <string>  
#include <vector>  
#include <list>  
#include <memory>  
#include <algorithms>  
// ...
```

然后

```cpp
#include "std.h"
```

这里的问题是，包含如此多的头文件可能会导致编译速度非常慢[Stroustrup,2021b]。

## A.4 创建你自己的std模块

这是最不吸引人的选择，因为它可能是最费力的，但一旦有人完成了，它就可以被共享：

```cpp
module;  
#include <iostream>  
#include <string>  
#include <vector>  
#include <list>  
#include <memory>  
#include <algorithms>  
// ...  
export module std;  
export istream;  
export ostream;  
export iostream;  
// ...
```

有一个捷径：

```cpp
export module std;  
export import "iostream";  
export import "string";  
export import "vector";  
export import "list";  
export import "memory";  
export import "algorithms";  
// ...
```

构造

```cpp
import "iostream";
```

导入一个**头文件单元**是模块和头文件之间的中间方案。它取一个头文件并将其变成类似模块的东西，但它也可以像**#include**一样将名称注入到全局命名空间中，并且它会泄露宏。

这种方法的编译速度不如**#include**慢，但也不如正确构造的命名模块快。

## A.5 建议

1. 首选实现提供的模块；见§A.2。
2. 使用模块；见§A.3。
3. 相比头文件单元，更倾向使用命名模块；见§A.4。
4. 要使用C标准中的宏和全局名称，请导入**std.compat**；见§A.1。
5. 避免使用宏；见§A.1。 [CG: ES.30] [CG: ES.31]。